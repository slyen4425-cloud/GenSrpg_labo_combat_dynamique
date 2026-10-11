import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";

const creaturePath = "data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json";
const skillPath = "data/capture/showcase/cap_earth_atk_7.capture-skill-transfer-v1.json";
const load = async path => readFile(new URL("../../" + path, import.meta.url), "utf8");

test("Mossback author export preserves its seismic ultimate without duplicate creature", async () => {
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x => x === creaturePath).length, 1);
  const registry = normalizeCaptureStatRegistryV1(JSON.parse(await load("data/capture/monster-capture-stat-registry.v1.json")));
  const imported = importCaptureTransferJsonV1(await load(creaturePath), {statRegistry: registry});
  assert.equal(imported.kind, "creature");
  assert.equal(imported.value.draft.id, "crea_mossback");
  assert.equal(imported.value.draft.skillIds.filter(id => id === "cap_earth_atk_7").length, 1);
  assert.deepEqual(imported.value.loadout.slots.map(slot => slot.skillId),
    ["cap_earth_atk_2", "lib_earth_guard", "cap_earth_atk_4", "cap_earth_atk_3", "cap_earth_atk_7"]);
  assert.equal(imported.value.draft.presentation.profileId, "massive");
  assert.equal(imported.value.draft.presentation.displayScale, 1.7);
  assert.equal(imported.value.statValues.values.health, 200);
});

test("seismic ultimate referenced by Mossback has its exact author transfer and one active registration", async () => {
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(path => path === skillPath).length, 1,
    "Missing author skill transfer cap_earth_atk_7: do not publish the creature's unresolved ultimate");
  const bytes = await load(skillPath);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "c55b4f384bccdd485f1d9e4fc9d39f58d7f28b679c9897b81e88b6fdb1c7f865");
  const imported = importCaptureTransferJsonV1(bytes);
  assert.equal(imported.kind, "skill");
  assert.equal(imported.value.draft.id, "cap_earth_atk_7");
  assert.equal(imported.value.draft.definition.id, "cap_earth_atk_7");
  assert.equal(imported.value.draft.definition.loadoutSlot, "ultimate");
  const draft = imported.value.draft;
  assert.equal(draft.definition.name, "Séisme primordial");
  assert.equal(draft.requiredLevel, 20);
  assert.equal(draft.definition.element, "earth");
  assert.equal(draft.definition.maxUsesPerCombat, 1);
  assert.deepEqual(draft.definition.targetRelations, ["enemy"]);
  assert.equal(draft.definition.effects[0].targetScope, "all_enemies");
  assert.equal(draft.definition.effects[0].amount, 100);
  assert.equal(draft.definition.effects[0].channel, "earth");
  assert.deepEqual(draft.presentation.feedback.cameraShake,{amplitudePx:50,durationMs:1200});
  assert.equal(draft.presentation.visual.impact.assetId,"pack:capture:sprite-rock-impact-upward-01");
});
