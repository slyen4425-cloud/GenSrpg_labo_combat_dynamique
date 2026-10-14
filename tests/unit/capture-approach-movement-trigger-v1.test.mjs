import test from "node:test";
import assert from "node:assert/strict";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";

const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:30,initialEnergy:30,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const make=ids=>createCombatSession({fighters:ids.map(fighter)});
function skill(id,{mode="none",form="contact",damage=5,category="offensive",relations=["enemy"],
 effects=[]}={}){
 return normalizeSkillDefinition({id,name:id,category,form,element:null,approachMode:mode,
  energyCost:0,preparationMs:0,travelMs:500,recoveryMs:0,cooldownMs:0,
  allowedDistances:["short","medium","long"],targetRelations:relations,
  effect:{damage,heal:0,interruptsPreparation:false,stunMs:0,tags:[]},effects});
}
const curse={id:"movement-curse",kind:"triggered_buff",polarity:"detrimental",
 durationMs:60000,stacking:"refresh",onEvent:{event:"movement",
 effects:[{kind:"damage",targetScope:"self",amount:7,channel:"physical"}]}};
function give(c,holder="actor",source="foe"){
 const s=skill("curse-cast",{form:"self",damage:0,category:"buff_debuff",
 relations:["enemy"],effects:[{kind:"apply_status",targetScope:"target",status:curse}]});
 const v=c.useSkill({actorId:source,targetId:holder,skill:s});
 assert.equal(v.ok,true);
}
test("real Capture approach ground/aerial/teleport/burrow triggers the same movement event once on completion",()=>{
 for(const mode of ["ground","aerial","teleport","burrow"]){
  const c=make(["actor","foe"]);give(c);
  const result=c.useSkill({actorId:"actor",targetId:"foe",skill:skill("moving-"+mode,{mode})});
  assert.equal(result.ok,true,mode);
  assert.equal(c.snapshot().fighters.actor.hp,93,mode);
  assert.equal(c.snapshot().fighters.foe.hp,95,mode);
  assert.equal(result.events.filter(e=>e.type==="hit"&&e.actorId==="actor"&&e.appliedDamage===7).length,1,mode);
 }
});
test("stationary projectile/beam never counts as movement even when projectile has travel time",()=>{
 for(const form of ["projectile","beam"]){
  const c=make(["actor","foe"]);give(c);
  const result=c.useSkill({actorId:"actor",targetId:"foe",skill:skill("stationary-"+form,{form,mode:"none"})});
  assert.equal(result.outcome,"hit");
  assert.equal(c.snapshot().fighters.actor.hp,100);
 }
});
test("expired movement curse is inert, and not attached to another 2v2 actor",()=>{
 const c=make(["actor","foe","friend","other"]);give(c);
 c.useSkill({actorId:"friend",targetId:"other",skill:skill("friend-approach",{mode:"ground"})});
 assert.equal(c.snapshot().fighters.actor.hp,100);
 c.advanceMs(60000);
 c.useSkill({actorId:"actor",targetId:"foe",skill:skill("actor-approach",{mode:"ground"})});
 assert.equal(c.snapshot().fighters.actor.hp,100);
});
