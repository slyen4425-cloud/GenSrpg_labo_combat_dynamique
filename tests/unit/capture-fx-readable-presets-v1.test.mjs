import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_FX_GLOW_PRESETS_V1,
  applyCaptureFxGlowPresetV1,
  captureFxGlowPresetIdForValuesV1
} from "../../src/catalogs/capture-fx-glow-presets-v1.js";

test("glow presets expose four readable levels with increasingly visible values", () => {
  assert.deepEqual(
    CAPTURE_FX_GLOW_PRESETS_V1.map(
      (preset) => preset.label
    ),
    [
      "Discret",
      "Visible",
      "Intense",
      "Très intense"
    ]
  );

  for (
    let index = 1;
    index < CAPTURE_FX_GLOW_PRESETS_V1.length;
    index += 1
  ) {
    const previous =
      CAPTURE_FX_GLOW_PRESETS_V1[index - 1];
    const current =
      CAPTURE_FX_GLOW_PRESETS_V1[index];

    assert.equal(
      current.strength > previous.strength,
      true
    );
    assert.equal(
      current.radiusPx > previous.radiusPx,
      true
    );
  }
});

test("applying a readable glow preset changes presentation only and preserves the chosen color", () => {
  const original = {
    fxGlowColor: "#ff6a1f",
    fxGlowStrength: 0.12,
    fxGlowRadiusPx: 8,
    impactFlashOpacity: 0.8,
    impactShakeAmplitudePx: 5,
    gameplaySentinel: {
      damage: 99
    }
  };

  const applied =
    applyCaptureFxGlowPresetV1({
      presetId: "intense",
      presentation: original
    });

  assert.equal(
    applied.fxGlowColor,
    "#ff6a1f"
  );
  assert.equal(
    applied.fxGlowStrength,
    0.85
  );
  assert.equal(
    applied.fxGlowRadiusPx,
    32
  );
  assert.equal(
    applied.impactFlashOpacity,
    0.8
  );
  assert.equal(
    applied.impactShakeAmplitudePx,
    5
  );
  assert.deepEqual(
    applied.gameplaySentinel,
    { damage: 99 }
  );
  assert.equal(
    original.fxGlowStrength,
    0.12,
    "preset application must not mutate its source"
  );
});

test("exact glow values reload as a readable level while manual tuning becomes custom", () => {
  assert.equal(
    captureFxGlowPresetIdForValuesV1({
      fxGlowStrength: 0.65,
      fxGlowRadiusPx: 22
    }),
    "visible"
  );

  assert.equal(
    captureFxGlowPresetIdForValuesV1({
      fxGlowStrength: 0.68,
      fxGlowRadiusPx: 22
    }),
    "custom"
  );
});

test("Capture editor exposes readable glow presets before expert numeric controls", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    html,
    /data-skill-fx-glow-preset/
  );
  assert.match(
    html,
    /Discret/
  );
  assert.match(
    html,
    /Très intense/
  );
  assert.match(
    html,
    /data-skill-fx-glow-preset-state/
  );
  assert.match(
    html,
    /Réglages experts/
  );

  assert.match(
    source,
    /applyCaptureFxGlowPresetV1/
  );
  assert.match(
    source,
    /captureFxGlowPresetIdForValuesV1/
  );
});
