import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const read = path => JSON.parse(readFileSync(new URL("../../" + path, import.meta.url), "utf8"));
const creature = id => read("data/capture/showcase/" + id + ".capture-creature-transfer-v1.json");
const skill = id => read("data/capture/showcase/" + id + ".capture-skill-transfer-v1.json");

test("Venombre is registered exactly once and its authored profile is corrected as biped without replacing the visual assets", () => {
  const p = "data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json";
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x => x === p).length, 1);
  const {draft,statValues,loadout} = creature("crea_tox_2");
  assert.equal(draft.id,"crea_tox_2");
  assert.equal(draft.displayName,"Venombre");
  assert.equal(draft.presentation.profileId,"biped","user confirmed biped, not the stale quadruped export");
  assert.equal(draft.presentation.visual.front.assetId,"pack:capture:creature-venombre-opponent-01");
  assert.equal(draft.presentation.visual.back.assetId,"pack:capture:creature-venombre-player-01");
  assert.equal(draft.presentation.visual.icon.assetId,"pack:capture:creature-venombre-icon-01");
  assert.equal(statValues.values.health,165);
  assert.equal(statValues.values.poison,20);
  assert.equal(statValues.values.esprit,27);
  assert.deepEqual(loadout.slots.map(x=>x.skillId),
    ["cap_poison_atk_2","cap_poison_atk_3","cap_poison_special_2","cap_poison_atk_6",null]);
});

test("Ailevent retains its source and gains only deliberate author presentation and loadout changes", () => {
  const {draft,loadout} = creature("crea_ailevent");
  assert.equal(draft.presentation.profileId,"flying");
  assert.deepEqual(draft.presentation.viewOverrides.opponent,
    {displayScale:0.9,position:{x:0,y:35}});
  assert.deepEqual(loadout.slots.map(x=>x.skillId),
    ["lib_gust","cap_air_atk_3","lib_tailwind","cap_air_atk_4","cap_air_atk_7"]);
});

test("Morsure venimeuse is in the active catalog, not a duplicate, and retains all author settings", () => {
  const p = "data/capture/showcase/cap_poison_atk_2.capture-skill-transfer-v1.json";
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===p).length,1);
  const {draft} = skill("cap_poison_atk_2");
  assert.equal(draft.id,"cap_poison_atk_2");
  assert.equal(draft.definition.name,"Morsure venimeuse");
  assert.equal(draft.definition.energyCost,3);
  assert.equal(draft.definition.preparationMs,700);
  assert.equal(draft.definition.travelMs,800);
  assert.equal(draft.definition.cooldownMs,15000);
  assert.equal(draft.definition.approachMode,"ground");
  assert.equal(draft.definition.effects[0].amount,15);
  const marker=draft.definition.effects[1].marker;
  assert.equal(marker.id,"poison");
  assert.equal(marker.durationMs,25000);
  assert.equal(marker.periodic.amount,5);
  assert.equal(marker.periodic.intervalMs,5000);
});

test("previous anti-air author fields remain authoritative, not overwritten by older full-export defaults", () => {
  for(const id of ["cap_air_atk_4","lib_chain_lightning"]){
    assert.deepEqual(skill(id).draft.definition.hitPresenceStates,["surface","airborne"]);
  }
});
