import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as files} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1,planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
const read=async p=>readFile(new URL("../../"+p,import.meta.url),"utf8");
const path=id=>"data/capture/showcase/"+id+".capture-skill-transfer-v1.json";
const authors=[
 {id:"lib_lifesteal_strike",name:"Frappe vampirique",sha256:"05837ae77fd87d7281179c9f0f8fae3d91dc4f38154b6455617f2b22eae3dec9",source:"gensrpg-capture-skill-lib_lifesteal_strike-2026-10-18-r2.json"},
 {id:"cap_shadow_atk_3",name:"Affaiblissement nocturne",sha256:"cdc1e382b303ec7a8da3be9edc47623937cd170156140986571d6b74089a0eb9",source:"gensrpg-capture-skill-cap_shadow_atk_3-2026-10-18.json"}
];
test("two incoming author exports are byte-exact, archived, uniquely active and round-trip",async()=>{
 for(const a of authors){
  assert.equal(files.filter(p=>p===path(a.id)).length,1,a.id+" registered exactly once");
  const raw=await read(path(a.id));
  assert.equal(createHash("sha256").update(raw).digest("hex"),a.sha256);
  assert.equal(raw,await read("data/capture/source-exports/"+a.source));
  const transfer=importCaptureTransferJsonV1(raw);
  assert.equal(transfer.kind,"skill");
  assert.equal(transfer.value.draft.id,a.id);
  assert.equal(transfer.value.draft.definition.id,a.id);
  assert.equal(transfer.value.draft.definition.name,a.name);
  assert.equal(transfer.value.draft.definition.element,"shadow");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(transfer.value.draft)).value.draft,transfer.value.draft);
 }
 assert.equal(new Set(files).size,files.length);
 assert.equal(files.filter(p=>p===path("cap_shadow_atk_1")).length,1,"existing Ombre vive remains present");
});
test("new impact Drain de vie and exact -60% / 25-second author debuff are preserved",async()=>{
 const life=JSON.parse(await read(path("lib_lifesteal_strike"))).draft;
 assert.deepEqual(life.definition.effects.map(e=>e.kind),["life_steal","damage"]);
 assert.equal(life.definition.effects[0].percent,50);
 assert.equal(life.definition.effects[1].amount,18);
 assert.equal(life.presentation.visual.impact.assetId,"pack:capture:sprite-life-drain-impact-01");
 assert.equal(life.presentation.visual.impact.playbackMode,"stretch");
 assert.equal(life.presentation.visual.impact.displayScale,1);
 assert.equal(life.presentation.visual.impact.opacity,0.5);
 const shadow=JSON.parse(await read(path("cap_shadow_atk_3"))).draft;
 assert.equal(shadow.requiredLevel,10);
 assert.equal(shadow.definition.category,"buff_debuff");
 assert.equal(shadow.definition.projectileClash.power,1);
 assert.equal(shadow.definition.cooldownMs,60000);
 assert.deepEqual(shadow.definition.targetRelations,["enemy"]);
 assert.equal(shadow.definition.effects.length,1);
 const debuff=shadow.definition.effects[0];
 assert.equal(debuff.kind,"apply_status");
 assert.equal(debuff.targetScope,"target");
 assert.equal(debuff.status.kind,"outgoing_damage_modifier");
 assert.equal(debuff.status.modifierPct,-60);
 assert.equal(debuff.status.durationMs,25000);
 assert.equal(debuff.status.stacking,"refresh");
 assert.equal(shadow.presentation.visual.cast.assetId,"pack:capture:sprite-shadow-spell-cast-01");
 assert.equal(shadow.presentation.visual.travel.assetId,"pack:capture:sprite-projectile-shadow-01");
 assert.equal(shadow.presentation.statusVisuals["status-1"].sprite.assetId,"pack:capture:sprite-shadow-spell-cast-01");
});
test("canonical configuredSkills import replaces Frappe by ID and adds debuff without touching Ombre vive",async()=>{
 const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
 const configuredCreatures=new Map(),configuredSkills=new Map(capturePortableNativeSkillDraftsV1().map(s=>[s.id,s]));
 for(const s of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(s.id))configuredSkills.set(s.id,s);
 for(const id of ["lib_lifesteal_strike","cap_shadow_atk_1"]){
  const t=importCaptureTransferJsonV1(await read(path(id)));
  const plan=planCaptureTransferImportV1({currentDatabase:buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills}),transfer:t,mode:"replace"});
  applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry,progressionRules});
 }
 const oldShadow=configuredSkills.get("cap_shadow_atk_1");
 const others=new Map(configuredSkills);
 for(const a of authors){
  const t=importCaptureTransferJsonV1(await read(path(a.id)));
  const beforeSize=configuredSkills.size;
  const plan=planCaptureTransferImportV1({currentDatabase:buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills}),transfer:t,mode:"replace"});
  assert.equal(plan.action,a.id==="lib_lifesteal_strike"?"replace-skill":"add-skill");
  applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry,progressionRules});
  assert.equal(configuredSkills.size,beforeSize+(plan.action==="add-skill"?1:0));
  assert.deepEqual(configuredSkills.get(a.id),t.value.draft);
 }
 assert.equal(configuredSkills.get("cap_shadow_atk_1"),oldShadow);
 for(const [id,v] of others)if(!authors.some(a=>a.id===id))assert.equal(configuredSkills.get(id),v,id);
});
