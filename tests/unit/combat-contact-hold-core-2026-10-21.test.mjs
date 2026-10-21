import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

const fighter=(id,hp=100)=>({id,maxHp:100,initialHp:hp,maxEnergy:50,
 initialEnergy:50,energyChargeAmount:0,energyChargeIntervalMs:2000});
function definition(id, opts={}){
 return normalizeSkillDefinition({
   id,name:id,category:"offensive",form:"contact",
   element:null,approachMode:"ground",energyCost:4,preparationMs:0,
   travelMs:1000,recoveryMs:0,cooldownMs:500,
   allowedDistances:["short","medium","long"],
   targetRelations:["enemy"],effect:{damage:0,heal:0,tags:[]},
   contactHold:{tickIntervalMs:1000,effects:[
     {kind:"damage",targetScope:"target",amount:10,channel:"physical"},
     {kind:"life_steal",targetScope:"self",percent:50}
   ]},...opts
 });
}
function createHarness(){
 const session=createCombatSession({fighters:[fighter("a",50),fighter("b")]});
 let current=0, timer=()=>{};
 const started=[],ticks=[],ended=[];
 const runtime=createCombatRuntime({session,now:()=>current,
  setTimer(fn){timer=fn;return 1;},clearTimer(){},
  onContactHoldStart:e=>started.push(e),
  onContactHoldTick:e=>ticks.push(e),
  onContactHoldEnd:e=>ended.push(e)
 });
 runtime.start();
 const step=(time)=>{current=time;timer();};
 const begin=(skill)=>{const r=runtime.startSkill({actorId:"a",targetId:"b",skill});
  assert.equal(r.ok,true);current=100;
  const contact=runtime.reportActionContact({actorId:"a",targetId:"b",skillId:skill.id});
  assert.equal(contact.outcome,"contact_held");
  return contact;};
 return {session,runtime,step,begin,started,ticks,ended};
}
test("skill contract validates opt-in melee contact, reusable effects and rejects duplicate clocks",()=>{
 const s=definition("sangsue");
 assert.equal(Object.isFrozen(s.contactHold.effects),true);
 assert.equal(s.contactHold.maxDurationMs,0);
 assert.throws(()=>definition("bad",{approachMode:"aerial"}),/contactHold requires/);
 assert.throws(()=>definition("bad",{form:"projectile"}),/contactHold requires/);
 assert.throws(()=>definition("bad",{contactHold:{tickIntervalMs:0,effects:[]}}),RangeError);
 assert.throws(()=>definition("bad",{contactHold:{tickIntervalMs:1000,
   effects:[{kind:"scheduled_effect",targetScope:"target",
     trigger:{type:"after_ms",delayMs:100},effects:[{kind:"damage",targetScope:"target",amount:3}]}]}}),/second zone or delayed/);
 const normal=normalizeSkillDefinition({id:"ordinary",name:"ordinary",category:"offensive",
  form:"contact",approachMode:"ground",energyCost:0,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
  effect:{damage:5,heal:0,tags:[]}});
 assert.equal(Object.hasOwn(normal,"contactHold"),false);
});
test("contact author pays energy only once; pulse native damage and lifesteal without second action",()=>{
 const h=createHarness(),skill=definition("sangsue");
 try{
  h.begin(skill);
  assert.equal(h.started.length,1);
  assert.equal(h.runtime.hasContactHoldFor("a"),true);
  assert.equal(h.runtime.startSkill({actorId:"a",targetId:"b",skill}).outcome,"contact_hold_active");
  assert.equal(h.session.snapshot().fighters.a.energy,46);
  h.step(1099); assert.equal(h.ticks.length,0);
  h.step(1100);
  assert.equal(h.ticks.length,1);
  assert.equal(h.session.snapshot().fighters.b.hp,90);
  assert.equal(h.session.snapshot().fighters.a.hp,55);
  h.step(3100);
  assert.equal(h.ticks.length,3);
  assert.equal(h.session.snapshot().fighters.b.hp,70);
  assert.equal(h.session.snapshot().fighters.a.hp,65);
  assert.equal(h.session.snapshot().fighters.a.energy,46);
 } finally {h.runtime.dispose();}
});
test("any actual hp loss breaks latch but full shield/immune damage does not",()=>{
 const h=createHarness(),skill=definition("sangsue");
 try{
  h.begin(skill);
  const enemy=normalizeSkillDefinition({id:"punch",name:"punch",category:"offensive",
    form:"contact",approachMode:"none",energyCost:0,preparationMs:0,
    travelMs:0,recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
    effect:{damage:7,heal:0,tags:[]}});
  const hit=h.session.useSkill({actorId:"b",targetId:"a",skill:enemy});
  assert.equal(hit.outcome,"hit");
  h.step(101);
  assert.equal(h.runtime.hasContactHoldFor("a"),false);
  assert.equal(h.ended[0].reason,"damage_taken");
  h.step(4100);
  assert.equal(h.ticks.length,0);
  assert.equal(h.runtime.startSkill({actorId:"a",targetId:"b",skill}).ok,true);
 }finally{h.runtime.dispose();}
});
test("bounded channel expires exactly; dispose or target KO cancels without leaks",()=>{
 const h=createHarness(),skill=definition("limited",{contactHold:{
    tickIntervalMs:1000,maxDurationMs:2500,effects:[
      {kind:"damage",targetScope:"target",amount:12,channel:"physical"}
    ]}});
 h.begin(skill);
 h.step(2600);
 assert.equal(h.ticks.length,2);
 assert.equal(h.ended[0].reason,"duration_expired");
 assert.equal(h.runtime.hasContactHoldFor("a"),false);
 h.runtime.dispose();
});

test("shield-only absorption does not detach; first subsequent real HP loss detaches",()=>{
 const h=createHarness(),latch=definition("shield-leech");
 const shield=normalizeSkillDefinition({id:"wall",name:"wall",category:"defensive",
  form:"self",approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
  targetRelations:["self"],effect:{damage:0,heal:0,tags:[]},
  effects:[{kind:"apply_status",targetScope:"self",status:{
   id:"wall-status",kind:"shield",polarity:"beneficial",durationMs:20000,
   stacking:"replace",amount:10
  }}]});
 const strike=normalizeSkillDefinition({id:"strike-shield",name:"strike",category:"offensive",
  form:"contact",approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
  effect:{damage:6,heal:0,tags:[]}});
 try{
  assert.equal(h.session.useSkill({actorId:"a",targetId:"a",skill:shield}).ok,true);
  h.begin(latch);
  h.session.useSkill({actorId:"b",targetId:"a",skill:strike});
  h.step(101);
  assert.equal(h.session.snapshot().fighters.a.hp,50);
  assert.equal(h.runtime.hasContactHoldFor("a"),true);
  h.session.useSkill({actorId:"b",targetId:"a",skill:strike});
  h.step(102);
  assert.equal(h.runtime.hasContactHoldFor("a"),false);
  assert.equal(h.ended[0].reason,"damage_taken");
 }finally{h.runtime.dispose();}
});
