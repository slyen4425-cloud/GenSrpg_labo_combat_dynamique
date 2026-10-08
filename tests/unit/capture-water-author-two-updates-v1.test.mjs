import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  applyCaptureTransferBatchToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const PRESETS = Object.freeze([
  {
    id: "cap_water_atk_1",
    name: "Goutte vive",
    digest: "3ab36b051d390bdb24b37f80a8a6c04ad02877299f1982a473dba499911c7098",
    assetIds: [
      "pack:capture:icon-skill-water-drop-01",
      "pack:capture:sprite-cast-water-01",
      "pack:capture:sprite-projectile-water-01",
      "pack:capture:sprite-impact-water-01"
    ],
    audioIds: [
      "gensrpg:sound:xel-cbc6cf88",
      "gensrpg:sound:xel-48520d94",
      "gensrpg:sound:sanctuary-17b7fa2c"
    ]
  },
  {
    id: "cap_water_atk_2",
    name: "Morsure de marée",
    digest: "0a7fba75a4f918e75f39f9be2d9dc09522758a271e8072442eed2be7ea89c791",
    assetIds: [
      "pack:capture:icon-skill-marine-bite-01",
      "pack:capture:sprite-cast-water-01",
      "pack:capture:sprite-impact-physical-01"
    ],
    audioIds: [
      "gensrpg:sound:xel-48520d94",
      "gensrpg:sound:effect-df32b429"
    ]
  }
]);

async function readRepoFile(path) {
  return readFile(new URL("../../" + path, import.meta.url), "utf8");
}

async function loadAuthorSkill(id) {
  const raw = await readRepoFile("data/capture/showcase/" + id + ".capture-skill-transfer-v1.json");
  return { raw: JSON.parse(raw), transfer: importCaptureTransferJsonV1(raw) };
}

test("both author JSON transfers replace existing Showcase entries exactly, without new owner or fallback", async () => {
  for (const preset of PRESETS) {
    const { raw, transfer } = await loadAuthorSkill(preset.id);
    assert.equal(transfer.kind, "skill");
    assert.equal(transfer.value.draft.id, preset.id);
    assert.equal(transfer.value.draft.definition.name, preset.name);
    assert.equal(transfer.value.draft.presentation.version, 9);
    assert.equal(raw.schema, "capture-skill-transfer-v1");
    assert.equal(raw.version, 1);

    const digest = createHash("sha256").update(JSON.stringify(raw), "utf8").digest("hex");
    assert.equal(digest, preset.digest, "The complete " + preset.id + " author export must stay identical; no approximation");
    assert.deepEqual(
      Object.values(raw.draft.presentation.visual).map(x => x.assetId),
      preset.assetIds
    );
    assert.deepEqual(
      Object.values(raw.draft.presentation.audio).map(x => x.assetId),
      preset.audioIds
    );
    const roundtrip = importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(transfer.value.draft));
    assert.deepEqual(roundtrip.value, transfer.value);
    const filename = "data/capture/showcase/" + preset.id + ".capture-skill-transfer-v1.json";
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x => x === filename).length, 1);
  }
});

test("Goutte vive preserves projectile timings, loop and impact 650ms + sound", async () => {
  const d = (await loadAuthorSkill("cap_water_atk_1")).transfer.value.draft;
  assert.equal(d.definition.form, "projectile");
  assert.equal(d.definition.preparationMs, 800);
  assert.equal(d.definition.travelMs, 800);
  assert.equal(d.definition.cooldownMs, 15000);
  assert.deepEqual(d.definition.effects, [
    {kind:"damage",targetScope:"target",amount:10,channel:"water"}
  ]);
  assert.equal(d.presentation.visual.travel.playbackMode, "loop");
  assert.equal(d.presentation.visual.impact.durationMs, 650);
  assert.equal(d.presentation.audio.impact.assetId, "gensrpg:sound:sanctuary-17b7fa2c");
});

test("Morsure de marée preserves burrow, damage + energy drain, 120px camera shake and cast", async () => {
  const d = (await loadAuthorSkill("cap_water_atk_2")).transfer.value.draft;
  assert.equal(d.definition.form, "contact");
  assert.equal(d.definition.approachMode, "burrow");
  assert.equal(d.definition.preparationMs, 2000);
  assert.equal(d.definition.travelMs, 650);
  assert.equal(d.definition.cooldownMs, 20000);
  assert.deepEqual(d.definition.effects, [
    {kind:"damage",targetScope:"target",amount:20,channel:"water"},
    {kind:"energy_drain",targetScope:"target",amount:3}
  ]);
  assert.equal(d.presentation.visual.cast.displayScale, 2.5);
  assert.equal(d.presentation.visual.cast.playbackMode, "stretch");
  assert.equal(d.presentation.feedback.cameraShake.amplitudePx, 120);
  assert.equal(d.presentation.feedback.cameraShake.durationMs, 140);
  assert.equal(d.presentation.audio.impact.assetId, "gensrpg:sound:effect-df32b429");
});

test("both author versions replace via the single configuredSkills batch without touching configuredCreatures", async () => {
  const registry = normalizeCaptureStatRegistryV1(JSON.parse(await readRepoFile("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules = normalizeCaptureProgressionRulesV1(JSON.parse(await readRepoFile("data/capture/monster-capture-progression-rules.v1.json")));
  const configuredSkills = new Map();
  for (const d of capturePortableNativeSkillDraftsV1()) configuredSkills.set(d.id, d);
  for (const d of captureComplexNativeSkillDraftsV1()) if (!configuredSkills.has(d.id)) configuredSkills.set(d.id, d);
  const configuredCreatures = new Map();
  const count = configuredSkills.size;
  const initialCreatures = [...configuredCreatures.entries()];
  const transfers = [];
  for (const preset of PRESETS) {
    assert.ok(configuredSkills.has(preset.id), preset.id + " must exist historically");
    transfers.push((await loadAuthorSkill(preset.id)).transfer);
  }
  const applied = applyCaptureTransferBatchToEditorStateV1({
    transfers, configuredCreatures, configuredSkills, statRegistry: registry, progressionRules, mode: "replace"
  });
  assert.deepEqual(applied.actions.map(x => [x.action,x.id]), [
    ["replace-skill", "cap_water_atk_1"],
    ["replace-skill", "cap_water_atk_2"]
  ]);
  assert.equal(configuredSkills.size, count);
  assert.equal(configuredCreatures.size, 0);
  assert.deepEqual([...configuredCreatures.entries()], initialCreatures);
  for (const preset of PRESETS) {
    assert.equal(configuredSkills.get(preset.id).definition.name, preset.name);
  }
});
