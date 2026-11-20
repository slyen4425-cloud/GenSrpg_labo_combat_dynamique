import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {captureCreatureReactionActionIdV1} from "../../src/contracts/capture-creature-defensive-reaction-v1.js";
const file=JSON.parse(readFileSync("data/capture/showcase/raiiven-vol-foulees.capture-skill-transfer-v1.json","utf8"));
const skill=normalizeCaptureSkillTransferV1(file).draft.definition;
const fighter=(id,maxCharges)=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0,
 defensiveReaction:{type:"dodge",maxCharges,rechargeMs:30000,activeWindowMs:500,damageReductionPct:50},defensiveCreatureId:id});
const key=id=>captureCreatureReactionActionIdV1(id,"dodge");
const avail=(s,id,maxCharges)=>s.rechargeableActionAvailability({actorId:id,actionId:key(id),maxCharges,rechargeMs:30000});
const press=(s,id,maxCharges)=>s.activateRechargeableAction({actorId:id,actionId:key(id),maxCharges,rechargeMs:30000,activeWindowMs:500});
test("damage scales from MAX dodge capacity; steals one available charge and restores thief without artificial dodge",()=>{
 const s=createCombatSession({fighters:[fighter("raiiven",3),fighter("enemy",2)]});
 assert.equal(press(s,"raiiven",3).ok,true);
 assert.equal(press(s,"enemy",2).ok,true);
 s.advanceMs(1000);
 const r=s.useSkill({actorId:"raiiven",targetId:"enemy",skill});
 assert.equal(r.outcome,"hit");assert.equal(s.snapshot().fighters.enemy.hp,85);
 assert.equal(avail(s,"enemy",2).charges,0);
 assert.equal(avail(s,"raiiven",3).charges,3);
 assert.equal(s.rechargeableActionWindowStatus({actorId:"enemy",actionId:key("enemy"),activeWindowMs:500}).active,false);
 assert.equal(r.events.some(e=>e.type==="evasion-charge-stolen"&&e.stolen===1&&e.restored===1),true);
});
test("zero available dodge charges still means 15 damage, but no charge can be stolen",()=>{
 const s=createCombatSession({fighters:[fighter("raiiven",3),fighter("enemy",2)]});
 press(s,"enemy",2);s.advanceMs(600);press(s,"enemy",2);s.advanceMs(600);
 const r=s.useSkill({actorId:"raiiven",targetId:"enemy",skill});
 assert.equal(r.outcome,"hit");assert.equal(s.snapshot().fighters.enemy.hp,85);
 assert.equal(r.events.some(e=>e.type==="evasion-charge-stolen"&&e.stolen===0),true);
});
