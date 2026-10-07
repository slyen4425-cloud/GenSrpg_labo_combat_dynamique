import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";

const FIREBALL_FILE =
  "data/capture/showcase/fireball.capture-skill-transfer-v1.json";

async function fireballDraft() {
  const text = await readFile(
    new URL("../../" + FIREBALL_FILE, import.meta.url),
    "utf8"
  );
  return importCaptureTransferJsonV1(text).value.draft;
}

test("Fireball cast keeps player +30 and opponent -30 through V9 side-aware resolver", async () => {
  const draft = await fireballDraft();
  const cast = draft.presentation.visual.cast;

  assert.equal(draft.presentation.version, 9);
  assert.equal(cast.offsetX, 30);
  assert.equal(cast.offsetY, 0);
  assert.equal(cast.offsetMode, "mirror_x");

  const assets = createCaptureSkillPresentationAssetsV2({
    skillPresentations: {
      [draft.id]: draft.presentation
    },
    assetForId(assetId) {
      return {
        id: assetId,
        frameCount: 1
      };
    }
  });

  const player = assets.presentationForSkill(
    draft.id,
    {
      sourceView: "player",
      fxType: "cast"
    }
  );
  const opponent = assets.presentationForSkill(
    draft.id,
    {
      sourceView: "opponent",
      fxType: "cast"
    }
  );

  assert.equal(player.cast.offsetX, 30);
  assert.equal(player.cast.offsetY, 0);
  assert.equal(opponent.cast.offsetX, -30);
  assert.equal(opponent.cast.offsetY, 0);
});
