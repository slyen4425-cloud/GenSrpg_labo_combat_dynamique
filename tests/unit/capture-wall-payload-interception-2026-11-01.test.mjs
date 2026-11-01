import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";

const base=JSON.parse(readFileSync(new URL("../../data/combat/skills/fireball.skill.json",import.meta.url),"utf8"));
const wallEffect={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",
  hpPerStatPoint:1,interceptKinds:["projectile","beam","contact"]};
function skill(id,overrides={}){
 return normalizeSkillDefinition({...base,id,name:id,energyCost:0,preparationMs:0,travelMs:300,
  recoveryMs:0,cooldownMs:0,projectileClash:{power:0},
  effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},effects:[],...overrides});
}
function combat(){
 const session=createCombatSession({fighters:[
  {id:"hero",maxHp:100,initialHp:100,maxEnergy:12,initialEnergy:12,statValuesById:{glace:6}},
  {id:"enemy",maxHp:100,initialHp:100,maxEnergy:12,initialEnergy:12}
 ]});
 const wall=skill("wall-full-hit",{
  form:"self",category:"defensive",targetRelations:["self"],targetLocations:["active"],
  effects:[wallEffect],travelMs:0});
 const start=session.startSkill({actorId:"hero",targetId:"hero",skill:wall});
 assert.equal(start.ok,true);assert.equal(session.completeSkill({action:start.action}).ok,true);
 return {session,wallId:session.snapshot().combatEntities[0].id};
}
test("RED: a wall with 6 HP terminates a single 40 damage hit without spill on its owner",()=>{
 for(const form of ["projectile","beam","contact"]){
  const {session,wallId}=combat(),before=session.snapshot();
  const result=applyCombatDamageV1({state:before,sourceActorId:"enemy",targetActorId:"hero",
   damage:40,incomingKind:form,contactedEntityId:wallId});
  assert.equal(result.absorbedByEntity,6,form);
  assert.equal(result.appliedDamage,0,form+" cannot pass through a destroyed wall");
  assert.equal(result.state.fighters.hero.hp,100,form);
  assert.equal(result.state.combatEntities.length,0,form);
 }
});
test("RED: observed wall hit suppresses enemy secondary damage, stun and energy drain",()=>{
 const {session,wallId}=combat();
 const strike=skill("enemy-wall-hit",{
  form:"projectile",category:"offensive",
  effect:{damage:40,heal:0,stunMs:1500,interruptsPreparation:true,tags:[]},
  effects:[
   {kind:"energy_drain",targetScope:"target",amount:3},
   {kind:"apply_status",targetScope:"target",status:{id:"ice-stun-red",
    kind:"stun",polarity:"detrimental",durationMs:2000,stacking:"refresh",tags:[]}}
  ]});
 const start=session.startSkill({actorId:"enemy",targetId:"hero",skill:strike});
 assert.equal(start.ok,true);
 const done=session.completeSkill({action:{...start.action,barrierContactId:wallId}});
 assert.equal(done.ok,true);
 assert.equal(session.snapshot().fighters.hero.hp,100);
 assert.equal(session.snapshot().fighters.hero.energy,12);
 assert.equal(session.snapshot().fighters.hero.statusEffects.length,0);
 assert.equal(done.events.some(x=>x.type==="charge-interrupt"&&x.actorId==="hero"),false);
 assert.equal(session.snapshot().combatEntities.length,0);
});
test("no spatial wall evidence keeps normal hit and debuff; ally self effects remain possible",()=>{
 const {session}=combat();
 const strike=skill("enemy-missed-wall",{
  form:"projectile",category:"offensive",
  effect:{damage:8,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},
  effects:[{kind:"energy_drain",targetScope:"target",amount:3}]});
 const start=session.startSkill({actorId:"enemy",targetId:"hero",skill:strike});
 assert.equal(start.ok,true);
 const done=session.completeSkill({action:start.action});
 assert.equal(done.ok,true);
 assert.ok(session.snapshot().fighters.hero.hp<100);
 assert.equal(session.snapshot().fighters.hero.energy,9);
 assert.equal(session.snapshot().combatEntities[0].hp,6);
});

test("a zero-damage projectile that only applies a detrimental status is intercepted by the same observed wall",()=>{
 const {session,wallId}=combat();
 const statusOnly=skill("status-only-wall-hit",{
  form:"projectile",category:"offensive",
  effects:[{kind:"apply_status",targetScope:"target",status:{id:"frost-only",
   kind:"stun",polarity:"detrimental",durationMs:2000,stacking:"refresh",tags:[]}}]
 });
 const started=session.startSkill({actorId:"enemy",targetId:"hero",skill:statusOnly});
 assert.equal(started.ok,true);
 const finished=session.completeSkill({action:{...started.action,barrierContactId:wallId}});
 assert.equal(finished.ok,true);
 assert.equal(session.snapshot().fighters.hero.statusEffects.length,0,
  "observed geometry must stop a non-damaging hostile payload as well");
 assert.equal(session.snapshot().combatEntities[0].hp,6);
});
test("a tactical-only damaging projectile is also stopped by the observed wall",()=>{
 const {session,wallId}=combat();
 const tactical=skill("damage-only-wall-hit",{
  form:"projectile",category:"offensive",
  effects:[{kind:"damage",targetScope:"target",amount:20,channel:"fire"}]
 });
 const started=session.startSkill({actorId:"enemy",targetId:"hero",skill:tactical});
 assert.equal(started.ok,true);
 const result=session.completeSkill({action:{...started.action,barrierContactId:wallId}});
 assert.equal(result.ok,true);
 assert.equal(session.snapshot().fighters.hero.hp,100);
 assert.equal(session.snapshot().combatEntities[0].hp,6,
  "blocking a tactical payload must not synthesize a second contact/damage event");
});
