import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as skillCatalog} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as creatureCatalog} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1,planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import {importMonsterCaptureCreatureRecordV1} from "../../src/adapters/input/capture/monster-capture-creature-import-v1.js";
import {importMonsterCaptureStatValuesV1} from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";


const fixtures=[
  {
    "id": "cap_shadow_atk_4",
    "kind": "skill",
    "name": "Impact spectral",
    "sha": "3cf8244a38f8e01255490566365765b6155bcea895407d4d35f39a774f00f7ad",
    "filename": "gensrpg-capture-skill-cap_shadow_atk_4-2026-10-18-r2.json",
    "prior": "gensrpg-capture-skill-cap_shadow_atk_4-2026-10-18.json"
  },
  {
    "id": "cap_shadow_atk_1",
    "kind": "skill",
    "name": "Ombre vive",
    "sha": "9c44db0e16a7d8d3f3fce1d638e64ef779fa9c6433f3fbce94f3a3d2be6301b5",
    "filename": "gensrpg-capture-skill-cap_shadow_atk_1-2026-10-18-r2.json",
    "prior": "gensrpg-capture-skill-cap_shadow_atk_1-2026-10-18.json"
  },
  {
    "id": "lib_lifesteal_strike",
    "kind": "skill",
    "name": "Frappe vampirique",
    "sha": "507e912cc42d39955b39b56b492166de7abe0ebdce516df775ec90c469302dc8",
    "filename": "gensrpg-capture-skill-lib_lifesteal_strike-2026-10-18-r3.json",
    "prior": "gensrpg-capture-skill-lib_lifesteal_strike-2026-10-18-r2.json"
  },
  {
    "id": "cap_shadow_atk_3",
    "kind": "skill",
    "name": "Affaiblissement nocturne",
    "sha": "da22623f0a457168f2c22c92f0aa3b08412b180c21d8a5796ff060c26b2e35e7",
    "filename": "gensrpg-capture-skill-cap_shadow_atk_3-2026-10-18-r2.json",
    "prior": "gensrpg-capture-skill-cap_shadow_atk_3-2026-10-18.json"
  },
  {
    "id": "crea_ombre_2",
    "kind": "creature",
    "name": "Noctigriffe",
    "sha": "cf17ee84d120f9eebd9867fdb35f2bf7c56b06159ee8a6a854b71968c65e6f40",
    "filename": "gensrpg-capture-creature-crea_ombre_2-2026-10-18-r2.json",
    "prior": "gensrpg-capture-creature-crea_ombre_2-2026-10-18.json"
  }
];
const read=p=>readFile(new URL("../../"+p,import.meta.url),"utf8");
const showcase=f=>"data/capture/showcase/"+f.id+".capture-"+f.kind+"-transfer-v1.json";
const source=f=>"data/capture/source-exports/"+f.filename;
const oldSource=f=>"data/capture/source-exports/"+f.prior;
const statRegistryForTransfers=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
const unpack=async(f,p=showcase(f))=>importCaptureTransferJsonV1(await read(p),f.kind==="creature"?{statRegistry:statRegistryForTransfers}:{});

