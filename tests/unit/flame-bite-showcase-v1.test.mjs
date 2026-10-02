import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const PRESET =
  "data/capture/showcase/lib_flame_bite.capture-skill-transfer-v1.json";
const CATALOG =
  "src/catalogs/capture-showcase-skill-presets-v1.js";

async function text(path) {
  return readFile(
    new URL("../../" + path, import.meta.url),
    "utf8"
  );
}

test("Morsure brulante showcase preset preserves the user export", async () => {
  const transfer = importCaptureTransferJsonV1(
    await text(PRESET)
  );

  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;

  assert.equal(draft.id, "lib_flame_bite");
  assert.equal(draft.requiredLevel, 15);
  assert.equal(
    draft.definition.name,
    "Morsure brûlante"
  );
  assert.equal(
    draft.definition.form,
    "contact"
  );
  assert.equal(
    draft.definition.approachMode,
    "ground"
  );
  assert.equal(
    draft.definition.element,
    "fire"
  );
  assert.equal(
    draft.definition.energyCost,
    5
  );
  assert.equal(
    draft.definition.preparationMs,
    700
  );
  assert.equal(
    draft.definition.travelMs,
    700
  );
  assert.equal(
    draft.definition.cooldownMs,
    25000
  );

  const [damage, status] =
    draft.definition.effects;

  assert.deepEqual(
    {
      kind: damage.kind,
      amount: damage.amount,
      channel: damage.channel
    },
    {
      kind: "damage",
      amount: 10,
      channel: "fire"
    }
  );

  assert.equal(
    status.kind,
    "apply_status"
  );
  assert.equal(
    status.status.kind,
    "damage_over_time"
  );
  assert.equal(
    status.status.durationMs,
    10000
  );
  assert.equal(
    status.status.tickIntervalMs,
    2000
  );
  assert.equal(
    status.status.amount,
    5
  );
  assert.equal(
    status.status.channel,
    "fire"
  );
  assert.equal(
    status.status.maxStacks,
    10
  );

  assert.equal(
    draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-impact-physical-01"
  );
  assert.equal(
    draft.presentation.audio.impact.assetId,
    "gensrpg:sound:effect-ee93278c"
  );
  assert.equal(
    draft.presentation.statusVisuals.status.tintColor,
    "#d73920"
  );
});

test("Morsure brulante is declared exactly once in the showcase preset catalog", async () => {
  const source = await text(CATALOG);
  assert.equal(
    (
      source.match(
        /lib_flame_bite\.capture-skill-transfer-v1\.json/g
      ) ?? []
    ).length,
    1
  );
});
