import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const FIREBALL_FILE =
  "data/capture/showcase/fireball.capture-skill-transfer-v1.json";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

test("Fireball V4 keeps the explicitly corrected authored socket and cast axes", async () => {
  const transfer =
    importCaptureTransferJsonV1(
      await text(FIREBALL_FILE)
    );
  const visual =
    transfer.value.draft.presentation.visual;

  assert.equal(visual.cast.anchor, "mouth");
  assert.equal(visual.travel.anchor, "mouth");
  assert.equal(visual.cast.offsetX, 30);
  assert.equal(visual.cast.offsetY, 0);
});

test("Fireball V4 changes no unrelated authored values", async () => {
  const transfer =
    importCaptureTransferJsonV1(
      await text(FIREBALL_FILE)
    );
  const draft = transfer.value.draft;

  assert.equal(draft.id, "fireball");
  assert.equal(draft.requiredLevel, 5);
  assert.equal(draft.definition.energyCost, 6);
  assert.equal(draft.definition.preparationMs, 2500);
  assert.equal(draft.definition.travelMs, 1300);
  assert.equal(draft.definition.recoveryMs, 400);
  assert.equal(draft.definition.cooldownMs, 20000);
  assert.equal(draft.definition.effects[0].amount, 25);

  assert.equal(
    draft.presentation.visual.cast.assetId,
    "pack:capture:sprite-fireball-2-cast-01"
  );
  assert.equal(draft.presentation.visual.cast.displayScale, 1.6);
  assert.equal(
    draft.presentation.visual.travel.assetId,
    "pack:capture:sprite-fireball-travel-01"
  );
  assert.equal(draft.presentation.visual.travel.displayScale, 2.5);
  assert.equal(
    draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-fireball-2-impact-01"
  );
  assert.equal(draft.presentation.visual.impact.displayScale, 1.7);

  assert.equal(
    draft.presentation.audio.cast.assetId,
    "gensrpg:sound:effect-135ee2ed"
  );
  assert.equal(
    draft.presentation.audio.travel.assetId,
    "gensrpg:sound:genrpg-pack2-a30f1071"
  );
  assert.equal(
    draft.presentation.audio.impact.assetId,
    "gensrpg:sound:genrpg-pack2-a3d02c0f"
  );
});
