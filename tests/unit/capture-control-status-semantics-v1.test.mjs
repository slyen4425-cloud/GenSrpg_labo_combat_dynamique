import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

function actor(id) {
  return { id, maxHp:100, initialHp:100, maxEnergy:20, initialEnergy:20,
    energyChargeAmount:0, energyChargeIntervalMs:2000, movementEnergyPerStep:1 };
}
function ability(id,{form="contact",approachMode="none",energyCost=2,travelMs=1000,preparationMs=0,effects=[],damage=2}={}){
 return normalizeSkillDefinition({
  id,name:id,category:damage>0?"offensive":"buff_debuff",form,element:null,approachMode,
  energyCost,preparationMs,travelMs,recoveryMs:0,cooldownMs:1000,
  allowedDistances:["short","medium","long"],targetRelations:["enemy","ally","self"],
  effect:{damage,heal:0,tags:[]},effects
 });
}
const status = (kind)=>({
  id:"control-"+kind,kind,polarity:"detrimental",durationModel:"time_ms",
  durationMs:3000,stacking:"refresh",maxStacks:1,tags:[]
});
const castStatus=(kind)=>ability("apply-"+kind,{
  form:"self",energyCost:0,travelMs:0,damage:0,
  effects:[{kind:"apply_status",targetScope:"target",status:status(kind)}]
});
const setup=()=>createCombatSession({distance:"medium",fighters:[actor("a"),actor("b")]});

test("Silence blocks projectile, beam and area, but allows melee and self/aura, without resource loss for rejected ranged skills",()=>{
 for(const form of ["projectile","beam","area"]){
  const session=setup();
  session.useSkill({actorId:"a",targetId:"b",skill:castStatus("silence")});
  const before=session.snapshot().fighters.b.energy;
  const blocked=session.startSkill({actorId:"b",targetId:"a",skill:ability("ranged-"+form,{form})});
  assert.equal(blocked.ok,false,form);
  assert.equal(blocked.outcome,"silenced",form);
  assert.equal(session.snapshot().fighters.b.energy,before,form);
  assert.equal(session.snapshot().fighters.b.skillCooldowns["ranged-"+form],undefined);
 }
 for(const form of ["contact","self","aura"]){
  const session=setup();
  session.useSkill({actorId:"a",targetId:"b",skill:castStatus("silence")});
  const skill=ability("allowed-"+form,{form,approachMode:form==="contact"?"ground":"none"});
  const ok=session.startSkill({actorId:"b",targetId:form==="contact"?"a":"b",skill});
  assert.equal(ok.ok,true,form);
 }
});

test("Immobilization stops voluntary distance changes and movement skills but still permits standing attacks",()=>{
 const session=setup();
 session.useSkill({actorId:"a",targetId:"b",skill:castStatus("immobilize")});
 const before=session.snapshot().fighters.b.energy;
 assert.equal(session.move("b","long").outcome,"immobilized");
 for (const approachMode of ["ground","aerial","teleport","burrow"]) {
  const denied=session.startSkill({actorId:"b",targetId:"a",skill:ability("moving-"+approachMode,{form:"contact",approachMode})});
  assert.equal(denied.ok,false,approachMode);
  assert.equal(denied.outcome,"immobilized",approachMode);
 }
 const still=session.startSkill({actorId:"b",targetId:"a",skill:ability("stationary",{form:"projectile",approachMode:"none"})});
 assert.equal(still.ok,true);
 assert.equal(session.snapshot().fighters.b.energy,before-2);
});

test("An immobilization applied during a live approach interrupts actual Combat Runtime action and cancels its visual owner",()=>{
 const session=setup();
 let time=0;
 const interrupted=[];
 const resolved=[];
 const runtime=createCombatRuntime({
  session,now:()=>time,
  onInterrupted:x=>interrupted.push(x),
  onResolved:x=>resolved.push(x)
 });
 const moving=ability("moving-contact",{form:"contact",approachMode:"ground",travelMs:1000});
 assert.equal(runtime.startSkill({actorId:"b",targetId:"a",skill:moving}).ok,true);
 assert.equal(runtime.hasActiveActionFor("b"),true);
 time=300;
 const root=runtime.startSkill({actorId:"a",targetId:"b",skill:castStatus("immobilize")});
 assert.equal(root.ok,true);
 assert.equal(session.snapshot().fighters.b.statusEffects.some(x=>x.definition.kind==="immobilize"),true);
 assert.equal(runtime.hasActiveActionFor("b"),false,"the in-flight ground movement has to stop on effect");
 assert.equal(interrupted.length,1);
 assert.equal(interrupted[0].action.actionId,"moving-contact");
 assert.equal(interrupted[0].reason,"immobilized");
 assert.equal(resolved.some(x=>x.skillId==="moving-contact"),false,"no delayed impact after root");
 time=600;
 const late=runtime.reportActionContact({actorId:"b",targetId:"a",skillId:"moving-contact"});
 assert.equal(late.ok,false);
 assert.equal(resolved.some(x=>x.skillId==="moving-contact"),false);
 runtime.dispose();
});

test("Root does not cancel stationary casts in progress",()=>{
 const session=setup();
 let time=0; const interrupted=[];
 const runtime=createCombatRuntime({session,now:()=>time,onInterrupted:x=>interrupted.push(x)});
 assert.equal(runtime.startSkill({actorId:"b",targetId:"a",skill:ability("standing-beam",{form:"beam",approachMode:"none"})}).ok,true);
 time=200;
 assert.equal(runtime.startSkill({actorId:"a",targetId:"b",skill:castStatus("immobilize")}).ok,true);
 assert.equal(runtime.hasActiveActionFor("b"),true);
 assert.equal(interrupted.length,0);
 runtime.dispose();
});
