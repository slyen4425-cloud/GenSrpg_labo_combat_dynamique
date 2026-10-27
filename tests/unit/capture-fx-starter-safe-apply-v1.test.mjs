import test from "node:test";
import assert from "node:assert/strict";

import {
  applyCaptureFxStarterProfileV1
} from "../../src/catalogs/capture-fx-starter-profile-catalog-v1.js";

const cendre = {
  iconAssetId:
    "core:icon-skill-poison-cloud-01",
  castAssetId: "",
  travelAssetId:
    "pack:capture:sprite-projectile-shadow-01",
  travelDisplayScale: 1.45,
  travelPlaybackMode: "loop",
  travelLayerPlayer: "front",
  travelLayerOpponent: "front",
  impactAssetId:
    "pack:capture:sprite-status-curse-01",
  impactDisplayScale: 1.45,
  impactPlaybackMode: "once",
  impactDurationMs: 350,
  impactOffsetX: 0,
  impactOffsetY: 0,
  impactLayerPlayer: "front",
  impactLayerOpponent: "front",
  zoneAssetId: "",
  socketId: "mouth",
  castAudioAssetId:
    "gensrpg:sound:academie-01fc18a6",
  impactAudioAssetId:
    "gensrpg:sound:genrpg-pack2-742f6521",
  statusVisuals: {
    "cap_fire_special_1:1": {
      mode: "tint",
      tintColor: "#5b2067",
      tintOpacity: 0.35,
      sprite: null
    }
  }
}

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
    applied.travelAssetId,
    cendre.travelAssetId
  );
  assert.equal(
    applied.travelDisplayScale,
    1.45
  );
  assert.equal(
    applied.travelPlaybackMode,
    "loop"
  );
  assert.equal(
    applied.impactAssetId,
    cendre.impactAssetId
  );
  assert.equal(
    applied.impactDisplayScale,
    1.45
  );
  assert.equal(
    applied.impactDurationMs,
    350
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
    applied.castAudioAssetId,
    cendre.castAudioAssetId
  );
  assert.equal(
    applied.impactAudioAssetId,
    cendre.impactAudioAssetId
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
