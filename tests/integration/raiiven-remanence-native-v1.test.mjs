import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {projectNativeSkillEchoV1} from "../../src/core/combat/skill-echo-v1.js";

const doc=JSON.parse(readFileSync("data/capture/showcase/raiiven-remanence-interdite.capture-skill-transfer-v1.json","utf8"));
const echo=normalizeCaptureSkillTransferV1(doc).draft.definition;
const fighter=(id,hp=160)=>({id,maxHp:160,initialHp:hp,maxEnergy:30,initialEnergy:30,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const attack=normalizeSkillDefinition({id:"enemy-shot",name:"Projectile original",category:"offensive",
  form:"projectile",element:"fire",approachMode:"none",energyCost:2,preparationMs:0,
  travelMs:0,recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
  targetRelations:["enemy"],effect:{damage:40,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}});
const heal=normalizeSkillDefinition({id:"enemy-heal",name:"Soin original",category:"heal",form:"self",
  element:"water",approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:0,targetRelations:["self"],allowedDistances:["short","medium","long"],
  effect:{damage:0,heal:0,tags:[]},effects:[{kind:"heal",targetScope:"self",amount:20}]});
test("Rémanence refuses no source before energy is paid",()=>{
  const s=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
  assert.equal(s.startSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
  assert.equal(s.snapshot().fighters.raiiven.energy,30);
});
test("Rémanence copies the last native projectile, converts 40 -> 24 shadow and pays only echo",()=>{
  const s=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
  assert.equal(s.useSkill({actorId:"enemy",targetId:"raiiven",skill:attack}).outcome,"hit");
  const before=s.snapshot().fighters.enemy.hp;
  const preview=s.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo});
  assert.equal(preview.ok,true);
  assert.equal(preview.events.find(e=>e.type==="hit").damageChannel,"shadow");
  const r=s.useSkill({actorId:"raiiven",targetId:"enemy",skill:echo});
  assert.equal(r.ok,true);
  assert.equal(s.snapshot().fighters.enemy.hp,before-24);
  assert.equal(s.snapshot().fighters.raiiven.energy,23);
  assert.equal(s.useSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"cooldown");
});
test("Rémanence copies a real ally/self heal to Raiiven with same native effect kind",()=>{
  const s=createCombatSession({fighters:[fighter("raiiven",80),fighter("enemy",100)]});
  assert.equal(s.useSkill({actorId:"enemy",targetId:"enemy",skill:heal}).outcome,"hit");
  const r=s.useSkill({actorId:"raiiven",targetId:"enemy",skill:echo});
  assert.equal(r.ok,true);
  assert.equal(s.snapshot().fighters.raiiven.hp,92);
  assert.equal(s.snapshot().fighters.enemy.hp,120);
  assert.equal(r.events.find(e=>e.type==="heal")?.applied,12);
});
test("Native source cannot be ultimate and new member cannot inherit old source",()=>{
  const s=createCombatSession({fighters:[fighter("raiiven"),fighter("enemy")]});
  const ultimate=normalizeSkillDefinition({...attack,id:"big-ultimate",loadoutSlot:"ultimate"});
  s.useSkill({actorId:"enemy",targetId:"raiiven",skill:ultimate});
  assert.equal(s.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
  s.useSkill({actorId:"enemy",targetId:"raiiven",skill:attack});
  s.replaceFighter("enemy",fighter("enemy"));
  assert.equal(s.previewSkill({actorId:"raiiven",targetId:"enemy",skill:echo}).outcome,"no_copy_source");
});
test("Nested zone damage/heal, statuses and channel effects project only numbers and shadow channel",()=>{
  const projected=projectNativeSkillEchoV1({echoSkill:echo,sourceSkill:{
    ...attack,effects:[{kind:"persistent_zone",targetScope:"target",
      tickEffect:{kind:"damage",targetScope:"target",amount:5,channel:"fire"}},
      {kind:"heal",targetScope:"self",amount:9}],effect:{...attack.effect,damage:0}},
    actorId:"raiiven",targetId:"enemy"});
  assert.equal(projected.ok,true);
  assert.equal(projected.skill.effects[0].tickEffect.amount,3);
  assert.equal(projected.skill.effects[0].tickEffect.channel,"shadow");
  assert.equal(projected.skill.effects[1].amount,5);
  assert.equal(projected.skill.id,echo.id);
});
