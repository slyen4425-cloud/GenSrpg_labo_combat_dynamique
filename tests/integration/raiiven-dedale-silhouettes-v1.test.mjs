import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
const authored=JSON.parse(readFileSync("data/capture/showcase/raiiven-dedale-silhouettes.capture-skill-transfer-v1.json","utf8"));
const decoy=normalizeCaptureSkillTransferV1(authored).draft.definition;
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:30,initialEnergy:30,
energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const strike=normalizeSkillDefinition({id:"test-strike",name:"Frappe",category:"offensive",
 form:"contact",element:"physical",approachMode:"ground",energyCost:0,
 preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
 allowedDistances:["short","medium","long"],targetRelations:["enemy"],
 effect:{damage:20,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}});
const area=normalizeSkillDefinition({...strike,id:"test-zone",name:"Zone",form:"area",approachMode:"none"});
test("Dédale creates two selectable native decoys for 20 seconds",()=>{
 const s=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
 const result=s.useSkill({actorId:"raiiven",targetId:"raiiven",skill:decoy});
 assert.equal(result.outcome,"hit");
 const statuses=s.snapshot().fighters.raiiven.statusEffects;
 assert.equal(statuses.length,2);
 assert.ok(statuses.every(x=>x.definition.kind==="decoy" && x.definition.durationMs===20000));
});
test("Explicit wrong silhouette is destroyed, retaliates 10 shadow, does not touch real Raiiven",()=>{
 const s=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
 s.useSkill({actorId:"raiiven",targetId:"raiiven",skill:decoy});
 const r=s.useSkill({actorId:"enemy",targetId:"raiiven",skill:strike,decoyId:"raiiven-decoy-left"});
 assert.equal(r.outcome,"decoy");
 assert.equal(s.snapshot().fighters.raiiven.hp,100);
 assert.equal(s.snapshot().fighters.enemy.hp,90);
 assert.equal(s.snapshot().fighters.raiiven.statusEffects.length,1);
 const second=s.useSkill({actorId:"enemy",targetId:"raiiven",skill:strike,decoyId:"raiiven-decoy-right"});
 assert.equal(second.outcome,"decoy");
 assert.equal(s.snapshot().fighters.enemy.hp,80);
 assert.equal(s.snapshot().fighters.raiiven.statusEffects.length,0);
});
test("A real target and area attack hit Raiiven even when illusions are active",()=>{
 const s=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
 s.useSkill({actorId:"raiiven",targetId:"raiiven",skill:decoy});
 assert.equal(s.useSkill({actorId:"enemy",targetId:"raiiven",skill:strike}).outcome,"hit");
 assert.equal(s.snapshot().fighters.raiiven.hp,80);
 assert.equal(s.useSkill({actorId:"enemy",targetId:"raiiven",skill:area}).outcome,"hit");
 assert.equal(s.snapshot().fighters.raiiven.hp,60);
 assert.equal(s.snapshot().fighters.raiiven.statusEffects.length,2);
});
test("Decoy selection after natural expiration is rejected without energy spending",()=>{
 const s=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
 s.useSkill({actorId:"raiiven",targetId:"raiiven",skill:decoy});
 s.advanceMs(20001);
 const result=s.useSkill({actorId:"enemy",targetId:"raiiven",skill:strike,decoyId:"raiiven-decoy-left"});
 assert.equal(result.ok,false);
 assert.equal(result.outcome,"invalid_decoy_target");
 assert.equal(s.snapshot().fighters.raiiven.hp,100);
});
test("No fake decoy selection for area skills or beneficial skills",()=>{
 const s=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
 s.useSkill({actorId:"raiiven",targetId:"raiiven",skill:decoy});
 const r=s.useSkill({actorId:"enemy",targetId:"raiiven",skill:area,decoyId:"raiiven-decoy-left"});
 assert.equal(r.ok,false);assert.equal(r.outcome,"invalid_decoy_target");
});
