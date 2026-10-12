import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import { applyCaptureTransferBatchToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { canonicalCaptureCreatureRecordsV1 } from "../../src/catalogs/capture-canonical-creature-catalog-v1.js";
import { importMonsterCaptureCreatureRecordV1 } from "../../src/adapters/input/capture/monster-capture-creature-import-v1.js";
import { importMonsterCaptureStatValuesV1 } from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";
import { buildCaptureCreatureHistoricalLoadoutV1 } from "../../src/catalogs/capture-creature-historical-loadout-v1.js";

function read(relative){return readFileSync(new URL("../../"+relative,import.meta.url),"utf8")}
const files=[
 {path:"data/capture/showcase/crea_ailevent.capture-creature-transfer-v1.json",hash:"6605ee3255f732ce9303be2f7f405aad1ec3f9b947255905944f46b5ce6d9af1",kind:"creature"},
 {path:"data/capture/showcase/lib_gust.capture-skill-transfer-v1.json",hash:"5104d712da06e7c4818950dbd86bb6f3fb6ce4241842173a969a138a9ea7af55",kind:"skill"}
];
const registry=normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(read("data/capture/monster-capture-progression-rules.v1.json")));
const gust=importCaptureTransferJsonV1(read(files[1].path));
const ailevent=importCaptureTransferJsonV1(read(files[0].path),{statRegistry:registry});
const slots=["lib_gust","cap_air_atk_3","lib_tailwind",null,null];

test("Exact author JSON files and single canonical showcase ownership",()=>{
 for(const f of files){
  const raw=read(f.path);
  assert.equal(createHash("sha256").update(raw).digest("hex"),f.hash);
  assert.equal(importCaptureTransferJsonV1(raw,{statRegistry:registry}).kind,f.kind);
 }
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===files[0].path).length,1);
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===files[1].path).length,1);
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length,18);
});
test("Ailevent authored loadout and creature stats survive exact import",()=>{
 const c=ailevent.value;
 assert.equal(c.draft.id,"crea_ailevent");
 assert.equal(c.draft.skillIds.length,11);
 for(const id of slots.filter(Boolean)) assert.ok(c.draft.skillIds.includes(id),id);
 assert.deepEqual(c.loadout.slots.map(x=>x.skillId),slots);
 assert.equal(c.statValues.values.health,170);
 assert.equal(c.statValues.values.air,15);
 assert.equal(c.draft.presentation.profileId,"flying");
 assert.equal(c.draft.presentation.audio.movement.assetId,"gensrpg:sound:conflux-da9a4465");
 assert.equal(c.draft.capture.evolution.targetId,"crea_rafalcor");
});
test("Rafale authored projectile, damage and media preserve original values",()=>{
 const s=gust.value.draft;
 assert.equal(s.id,"lib_gust");
 assert.equal(s.definition.form,"projectile");
 assert.equal(s.definition.projectileTargeting,"direct");
 assert.equal(s.definition.element,"air");
 assert.equal(s.definition.energyCost,3);
 assert.equal(s.definition.preparationMs,800);
 assert.equal(s.definition.travelMs,700);
 assert.equal(s.definition.projectileClash.power,2);
 assert.equal(s.definition.cooldownMs,8000);
 assert.equal(s.definition.effects.length,1);
 assert.equal(s.definition.effects[0].amount,4);
 assert.equal(s.definition.effects[0].channel,"air");
 assert.equal(s.definition.effects[0].ignoreDamageReductionPct,100);
 assert.equal(s.presentation.visual.travel.assetId,"pack:capture:sprite-air-wind-bolt-01");
 assert.equal(s.presentation.visual.travel.anchor,"mouth");
 assert.equal(s.presentation.visual.impact.assetId,"pack:capture:sprite-air-wind-impact-01");
 assert.equal(s.presentation.visual.impact.opacity,0.5);
 assert.equal(s.presentation.audio.travel.assetId,"gensrpg:sound:tower-6dbf268f");
 assert.equal(s.presentation.feedback.cameraShake.amplitudePx,9);
});
test("Real Transfer batch replaces one native Rafale and one Ailevent without duplicate or unwanted skill changes",()=>{
 const skills=new Map();
 for(const s of [...capturePortableNativeSkillDraftsV1(),...captureComplexNativeSkillDraftsV1()]) if(!skills.has(s.id))skills.set(s.id,s);
 assert.ok(skills.has("lib_gust"),"native Rafale must be replaced in place");
 assert.ok(skills.has("lib_tailwind"),"authored Vent arrière must remain accessible");
 const oldSkill=skills.get("cap_air_atk_3");
 const baselineSkillCount=skills.size;
 const creatures=new Map();
 const monsterCatalog=JSON.parse(read("data/capture/monster-capture-creatures.v1.json"));
 const runtimeSkillIds=new Set(skills.keys());
 for(const entry of canonicalCaptureCreatureRecordsV1(monsterCatalog.entries)){
  const imported=importMonsterCaptureCreatureRecordV1(entry);
  const historical=buildCaptureCreatureHistoricalLoadoutV1({
   creatureId:imported.draft.id,level:imported.draft.level,
   selectionMode:"planned",abilityIds:imported.draft.skillIds,runtimeSkillIds
  });
  creatures.set(imported.draft.id,{
   draft:imported.draft,loadout:historical.loadout,
   statValues:importMonsterCaptureStatValuesV1(entry,registry)
  });
 }
 const originalCreaturesCount=creatures.size;
 assert.equal(originalCreaturesCount,102);
 assert.ok(creatures.has("crea_ailevent"));
 assert.ok(creatures.has("crea_rafalcor"));
 const result=applyCaptureTransferBatchToEditorStateV1({
  transfers:[gust,ailevent],configuredCreatures:creatures,configuredSkills:skills,statRegistry:registry,progressionRules,mode:"replace"
 });
 assert.deepEqual(result.actions.map(x=>x.action),["replace-skill","replace-creature"]);
 assert.equal(skills.size,baselineSkillCount);
 assert.equal(skills.get("cap_air_atk_3"),oldSkill);
 assert.equal(skills.get("lib_gust").definition.effects[0].amount,4);
 assert.equal(creatures.size,originalCreaturesCount);
 assert.deepEqual(creatures.get("crea_ailevent").loadout.slots.map(s=>s.skillId),slots);
 assert.equal(new Set(creatures.keys()).size,originalCreaturesCount);
});
test("Fireball airborne presence guard remains independent of this authored update",()=>{
 const fireball=importCaptureTransferJsonV1(read("data/capture/showcase/fireball.capture-skill-transfer-v1.json")).value.draft;
 assert.deepEqual(fireball.definition.hitPresenceStates,["surface"]);
});
