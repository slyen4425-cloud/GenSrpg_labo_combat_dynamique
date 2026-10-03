import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  privateAudioRuntimeAssetV1
} from "../../src/assets/private-audio-runtime-library-v1.js";

const PRESET_FILE =
  "data/capture/showcase/lib_flame_bite.capture-skill-transfer-v1.json";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

test("Morsure brulante showcase transfer keeps the exported combat and presentation data", async () => {
  const transfer = importCaptureTransferJsonV1(
    await text(PRESET_FILE)
  );
  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;
  assert.equal(draft.id, "lib_flame_bite");
  assert.equal(draft.requiredLevel, 15);
  assert.equal(draft.definition.name, "Morsure brûlante");
  assert.equal(draft.definition.element, "fire");
  assert.equal(draft.definition.form, "contact");
  assert.equal(draft.definition.approachMode, "ground");
  assert.equal(draft.definition.effects[0].amount, 10);
  assert.equal(draft.definition.effects[0].channel, "fire");

  const burn = draft.definition.effects[1].status;
  assert.equal(burn.kind, "damage_over_time");
  assert.equal(burn.durationMs, 10000);
  assert.equal(burn.tickIntervalMs, 2000);
  assert.equal(burn.amount, 5);
  assert.equal(burn.channel, "fire");
  assert.equal(burn.maxStacks, 10);

  assert.equal(
    draft.presentation.visual.icon.assetId,
    "core:icon-skill-fire-rain-01"
  );
  assert.equal(
    draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-impact-physical-01"
  );
  assert.equal(
    draft.presentation.audio.impact.assetId,
    "gensrpg:sound:effect-ee93278c"
  );
  assert.ok(
    privateAudioRuntimeAssetV1(
      "gensrpg:sound:effect-ee93278c"
    )
  );
  assert.equal(
    draft.presentation.statusVisuals.status.tintColor,
    "#d73920"
  );
  assert.equal(
    draft.presentation.statusVisuals.status.tintOpacity,
    0.8
  );
});

test("showcase skill preset catalog declares Morsure brulante exactly once", async () => {
  const source = await text(
    "src/catalogs/capture-showcase-skill-presets-v1.js"
  );
  assert.equal(
    (
      source.match(
        /lib_flame_bite\.capture-skill-transfer-v1\.json/g
      ) ?? []
    ).length,
    1
  );
});
