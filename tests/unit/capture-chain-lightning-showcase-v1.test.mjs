import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferBatchToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";

const path = "data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json";
const load = async p => JSON.parse(await readFile(new URL("../../"+p, import.meta.url),"utf8"));
const registry = normalizeCaptureStatRegistryV1(await load("data/capture/monster-capture-stat-registry.v1.json"));
const progressionRules = normalizeCaptureProgressionRulesV1(await load("data/capture/monster-capture-progression-rules.v1.json"));

test("Arc électrique is declared once in existing canonical showcase and uses exact author skill ID",()=>{
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===path).length,1);
 assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
});

test("Arc électrique preserves authored beam, status, FX, sounds and complete Transfer roundtrip",async()=>{
 const raw = await load(path);
 const t=importCaptureTransferJsonV1(JSON.stringify(raw));
 assert.equal(t.kind,"skill");
 const s=t.value.draft;
 assert.equal(s.id,"lib_chain_lightning");
 assert.equal(s.definition.name,"Arc électrique");
 assert.equal(s.requiredLevel,10);
 assert.equal(s.definition.form,"beam");
 assert.equal(s.definition.energyCost,6);
 assert.equal(s.definition.cooldownMs,45000);
 assert.equal(s.definition.effects[0].amount,20);
 assert.equal(s.definition.effects[0].ignoreDamageReductionPct,30);
 assert.equal(s.definition.effects[1].status.kind,"stun");
 assert.equal(s.definition.effects[1].status.durationMs,3000);
 assert.deepEqual(s.presentation.visual,raw.draft.presentation.visual);
 assert.deepEqual(s.presentation.audio,raw.draft.presentation.audio);
 assert.deepEqual(s.presentation.feedback,raw.draft.presentation.feedback);
 assert.equal(s.presentation.visual.travel.assetId,"pack:capture:sprite-electric-yellow-beam-body-01");
 assert.equal(s.presentation.visual.beamStart.anchor,"mouth");
 assert.equal(s.presentation.feedback.glow.strength,0.85);
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(s)).value,t.value);
});

test("Arc électrique replaces historical skill by stable ID without adding a duplicate or editing others",async()=>{
 const native = new Map();
 for(const draft of [...capturePortableNativeSkillDraftsV1(),...captureComplexNativeSkillDraftsV1()])
   if(!native.has(draft.id))native.set(draft.id,draft);
 const current=await load("data/combat/skills/catalog.v1.json");
 const original=current.entries.find(x=>x.definition?.id==="lib_chain_lightning");
 assert.ok(original,"author exported existing historical ID");
 const previous=native.get("lib_chain_lightning")??null;
 const others=new Map(native);
 const t=importCaptureTransferJsonV1(JSON.stringify(await load(path)));
 const result=applyCaptureTransferBatchToEditorStateV1({
   transfers:[t],configuredCreatures:new Map(),configuredSkills:native,statRegistry:registry,
   progressionRules,mode:"replace"
 });
 assert.equal(result.actions.length,1);
 assert.equal(native.get("lib_chain_lightning").definition.name,"Arc électrique");
 assert.equal(native.get("lib_chain_lightning").presentation.feedback.glow.radiusPx,32);
 for(const [key,old] of others)if(key!=="lib_chain_lightning")assert.deepEqual(native.get(key),old);
 assert.equal([...native.keys()].filter(id=>id==="lib_chain_lightning").length,1);
 if(previous)assert.notDeepEqual(previous,native.get("lib_chain_lightning"));
 const db=buildCaptureEditorDatabaseV1({
   configuredCreatures:new Map(),configuredSkills:native,statRegistry:registry,progressionRules
 });
 assert.equal(db.skills.filter(x=>x.id==="lib_chain_lightning").length,1);
});
