import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";

const read = path => readFileSync(new URL("../../" + path, import.meta.url));
const dbPath = "data/capture/source-exports/gensrpg-capture-database-2026-10-23.json";
const db = JSON.parse(read(dbPath));
const creatures = new Map(db.creatures.map(c=>[c.draft.id,c]));
const skills = new Map(db.skills.map(s=>[s.id,s]));
const statRegistry = normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const creature = id => importCaptureTransferJsonV1(read("data/capture/showcase/"+id+".capture-creature-transfer-v1.json").toString(),{statRegistry}).value;
const skill = id => importCaptureTransferJsonV1(read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json").toString()).value.draft;

test("export source is byte-exact archived and indexed with no duplicate IDs",()=>{
 assert.equal(createHash("sha256").update(read(dbPath)).digest("hex"),"5c81d6d1c0712f1614f63f5d4936b92e8c0a3afb32852d15d146592cc0cd6865");
 assert.equal(db.schema,"capture-database-v1");
 assert.equal(db.creatures.length,104);
 assert.equal(db.skills.length,123);
 assert.equal(creatures.size,104);
 assert.equal(skills.size,123);
 assert.equal(new Set(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length);
 assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
});

test("Kitsune now has authored five skills with healing aura and Sacrifice ultimate",()=>{
 const a=creature("kitsune_lunaire"),b=creatures.get("kitsune_lunaire");
 assert.deepEqual(a.draft.skillIds,b.draft.skillIds);
 assert.deepEqual(a.loadout,b.loadout);
 assert.equal(a.loadout.slots[3].skillId,"aura-lunaire");
 assert.equal(a.loadout.slots[4].skillId,"Sacrifice_kitsune");
 assert.equal(a.draft.presentation.visual.front.assetId,"pack:capture:creature-renard-lunaire-opponent-01");
});

test("Dracendre uses authored 1.7 movement frame scale on both sides without replacing sprite references",()=>{
 const a=creature("crea_dracendre"),s=creatures.get("crea_dracendre");
 assert.deepEqual(a.draft.presentation.visual.movementScaleByView,s.draft.presentation.visual.movementScaleByView);
 assert.deepEqual(a.draft.presentation.visual.movementScaleByView,{player:1.7,opponent:1.7});
 for(const key of ["movement","movementBack","rangedAttack","rangedAttackBack"])
   assert.equal(a.draft.presentation.visual[key]?.assetId,s.draft.presentation.visual[key]?.assetId,key);
});

test("Sacrifice visual author changes are present but no unsafe target or gameplay override",()=>{
 const a=skill("Sacrifice_kitsune"),s=skills.get("Sacrifice_kitsune");
 for(const key of ["displayScale","offsetX","offsetY","opacity"])
   assert.equal(a.presentation.visual.aura[key],s.presentation.visual.aura[key],key);
 assert.deepEqual(a.definition.targetRelations,["self"]);
 assert.equal(a.definition.element,"psy");
 assert.equal(a.definition.effects.filter(x=>x.kind==="persistent_zone").length,3);
 assert.equal(a.definition.effects.filter(x=>x.kind==="knockout").length,1);
 assert.equal(a.definition.effects.every(x=>x.kind==="knockout"||x.persistAfterRecall===true),true);
});

test("author Firestorm / Primordial Fire / Spirit Arrow edits preserve the native contracts",()=>{
 const firestorm=skill("cap_fire_atk_6"),prior=skills.get("cap_fire_atk_6");
 const area=firestorm.definition.effects.find(x=>x.kind==="persistent_zone");
 const wanted=prior.definition.effects.find(x=>x.kind==="persistent_zone");
 assert.equal(area.tickIntervalMs,750);
 assert.equal(area.tickEffect.amount,10);
 assert.equal(area.tickIntervalMs,wanted.tickIntervalMs);
 assert.equal(area.tickEffect.amount,wanted.tickEffect.amount);
 const fire=skill("cap_fire_atk_7"),a=skills.get("cap_fire_atk_7");
 for(const key of ["energyCost","travelMs","maxUsesPerCombat"])
  assert.equal(fire.definition[key],a.definition[key],key);
 assert.deepEqual(fire.presentation.visual.icon,a.presentation.visual.icon);
 const arrow=skill("fleche_spirituel");
 assert.equal(arrow.definition.projectileClash.power,1);
 assert.equal(arrow.definition.projectileClash.power,skills.get("fleche_spirituel").definition.projectileClash.power);
});

test("unchanged stat registry and source progression schedule remain authoritative",()=>{
 assert.deepEqual(statRegistry.stats.map(s=>s.id),db.statRegistry.stats.map(s=>s.id));
 const progress=JSON.parse(read("data/capture/monster-capture-progression-rules.v1.json"));
 assert.deepEqual(progress,db.progressionRules);
});
