import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import test from "node:test";
import assert from "node:assert/strict";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
const skill=()=>normalizeSkillDefinition({
  id:"ice-channel-test",name:"Piques de glace",category:"offensive",form:"beam",
  element:"ice",approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:0,targetRelations:["enemy"],targetLocations:["active"],
  effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},
  channeling:{tickIntervalMs:1000,maxDurationMs:5000,maxTicks:4,energyCostPerTick:3,
    stopOnDamage:true,effects:[{kind:"damage",targetScope:"target",amount:12}]}
});
const session=()=>createCombatSession({fighters:[
  {id:"hero",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10},
  {id:"enemy",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
]});
test("channeling is a normalized skill contract with strict tick budget and effects",()=>{
 const s=skill();assert.equal(s.channeling.tickIntervalMs,1000);
 assert.equal(s.channeling.energyCostPerTick,3);
 assert.equal(s.channeling.effects[0].kind,"damage");
 assert.throws(()=>normalizeSkillDefinition({...s,channeling:{...s.channeling,tickIntervalMs:0}}),/tickIntervalMs/);
 assert.throws(()=>normalizeSkillDefinition({...s,channeling:{...s.channeling,energyCostPerTick:-1}}),/energyCostPerTick/);
 assert.throws(()=>normalizeSkillDefinition({...s,channeling:{...s.channeling,maxTicks:0}}),/maxTicks/);
});
test("native channel tick spends energy once, applies one effect and never hits on rejected tick",()=>{
 const native=session(),s=skill();
 const first=native.applyChannelingTickV1({actorId:"hero",targetId:"enemy",skill:s,atMs:1000});
 assert.equal(first.ok,true);assert.equal(native.snapshot().fighters.hero.energy,7);
 assert.equal(native.snapshot().fighters.enemy.hp,88);
 const second=native.applyChannelingTickV1({actorId:"hero",targetId:"enemy",skill:s,atMs:2000});
 assert.equal(second.ok,true);assert.equal(native.snapshot().fighters.hero.energy,4);
 const third=native.applyChannelingTickV1({actorId:"hero",targetId:"enemy",skill:s,atMs:3000});
 assert.equal(third.ok,true);assert.equal(native.snapshot().fighters.hero.energy,1);
 const beforeHp=native.snapshot().fighters.enemy.hp;
 const rejected=native.applyChannelingTickV1({actorId:"hero",targetId:"enemy",skill:s,atMs:4000});
 assert.equal(rejected.ok,false);assert.equal(rejected.outcome,"insufficient_energy");
 assert.equal(native.snapshot().fighters.enemy.hp,beforeHp);
 assert.equal(native.snapshot().fighters.hero.energy,1);
});

function harness(){
 let current=0,timer=()=>{};
 const combat=session(),started=[],ticks=[],ended=[];
 const runtime=createCombatRuntime({session:combat,now:()=>current,
   setTimer(fn){timer=fn;return 1;},clearTimer(){},
   onChannelStart:e=>started.push(e),
   onChannelTick:e=>ticks.push(e),
   onChannelEnd:e=>ended.push(e)
 });
 runtime.start();
 const step=t=>{current=t;timer();};
 const start=()=>{const r=runtime.startSkill({actorId:"hero",targetId:"enemy",skill:skill()});
   assert.equal(r.ok,true);step(100);return r;};
 return {runtime,combat,started,ticks,ended,step,start};
}
test("one CombatRuntime clock starts, ticks and exhausts a channeled beam without ghost effect",()=>{
 const h=harness();
 try{
  h.start();assert.equal(h.started.length,1);
  assert.equal(h.runtime.startSkill({actorId:"hero",targetId:"enemy",skill:skill()}).outcome,"channeling_active");
  // The immediate cast resolves at clock 0; step(100) in start() only
  // advances the fixture's clock and must NOT postpone the first channel tick.
  h.step(999);assert.equal(h.ticks.length,0);
  h.step(1000);assert.equal(h.ticks.length,1);
  assert.equal(h.combat.snapshot().fighters.hero.energy,7);
  h.step(2999);assert.equal(h.ticks.length,2);
  h.step(3000);assert.equal(h.ticks.length,3);
  assert.equal(h.combat.snapshot().fighters.hero.energy,1);
  const hp=h.combat.snapshot().fighters.enemy.hp;
  h.step(4000);assert.equal(h.ticks.length,3);
  assert.equal(h.ended[0].reason,"insufficient_energy");
  assert.equal(h.combat.snapshot().fighters.enemy.hp,hp);
  h.step(5500);assert.equal(h.ticks.length,3);
 }finally{h.runtime.dispose();}
});
test("channeling interruption on real damage and explicit recall uses existing owner",()=>{
 const h=harness();
 try{
  h.start();
  const strike=normalizeSkillDefinition({id:"strike",name:"Strike",category:"offensive",
    form:"contact",approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
    recoveryMs:0,cooldownMs:0,targetRelations:["enemy"],
    effect:{damage:5,heal:0,tags:[]}});
  assert.equal(h.combat.useSkill({actorId:"enemy",targetId:"hero",skill:strike}).ok,true);
  h.step(1099);
  assert.equal(h.ticks.length,0);
  assert.equal(h.ended[0].reason,"damage_taken");
  h.step(4100);assert.equal(h.ticks.length,0);
 }finally{h.runtime.dispose();}
 const second=harness();
 try{
  second.start();
  assert.equal(second.runtime.cancelActionsForActor("hero",{reason:"recall"}).ok,true);
  second.step(4100);assert.equal(second.ticks.length,0);
  assert.equal(second.ended[0].reason,"recall");
 }finally{second.runtime.dispose();}
});
