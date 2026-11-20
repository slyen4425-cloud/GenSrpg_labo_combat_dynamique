import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
const transfer=JSON.parse(readFileSync("data/capture/showcase/raiiven-fer-maudit.capture-skill-transfer-v1.json","utf8"));
const skill=normalizeCaptureSkillTransferV1(transfer).draft.definition;
const fighter=id=>({id,maxHp:150,initialHp:150,maxEnergy:30,initialEnergy:30,energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const strike=normalizeSkillDefinition({id:"test-offensive",name:"Offensive",category:"offensive",form:"contact",approachMode:"none",element:"physical",energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],targetRelations:["enemy"],effect:{damage:0,heal:0,tags:[]}});
const heal=normalizeSkillDefinition({...strike,id:"test-heal",name:"Soin",category:"heal",form:"self",targetRelations:["self"]});
test("Raiiven's cursed mark detonates ONCE on paid offensive action, not on support",()=>{
  const session=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
  assert.equal(session.useSkill({actorId:"raiiven",targetId:"enemy",skill}).outcome,"hit");
  assert.equal(session.snapshot().fighters.enemy.hp,138);
  assert.equal(session.snapshot().fighters.enemy.statusEffects.length,1);
  assert.equal(session.useSkill({actorId:"enemy",targetId:"enemy",skill:heal}).outcome,"hit");
  assert.equal(session.snapshot().fighters.enemy.hp,138);
  assert.equal(session.useSkill({actorId:"enemy",targetId:"raiiven",skill:strike}).outcome,"hit");
  assert.equal(session.snapshot().fighters.enemy.hp,130);
  assert.equal(session.snapshot().fighters.enemy.statusEffects.length,0);
  assert.equal(session.useSkill({actorId:"enemy",targetId:"raiiven",skill:strike}).outcome,"hit");
  assert.equal(session.snapshot().fighters.enemy.hp,130);
});
test("The mark expires after 6 seconds and does not detonate when no offensive action was used",()=>{
  const session=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
  session.useSkill({actorId:"raiiven",targetId:"enemy",skill});
  session.advanceMs(6001);
  session.useSkill({actorId:"enemy",targetId:"raiiven",skill:strike});
  assert.equal(session.snapshot().fighters.enemy.hp,138);
});
test("Author export retains native consumable-trigger semantics",()=>{
  assert.equal(skill.effect.damage,12);
  const status=skill.effects[0].status;
  assert.equal(status.durationMs,6000);
  assert.equal(status.onEvent.event,"offensive_skill_start");
  assert.equal(status.onEvent.consume,true);
  assert.equal(status.onEvent.effects[0].amount,8);
});
