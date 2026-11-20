import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureCreatureTransferV1} from "../../src/contracts/capture-creature-transfer-v1.js";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";

test("Raiiven native five-skill loadout links exactly four new skills plus approved Cavalcade, without editing visuals",()=>{
 const registry=JSON.parse(readFileSync("data/capture/monster-capture-stat-registry.v1.json","utf8"));
 const creature=normalizeCaptureCreatureTransferV1(JSON.parse(
   readFileSync("data/capture/showcase/raiiven.capture-creature-transfer-v1.json","utf8")),registry);
 const ids=["raiiven-fer-maudit","raiiven-dedale-silhouettes","raiiven-vol-foulees",
   "raiiven-remanence-interdite","raiiven-cavalcade-damnes"];
 assert.deepEqual(creature.draft.skillIds,ids);
 assert.deepEqual(creature.loadout.slots.map(slot=>slot.skillId),ids);
 for(let i=0;i<ids.length;i++){
   const skill=normalizeCaptureSkillTransferV1(JSON.parse(readFileSync(
     "data/capture/showcase/"+ids[i]+".capture-skill-transfer-v1.json","utf8"))).draft;
   assert.equal(skill.id,ids[i]);
   assert.equal(skill.requiredLevel,[1,5,10,15,20][i]);
   assert.equal(skill.definition.loadoutSlot,i===4?"ultimate":"standard");
 }
 const visual=creature.draft.presentation.visual;
 assert.equal(visual.movementBack.assetId,"pack:capture:creature-raiiven-movement-player-7-v1");
 assert.equal(visual.movement.assetId,"pack:capture:creature-raiiven-movement-opponent-6-v1");
 assert.equal(visual.rangedAttack.assetId,"pack:capture:creature-raiiven-attack-opponent-5-v1");
 assert.equal(visual.rangedAttackBack.assetId,"pack:capture:creature-raiiven-attack-player-5-v1");
});
