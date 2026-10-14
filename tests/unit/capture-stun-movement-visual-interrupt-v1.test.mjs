import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {createCombatResolutionPresenter} from "../../src/adapters/renderer/combat-resolution-presenter.js";

const arc=normalizeSkillDefinition(JSON.parse(readFileSync(new URL(
  "../../data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json",import.meta.url),"utf8"
)).draft.definition);
assert.equal(arc.name,"Arc électrique");
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
function movingSkill(id,mode="ground"){
 return normalizeSkillDefinition({
  id,name:id,category:"offensive",form:"contact",element:null,approachMode:mode,
  energyCost:0,preparationMs:150,travelMs:7000,recoveryMs:0,cooldownMs:0,
  allowedDistances:["short","medium","long"],targetRelations:["enemy"],
  effect:{damage:25,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}
 });
}
function harness(){
 let clock=0,tick=()=>{};
 const visualCalls=[],interrupts=[],resolutions=[];
 const visuals={
  playEventFor(actorId,event){visualCalls.push(["event",actorId,event]);return Promise.resolve({status:"finished"})},
  playApproachFor(actorId,mode){visualCalls.push(["approach",actorId,mode]);return new Promise(()=>{})},
  cancelFor(actorId){visualCalls.push(["cancel",actorId])}
 };
 const presenter=createCombatResolutionPresenter({visuals});
 const session=createCombatSession({fighters:["victim","caster"].map(fighter)});
 const runtime=createCombatRuntime({session,now:()=>clock,setTimer:fn=>(tick=fn,1),clearTimer:()=>{},
  onRelease:({action})=>presenter.presentRelease({action,actorSlot:action.actorId,targetSlot:action.targetId}),
  onInterrupted:r=>{interrupts.push(r);presenter.cancelActionPresentation(r.action.actorId)},
  onResolved:r=>resolutions.push(r)
 });
 runtime.start();
 return {session,runtime,visualCalls,interrupts,resolutions,
  step(ms){clock=ms;tick()},dispose(){runtime.dispose();presenter.dispose()}};
}
test("RED: true Arc stun stops the moving action AND the already playing creature animation",()=>{
 const h=harness();
 h.runtime.startSkill({actorId:"victim",targetId:"caster",skill:movingSkill("approach")});
 h.runtime.startSkill({actorId:"caster",targetId:"victim",skill:arc});
 h.step(400);
 assert.equal(h.runtime.hasActiveActionFor("victim"),true);
 assert.equal(h.visualCalls.some(x=>x[0]==="approach"&&x[1]==="victim"),true);
 assert.equal(h.visualCalls.some(x=>x[0]==="cancel"&&x[1]==="victim"),false);
 h.step(1600);
 assert.equal(h.session.snapshot().fighters.victim.statusEffects.some(x=>x.definition.kind==="stun"),true);
 assert.equal(h.runtime.hasActiveActionFor("victim"),false,"native movement action must be cancelled");
 assert.equal(h.interrupts.filter(x=>x.reason==="stun"&&x.action.actorId==="victim").length,1);
 assert.equal(h.visualCalls.some(x=>x[0]==="cancel"&&x[1]==="victim"),true,"presenter must cancel the travel animation");
 assert.equal(h.visualCalls.some(x=>x[0]==="cancel"&&x[1]==="caster"),false,"do not cancel the other actor's beam");
 h.step(9000);
 assert.equal(h.session.snapshot().fighters.caster.hp,100,"no late collision or hit from cancelled approach");
 h.dispose();
});
test("RED: every native movement profile is cancelled visually by the same callback",()=>{
 for(const mode of ["ground","aerial","teleport","burrow"]){
  const h=harness();
  h.runtime.startSkill({actorId:"victim",targetId:"caster",skill:movingSkill("approach-"+mode,mode)});
  h.runtime.startSkill({actorId:"caster",targetId:"victim",skill:arc});
  h.step(400);h.step(1600);
  assert.equal(h.runtime.hasActiveActionFor("victim"),false,mode);
  assert.equal(h.visualCalls.filter(x=>x[0]==="cancel"&&x[1]==="victim").length,1,mode);
  h.dispose();
 }
});
test("RED: cancelling a live approach by the existing UI callback immediately cancels its visual",()=>{
 const h=harness();
 h.runtime.startSkill({actorId:"victim",targetId:"caster",skill:movingSkill("movement")});
 h.step(400);
 const res=h.runtime.cancelActionsForActor("victim",{reason:"test-stop"});
 assert.equal(res.ok,true);
 assert.equal(h.visualCalls.filter(x=>x[0]==="cancel"&&x[1]==="victim").length,1);
 h.dispose();
});
