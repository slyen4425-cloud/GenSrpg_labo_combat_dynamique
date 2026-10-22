import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureMarkerV1,markerStatusDefinitionV1} from "../../src/contracts/capture-marker-v1.js";
import {normalizeStatusEffectV1} from "../../src/contracts/status-effect-v1.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyImmediateTacticalEffectsV1} from "../../src/core/combat/immediate-tactical-effects-v1.js";
import {consumeCaptureMarkerStacksV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {effectiveApproachTimingMs,advanceSkillCooldownDeadlinesV1} from "../../src/core/combat/combat-timing.js";
import {captureMarkerAdvancedThresholdEffectV1} from "../../src/ui/capture-marker-library-v1.js";

const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
const state=()=>createCombatState({fighters:[fighter("a"),fighter("b")]});
const status=(kind,amount=10,index=0,opts={})=>captureMarkerAdvancedThresholdEffectV1({
  id:"charge-venin",index,kind,amount,durationSeconds:4,maxStacks:8,repeat:true,
  statId:"esprit",statMode:"points",...opts
});
const marker=(changes={})=>({
  id:"venin",name:"Venin",polarity:"detrimental",durationMs:12000,maxStacks:8,
  onStackAdded:{effects:[status("slow_movement",20)]},...changes
});
const apply=(m,n=1,prior=state())=>{
  const skill={id:"venom-sting",effects:[normalizeSkillEffectV1({
    kind:"apply_marker",targetScope:"target",marker:m,charges:n
  })]};
  return applyImmediateTacticalEffectsV1({
    state:prior,actorId:"a",targetId:"b",skill,atMs:0,combatAtMs:0
  }).state;
};
const instances=s=>s.fighters.b.statusEffects;
const get=(s,kind)=>instances(s).find(e=>e.definition.kind===kind);
const approach=(s,ms=0)=>effectiveApproachTimingMs({
  baseMs:1000,approachMode:"ground",statusEffects:instances(s),atMs:ms
});

test("a SINGLE marker immediately applies its own native movement debuff",()=>{
  const mark=normalizeCaptureMarkerV1(marker());
  assert.equal(mark.onStackAdded.effects.length,1);
  assert.equal(markerStatusDefinitionV1(mark).onStackAdded.effects[0].status.kind,"approach_time_modifier");
  let s=apply(mark);
  assert.equal(get(s,"stack_counter").stacks,1);
  assert.equal(get(s,"approach_time_modifier").stacks,1);
  assert.equal(approach(s),1200);
  assert.equal(approach(s,4000),1000);
});

test("every actually added charge stacks its own native effect, but maxStacks never retriggers",()=>{
  const mark=marker({maxStacks:3,onStackAdded:{effects:[status("slow_movement",20,0,{maxStacks:3})]}});
  let s=apply(mark,3);
  assert.equal(get(s,"stack_counter").stacks,3);
  assert.equal(get(s,"approach_time_modifier").stacks,3);
  assert.equal(approach(s),1600);
  s=apply(mark,5,s);
  assert.equal(get(s,"stack_counter").stacks,3);
  assert.equal(get(s,"approach_time_modifier").stacks,3);
});

test("individual cooldown, stats, energy and outgoing damage use existing native statuses",()=>{
  const mark=marker({onStackAdded:{effects:[
    status("slow_cooldown",10,0),
    status("reduce_stat",2,1),
    status("slow_energy",20,2),
    status("reduce_damage",10,3)
  ]}});
  const s=apply(mark,2);
  const kinds=["skill_cooldown_rate_modifier","stat_modifier",
    "energy_regen_modifier","outgoing_damage_modifier"];
  for(const kind of kinds)assert.equal(get(s,kind)?.stacks,2,kind);
  assert.equal(get(s,"stat_modifier").definition.statId,"esprit");
  const deadlines=advanceSkillCooldownDeadlinesV1({
    cooldowns:{strike:2000},atMs:0,deltaMs:1000,statusEffects:instances(s)
  });
  assert.equal(deadlines.strike,2200);
});

test("immediate per-charge and advanced threshold coexist without sharing their counters",()=>{
  const mark=marker({onStackThreshold:{
    count:3,consume:"keep",effects:[status("reduce_damage",20,5,{repeat:false})]
  }});
  let s=apply(mark,2);
  assert.equal(get(s,"approach_time_modifier").stacks,2);
  assert.equal(get(s,"outgoing_damage_modifier"),undefined);
  s=apply(mark,1,s);
  assert.equal(get(s,"approach_time_modifier").stacks,3);
  assert.equal(get(s,"outgoing_damage_modifier").stacks,1);
});

test("one-charge direct damage, heal and energy remain native, independent of periodic damage/heal",()=>{
  const mark=marker({onStackAdded:{effects:[
    {kind:"damage",targetScope:"target",amount:5},
    {kind:"heal",targetScope:"self",amount:3},
    {kind:"energy_drain",targetScope:"target",amount:2}
  ]},periodic:{kind:"damage",amount:2,intervalMs:5000,damageMode:"fixed",channel:"poison"}});
  const s=apply(mark,2);
  assert.equal(s.fighters.b.hp,90);
  assert.equal(get(s,"stack_counter").definition.periodic.amount,2);
  assert.equal(s.fighters.b.energy,16);
});

test("consuming marker charges does not retrigger the addition effect or its independent native lifetime",()=>{
  const mark=marker();
  const s=apply(mark,3);
  const eaten=consumeCaptureMarkerStacksV1({
    state:s,targetActorId:"b",markerId:"venin",count:2,minimum:1
  });
  assert.equal(eaten.consumed,2);
  assert.equal(get(eaten.state,"stack_counter").stacks,1);
  assert.equal(get(eaten.state,"approach_time_modifier").stacks,3);
});

test("legacy marker contracts/export remain unchanged and new effects reject unsafe schema",()=>{
  const old=normalizeCaptureMarkerV1({
    id:"ancien",name:"Ancien",durationMs:10000,maxStacks:9,
    periodic:{kind:"heal",amount:2,intervalMs:3000}
  });
  assert.equal(old.onStackAdded,undefined);
  assert.equal(markerStatusDefinitionV1(old).onStackAdded,undefined);
  assert.throws(()=>normalizeCaptureMarkerV1(marker({
    onStackAdded:{effects:[{kind:"apply_marker",targetScope:"target",marker:marker(),charges:1}]}
  })),/Unsupported onStackAdded effect/i);
  assert.throws(()=>normalizeCaptureMarkerV1(marker({
    onStackAdded:{effects:Array(13).fill({kind:"heal",targetScope:"target",amount:1})}
  })),/1 to 12/);
  assert.throws(()=>normalizeCaptureMarkerV1({...marker(),undocumented:1}),/Unknown marker field/);
  const invalid={id:"not-a-marker",kind:"stack_counter",polarity:"neutral",durationMs:1000,
    stacking:"stack",maxStacks:2,onStackAdded:{effects:[{kind:"heal",targetScope:"self",amount:1}]}};
  assert.throws(()=>normalizeStatusEffectV1(invalid),/only supported by shared markers/);
});

test("real authoring exposes diverse per-charge effects and preserves independent threshold controls",()=>{
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const js=readFileSync(new URL("../../src/ui/capture-marker-library-v1.js",import.meta.url),"utf8");
  for(const tag of ["data-marker-charge-enabled","data-marker-charge-effect",
    "data-marker-charge-stat","data-marker-charge-add-effect",
    "data-marker-threshold-enabled","data-marker-periodic-enabled"]){
      assert.ok(html.includes(tag),tag);
  }
  for(const value of ["slow_movement","reduce_stat","slow_cooldown",
    "slow_energy","reduce_damage","silence","immobilize","stun"]){
      assert.match(html.slice(html.indexOf("data-marker-charge-card"),html.indexOf("data-marker-periodic-card")),new RegExp('value="'+value+'"'));
  }
  assert.match(js,/onStackAdded:\{effects:chargeEffects\}/);
  assert.match(js,/marker\.onStackAdded\?\.effects/);
});
