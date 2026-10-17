import test from "node:test";
import assert from "node:assert/strict";
import {normalizeCaptureMarkerV1, markerStatusDefinitionV1} from "../../src/contracts/capture-marker-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {consumeCaptureMarkerStacksV1, applyStatusEffectV1, advanceStatusEffectsV1} from "../../src/core/combat/status-effect-runtime-v1.js";

const fighter=id=>({id,maxHp:120,initialHp:120,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
const session=()=>createCombatSession({fighters:[fighter("a"),fighter("b")]});
const venom={id:"venin",name:"Venin",polarity:"detrimental",durationMs:20000,maxStacks:10,
  periodic:{kind:"damage",amount:5,intervalMs:5000,damageMode:"fixed",channel:"physical"}};
function ability(id,{effects=[],markerCost=null,energyCost=0}={}){
  return normalizeSkillDefinition({id,name:id,category:"buff_debuff",form:"self",
    element:null,approachMode:"none",energyCost,preparationMs:0,travelMs:0,
    recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
    targetRelations:["self","ally","enemy"],effect:{damage:0,heal:0,tags:[]},
    effects,...(markerCost==null?{}:{markerCost})});
}
const place=(id,charges,target="target")=>ability(id,{effects:[
  {kind:"apply_marker",targetScope:target,marker:venom,charges}
]});
const statuses=(s,id="b")=>s.snapshot().fighters[id].statusEffects;

test("marker periodic authoring is strict, portable, optional and reuses one stack_counter",()=>{
  const marker=normalizeCaptureMarkerV1(venom);
  assert.equal(marker.periodic.amount,5);
  assert.equal(markerStatusDefinitionV1(marker).periodic.intervalMs,5000);
  assert.equal(markerStatusDefinitionV1(marker).kind,"stack_counter");
  assert.equal(normalizeCaptureMarkerV1({...venom,periodic:null}).periodic,undefined);
  assert.throws(()=>normalizeCaptureMarkerV1({...venom,periodic:{...venom.periodic,intervalMs:0}}),/intervalMs/i);
  assert.throws(()=>normalizeCaptureMarkerV1({...venom,periodic:{kind:"heal",amount:5,intervalMs:5000,channel:"x"}}),/heal/i);
  assert.throws(()=>normalizeCaptureMarkerV1({...venom,periodic:{kind:"damage",amount:5,intervalMs:5000,strange:3}}),/unknown/i);
  assert.throws(()=>normalizeSkillDefinition({...ability("safe"),markerCost:{markerId:"venin",count:0}}),/count/i);
  assert.throws(()=>normalizeSkillDefinition({...ability("safe"),markerCost:{markerId:"venin",count:2,source:"all"}}),/source/i);
});

test("venom 5 damage per stack each 5 sec; cross-skill placement preserves one tick clock",()=>{
  const s=session();
  assert.equal(s.useSkill({actorId:"a",targetId:"b",skill:place("fang",2)}).ok,true);
  s.advanceMs(2500);
  assert.equal(s.useSkill({actorId:"a",targetId:"b",skill:place("sting",1)}).ok,true);
  assert.equal(statuses(s).length,1);
  assert.equal(statuses(s)[0].stacks,3);
  assert.equal(statuses(s)[0].nextTickAtMs,5000,"adding stacks must not create a new clock");
  s.advanceMs(2500);
  assert.equal(s.snapshot().fighters.b.hp,105,"3 × 5 at 5 sec");
  const consumed=consumeCaptureMarkerStacksV1({state:s.snapshot(),targetActorId:"b",markerId:"venin",count:2,minimum:2});
  assert.equal(consumed.consumed,2);
  // CombatState mutation is returned purely; use independent runtime clock projection.
  const next=applyStatusEffectV1({state:consumed.state,sourceActorId:"a",targetActorId:"b",
    sourceSkillId:"fang",status:markerStatusDefinitionV1(venom),atMs:5000});
  assert.equal(next.fighters.b.statusEffects.find(x=>x.definition.id==="marker:venin").stacks,2);
  const partialTick=advanceStatusEffectsV1({state:consumed.state,deltaMs:5000});
  assert.equal(partialTick.fighters.b.hp,100,"one remaining charge deals 5, not the old 15");
  const restackedTick=advanceStatusEffectsV1({state:next,deltaMs:5000});
  assert.equal(restackedTick.fighters.b.hp,95,"adding a new charge before the next tick deals 10");
});

test("markers do not create ticks when absent and native status expiration removes them",()=>{
  const s=session();
  s.useSkill({actorId:"a",targetId:"b",skill:place("sting",2)});
  s.advanceMs(5000);
  assert.equal(s.snapshot().fighters.b.hp,110);
  s.advanceMs(15000);
  assert.equal(s.snapshot().fighters.b.hp,80,"ticks at 5/10/15/20 sec use the native combat clock");
  assert.equal(statuses(s).length,0);
  s.advanceMs(10000);
  assert.equal(s.snapshot().fighters.b.hp,80,"no tick after expiry");
});

test("skill activation rejects missing marker cost before energy/cooldown and pays at launch",()=>{
  const s=session();
  const burst=ability("burst",{energyCost:4,
    markerCost:{markerId:"venin",count:3,source:"target"},
    effects:[{kind:"damage",targetScope:"target",amount:12,channel:"physical"}]});
  const missing=s.startSkill({actorId:"a",targetId:"b",skill:burst});
  assert.equal(missing.ok,false);
  assert.equal(missing.outcome,"insufficient_markers");
  assert.equal(s.snapshot().fighters.a.energy,20);
  assert.equal(s.snapshot().fighters.b.hp,120);
  assert.equal(s.useSkill({actorId:"a",targetId:"b",skill:place("fang",4)}).ok,true);
  const started=s.startSkill({actorId:"a",targetId:"b",skill:burst});
  assert.equal(started.ok,true);
  assert.equal(s.snapshot().fighters.a.energy,16);
  assert.equal(statuses(s)[0].stacks,1);
  assert.equal(started.events.some(x=>x.type==="marker-cost-paid"&&x.consumed===3),true);
});

test("cost can consume own markers and never mistakenly takes unrelated old stack status",()=>{
  const s=session();
  const old={id:"venin",kind:"stack_counter",polarity:"neutral",durationMs:20000,stacking:"stack",maxStacks:10};
  const withOld=applyStatusEffectV1({state:s.snapshot(),targetActorId:"a",sourceActorId:"a",status:old,sourceSkillId:"old"});
  const cost=ability("self-burst",{markerCost:{markerId:"venin",count:1,source:"self"}});
  const result=s.startSkill({actorId:"a",targetId:"a",skill:cost});
  assert.equal(result.ok,false);
  assert.equal(result.outcome,"insufficient_markers");
  assert.equal(withOld.fighters.a.statusEffects.length,1);
});

test("heal variant and native immunity to damage remain available to marker author",()=>{
  const s=session();
  const shield={id:"shield",kind:"shield",polarity:"beneficial",durationMs:15000,
    stacking:"replace",amount:10};
  // Pre-existing shields must be able to absorb periodic venom damage.
  const native=applyStatusEffectV1({state:s.snapshot(),targetActorId:"b",sourceActorId:"b",status:shield});
  const withVenom=applyStatusEffectV1({state:native,targetActorId:"b",sourceActorId:"a",
    sourceSkillId:"venom",status:markerStatusDefinitionV1(venom)});
  assert.equal(withVenom.fighters.b.statusEffects.length,2);
  const shielded=advanceStatusEffectsV1({state:withVenom,deltaMs:5000});
  assert.equal(shielded.fighters.b.hp,120,"native shield absorbs the venom tick");
  assert.equal(shielded.fighters.b.statusEffects.find(s=>s.definition.id==="shield").shieldRemaining,5);
  const immune={id:"immune-damage",kind:"immunity",polarity:"beneficial",
    durationMs:15000,stacking:"replace",domains:["damage"]};
  const defended=applyStatusEffectV1({state:s.snapshot(),targetActorId:"b",sourceActorId:"b",status:immune});
  const poisoned=applyStatusEffectV1({state:defended,targetActorId:"b",sourceActorId:"a",
    sourceSkillId:"venom",status:markerStatusDefinitionV1(venom)});
  assert.equal(advanceStatusEffectsV1({state:poisoned,deltaMs:5000}).fighters.b.hp,120,
    "damage immunity applies to marker ticks");
  const heal=normalizeCaptureMarkerV1({...venom,id:"care",polarity:"beneficial",
    periodic:{kind:"heal",amount:2,intervalMs:2000}});
  assert.equal(heal.periodic.kind,"heal");
});
