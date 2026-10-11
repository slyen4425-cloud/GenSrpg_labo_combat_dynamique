import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1, planCaptureTransferImportV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferPlanToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";

const manifest = [
  ["cap_earth_atk_7","2e4b69a84147aa4a0c22dd464e2e0915bc3c82528aa8d67ea5a8bbead345dde1","pack:capture:icon-skill-seismic-shock-01"],
  ["cap_earth_atk_3","51f0a7eb1d648167ca908c3cd7d73e28ab970b49b33726e9e4859118803afc07","core:icon-skill-thorn-vines-01"],
  ["cap_fire_special_1","c1d1cc723aed981362f56c9b2439c2882b6c88d2038f02d2c2c68916015fa572","pack:capture:icon-skill-blinding-ash-01"]
];
const read = path => readFile(new URL("../../"+path,import.meta.url),"utf8");

test("the three user-supplied skill exports replace existing stable ids byte-for-byte, no duplicate catalog",async()=>{
 for(const [id,sha,icon] of manifest){
   const path="data/capture/showcase/"+id+".capture-skill-transfer-v1.json";
   assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===path).length,1,id+" must only be registered once");
   const raw=await read(path);
   const authorBytesWithoutRequestedIconChange = id === "cap_fire_special_1" ? raw.replace(
     '"assetId": "pack:capture:icon-skill-blinding-ash-01"',
     '"assetId": "pack:capture:icon-skill-burning-bite-01"'
   ) : raw;
   assert.equal(createHash("sha256").update(authorBytesWithoutRequestedIconChange).digest("hex"),sha,id+" must preserve author bytes except requested icon change");
   const imported=importCaptureTransferJsonV1(raw);
   assert.equal(imported.kind,"skill");
   assert.equal(imported.value.draft.id,id);
   assert.equal(imported.value.draft.definition.id,id);
   assert.equal(imported.value.draft.presentation.visual.icon.assetId,icon);
   assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(imported.value.draft)).value.draft,imported.value.draft);
 }
});

test("the authored seismic, telluric and ash configurations preserve each latest delta",async()=>{
 const [seismic,telluric,ash]=await Promise.all(manifest.map(async ([id])=>
   importCaptureTransferJsonV1(await read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json")).value.draft));
 assert.equal(seismic.definition.name,"Séisme primordial");
 assert.equal(seismic.definition.activationRequirements.conditions[0].type,"damage_taken");
 assert.equal(seismic.definition.activationRequirements.conditions[0].threshold,100);
 assert.deepEqual(seismic.presentation.feedback.cameraShake,{amplitudePx:50,durationMs:1200});
 assert.equal(seismic.definition.effects[0].amount,100);
 assert.equal(telluric.presentation.statusVisuals.status.tintBlinkEnabled,true);
 assert.equal(telluric.presentation.statusVisuals.status.tintBlinkPeriodMs,1500);
 assert.equal(telluric.presentation.visual.aura.playbackMode,"hold-last");
 assert.equal(ash.presentation.visual.cast.anchor,"mouth");
 assert.equal(ash.presentation.visual.cast.offsetX,30);
 assert.equal(ash.presentation.statusVisuals["cap_fire_special_1:1"].sprite.offsetY,-15);
 assert.equal(ash.definition.effects.length,2);
});

test("existing configuredSkills authority replaces these skills and does not rewrite unrelated skills or creature loadouts",async()=>{
 const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
 const configuredCreatures=new Map();
 const configuredSkills=new Map(capturePortableNativeSkillDraftsV1().map(x=>[x.id,x]));
 for(const s of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(s.id))configuredSkills.set(s.id,s);
 const unaffected=configuredSkills.get("cap_earth_atk_4");
 for(const [id] of manifest){
   const transfer=importCaptureTransferJsonV1(await read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json"));
   const db=buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills,metadata:{producer:"three-author-skills-v2"}});
   const plan=planCaptureTransferImportV1({currentDatabase:db,transfer,mode:"replace"});
   assert.ok(["replace-skill","add-skill"].includes(plan.action));
   const beforeCount=configuredSkills.size;
   applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry,progressionRules});
   assert.deepEqual(configuredSkills.get(id),transfer.value.draft);
   assert.equal(configuredSkills.size,beforeCount+(plan.action==="add-skill"?1:0));
 }
 assert.equal(configuredSkills.get("cap_earth_atk_4"),unaffected);
});
