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


test("new Impact rocheux export replaces old author file but preserves all new authored bytes except fixed-point correction", async () => {
  const raw = await read();
  const sha = value => createHash("sha256").update(value,"utf8").digest("hex");
  assert.equal(sha(raw), "04c1330d6993bb0d5e90afd2c39d544944d2c8aa4b009cdbd075f18d4c4bed6b");
  const original = raw.replace('"projectileTargeting": "fixed_point"', '"projectileTargeting": "direct"');
  assert.notEqual(original, raw);
  assert.equal(sha(original), "67554e742c0045b882bbfe6053cd4d5dfb93e1bb2855ea4b13eb0f68d2632bb9");
});
