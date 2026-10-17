import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCaptureMarkerV1, markerStatusDefinitionV1 } from "../../src/contracts/capture-marker-v1.js";
import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import {
  consumeCaptureMarkerStacksV1, resumeStatusEffectsV1, activeStatusEffectsV1,
  applyStatusEffectV1, advanceStatusEffectsV1
} from "../../src/core/combat/status-effect-runtime-v1.js";
import {projectStatusEffectInfoV1} from "../../src/adapters/renderer/status-effect-info-v1.js";

const fighter=id=>({id,maxHp:250,initialHp:250,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
const makeSession=()=>createCombatSession({fighters:[fighter("a"),fighter("b")]});
const permanent={id:"venin",name:"Venin",polarity:"detrimental",permanent:true,maxStacks:20,
  periodic:{kind:"damage",amount:5,intervalMs:5000,damageMode:"fixed",channel:"physical"}};
const placed=(id,charges)=>normalizeSkillDefinition({id,name:id,category:"buff_debuff",form:"self",
  element:null,approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,
  cooldownMs:0,allowedDistances:["short","medium","long"],targetRelations:["self","enemy"],
  effect:{damage:0,heal:0,tags:[]},
  effects:[{kind:"apply_marker",targetScope:"target",marker:permanent,charges}]});
const entries=s=>s.snapshot().fighters.b.statusEffects;

test("permanent marker contract stays portable without numeric infinity, zero or timeout",()=>{
  const marker=normalizeCaptureMarkerV1(permanent);
  const normalized=markerStatusDefinitionV1(marker);
  assert.equal(marker.permanent,true);
  assert.equal("durationMs" in marker,false);
  assert.equal(normalized.durationModel,"permanent");
  assert.equal("durationMs" in normalized,false);
  assert.equal(normalized.periodic.intervalMs,5000);
  assert.deepEqual(JSON.parse(JSON.stringify(marker)),marker);
  assert.throws(()=>normalizeCaptureMarkerV1({...permanent,durationMs:0}),/permanent|durationMs/i);
  assert.throws(()=>normalizeCaptureMarkerV1({...permanent,permanent:"yes"}),/boolean/i);
  assert.throws(()=>normalizeStatusEffectV1({...normalized,tags:[]}),/permanent/i);
  assert.throws(()=>normalizeStatusEffectV1({...normalized,durationMs:0}),/duration/i);
  const timed=normalizeCaptureMarkerV1({...permanent,permanent:false,durationMs:5000});
  assert.equal(timed.durationMs,5000);
  assert.equal(timed.permanent,undefined);
});

test("shared permanent Venin remains alive across long combat time and 5s periodic ticks",()=>{
  const s=makeSession();
  assert.equal(s.useSkill({actorId:"a",targetId:"b",skill:placed("fang",2)}).ok,true);
  assert.equal(entries(s).length,1);
  assert.equal(entries(s)[0].expiresAtMs,null);
  assert.equal(entries(s)[0].nextTickAtMs,5000);
  assert.equal(activeStatusEffectsV1(s.snapshot(),"b").length,1);
  s.advanceMs(5000);
  assert.equal(s.snapshot().fighters.b.hp,240);
  s.advanceMs(5000);
  assert.equal(s.snapshot().fighters.b.hp,230);
  // At 12 seconds, add another charge using another skill. No second clock.
  s.advanceMs(2000);
  assert.equal(s.useSkill({actorId:"a",targetId:"b",skill:placed("sting",1)}).ok,true);
  assert.equal(entries(s).length,1);
  assert.equal(entries(s)[0].stacks,3);
  assert.equal(entries(s)[0].expiresAtMs,null);
  assert.equal(entries(s)[0].nextTickAtMs,15000);
  s.advanceMs(3000);
  assert.equal(s.snapshot().fighters.b.hp,215,"3 × 5 at 15s");
  s.advanceMs(25000);
  assert.equal(s.snapshot().fighters.b.hp,140,"five more ticks × 15 until 40s");
  assert.equal(entries(s)[0].stacks,3);
  assert.equal(projectStatusEffectInfoV1({instance:entries(s)[0],elapsedMs:40000}).remainingLabel,"Permanent");
});

test("permanent charges can be partially consumed; no next ticks after complete consumption",()=>{
  const base=makeSession().snapshot();
  let state=base;
  const status=markerStatusDefinitionV1(permanent);
  for(let i=0;i<3;i++)state=applyStatusEffectV1({
    state,targetActorId:"b",sourceActorId:"a",sourceSkillId:"fang",status,atMs:0
  });
  state=advanceStatusEffectsV1({state,deltaMs:5000});
  assert.equal(state.fighters.b.hp,235);
  const removed=consumeCaptureMarkerStacksV1({state,targetActorId:"b",markerId:"venin",count:2,minimum:2});
  assert.equal(removed.consumed,2);
  assert.equal(removed.state.fighters.b.statusEffects[0].stacks,1);
  state=advanceStatusEffectsV1({state:removed.state,deltaMs:5000});
  assert.equal(state.fighters.b.hp,230);
  state=consumeCaptureMarkerStacksV1({state,targetActorId:"b",markerId:"venin",count:"all",minimum:1}).state;
  assert.equal(state.fighters.b.statusEffects.length,0);
  state=advanceStatusEffectsV1({state,deltaMs:30000});
  assert.equal(state.fighters.b.hp,230);
});

test("permanent markers without periodic remain silent, survive resume; legacy timed status expires",()=>{
  const s=makeSession().snapshot();
  const silent=markerStatusDefinitionV1({id:"mark",name:"Mark",permanent:true,polarity:"neutral",maxStacks:5});
  const timed={id:"slow",kind:"stack_counter",polarity:"detrimental",durationMs:1000,stacking:"stack",maxStacks:5};
  let state=applyStatusEffectV1({state:s,targetActorId:"b",sourceActorId:"a",sourceSkillId:"one",status:silent});
  state=applyStatusEffectV1({state,targetActorId:"b",sourceActorId:"a",sourceSkillId:"two",status:timed});
  const statuses=resumeStatusEffectsV1(state.fighters.b.statusEffects,90000);
  assert.equal(statuses.length,1,"recall resume must retain permanent while shedding expired temporary status");
  assert.equal(statuses[0].definition.id,"marker:mark");
  assert.equal(statuses[0].nextTickAtMs,null);
  state=advanceStatusEffectsV1({state,deltaMs:90000});
  assert.equal(state.fighters.b.hp,250);
  assert.deepEqual(state.fighters.b.statusEffects.map(x=>x.definition.id),["marker:mark"]);
});
