import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1, planCaptureTransferImportV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferPlanToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";

const files=[
  {
    "path": "data/capture/showcase/lib_tailwind.capture-skill-transfer-v1.json",
    "id": "lib_tailwind",
    "sha256": "2e56ae50815052bbac261f44ad1e42abae82b95ad734484684c523967924d234"
  },
  {
    "path": "data/capture/showcase/cap_air_atk_3.capture-skill-transfer-v1.json",
    "id": "cap_air_atk_3",
    "sha256": "0fb30bd4ecb13f2793906900e5be990aa1b8beee2b965f84e1b4d40e049784fd"
  }
];
async function read(path){return readFile(new URL("../../"+path, import.meta.url),"utf8");}
test("two user-authored air skills preserve exact source bytes and canonical references",async()=>{
 for(const f of files){
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===f.path).length,1);
  const raw=await read(f.path);
  const historicAuthorBytes=f.id==="cap_air_atk_3" ? raw.replace('"assetId": "pack:capture:icon-skill-aerial-attack-01"','"assetId": "core:icon-skill-speed-dash-01"') : raw;
  assert.equal(createHash("sha256").update(historicAuthorBytes).digest("hex"),f.sha256);
  const transfer=importCaptureTransferJsonV1(raw);
  assert.equal(transfer.kind,"skill");
  assert.equal(transfer.value.draft.id,f.id);
 }
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length,23);
});
test("Vent arrière repaired statuses keep author effect values and unique IDs",async()=>{
 const record=importCaptureTransferJsonV1(await read(files[0].path)).value.draft;
 assert.equal(record.definition.name,"Vent arrière");
 assert.equal(record.definition.effects.length,4);
 assert.deepEqual(record.definition.effects.map(x=>x.status.id),["lib_tailwind:0","lib_tailwind:cooldown","lib_tailwind:energy","lib_tailwind:defense"]);
 assert.deepEqual(record.definition.effects.map(x=>x.status.kind),["stat_modifier","skill_cooldown_rate_modifier","energy_regen_modifier","stat_modifier"]);
 assert.deepEqual(record.definition.effects.map(x=>x.targetScope),["self","self","self","self"]);
 assert.deepEqual(record.definition.targetRelations,["self"]);
 assert.deepEqual(record.definition.effects.map(x=>x.status.durationMs),[15000,15000,15000,15000]);
 assert.equal(record.presentation.visual.icon.assetId,"core:icon-skill-portal-dash-01");
});
test("Charge aérienne author projectile-free aerial contact attack preserved",async()=>{
 const draft=importCaptureTransferJsonV1(await read(files[1].path)).value.draft;
 assert.equal(draft.definition.name,"Charge aérienne");
 assert.equal(draft.definition.form,"contact");
 assert.equal(draft.definition.approachMode,"aerial");
 assert.equal(draft.definition.effects[0].amount,15);
 assert.equal(draft.presentation.visual.icon.assetId,"pack:capture:icon-skill-aerial-attack-01");
 assert.equal(draft.presentation.visual.cast.assetId,"pack:capture:sprite-air-wind-charge-01");
});
test("canonical Transfer planner replaces two native skills without altering other entries",async()=>{
 const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
 const configuredSkills=new Map();
 for(const draft of [...capturePortableNativeSkillDraftsV1(),...captureComplexNativeSkillDraftsV1()])if(!configuredSkills.has(draft.id))configuredSkills.set(draft.id,draft);
 const idsBefore=[...configuredSkills.keys()];
 const baseline=new Map(configuredSkills);
 for(const f of files){
  assert.ok(configuredSkills.has(f.id),f.id+" must be an existing native skill");
  const transfer=importCaptureTransferJsonV1(await read(f.path));
  const plan=planCaptureTransferImportV1({currentDatabase:buildCaptureEditorDatabaseV1({statRegistry:registry,progressionRules,configuredCreatures:new Map(),configuredSkills}),transfer,mode:"replace"});
  assert.equal(plan.action,"replace-skill");
  applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures:new Map(),configuredSkills,statRegistry:registry,progressionRules});
 }
 assert.deepEqual([...configuredSkills.keys()],idsBefore);
 assert.equal(configuredSkills.size,baseline.size);
 assert.equal(configuredSkills.get("lib_tailwind").definition.effects.length,4);
 assert.equal(configuredSkills.get("cap_air_atk_3").definition.effects[0].amount,15);
 for(const [id,v] of baseline)if(!files.some(f=>f.id===id))assert.equal(configuredSkills.get(id),v);
});
