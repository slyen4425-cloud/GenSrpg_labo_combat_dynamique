import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {normalizeCaptureStatRegistryV1,captureStatDefinitionForIdV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureCreatureStatValuesV1} from "../../src/contracts/capture-creature-stat-values-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCreaturePresentationBinding} from "../../src/contracts/creature-presentation-binding.js";

const read = path => readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const registryPath="data/capture/monster-capture-stat-registry.v1.json";
const activePath="data/capture/showcase/crea_scar_2.capture-creature-transfer-v1.json";
const sourcePath="data/capture/source-exports/gensrpg-capture-creature-crea_scar_2-2026-10-21.json";
const beforeIds=["health","speed","physical","defense","fire","water","earth","air","electric","light","shadow","poison","acier"];
const ids=Object.freeze({
  front:"pack:capture:creature-scarabacier-opponent-01",
  back:"pack:capture:creature-scarabacier-player-01",
  icon:"pack:capture:creature-scarabacier-icon-01",
  dodge:"pack:capture:sprite-steel-carapace-hold-01",
  movement:"pack:capture:creature-scarabacier-roll-01",
  rangedAttack:"pack:capture:creature-scarabacier-attack-face-v5",
  rangedAttackBack:"pack:capture:creature-scarabacier-attack-dos-v5"
});
const registry=normalizeCaptureStatRegistryV1(JSON.parse(read(registryPath)));
const scar=JSON.parse(read(activePath));

test("Nature is one new stat appended to canonical registry, keeping Acier and old channels untouched",()=>{
  assert.deepEqual(registry.stats.slice(0,13).map(x=>x.id),beforeIds);
  assert.deepEqual(registry.stats.map(x=>x.id),[...beforeIds,"nature","esprit"]);
  const n=captureStatDefinitionForIdV1(registry,"nature");
  assert.equal(n.label,"Nature");
  assert.equal(n.damageChannel,"nature");
  assert.equal(n.resistanceChannel,"nature");
  assert.equal(n.damagePctPerPoint,1);
  assert.equal(n.resistancePctPerPoint,1);
  assert.equal(n.chargeTimeReductionPctPerPoint,0);
  assert.equal(n.maxHpPerPoint,0);
  assert.equal(n.damageReductionPctPerPoint,0);
  assert.equal(captureStatDefinitionForIdV1(registry,"acier").damageChannel,"acier");
  assert.equal(registry.stats.filter(x=>x.id==="nature").length,1);
});
test("Nature stat values normalize, legacy creature without nature remains valid",()=>{
  const nature=normalizeCaptureCreatureStatValuesV1({
    schema:"capture-creature-stat-values-v1",creatureId:"nature-probe",values:{nature:12,acier:4}
  },registry);
  assert.equal(nature.values.nature,12);
  assert.equal(nature.values.acier,4);
  const old=normalizeCaptureCreatureStatValuesV1({
    schema:"capture-creature-stat-values-v1",creatureId:"legacy",values:{acier:4}
  },registry);
  assert.equal(old.values.acier,4);
  assert.equal(Object.hasOwn(old.values,"nature"),false,"legacy values remain backwards-compatible");
});
test("the author's Scarabacier is the only active preset; archived extraction matches exactly",()=>{
  assert.equal(read(activePath),read(sourcePath));
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===activePath).length,1);
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.includes(sourcePath),false);
  assert.equal(scar.schema,"capture-creature-transfer-v1");
  assert.equal(scar.draft.id,"crea_scar_2");
  assert.equal(scar.draft.displayName,"Scarabacier");
  assert.equal(scar.draft.presentation.version,8);
  assert.deepEqual(scar.draft.skillIds,
    ["cisaille","cap_water_atk_1","carapce_acier","Tempete_metallique","sangsue","tempete_rouille"]);
  assert.deepEqual(scar.loadout.slots.map(s=>s.skillId),
    ["cisaille","carapce_acier","Tempete_metallique","sangsue","tempete_rouille"]);
  assert.equal(scar.statValues.values.acier,15);
  assert.equal(scar.statValues.values.nature,0);
  assert.equal(scar.draft.combat.reaction.damageReductionPct,80);
  assert.equal(scar.draft.combat.reaction.maxCharges,1);
  assert.equal(scar.draft.combat.approachTimeModifierPct,25);
  for(const skillId of scar.draft.skillIds) {
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.some(p=>p.endsWith("/"+skillId+".capture-skill-transfer-v1.json")),true,skillId+" missing from active preset library");
  }
});
test("author Scarabacier import goes through existing contract with Nature and keeps visual/audio bindings",()=>{
  const loaded=importCaptureTransferJsonV1(read(activePath),{statRegistry:registry});
  assert.equal(loaded.kind,"creature");
  assert.equal(loaded.value.draft.id,"crea_scar_2");
  assert.equal(loaded.value.statValues.values.nature,0);
  const binding=loaded.value.draft.presentation;
  assert.deepEqual(normalizeCreaturePresentationBinding(JSON.parse(JSON.stringify(binding))),binding);
  for(const [slot,assetId] of Object.entries(ids)) assert.equal(binding.visual[slot]?.assetId,assetId,slot);
  assert.deepEqual(binding.visual.movementScaleByView,{player:1,opponent:1.2});
  assert.deepEqual(binding.visual.rangedAttackScaleByView,{player:.8,opponent:1});
  assert.deepEqual(binding.visual.rangedAttackPlacement.back,{x:-20,y:-20});
  assert.equal(binding.audio.movement.assetId,"gensrpg:sound:effect-ad54aecf");
  assert.equal(binding.audio.movement.volume,1);
  assert.equal(loaded.value.loadout.slots[3].skillId,"sangsue");
  assert.equal(loaded.value.loadout.slots[4].skillId,"tempete_rouille");
});
test("stat renderer UI loads the single canonical registry, not a hardcoded Nature/Acier duplicate",()=>{
  const ui=read("src/ui/capture-editor-human-v2.js");
  assert.match(ui,/monster-capture-stat-registry\.v1\.json/);
  assert.match(ui,/normalizeCaptureStatRegistryV1/);
});
