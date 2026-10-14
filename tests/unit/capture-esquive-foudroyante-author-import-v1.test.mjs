import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";

const path="../../data/capture/showcase/dodge.capture-skill-transfer-v1.json";
const relative="data/capture/showcase/dodge.capture-skill-transfer-v1.json";
async function readAuthor(){return await readFile(new URL(path,import.meta.url),"utf8")}
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
test("RED: Esquive foudroyante author skill registered exactly once in actual showcase import owner",()=>{
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===relative).length,1);
});
test("author transfer remains byte-for-byte identical and roundtrips without modifying draft",async()=>{
 const original=await readAuthor();
 assert.equal(Buffer.byteLength(original,"utf8"),2532);
 assert.equal(createHash("sha256").update(original).digest("hex"),"dd5319422c9e413168477d98d56aa26bfa32c2830a42921683340a6beab7ecb4");
 const imported=importCaptureTransferJsonV1(original);
 assert.equal(imported.value.draft.id,"dodge");
 assert.equal(imported.value.draft.definition.id,"dodge");
 const exported=exportCaptureSkillTransferJsonV1(imported.value.draft);
 assert.deepEqual(importCaptureTransferJsonV1(exported).value.draft,imported.value.draft);
});
test("native combat activates author's 10-second auto-dodge without changing the generic dodge button",async()=>{
 const draft=importCaptureTransferJsonV1(await readAuthor()).value.draft;
 const skill=draft.definition;
 assert.equal(skill.name,"Esquive foudroyante");
 assert.equal(skill.category,"defensive");
 assert.equal(skill.energyCost,4);
 assert.equal(skill.preparationMs,300);
 assert.equal(skill.cooldownMs,20000);
 assert.deepEqual(skill.targetRelations,["ally","self"]);
 assert.equal(skill.effects[0].kind,"apply_status");
 assert.equal(skill.effects[0].targetScope,"target");
 assert.equal(skill.effects[0].status.kind,"auto_dodge");
 assert.equal(skill.effects[0].status.durationMs,10000);
 assert.equal(draft.presentation.visual.icon.assetId,"core:icon-skill-recall-01");
 assert.equal(draft.presentation.statusVisuals["status-1"].tintBlinkPeriodMs,800);
 assert.equal(draft.presentation.statusVisuals["status-1"].tintOpacity,0.35);
 const session=createCombatSession({fighters:[fighter("self"),fighter("enemy")]});
 const applied=session.useSkill({actorId:"self",targetId:"self",skill});
 assert.equal(applied.outcome,"hit");
 assert.equal(session.snapshot().fighters.self.energy,16);
 assert.equal(session.snapshot().fighters.self.statusEffects.length,1);
 assert.equal(session.snapshot().fighters.self.statusEffects[0].definition.kind,"auto_dodge");
 session.advanceMs(9999);
 assert.equal(session.snapshot().fighters.self.statusEffects.length,1);
 session.advanceMs(1);
 assert.equal(session.snapshot().fighters.self.statusEffects.length,0);
});
test("no second version of Esquive foudroyante skill exists in native author catalogs",async()=>{
 const portable=await import("../../src/catalogs/capture-portable-native-skill-catalog-v1.js");
 const complex=await import("../../src/catalogs/capture-complex-native-skill-catalog-v1.js");
 assert.equal(portable.capturePortableNativeSkillDraftsV1().filter(d=>d.id==="dodge").length,0);
 assert.equal(complex.captureComplexNativeSkillDraftsV1().filter(d=>d.id==="dodge").length,0);
});
