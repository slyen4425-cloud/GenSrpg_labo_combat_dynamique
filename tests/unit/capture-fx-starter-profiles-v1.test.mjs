import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_FX_STARTER_PROFILES_V1,
  captureFxStarterProfileByIdV1,
  applyCaptureFxStarterProfileV1
} from "../../src/catalogs/capture-fx-starter-profile-catalog-v1.js";

const PRESENTATION_KEYS = new Set([
  "iconAssetId",
  "castAssetId",
  "castDisplayScale",
  "castPlaybackMode",
  "castOffsetX",
  "castOffsetY",
  "castLayerPlayer",
  "castLayerOpponent",
  "travelAssetId",
  "travelDisplayScale",
  "travelPlaybackMode",
  "travelLayerPlayer",
  "travelLayerOpponent",
  "impactAssetId",
  "impactDisplayScale",
  "impactPlaybackMode",
  "impactDurationMs",
  "impactOffsetX",
  "impactOffsetY",
  "impactLayerPlayer",
  "impactLayerOpponent",
  "zoneAssetId",
  "zoneDisplayScale",
  "zoneDisplayScaleX",
  "zoneDisplayScaleY",
  "zonePlaybackMode",
  "zoneOffsetX",
  "zoneOffsetY",
  "zoneLayerPlayer",
  "zoneLayerOpponent",
  "castAudioAssetId",
  "travelAudioAssetId",
  "impactAudioAssetId",
  "zoneAudioAssetId"
]);

test("Capture FX starter library exposes protected system profiles only through presentation data", () => {
  assert.equal(
    CAPTURE_FX_STARTER_PROFILES_V1.length >= 8,
    true
  );

  const ids = new Set();

  for (
    const profile of
      CAPTURE_FX_STARTER_PROFILES_V1
  ) {
    assert.equal(profile.source, "system");
    assert.equal(profile.protected, true);
    assert.equal(Object.isFrozen(profile), true);
    assert.equal(
      Object.isFrozen(profile.presentation),
      true
    );
    assert.equal(ids.has(profile.id), false);
    ids.add(profile.id);

    for (
      const key of
        Object.keys(profile.presentation)
    ) {
      assert.equal(
        PRESENTATION_KEYS.has(key),
        true,
        "unexpected non-presentation field: " +
          key
      );
    }

    for (
      const [key, value] of
        Object.entries(profile.presentation)
    ) {
      if (
        !key.endsWith("AssetId") ||
        value === ""
      ) {
        continue;
      }

      assert.match(
        value,
        /^[A-Za-z0-9._-]+(?::[A-Za-z0-9._-]+)+$/,
        key + " must use a stable logical assetId"
      );
      assert.equal(
        value.includes("/"),
        false,
        key + " must not contain a physical path"
      );
    }
  }

  assert.equal(
    captureFxStarterProfileByIdV1(
      "capture:fx-profile:fireball-classic"
    )?.label,
    "Boule de feu"
  );
  assert.equal(
    captureFxStarterProfileByIdV1(
      "missing"
    ),
    null
  );
});

test("applying a starter profile copies presentation defaults while preserving socket/status and future presentation fields", () => {
  const statusVisuals = {
    poison: {
      assetId:
        "pack:capture:sprite-status-poison-01"
    }
  };
  const original = {
    socketId: "mouth",
    statusVisuals,
    zoneAssetId:
      "user:old-zone",
    zoneDisplayScale: 4,
    futurePresentationField:
      "keep-me"
  };

  const applied =
    applyCaptureFxStarterProfileV1({
      profileId:
        "capture:fx-profile:water-projectile",
      presentation: original
    });

  assert.equal(
    original.zoneAssetId,
    "user:old-zone",
    "source presentation must not be mutated"
  );
  assert.equal(applied.socketId, "mouth");
  assert.equal(
    applied.statusVisuals,
    statusVisuals
  );
  assert.equal(
    applied.futurePresentationField,
    "keep-me"
  );
  assert.equal(
    applied.castAssetId,
    "pack:capture:sprite-cast-water-01"
  );
  assert.equal(
    applied.travelAssetId,
    "pack:capture:sprite-projectile-water-01"
  );
  assert.equal(
    applied.impactAssetId,
    "pack:capture:sprite-impact-water-01"
  );
  assert.equal(
    applied.zoneAssetId,
    "",
    "profile application must clear slots owned by a previous profile"
  );
});

test("starter profile application rejects unknown profiles and never accepts a non-object presentation", () => {
  assert.throws(
    () =>
      applyCaptureFxStarterProfileV1({
        profileId: "capture:fx-profile:unknown",
        presentation: {}
      }),
    /Unknown Capture FX starter profile/
  );

  assert.throws(
    () =>
      applyCaptureFxStarterProfileV1({
        profileId:
          "capture:fx-profile:fireball-classic",
        presentation: []
      }),
    /presentation must be an object/
  );
});

test("Capture editor exposes simple protected FX profiles before existing advanced controls", async () => {
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

  for (const marker of [
    "data-skill-fx-starter",
    "data-skill-fx-starter-profile",
    "data-skill-fx-starter-apply",
    "data-skill-fx-starter-state",
    "data-skill-fx-advanced",
    "Appliquer et personnaliser"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      "missing starter FX UI marker: " +
        marker
    );
  }

  for (const owner of [
    "CAPTURE_FX_STARTER_PROFILES_V1",
    "applyCaptureFxStarterProfileV1",
    "writeSkillSpriteControlsV1"
  ]) {
    assert.equal(
      source.includes(owner),
      true,
      owner +
        " must be wired through existing presentation owners"
    );
  }

  for (const forbidden of [
    "localStorage",
    "sessionStorage",
    "indexedDB"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      forbidden +
        " must not become an FX profile storage authority"
    );
  }
});
