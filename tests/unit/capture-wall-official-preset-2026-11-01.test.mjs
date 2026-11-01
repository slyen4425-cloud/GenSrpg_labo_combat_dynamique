import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";

const path="data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json";
const published=()=>importCaptureTransferJsonV1(readFileSync(new URL("../../"+path,import.meta.url),"utf8")).value.draft;

test("one official Mur de glace preset replaces level-one example with actual corrected player export",()=>{
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===path).length,1);
 const draft=published(),skill=normalizeSkillDefinition(draft.definition);
 assert.equal(draft.id,"mur_de_glace");
 assert.equal(draft.requiredLevel,10);
 assert.equal(skill.form,"self");assert.equal(skill.category,"defensive");
 assert.deepEqual(skill.targetRelations,["self"]);
 assert.deepEqual(skill.targetLocations,["active"]);
 assert.equal(skill.approachMode,"none");
 assert.equal(skill.energyCost,5);
 assert.equal(skill.preparationMs,900);
 assert.equal(skill.cooldownMs,45000);
 assert.equal(skill.dodgeable,false);
 assert.equal(skill.effects.length,1);
 assert.equal(skill.effects[0].kind,"summon_entity");
 assert.equal(skill.effects[0].targetScope,"self");
 assert.equal(skill.effects[0].entityKind,"barrier");
 assert.equal(skill.effects[0].statId,"glace");
 assert.equal(skill.effects[0].hpPerStatPoint,1);
 assert.deepEqual(skill.effects[0].interceptKinds,["projectile","beam"]);
 assert.equal(skill.effects[0].spriteAssetId,"pack:capture:sprite-mur-glace-arcanique-01");
 assert.equal(skill.effects[0].visualScale,1);
 assert.equal(skill.effects[0].offsetForwardPx,80);
 assert.equal(skill.effects[0].offsetUpPx,50);
 assert.ok(draft.description.includes("Glace"),"meaningful description is required, not the author's earlier placeholder");
 const fields=humanSkillEditorFieldsFromDraftV1(draft);
 assert.equal(fields.form,"self");assert.equal(fields.requiredLevel,10);
 assert.equal(fields.effects[0].spriteAssetId,skill.effects[0].spriteAssetId);
 const roundTrip=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft));
 assert.deepEqual(roundTrip.value.draft.definition.effects, draft.definition.effects);
 assert.equal(roundTrip.value.draft.requiredLevel,10);
});
test("official preset can launch through the native combat session and creates one stat-scaled wall",()=>{
 const skill=normalizeSkillDefinition(published().definition);
 const make=glace=>createCombatSession({fighters:[
  {id:"player",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace}},
  {id:"opponent",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
 ]});
 const invalid=make(0);
 assert.equal(invalid.startSkill({actorId:"player",targetId:"player",skill}).outcome,"no_stat_points");
 assert.equal(invalid.snapshot().fighters.player.energy,10);
 const valid=make(12),started=valid.startSkill({actorId:"player",targetId:"player",skill});
 assert.equal(started.ok,true);
 assert.equal(valid.snapshot().fighters.player.energy,5);
 assert.equal(valid.completeSkill({action:started.action}).ok,true);
 assert.equal(valid.snapshot().combatEntities.length,1);
 assert.equal(valid.snapshot().combatEntities[0].hp,12);
 assert.equal(valid.snapshot().combatEntities[0].spriteAssetId,
   "pack:capture:sprite-mur-glace-arcanique-01");
});
