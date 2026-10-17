import test from "node:test";
import assert from "node:assert/strict";
import {normalizeCaptureMarkerV1, normalizeCaptureMarkerLibraryV1, markerStatusDefinitionV1} from "../../src/contracts/capture-marker-v1.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {normalizeStatusEffectV1} from "../../src/contracts/status-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyImmediateTacticalEffectsV1} from "../../src/core/combat/immediate-tactical-effects-v1.js";
import {applyStatusEffectV1, consumeCaptureMarkerStacksV1} from "../../src/core/combat/status-effect-runtime-v1.js";

const fighter=id=>({id,maxHp:120,initialHp:120,maxEnergy:30,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const start=()=>createCombatState({fighters:["a","b","c","d"].map(fighter)});
const marker=Object.freeze({id:"poison",name:"Poison",polarity:"neutral",maxStacks:10,durationMs:10000});
const skill=(id,effects)=>({id,effects});
const place=(id,mark=marker,charges=1,targetScope="target")=>
  skill(id,[normalizeSkillEffectV1({kind:"apply_marker",targetScope,marker:mark,charges})]);
const consume=(id,opts={})=>skill(id,[normalizeSkillEffectV1({
  kind:"consume_marker",targetScope:"target",markerId:"poison",count:"all",minimum:1,
  effects:[{kind:"damage",targetScope:"target",amount:20,channel:"poison"}],...opts
})]);
const cast=(state,sk,targetId="b",actorId="a")=>
  applyImmediateTacticalEffectsV1({state,actorId,targetId,skill:sk,atMs:0,combatAtMs:0});
const entries=(state,id="b")=>state.fighters[id].statusEffects.filter(x=>x.definition.tags?.includes("gensrpg:marker:v1"));

test("marker library validates stable unique IDs, editable optional threshold and has no second runtime counter",()=>{
  const norm=normalizeCaptureMarkerV1(marker);
  assert.equal(norm.maxStacks,10);
  assert.equal(markerStatusDefinitionV1(norm).kind,"stack_counter");
  assert.equal(markerStatusDefinitionV1(norm).onStackThreshold,undefined);
  assert.throws(()=>normalizeCaptureMarkerLibraryV1([marker,marker]),/Duplicate/i);
  assert.throws(()=>normalizeCaptureMarkerV1({...marker,id:"POISON"}),/ID/i);
  assert.throws(()=>normalizeSkillEffectV1({kind:"consume_marker",targetScope:"all_active",markerId:"poison",count:2,minimum:3,effects:[]}),/minimum/i);
  assert.throws(()=>normalizeSkillEffectV1({kind:"consume_marker",targetScope:"target",effects:[{kind:"apply_marker",targetScope:"target",marker}]}),/nested|Unsupported/i);
  assert.throws(()=>normalizeSkillEffectV1({kind:"damage",targetScope:"all_active",amount:1}),/all_active/i);
});

test("different skills place charges into one native status and preserve original caster provenance",()=>{
  let s=start();
  s=cast(s,place("fang",marker,3)).state;
  s=cast(s,place("sting",marker,2)).state;
  assert.equal(entries(s).length,1);
  assert.equal(entries(s)[0].stacks,5);
  assert.equal(entries(s)[0].sourceSkillId,"sting");
  assert.equal(entries(s)[0].expiresAtMs,10000);
  const after=cast(s,consume("detonate",{count:3,effects:[{kind:"damage",targetScope:"target",amount:7}]}));
  assert.equal(entries(after.state)[0].stacks,2);
  assert.equal(after.state.fighters.b.hp,113);
  assert.equal(after.events.find(e=>e.type==="markers-consumed").charges,3);
});

test("consume all leaves normal debuffs and stacks intact, and only casts follow-up if markers found",()=>{
  const buff=normalizeStatusEffectV1({id:"old-poison",kind:"stack_counter",polarity:"detrimental",
    durationMs:10000,stacking:"stack",maxStacks:8});
  let state=applyStatusEffectV1({state:start(),sourceActorId:"a",targetActorId:"b",sourceSkillId:"old",
    status:buff});
  state=cast(state,place("sting",marker,4)).state;
  let resolved=cast(state,consume("purge",{markerId:"*",effects:[{kind:"heal",targetScope:"self",amount:11}]}));
  assert.equal(resolved.state.fighters.a.hp,120);
  assert.equal(entries(resolved.state).length,0);
  assert.equal(resolved.state.fighters.b.statusEffects.some(s=>s.definition.id==="old-poison"),true);
  const again=cast(resolved.state,consume("purge"));
  assert.equal(again.state.fighters.b.hp,120);
  assert.equal(again.events.some(e=>e.type==="hit"),false);
});

test("minimum condition is atomic per target, and consumption never triggers a stack threshold",()=>{
  const thresholdMarker={...marker,onStackThreshold:{count:5,consume:"reset",
    effects:[{kind:"damage",targetScope:"target",amount:20}]}};
  let state=cast(start(),place("fang",thresholdMarker,4)).state;
  const notEnough=cast(state,consume("consume",{count:4,minimum:5,effects:[]}));
  assert.equal(entries(notEnough.state)[0].stacks,4);
  const take=cast(state,consume("consume",{count:4,minimum:4,effects:[]}));
  assert.equal(entries(take.state).length,0);
  assert.equal(take.state.fighters.b.hp,120);
  state=cast(state,place("fang",thresholdMarker,1)).state;
  assert.equal(state.fighters.b.hp,100);
  assert.equal(entries(state).length,0);
});

test("all_active consumes every active actor's markers without touching other states",()=>{
  let s=cast(start(),place("poison-a",marker,2),"b").state;
  s=cast(s,place("poison-b",marker,3),"c").state;
  const out=cast(s,consume("cleanse-all",{targetScope:"all_active",markerId:"*",effects:[
    {kind:"damage",targetScope:"target",amount:9}]}));
  assert.equal(entries(out.state,"b").length,0);
  assert.equal(entries(out.state,"c").length,0);
  assert.equal(out.state.fighters.b.hp,111);
  assert.equal(out.state.fighters.c.hp,111);
  assert.equal(out.state.fighters.a.hp,120);
  assert.equal(out.events.filter(e=>e.type==="markers-consumed").length,2);
});

test("detrimental markers respect native negative-status immunity",()=>{
  const immunity=normalizeStatusEffectV1({id:"immune",kind:"immunity",polarity:"beneficial",
    durationMs:30000,stacking:"replace",domains:["negative_status"]});
  let s=applyStatusEffectV1({state:start(),sourceActorId:"b",targetActorId:"b",status:immunity});
  const out=cast(s,place("curse",{...marker,polarity:"detrimental"}));
  assert.equal(entries(out.state).length,0);
  assert.equal(out.events.some(e=>e.type==="status-immune"),true);
});

test("two definitions with the same marker ID cannot silently diverge",()=>{
  const base=cast(start(),place("alpha",marker)).state;
  assert.throws(()=>cast(base,place("beta",{...marker,durationMs:3000})),/Conflicting marker definition/);
});
