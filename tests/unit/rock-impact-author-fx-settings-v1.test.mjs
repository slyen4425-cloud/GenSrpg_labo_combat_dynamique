import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { adaptCaptureSkillToSkillDefinition } from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";

const path = "data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json";
const read = () => readFile(new URL("../../" + path, import.meta.url), "utf8");

test("Impact rocheux uses only the six user-approved diagnostic FX values", async () => {
  const original = JSON.parse(await read());
  const draft = importCaptureTransferJsonV1(JSON.stringify(original)).value.draft;
  assert.equal(draft.id, "cap_earth_atk_4");
  assert.equal(draft.definition.name, "Impact rocheux");
  const { visual, feedback } = draft.presentation;

  assert.equal(visual.travel.trajectoryMode, "skyfall");
  assert.equal(visual.travel.fallHeightPx, 650);
  assert.equal(visual.travel.fallOffsetXPx, 0);
  assert.equal(visual.travel.displayScale, 2);
  assert.equal(adaptCaptureSkillToSkillDefinition({ id: original.draft.id, definition: original.draft.definition }, original.draft.presentation).projectileTargeting, "fixed_point");

  assert.equal(feedback.projectileTrail.sizePx, 8);
  assert.equal(feedback.projectileTrail.lengthPx, 50);
  assert.equal(feedback.projectileTrail.count, 6);
  assert.equal(feedback.projectileTrail.anchorX, 0.5);
  assert.equal(feedback.projectileTrail.anchorY, 0.4);
  assert.equal(feedback.cameraShake.amplitudePx, 5);
  assert.equal(feedback.cameraShake.durationMs, 140);
  assert.equal(feedback.aftermathSmoke.sizePx, 35);
  assert.equal(feedback.glow, null);
  assert.deepEqual(
    importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft,
    draft
  );
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p => p === path).length, 1);
});

test("Impact rocheux preserves all original author-export bytes except precisely six FX numbers", async () => {
  const raw = await read();
  const swap = (text, newer, older) => {
    const index = text.indexOf(newer);
    assert.ok(index >= 0, "expected authored FX span missing: " + newer);
    assert.equal(text.indexOf(newer, index + newer.length), -1, "FX replacement must be unique");
    return text.replace(newer, older);
  };
  const old = [
    [
      '"cameraShake": {\n          "amplitudePx": 5,',
      '"cameraShake": {\n          "amplitudePx": 600,'
    ],
    [
      '"projectileTrail": {\n          "color": "#ffffff",\n          "count": 6,\n          "lengthPx": 50,\n          "sizePx": 8,\n          "opacity": 1,\n          "anchorX": 0.5,\n          "anchorY": 0.4',
      '"projectileTrail": {\n          "color": "#ffffff",\n          "count": 8,\n          "lengthPx": 120,\n          "sizePx": 120,\n          "opacity": 1,\n          "anchorX": 0.5,\n          "anchorY": 0.5'
    ],
    [
      '"aftermathSmoke": {\n          "color": "#594943",\n          "count": 8,\n          "spreadPx": 50,\n          "sizePx": 35,',
      '"aftermathSmoke": {\n          "color": "#594943",\n          "count": 8,\n          "spreadPx": 50,\n          "sizePx": 120,'
    ]
  ].reduce((text, [newValue, oldValue]) => swap(text, newValue, oldValue), raw);
  const sha = createHash("sha1")
    .update("blob " + Buffer.byteLength(old) + "\0", "utf8")
    .update(old, "utf8")
    .digest("hex");
  assert.equal(sha, "8da9dceb1396fc428f39fddab6cddd23a957f906");
});
