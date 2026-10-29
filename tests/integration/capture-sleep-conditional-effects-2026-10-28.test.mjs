import test from "node:test";
import assert from "node:assert/strict";
import {normalizeStatusEffectV1} from "../../src/contracts/status-effect-v1.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyStatusEffectV1,activeStatusEffectsV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";
import {applyImmediateTacticalEffectsV1} from "../../src/core/combat/immediate-tactical-effects-v1.js";

const fighter=id=>({id,maxHp:300,initialHp:300,maxEnergy:20,initialEnergy:20,movementEnergyPerStep:0});
const initial=()=>createCombatState({fighters:[fighter("a"),fighter("b")]});
const sleep=()=>normalizeStatusEffectV1({
  id:"dream",kind:"stun",polarity:"detrimental",durationModel:"until_damage",
  stacking:"refresh",tags:[]
});
const applySleep=(state=initial())=>applyStatusEffectV1({
  state,targetActorId:"b",sourceActorId:"a",sourceSkillId:"dream-beam",
  status:sleep(),atMs:0
});
const active=(state,id="b",atMs=0)=>activeStatusEffectsV1(state,id,atMs);
const skill=effects=>({id:"dream-punish",form:"projectile",element:"physical",
  category:"offensive",effects:effects.map(normalizeSkillEffectV1)});

test("Sommeil is native stun without an arbitrary timer and survives zero actual HP loss",()=>{
  const status=sleep();
  assert.equal(status.durationModel,"until_damage");
  let s=applySleep();
  assert.equal(active(s,"b",600000)[0].definition.kind,"stun");
  s=applyCombatDamageV1({state:s,sourceActorId:"a",targetActorId:"b",damage:0,atMs:500}).state;
  assert.equal(active(s,"b",600000).length,1);
  s=applyCombatDamageV1({state:s,sourceActorId:"a",targetActorId:"b",damage:12,atMs:600}).state;
  assert.equal(active(s,"b",600).length,0,"first HP loss ends sleep immediately");
});

test("conditional effects inspect the real pre-impact target status, even when the first hit wakes it",()=>{
  const prior=applySleep();
  const move=skill([
    {kind:"damage",targetScope:"target",amount:10},
    {kind:"damage",targetScope:"target",amount:100,condition:{type:"sleep"}}
  ]);
  const result=applyImmediateTacticalEffectsV1({
    state:prior,conditionState:prior,actorId:"a",targetId:"b",skill:move,atMs:0,combatAtMs:0
  });
  assert.equal(result.state.fighters.b.hp,190);
  assert.equal(active(result.state).length,0);
  const normal=applyImmediateTacticalEffectsV1({
    state:initial(),actorId:"a",targetId:"b",skill:move,atMs:0,combatAtMs:0
  });
  assert.equal(normal.state.fighters.b.hp,290);
});

test("every effect kind accepts a canonical target condition and rejects unknown condition keys",()=>{
  for(const kind of ["damage","heal","energy_restore","apply_status","apply_marker","cleanse"]){
    const input={kind,targetScope:"target",condition:{type:"status_kind",value:"stun",minimum:1}};
    if(kind==="damage"||kind==="heal"||kind==="energy_restore")input.amount=5;
    if(kind==="apply_status")input.status={id:"guard",kind:"immobilize",polarity:"detrimental",durationMs:1000,stacking:"refresh",tags:[]};
    if(kind==="apply_marker")input.marker={id:"venin",name:"Venin",polarity:"detrimental",durationMs:1000,maxStacks:4};
    if(kind==="cleanse")input.statusTags=[];
    assert.equal(normalizeSkillEffectV1(input).condition.type,"status_kind");
  }
  assert.throws(()=>normalizeSkillEffectV1({kind:"damage",targetScope:"target",amount:5,
    condition:{type:"sleep",typo:true}}),/condition|unknown/i);
});

test("marker condition counts charges on the live target and can check absence",()=>{
  const markerStatus=normalizeStatusEffectV1({id:"marker:venin",kind:"stack_counter",polarity:"detrimental",durationMs:10000,
    stacking:"stack",maxStacks:5,tags:["gensrpg:marker:v1","marker:venin"]});
  let state=applyStatusEffectV1({state:initial(),sourceActorId:"a",targetActorId:"b",status:markerStatus,atMs:0});
  const attack=skill([{kind:"damage",targetScope:"target",amount:30,
    condition:{type:"marker",value:"venin",minimum:2}}]);
  assert.equal(applyImmediateTacticalEffectsV1({state,actorId:"a",targetId:"b",skill:attack,atMs:0}).state.fighters.b.hp,300);
  state=applyStatusEffectV1({state,sourceActorId:"a",targetActorId:"b",status:markerStatus,atMs:0});
  assert.equal(applyImmediateTacticalEffectsV1({state,actorId:"a",targetId:"b",skill:attack,atMs:0}).state.fighters.b.hp,270);
});
