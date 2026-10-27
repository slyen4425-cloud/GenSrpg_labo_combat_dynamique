import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1, exportCaptureCreatureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";

const path = "data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json";
const raw = readFileSync(new URL("../../" + path, import.meta.url));
const registry = normalizeCaptureStatRegistryV1(JSON.parse(readFileSync(new URL("../../data/capture/monster-capture-stat-registry.v1.json", import.meta.url), "utf8")));

test("Voltige latest V4 supersedes V3 while preserving all visual, stats and identity invariants", () => {
  assert.equal(createHash("sha256").update(raw).digest("hex"), "27a57678225ce2ed0f1a0ae270b59a2bcd48ccca79af59e96b84aba09e6c4fd6");
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(v => v === path).length, 1);
  const value = JSON.parse(raw.toString("utf8"));
  assert.equal(value.schema, "capture-creature-transfer-v1");
  assert.equal(value.draft.id, "crea_voltik");
  assert.equal(value.draft.presentation.viewOverrides.opponent.displayScale, 0.7);
  assert.deepEqual(value.draft.presentation.viewOverrides.opponent.position, {x: 0, y: 60});
  assert.equal(value.draft.presentation.viewOverrides.player.displayScale, 0.9);
  assert.deepEqual(value.loadout.slots.map(s => s.skillId), ["teleport-strike", "lib_static_bite", "lib_chain_lightning", "dodge", "cap_electric_special_2"]);
  assert.equal(value.draft.combat.approachTimeModifierPct, -40);
  assert.equal(value.statValues.values.health, 120);
  assert.equal(value.statValues.values.electric, 15);
  const transfer = importCaptureTransferJsonV1(raw.toString("utf8"), {statRegistry: registry});
  assert.equal(transfer.kind, "creature");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(transfer.value, {statRegistry: registry}), {statRegistry: registry}).value, transfer.value);
});
