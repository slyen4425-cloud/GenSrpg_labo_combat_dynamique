import test from "node:test";
import assert from "node:assert/strict";

import {
  applyCaptureFxStarterProfileV1
} from "../../src/catalogs/capture-fx-starter-profile-catalog-v1.js";

const cendre = {
  iconAssetId:
    "core:icon-skill-poison-cloud-01",
  castAssetId:
    "pack:capture:sprite-cast-physical-01",
  castDisplayScale: 1,
  castPlaybackMode: "once",
  castOffsetX: 0,
  castOffsetY: 0,
  castLayerPlayer: "front",
  castLayerOpponent: "front",
  travelAssetId:
    "pack:capture:sprite-projectile-earth-01",
  travelDisplayScale: 2.5,
  travelPlaybackMode: "once",
  travelLayerPlayer: "front",
  travelLayerOpponent: "front",
  impactAssetId:
    "pack:capture:sprite-impact-nature-01",
  impactDisplayScale: 2,
  impactPlaybackMode: "once",
  impactDurationMs: 0,
  impactOffsetX: 0,
  impactOffsetY: 0,
  impactLayerPlayer: "front",
  impactLayerOpponent: "front",
  zoneAssetId: "",
  socketId: "mouth",
  statusVisuals: {
    "cap_fire_special_1:1": {
      mode: "sprite",
      tintColor: "#e84b32",
      tintOpacity: 0.35,
      sprite: {
        assetId:
          "pack:capture:sprite-teleportation-2",
        displayScale: 3,
        opacity: 0.85
      }
    }
  }
};

test("starter FX enriches configured Cendre aveuglante without replacing its authored media", () => {
  const applied =
    applyCaptureFxStarterProfileV1({
      profileId:
        "capture:fx-profile:fireball-classic",
      presentation: cendre
    });

  assert.equal(
    applied.iconAssetId,
    cendre.iconAssetId
  );
  assert.equal(
    applied.castAssetId,
    cendre.castAssetId
  );
  assert.equal(
    applied.castDisplayScale,
    1
  );
  assert.equal(
    applied.travelAssetId,
    cendre.travelAssetId
  );
  assert.equal(
    applied.travelDisplayScale,
    2.5
  );
  assert.equal(
    applied.impactAssetId,
    cendre.impactAssetId
  );
  assert.equal(
    applied.impactDisplayScale,
    2
  );
  assert.equal(
    applied.socketId,
    "mouth"
  );
  assert.deepEqual(
    applied.statusVisuals,
    cendre.statusVisuals
  );

  assert.equal(
    applied.fxGlowColor,
    "#ff6a1f"
  );
  assert.equal(
    applied.projectileTrailCount > 0,
    true
  );
  assert.equal(
    applied.aftermathSmokeCount > 0,
    true
  );
});

test("starter FX still supplies authored media to a blank new ability", () => {
  const applied =
    applyCaptureFxStarterProfileV1({
      profileId:
        "capture:fx-profile:fireball-classic",
      presentation: {
        iconAssetId: "",
        castAssetId: "",
        travelAssetId: "",
        impactAssetId: "",
        zoneAssetId: "",
        socketId: null,
        statusVisuals: {}
      }
    });

  assert.equal(
    applied.iconAssetId,
    "pack:capture:icon-skill-fireball-01"
  );
  assert.equal(
    applied.castAssetId,
    "pack:capture:sprite-fireball-cast-01"
  );
  assert.equal(
    applied.travelAssetId,
    "pack:capture:sprite-fireball-travel-01"
  );
  assert.equal(
    applied.impactAssetId,
    "pack:capture:sprite-fireball-impact-01"
  );
});

test("starter FX preserves creator audio when already configured", () => {
  const applied =
    applyCaptureFxStarterProfileV1({
      profileId:
        "capture:fx-profile:fireball-classic",
      presentation: {
        castAudioAssetId:
          "user:audio:cast",
        travelAudioAssetId:
          "user:audio:travel",
        impactAudioAssetId:
          "user:audio:impact",
        zoneAudioAssetId:
          "user:audio:zone"
      }
    });

  assert.equal(
    applied.castAudioAssetId,
    "user:audio:cast"
  );
  assert.equal(
    applied.travelAudioAssetId,
    "user:audio:travel"
  );
  assert.equal(
    applied.impactAudioAssetId,
    "user:audio:impact"
  );
  assert.equal(
    applied.zoneAudioAssetId,
    "user:audio:zone"
  );
});


test("Capture editor applies starter FX against the real current presentation", async () => {
  const { readFile } =
    await import("node:fs/promises");
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /const currentPresentation\s*=\s*readSkillFields\(root\)\s*\.presentation/
  );
  assert.doesNotMatch(
    source,
    /presentation:\s*\{\s*socketId:[\s\S]*statusVisuals:\s*\{\}/
  );
});
