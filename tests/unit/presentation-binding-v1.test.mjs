import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  PRESENTATION_BINDING_SCHEMA,
  normalizePresentationBindingV1
} from "../../src/contracts/presentation-binding-v1.js";

function skillBinding() {
  return {
    schema: "presentation-binding-v1",
    subjectType: "skill",
    subjectId: "fireball",
    visual: {
      icon: {
        assetId: "core:icon-skill-fireball-01"
      },
      cast: {
        assetId: "pack:capture:sprite-fireball-cast-01",
        displayScale: 1.45,
        attachment: "source",
        anchor: "mouth",
        offsetX: 2,
        offsetY: -3,
        layer: "front",
        layerByView: {
          player: "behind",
          opponent: "front"
        },
        trigger: "release",
        playbackMode: "once",
        rotationDeg: 5,
        opacity: 0.9
      },
      travel: {
        assetId: "pack:capture:sprite-fireball-travel-01",
        attachment: "path",
        trigger: "travel"
      },
      impact: {
        assetId: "pack:capture:sprite-fireball-impact-01",
        attachment: "target",
        trigger: "impact",
        playbackMode: "stretch"
      }
    },
    audio: {
      cast: {
        assetId: "gensrpg:sound:fire-cast-01",
        volume: 0.72,
        loop: false,
        trigger: "release"
      },
      impact: {
        assetId: "gensrpg:sound:melee-impact-01",
        volume: 0.82
      }
    }
  };
}

test("PresentationBindingV1 normalizes a skill visual/audio binding", () => {
  const binding = normalizePresentationBindingV1(skillBinding());

  assert.equal(PRESENTATION_BINDING_SCHEMA, "presentation-binding-v1");
  assert.equal(binding.schema, PRESENTATION_BINDING_SCHEMA);
  assert.equal(binding.subjectType, "skill");
  assert.equal(binding.subjectId, "fireball");
  assert.equal(binding.visual.cast.assetId, "pack:capture:sprite-fireball-cast-01");
  assert.equal(binding.visual.cast.displayScale, 1.45);
  assert.equal(binding.visual.cast.attachment, "source");
  assert.equal(binding.visual.cast.anchor, "mouth");
  assert.deepEqual(binding.visual.cast.layerByView, {
    player: "behind",
    opponent: "front"
  });
  assert.equal(binding.audio.cast.volume, 0.72);
  assert.equal(binding.audio.cast.loop, false);
  assert.equal(Object.isFrozen(binding), true);
  assert.equal(Object.isFrozen(binding.visual.cast), true);
  assert.equal(Object.isFrozen(binding.audio.cast), true);
});

test("PresentationBindingV1 visual defaults are presentation-only", () => {
  const binding = normalizePresentationBindingV1({
    schema: "presentation-binding-v1",
    subjectType: "skill",
    subjectId: "claw",
    visual: {
      impact: {
        assetId: "pack:capture:sprite-claw-impact-01"
      }
    }
  });

  assert.equal(binding.visual.impact.displayScale, 1);
  assert.equal(binding.visual.impact.attachment, null);
  assert.equal(binding.visual.impact.anchor, null);
  assert.equal(binding.visual.impact.offsetX, 0);
  assert.equal(binding.visual.impact.offsetY, 0);
  assert.equal(binding.visual.impact.layer, null);
  assert.deepEqual(binding.visual.impact.layerByView, {});
  assert.equal(binding.visual.impact.trigger, null);
  assert.equal(binding.visual.impact.playbackMode, "once");
  assert.equal(binding.visual.impact.rotationDeg, 0);
  assert.equal(binding.visual.impact.opacity, 1);
});

test("the same PresentationBindingV1 contract supports creature views", () => {
  const binding = normalizePresentationBindingV1({
    schema: "presentation-binding-v1",
    subjectType: "creature",
    subjectId: "maraileron",
    visual: {
      player: {
        assetId: "project:maraileron-player",
        attachment: "source"
      },
      opponent: {
        assetId: "project:maraileron-opponent",
        attachment: "source"
      },
      icon: {
        assetId: "project:maraileron-icon"
      }
    }
  });

  assert.equal(binding.subjectType, "creature");
  assert.deepEqual(Object.keys(binding.visual), [
    "player",
    "opponent",
    "icon"
  ]);
});

test("PresentationBindingV1 rejects physical paths and URLs as assetId", () => {
  for (const assetId of [
    "https://example.test/fire.png",
    "assets/audio/fire.mp3",
    "../fire.png",
    "sprites\\fire.png"
  ]) {
    assert.throws(
      () => normalizePresentationBindingV1({
        schema: "presentation-binding-v1",
        subjectType: "skill",
        subjectId: "fireball",
        visual: {
          impact: { assetId }
        }
      }),
      /assetId.*logical|physical|path|URL/i,
      assetId
    );
  }
});

test("PresentationBindingV1 rejects gameplay and physical-resource fields", () => {
  const topLevelGameplay = skillBinding();
  topLevelGameplay.damage = 30;
  assert.throws(
    () => normalizePresentationBindingV1(topLevelGameplay),
    /unsupported|unknown.*damage|damage.*not allowed/i
  );

  const visualGameplay = skillBinding();
  visualGameplay.visual.cast.energyCost = 3;
  assert.throws(
    () => normalizePresentationBindingV1(visualGameplay),
    /unsupported|unknown.*energyCost|energyCost.*not allowed/i
  );

  const physical = skillBinding();
  physical.visual.cast.url = "assets/fire.png";
  assert.throws(
    () => normalizePresentationBindingV1(physical),
    /unsupported|unknown.*url|url.*not allowed/i
  );

  const audioPhysical = skillBinding();
  audioPhysical.audio.cast.file = "fire.mp3";
  assert.throws(
    () => normalizePresentationBindingV1(audioPhysical),
    /unsupported|unknown.*file|file.*not allowed/i
  );
});

test("PresentationBindingV1 validates visual enums and numeric bounds", () => {
  for (const [field, value] of [
    ["displayScale", 0],
    ["attachment", "dom-node"],
    ["layer", "z-999"],
    ["playbackMode", "forever"],
    ["opacity", 1.1]
  ]) {
    const input = skillBinding();
    input.visual.cast[field] = value;
    assert.throws(
      () => normalizePresentationBindingV1(input),
      new RegExp(field, "i"),
      field
    );
  }

  const badViewLayer = skillBinding();
  badViewLayer.visual.cast.layerByView.player = "middle";
  assert.throws(
    () => normalizePresentationBindingV1(badViewLayer),
    /layerByView/i
  );
});

test("PresentationBindingV1 validates audio values", () => {
  const badVolume = skillBinding();
  badVolume.audio.cast.volume = -0.1;
  assert.throws(
    () => normalizePresentationBindingV1(badVolume),
    /volume/i
  );

  const badLoop = skillBinding();
  badLoop.audio.cast.loop = "yes";
  assert.throws(
    () => normalizePresentationBindingV1(badLoop),
    /loop/i
  );
});

test("PresentationBindingV1 requires at least one visual or audio slot", () => {
  assert.throws(
    () => normalizePresentationBindingV1({
      schema: "presentation-binding-v1",
      subjectType: "skill",
      subjectId: "empty",
      visual: {},
      audio: {}
    }),
    /at least one.*slot/i
  );
});

test("PresentationBindingV1 has no renderer, gameplay, DOM, storage or network authority", async () => {
  const source = await readFile(
    "src/contracts/presentation-binding-v1.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /demo-assets|skill-definition|core\/combat|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
  );
});
