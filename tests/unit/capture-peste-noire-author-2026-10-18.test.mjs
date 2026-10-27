import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as skillCatalog} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1,planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
const path="data/capture/showcase/cap_shadow_atk_5.capture-skill-transfer-v1.json";
const archive="data/capture/source-exports/gensrpg-capture-skill-cap_shadow_atk_5-2026-10-18.json";
const sourceSha256="40fd2e5e98199351d12b26e16f067e61639fe7dfd1110c09546026ed6b583fe7";
const read=p=>readFile(new URL("../../"+p,import.meta.url),"utf8");

test("Peste noire: raw author export is preserved and loaded exactly once in skill showcase",async()=>{
  assert.equal(skillCatalog.filter(p=>p===path).length,1);
  assert.equal(new Set(skillCatalog).size,skillCatalog.length);
  const raw=await read(path);
  assert.equal(raw,await read(archive),"archive and active preset must be exactly the author file");
  assert.equal(createHash("sha256").update(raw).digest("hex"),sourceSha256);
  const transfer=importCaptureTransferJsonV1(raw);
  assert.equal(transfer.kind,"skill");
  const draft=transfer.value.draft;
  assert.equal(draft.id,"cap_shadow_atk_5");
  assert.equal(draft.definition.id,draft.id);
  assert.equal(draft.definition.name,"Peste noire");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft,draft);
});

test("Peste noire: author gameplay is kept without a fabricated Peste marker effect",async()=>{
  const {draft}=JSON.parse(await read(path));
  const def=draft.definition;
  assert.equal(draft.requiredLevel,20);
  assert.equal(def.category,"buff_debuff");
  assert.equal(def.element,"shadow");
  assert.equal(def.form,"projectile");
  assert.equal(def.loadoutSlot,"ultimate");
  assert.equal(def.energyCost,12);
  assert.equal(def.preparationMs,3500);
  assert.equal(def.travelMs,1200);
  assert.equal(def.cooldownMs,0);
  assert.equal(def.maxUsesPerCombat,1);
  assert.equal(def.projectileClash.power,3);
  assert.deepEqual(def.effects,[],"author has not attached Peste marker yet");
  assert.deepEqual(draft.presentation.visual,{});
  assert.deepEqual(draft.presentation.audio,{});
});

test("Peste noire: canonical configuredSkills imports with stable ID, no duplicate and all neighbors intact",async()=>{
  const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
  const configuredCreatures=new Map(),configuredSkills=new Map(capturePortableNativeSkillDraftsV1().map(s=>[s.id,s]));
  for(const s of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(s.id))configuredSkills.set(s.id,s);
  const beforeSkills=new Map(configuredSkills),beforeSize=configuredSkills.size;
  const transfer=importCaptureTransferJsonV1(await read(path));
  const plan=planCaptureTransferImportV1({currentDatabase:buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills}),transfer,mode:"replace"});
  assert.equal(plan.action,beforeSkills.has("cap_shadow_atk_5")?"replace-skill":"insert-skill");
  applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry,progressionRules});
  assert.equal(configuredSkills.size,beforeSize+(beforeSkills.has("cap_shadow_atk_5")?0:1));
  assert.deepEqual(configuredSkills.get("cap_shadow_atk_5"),transfer.value.draft);
  assert.equal(configuredSkills.get("cap_shadow_atk_5").definition.name,"Peste noire");
  for(const [id,other] of beforeSkills)if(id!=="cap_shadow_atk_5")assert.equal(configuredSkills.get(id),other,id+" unchanged");
  assert.equal(configuredCreatures.size,0,"import does not auto-equip any creature");
});
