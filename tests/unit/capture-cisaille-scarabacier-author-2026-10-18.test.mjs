import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as skills} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as creatures} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {importCaptureTransferJsonV1,planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import {importMonsterCaptureCreatureRecordV1} from "../../src/adapters/input/capture/monster-capture-creature-import-v1.js";
import {importMonsterCaptureStatValuesV1} from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";
const read = p => readFile(new URL("../../"+p, import.meta.url),"utf8");
const skillPath="data/capture/showcase/cisaille.capture-skill-transfer-v1.json";
const creaturePath="data/capture/showcase/crea_scar_2.capture-creature-transfer-v1.json";
const archiveSkill="data/capture/source-exports/gensrpg-capture-skill-cisaille-2026-10-18.json";
const archiveCreature="data/capture/source-exports/gensrpg-capture-creature-crea_scar_2-2026-10-18-r2.json";
const author = [
  {id:"cisaille",path:skillPath,archive:archiveSkill,sha:"ee715faf21ace2fb14f2bbfce1c363574a1f257f0be3403f34c17b632becb417"},
  {id:"crea_scar_2",path:creaturePath,archive:archiveCreature,sha:"cb075e8e4133611f0e915af34ec55d0c53494215c9cee275415f851bb99c17c4"}
];
const reg=async()=>normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
test("Cisaille and Scarabacier are exact author bytes, safely archived and uniquely active",async()=>{
 const registry=await reg();
 for(const f of author){
  const cat=f.id==="cisaille"?skills:creatures;
  assert.equal(cat.filter(x=>x===f.path).length,1);
  assert.equal(new Set(cat).size,cat.length);
  const raw=await read(f.path);
  assert.equal(raw,await read(f.archive));
  assert.equal(createHash("sha256").update(raw).digest("hex"),f.sha);
  const transfer=importCaptureTransferJsonV1(raw, f.id==="cisaille"?{}:{statRegistry:registry});
  assert.equal(transfer.value.draft.id,f.id);
 }
 assert.equal(registry.stats.filter(s=>s.id==="acier").length,1);
});
test("Cisaille retains precise attack effects and author VFX/audio",async()=>{
 const {draft} = JSON.parse(await read(skillPath));
 assert.equal(draft.definition.element,"steel");
 assert.equal(draft.definition.effects.length,2);
 assert.deepEqual(draft.definition.effects.map(x=>x.kind),["damage","energy_drain"]);
 assert.equal(draft.definition.effects[0].amount,12);
 assert.equal(draft.definition.effects[0].channel,null);
 assert.equal(draft.definition.effects[1].amount,2);
 assert.equal(draft.definition.energyCost,3);
 assert.equal(draft.presentation.visual.impact.assetId,"pack:capture:sprite-impact-blade-01");
 assert.equal(draft.presentation.audio.impact.assetId,"gensrpg:sound:effect-ff9cee8c");
});
test("Scarabacier and Cisaille travel the canonical configured owner path, leaving others intact",async()=>{
 const statRegistry=await reg();
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
 const natives=JSON.parse(await read("data/capture/monster-capture-creatures.v1.json")).entries;
 const lookup=id=>natives.find(x=>x.id===id);
 const scar=lookup("crea_scar_2"),other=lookup("crea_scar_1");
 assert.ok(scar&&other);
 const configuredCreatures=new Map([scar,other].map(x=>[x.id,{...importMonsterCaptureCreatureRecordV1(x),statValues:importMonsterCaptureStatValuesV1(x,statRegistry)}]));
 const savedOther=configuredCreatures.get("crea_scar_1");
 const configuredSkills=new Map(capturePortableNativeSkillDraftsV1().map(x=>[x.id,x]));
 for(const x of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(x.id))configuredSkills.set(x.id,x);
 const originalOtherSkill=configuredSkills.get("lib_lifesteal_strike");
 for(const source of [skillPath,creaturePath]){
  const transfer=importCaptureTransferJsonV1(await read(source),{statRegistry});
  const plan=planCaptureTransferImportV1({
   currentDatabase:buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills}),
   transfer,mode:"replace"
  });
  assert.equal(plan.action,transfer.kind==="skill"?(configuredSkills.has("cisaille")?"replace-skill":"add-skill"):"replace-creature");
  applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry,progressionRules});
 }
 assert.equal(configuredCreatures.size,2);
 assert.equal(configuredCreatures.get("crea_scar_1"),savedOther);
 assert.equal(configuredSkills.get("lib_lifesteal_strike"),originalOtherSkill);
 assert.equal(configuredSkills.get("cisaille").definition.effects[1].amount,2);
 const actual=configuredCreatures.get("crea_scar_2");
 assert.equal(actual.draft.presentation.visual.dodge.assetId,"pack:capture:sprite-status-stone-shell-01");
 assert.equal(actual.draft.presentation.audio.movement.assetId,"gensrpg:sound:effect-ad54aecf");
 assert.equal(actual.draft.combat.reaction.type,"defense");
 assert.equal(actual.draft.combat.reaction.damageReductionPct,90);
 assert.equal(actual.statValues.values.acier,15);
 assert.equal(actual.statValues.values.defense,20);
 assert.deepEqual(actual.loadout.slots.map(x=>x.skillId),["cisaille",null,null,null,null]);
 assert.ok(actual.draft.skillIds.includes("cisaille"));
});
