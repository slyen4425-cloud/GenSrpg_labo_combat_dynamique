import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCaptureMarkerV1, markerStatusDefinitionV1 } from "../../src/contracts/capture-marker-v1.js";
import { normalizeSkillEffectV1 } from "../../src/contracts/skill-effect-v1.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import { applyImmediateTacticalEffectsV1 } from "../../src/core/combat/immediate-tactical-effects-v1.js";
import { effectiveApproachTimingMs, advanceSkillCooldownDeadlinesV1 } from "../../src/core/combat/combat-timing.js";
import { projectStatusStatEffectsV1 } from "../../src/core/combat/status-effect-projection-v1.js";
import { captureMarkerAdvancedThresholdEffectV1 } from "../../src/ui/capture-marker-library-v1.js";

const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
function apply(mark,charges=1,state=null){
  const current=state??createCombatState({fighters:[fighter("a"),fighter("b")]});
  const skill={id:"sting",effects:[normalizeSkillEffectV1({
    kind:"apply_marker",targetScope:"target",marker:mark,charges
  })]};
  return applyImmediateTacticalEffectsV1({state:current,actorId:"a",targetId:"b",skill,atMs:0,combatAtMs:0}).state;
}
const debuff=(kind,opts={})=>captureMarkerAdvancedThresholdEffectV1({
  id:"froid",kind,amount:25,durationSeconds:4,maxStacks:50,...opts
});
const marker=({count=1,repeat=true,effects=[debuff("slow_movement")],maxStacks=50}={})=>({
  id:"froid",name:"Froid",polarity:"detrimental",durationMs:20000,maxStacks,
  onStackThreshold:{count,consume:"keep",...(repeat?{repeat:"each_addition"}:{}),effects}
});
const statuses=state=>state.fighters.b.statusEffects;
const get= (state,kind)=>statuses(state).find(x=>x.definition.kind===kind);

test("marker threshold keeps backwards-compatible single trigger; new repeat is opt-in",()=>{
 const old=marker({repeat:false,count:3});
 const normalized=normalizeCaptureMarkerV1(old);
 assert.equal(normalized.onStackThreshold.repeat,undefined);
 let state=apply(old,5);
 assert.equal(get(state,"approach_time_modifier").stacks,1);
 assert.equal(statuses(state).find(x=>x.definition.kind==="stack_counter").stacks,5);
 assert.throws(()=>normalizeCaptureMarkerV1({
  ...old,onStackThreshold:{...old.onStackThreshold,repeat:"each_addition",consume:"reset"}
 }),/consume|keep/i);
});

test("every new marker stacks native movement debuff, expires from native status time",()=>{
 const mark=marker(); let state=apply(mark,3);
 assert.equal(get(state,"approach_time_modifier").stacks,3);
 assert.equal(effectiveApproachTimingMs({
  baseMs:1000,approachMode:"ground",statusEffects:statuses(state),atMs:0
 }),1750);
 assert.equal(effectiveApproachTimingMs({
  baseMs:1000,approachMode:"ground",statusEffects:statuses(state),atMs:4000
 }),1000);
 state=apply(mark,2,state);
 assert.equal(get(state,"approach_time_modifier").stacks,5);
 assert.equal(effectiveApproachTimingMs({
  baseMs:1000,approachMode:"ground",statusEffects:statuses(state),atMs:0
 }),2250);
});

test("threshold N activates at N then for each further charge, but not at stack cap",()=>{
 const mark=marker({count:3,maxStacks:4});
 let state=apply(mark,2);
 assert.equal(get(state,"approach_time_modifier"),undefined);
 state=apply(mark,1,state);
 assert.equal(get(state,"approach_time_modifier").stacks,1);
 state=apply(mark,1,state);
 assert.equal(get(state,"approach_time_modifier").stacks,2);
 state=apply(mark,5,state);
 assert.equal(get(state,"approach_time_modifier").stacks,2);
});

test("native cooldown, energy, outgoing damage, control and stat debuffs are authorable",()=>{
 for(const kind of ["slow_cooldown","boost_cooldown","slow_energy",
   "boost_energy","reduce_damage","boost_damage","reduce_stat","increase_stat",
   "silence","immobilize","stun","slow_movement","boost_movement"]){
   const effect=debuff(kind,{statId:"speed",statMode:"points"});
   assert.equal(effect.kind,"apply_status",kind);
   assert.equal(effect.status.durationMs,kind==="stun"?25000:4000);
   assert.equal(effect.status.stacking,"stack");
   assert.equal(effect.status.maxStacks,50);
 }
 const cooldown=apply(marker({effects:[debuff("slow_cooldown",{amount:10})]}),3);
 assert.equal(get(cooldown,"skill_cooldown_rate_modifier").stacks,3);
 const ready=advanceSkillCooldownDeadlinesV1({
  cooldowns:{strike:2000},atMs:0,deltaMs:1000,statusEffects:statuses(cooldown)
 });
 assert.equal(ready.strike,2300);
 const damage=apply(marker({effects:[debuff("reduce_damage",{amount:10})]}),2);
 assert.equal(projectStatusStatEffectsV1({fighter:damage.fighters.b,atMs:0}).outgoingDamagePct,-20);
 const stat=debuff("reduce_stat",{statId:"esprit",statMode:"percent",amount:15});
 assert.equal(stat.status.statId,"esprit");
 assert.equal(stat.status.modifierMode,"percent");
 assert.equal(stat.status.percent,-15);
});

test("authoring permits simultaneous debuffs and buffs, plus original effects and no magic stat ID",()=>{
 const effects=[
  debuff("slow_movement",{index:0,amount:30}),
  debuff("slow_cooldown",{index:1,amount:10}),
  debuff("boost_energy",{index:2,amount:5}),
  captureMarkerAdvancedThresholdEffectV1({id:"froid",kind:"damage",amount:8,channel:"earth"})
 ];
 const mark=normalizeCaptureMarkerV1(marker({effects}));
 assert.equal(mark.onStackThreshold.effects.length,4);
 const state=apply(mark,3);
 assert.equal(get(state,"approach_time_modifier").stacks,3);
 assert.equal(get(state,"skill_cooldown_rate_modifier").stacks,3);
 assert.equal(get(state,"energy_regen_modifier").stacks,3);
 assert.equal(state.fighters.b.hp,76);
 assert.throws(()=>debuff("reduce_stat",{statId:""}),/caractéristique/i);
 const original={kind:"damage",targetScope:"target",amount:12};
 assert.equal(captureMarkerAdvancedThresholdEffectV1({id:"froid",kind:"preserve",original}),original);
});

test("real editor exposes stack count, repeat, multi-effect and stat register picker",()=>{
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../../src/ui/capture-marker-library-v1.js",import.meta.url),"utf8");
 for(const tag of ["data-marker-threshold-repeat","data-marker-threshold-add-effect",
   "data-marker-threshold-extra-host","data-marker-threshold-stat","data-marker-threshold-status-duration"]){
  assert.ok(html.includes(tag),tag);
 }
 assert.match(html,/data-marker-max type="number" min="1" step="1"/);
 assert.match(js,/captureMarkerStatOptionsV1/);
 assert.match(js,/effects\.length>12/);
 assert.match(js,/repeat:"each_addition"/);
});
