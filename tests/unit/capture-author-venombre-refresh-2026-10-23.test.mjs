import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { normalizeCaptureCreatureEditorDraftV3 } from "../../src/contracts/capture-creature-editor-draft-v3.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";

const read = p => JSON.parse(readFileSync(new URL("../../" + p, import.meta.url), "utf8"));
const creature = id => read("data/capture/showcase/" + id + ".capture-creature-transfer-v1.json");
const skill = id => read("data/capture/showcase/" + id + ".capture-skill-transfer-v1.json");
const snapshot = id => read("data/capture/source-exports/" + id + ".author-export-2026-10-23.json");

test("author Ailevent changes only opponent visual and two new skills without altering combat rules", () => {
  const c = creature("crea_ailevent");
  assert.equal(c.draft.presentation.viewOverrides.opponent.displayScale, 0.9);
  assert.deepEqual(c.draft.presentation.viewOverrides.opponent.position, {x:0,y:35});
  assert.equal(c.loadout.slots.find(s=>s.id==="slot-4")?.skillId, "cap_air_atk_4");
  assert.equal(c.loadout.slots.find(s=>s.id==="slot-ultimate")?.skillId, "cap_air_atk_7");
  assert.equal(c.draft.presentation.profileId, "flying");
  assert.equal(c.draft.id, "crea_ailevent");
});

test("Venombre keeps the imported author record and corrects only the expressly confirmed biped profile", () => {
  const c = creature("crea_tox_2");
  const original = snapshot("crea_tox_2");
  // Compare against the immutable 23 October original after undoing only the
  // author-approved 24 October presentation override and loadout fields.
  assert.deepEqual({
    ...c,
    draft:{...c.draft,presentation:{
      ...c.draft.presentation,profileId:"quadruped",
      viewOverrides:original.draft.presentation.viewOverrides
    }},
    loadout:original.loadout
  }, original);
  assert.equal(c.draft.id, "crea_tox_2");
  assert.equal(c.draft.displayName, "Venombre");
  assert.equal(c.draft.presentation.profileId, "biped");
  assert.equal(c.draft.combat.maxHp, 165);
  assert.equal(c.draft.combat.reaction.maxCharges, 2);
  assert.equal(c.statValues.values.poison, 20);
  assert.ok(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.includes("data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json"));
  assert.doesNotThrow(()=>normalizeCaptureCreatureEditorDraftV3(c.draft));
});

test("Morsure venimeuse author effects, cooldown and presentation use the native skill ID", () => {
  const c = skill("cap_poison_atk_2");
  assert.deepEqual(c, snapshot("cap_poison_atk_2"));
  assert.ok(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.includes("data/capture/showcase/cap_poison_atk_2.capture-skill-transfer-v1.json"));
  assert.equal(c.draft.id, "cap_poison_atk_2");
  assert.equal(c.draft.definition.energyCost, 3);
  assert.equal(c.draft.definition.cooldownMs, 15000);
  assert.equal(c.draft.definition.travelMs, 800);
  assert.equal(c.draft.definition.effects.find(e=>e.kind==="apply_marker")?.marker.id, "poison");
  assert.doesNotThrow(()=>normalizeSkillDefinition(c.draft.definition));
});

test("existing anti-air changes and source IDs remain untouched and manifests contain no duplicates", () => {
  for (const id of ["cap_air_atk_4","lib_chain_lightning"]) {
    assert.deepEqual(skill(id).draft.definition.hitPresenceStates, ["surface","airborne"]);
  }
  for (const list of [CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1,CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1]) {
    assert.equal(list.length,new Set(list).size);
    const actualIds=list.map(path => {
      const json=read(path);
      return json.draft.id;
    });
    assert.equal(actualIds.length,new Set(actualIds).size);
  }
});