test("five user files are intact, archived, unique in the canonical showcase registries",async()=>{
 for(const f of fixtures){
  const catalog=f.kind==="creature"?creatureCatalog:skillCatalog;
  assert.equal(catalog.filter(p=>p===showcase(f)).length,1,f.id+" active exactly once");
  const raw=await read(showcase(f));
  assert.ok((await read(source(f))).length>0,f.id+" historical archive must remain present");
  assert.equal(createHash("sha256").update(await read(source(f))).digest("hex"),f.sha);
  const t=await unpack(f);
  assert.equal(t.kind,f.kind);
  assert.equal(t.value.draft.id,f.id);
  assert.equal(f.kind==="creature"?t.value.draft.displayName:t.value.draft.definition.name,f.name);
  if(f.kind==="skill") assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(t.value.draft)).value.draft,t.value.draft);
 }
 assert.equal(new Set(skillCatalog).size,skillCatalog.length);
 assert.equal(new Set(creatureCatalog).size,creatureCatalog.length);
});
test("preserves authored shadow skills, impacts, sounds and effects without reinterpretation",async()=>{
 const byId=Object.fromEntries(await Promise.all(fixtures.filter(f=>f.kind==="skill").map(async f=>[f.id,(await unpack(f)).value.draft])));
 const spectral=byId.cap_shadow_atk_4;
 assert.equal(spectral.requiredLevel,15);
 assert.equal(spectral.description,"Attaque Ombre de puissance 6. Disponible au niveau 16.");
 assert.equal(spectral.definition.effects[0].amount,15);
 assert.equal(spectral.definition.effects[0].ignoreDamageReductionPct,100);
 assert.equal(spectral.definition.effects[1].status.kind,"stun");
 assert.equal(spectral.definition.effects[1].status.durationMs,2500);
 assert.equal(spectral.presentation.visual.travel.assetId,"pack:capture:sprite-projectile-shadow-01");
 assert.equal(spectral.presentation.visual.travel.frameSpeedMultiplier,2);
 assert.equal(spectral.presentation.audio.impact.assetId,"gensrpg:sound:genrpg-pack2-ebe64290");
 const ombre=byId.cap_shadow_atk_1;
 assert.equal(ombre.definition.approachMode,"teleport");
 assert.equal(ombre.definition.effects[0].amount,12);
 assert.equal(ombre.presentation.visual.icon.assetId,"pack:capture:icon-skill-attaque-ombre-01");
 assert.equal(ombre.presentation.visual.cast.opacity,0.3);
 const life=byId.lib_lifesteal_strike;
 assert.deepEqual(life.definition.effects.map(e=>e.kind),["life_steal","damage"]);
 assert.equal(life.definition.effects[0].percent,50);
 assert.equal(life.definition.effects[1].amount,18);
 assert.equal(life.presentation.visual.icon.assetId,"pack:capture:icon-skill-drain-de-vie-01");
 assert.equal(life.presentation.visual.impact.assetId,"pack:capture:sprite-life-drain-impact-01");
 const debuff=byId.cap_shadow_atk_3;
 assert.equal(debuff.definition.effects[0].status.modifierPct,-60);
 assert.equal(debuff.definition.effects[0].status.durationMs,25000);
 assert.equal(debuff.definition.approachMode,"none");
 assert.equal(debuff.presentation.visual.icon.assetId,"pack:capture:icon-skill-voile-ombre-01");
});
test("Noctigriffe has author-level stats, resistances, visuals, socket and full planned loadout",async()=>{
 const t=await unpack(fixtures.find(f=>f.kind==="creature"));
 const c=t.value.draft;
 assert.deepEqual(c.elements,["shadow"]);
 assert.equal(c.level,1);
 assert.equal(c.capture.evolution.targetId,"crea_ombre_3");
 assert.equal(c.capture.evolution.level,37);
 assert.equal(c.resistances.find(x=>x.kind==="element:light").value,-50);
 assert.equal(c.resistances.find(x=>x.kind==="element:shadow").value,35);
 assert.equal(c.combat.reaction.type,"dodge");
 assert.equal(c.combat.reaction.maxCharges,3);
 assert.equal(c.presentation.visual.dodge.assetId,"pack:capture:sprite-ash-smoke-status-aura-01");
 assert.equal(c.presentation.sockets[0].front.x,0.2979381553294072);
 assert.equal(c.presentation.sockets[0].back.x,0.7371133682172085);
 assert.equal(t.value.statValues.values.shadow,15);
 assert.deepEqual(t.value.loadout.slots.map(s=>s.skillId),["cap_shadow_atk_1","lib_lifesteal_strike","cap_shadow_atk_3","cap_shadow_atk_4",null]);
});
test("actual Transfer planner replaces all five IDs in configured owners without duplicates or moving unrelated loadouts",async()=>{
 const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
 const configuredCreatures=new Map();
 // The real editor hydrates the historical creature catalog before showcase imports.
 // Use the actual native evolution target, never an invented fixture or bypass.
 const nativeCatalog=JSON.parse(await read("data/capture/monster-capture-creatures.v1.json"));
 const nativeTarget=nativeCatalog.entries.find(e=>e.id==="crea_ombre_3");
 assert.ok(nativeTarget,"real historical Éclipsar evolution target");
 configuredCreatures.set(nativeTarget.id,{
  ...importMonsterCaptureCreatureRecordV1(nativeTarget),
  statValues:importMonsterCaptureStatValuesV1(nativeTarget,statRegistry)
 });
 const protectedTarget=configuredCreatures.get(nativeTarget.id);
 const configuredSkills=new Map(capturePortableNativeSkillDraftsV1().map(s=>[s.id,s]));
 for(const s of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(s.id))configuredSkills.set(s.id,s);
 const apply=(t)=>{const plan=planCaptureTransferImportV1({currentDatabase:buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills}),transfer:t,mode:"replace"});applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry,progressionRules});return plan;};
 for(const f of fixtures){const old=await unpack(f,oldSource(f));apply(old);}
 const previous=new Map([...configuredSkills]);
 const oldCreature=configuredCreatures.get("crea_ombre_2");
 assert.ok(oldCreature,"Noctigriffe prior state exists");
 for(const f of fixtures){
  const oldSize=(f.kind==="creature"?configuredCreatures:configuredSkills).size;
  const t=await unpack(f);
  const plan=apply(t);
  assert.equal(plan.action,f.kind==="creature"?"replace-creature":"replace-skill",f.id+" replaced, not duplicated");
  assert.equal((f.kind==="creature"?configuredCreatures:configuredSkills).size,oldSize,f.id+" exact count");
  if(f.kind==="skill")assert.deepEqual(configuredSkills.get(f.id),t.value.draft);
  else {assert.deepEqual(configuredCreatures.get(f.id).draft,t.value.draft);assert.deepEqual(configuredCreatures.get(f.id).loadout,t.value.loadout);}
 }
 for(const [id,obj] of previous)if(!fixtures.some(f=>f.id===id))assert.equal(configuredSkills.get(id),obj,id+" preserved");
 assert.equal(configuredCreatures.get("crea_ombre_3"),protectedTarget,"Éclipsar native evolution remains unchanged");
 assert.deepEqual(configuredCreatures.get("crea_ombre_2").loadout.slots.map(s=>s.skillId),["cap_shadow_atk_1","lib_lifesteal_strike","cap_shadow_atk_3","cap_shadow_atk_4",null]);
});
