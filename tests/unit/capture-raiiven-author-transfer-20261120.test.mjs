import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCaptureCreatureTransferV1 } from "../../src/contracts/capture-creature-transfer-v1.js";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const file = readJson("data/capture/showcase/raiiven.capture-creature-transfer-v1.json");
const registry = readJson("data/capture/monster-capture-stat-registry.v1.json");

test("Raiiven author transfer is a complete valid canonical Capture creature", () => {
  const record = normalizeCaptureCreatureTransferV1(file, registry);
  assert.equal(record.schema, "capture-creature-transfer-v1");
  assert.equal(record.draft.id, "raiiven");
  assert.equal(record.statValues.creatureId, record.draft.id);
  assert.equal(record.loadout.creatureId, record.draft.id);
  assert.equal(record.draft.presentation.subjectId, record.draft.id);
  assert.equal(record.draft.presentation.version, 9);
  const visual = record.draft.presentation.visual;
  for (const slot of ["front", "back", "icon"]) {
    assert.ok(visual[slot].assetId.startsWith("pack:capture:creature-raiiven-"));
  }
  for (const slot of ["movement", "movementBack", "rangedAttack", "rangedAttackBack"]) {
    const asset = visual[slot];
    assert.equal(asset.mode, "sprite");
    const expected = asset.assetId.match(/-(\d+)-v1$/);
    assert.ok(expected, "canonical sprite-strip ID required for " + slot);
    assert.equal(asset.frameCount, Number(expected[1]), "frame count disagrees with canonical atlas ID: " + slot);
    assert.ok(asset.frameCount > 1);
  }
  assert.equal(new Set(record.loadout.slots.filter(s => s.skillId).map(s => s.skillId)).size,
               record.loadout.slots.filter(s => s.skillId).length);
});
