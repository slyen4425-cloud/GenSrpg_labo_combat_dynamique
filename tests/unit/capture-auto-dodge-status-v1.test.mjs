import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { projectStatusEffectInfoV1 } from "../../src/adapters/renderer/status-effect-info-v1.js";

const fighter = id => ({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
function skill(id,{category="offensive",form="projectile",damage=22,healing=0,
  effects=[],targetRelations=["enemy"],dodgeable=true}={}) {
  return normalizeSkillDefinition({id,name:id,category,form,element:null,approachMode:"none",
    energyCost:0,preparationMs:0,travelMs:750,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],targetRelations,dodgeable,
    effect:{damage,heal:healing,interruptsPreparation:false,stunMs:0,tags:[]},effects});
}
const buff = skill("lightning-dodge",{category:"buff_debuff",form:"self",damage:0,targetRelations:["self"],
  effects:[{kind:"apply_status",targetScope:"self",status:{
    id:"lightning-dodge-status",kind:"auto_dodge",polarity:"beneficial",
    durationMs:3000,stacking:"refresh",tags:["lightning"]
  }}]});
function session(ids=["attack","defender"]) { return createCombatSession({fighters:ids.map(fighter)}); }
function addBuff(combat,actorId="defender") {
  const done=combat.useSkill({actorId,targetId:actorId,skill:buff});
  assert.equal(done.ok,true);return done;
}
function attack(combat,{dodgeable=true,form="projectile",effects=[]}={}) {
  return combat.useSkill({actorId:"attack",targetId:"defender",
    skill:skill("incoming-"+form,{dodgeable,form,effects})});
}
test("automatic dodge is a beneficial authored duration status, not an immunity or reusable button charge",()=>{
  const status=normalizeStatusEffectV1({id:"lightning",kind:"auto_dodge",polarity:"beneficial",
    durationMs:3500,stacking:"refresh"});
  assert.equal(status.kind,"auto_dodge");
  assert.equal(status.durationMs,3500);
  assert.throws(()=>normalizeStatusEffectV1({...status,polarity:"detrimental"}),/beneficial/);
  assert.throws(()=>normalizeStatusEffectV1({...status,durationModel:"owner_action_end",durationMs:undefined,durationActions:2}),/time_ms/);
});
test("authored status applies with the usual effect contract and evades direct attacks at impact",()=>{
  const combat=session();
  addBuff(combat);
  const statuses=combat.snapshot().fighters.defender.statusEffects;
  assert.equal(statuses.length,1);
  assert.equal(statuses[0].definition.kind,"auto_dodge");
  assert.match(projectStatusEffectInfoV1({instance:statuses[0],elapsedMs:0}).descriptionLines.join(" "),/esquiv/i);
  for(const form of ["contact","projectile","beam","area"]){
    const result=attack(combat,{form});
    assert.equal(result.outcome,"evaded",form);
    assert.equal(combat.snapshot().fighters.defender.hp,100,form);
    assert.equal(result.evasionReason,"auto_dodge",form);
  }
  assert.equal(combat.snapshot().fighters.defender.statusEffects.length,1);
});
test("automatic evasion also suppresses a negative on-hit status and never dodges undodgeable attacks",()=>{
  const combat=session();
  addBuff(combat);
  const result=attack(combat,{effects:[{kind:"apply_status",targetScope:"target",
    status:{id:"blind",kind:"stun",polarity:"detrimental",durationMs:1000,stacking:"refresh"}}]});
  assert.equal(result.outcome,"evaded");
  assert.equal(combat.snapshot().fighters.defender.statusEffects.length,1);
  const unavoidable=attack(combat,{dodgeable:false});
  assert.equal(unavoidable.outcome,"hit");
  assert.equal(combat.snapshot().fighters.defender.hp,78);
});
test("automatic dodge expires on the real combat clock and does not block a later hit",()=>{
  const combat=session();addBuff(combat);
  combat.advanceMs(2999);
  assert.equal(attack(combat).outcome,"evaded");
  combat.advanceMs(1);
  assert.equal(attack(combat).outcome,"hit");
  assert.equal(combat.snapshot().fighters.defender.hp,78);
});
test("automatic dodge respects independent fighter statuses in a 2v2 session",()=>{
  const combat=session(["attack","defender","ally","other"]);
  addBuff(combat);
  const onDefender=attack(combat);
  assert.equal(onDefender.outcome,"evaded");
  const onAlly=combat.useSkill({actorId:"attack",targetId:"ally",skill:skill("hit-ally")});
  assert.equal(onAlly.outcome,"hit");
  assert.equal(combat.snapshot().fighters.ally.hp,78);
});
test("Human Editor exposes this effect as a configurable duration buff, and existing source protects no core clocks",()=>{
  const editor=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(editor,/auto_dodge:\s*["']Esquive automatique/);
  assert.match(editor,/statusKind === "auto_dodge"/);
  const source=readFileSync(new URL("../../src/core/combat/action-resolver.js",import.meta.url),"utf8");
  assert.match(source,/autoDodgeEvasionFor/);
  assert.doesNotMatch(source,/setTimeout|setInterval/);
});
