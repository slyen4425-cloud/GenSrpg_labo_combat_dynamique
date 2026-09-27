import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillPresentationBindingV1
} from "../../src/contracts/skill-presentation-binding-v1.js";

function fullBinding() {
  return {
    version: 1,
    skillId: "fireball",
    visual: {
      icon: {
        assetId: "pack:capture:icon-skill-fireball-01",
        displayScale: 1
      },
      cast: {
        assetId: "pack:capture:sprite-fireball-cast-01",
        displayScale: 1.45,
        attachment: "source",
        anchor: "mouth",
        offsetX: 2,
        offsetY: -3,
        layer: "behind",
        trigger: "preparation-start",
        playbackMode: "loop",
        rotationDeg: 0,
        opacity: 0.95
      },
      travel: {
        assetId: "pack:capture:sprite-fireball-travel-01",
        displayScale: 2.8,
        attachment: "travel",
        anchor: "mouth",
        layer: "front",
        trigger: "travel-start",
        playbackMode: "loop"
      },
      impact: {
        assetId: "pack:capture:sprite-fireball-impact-01",
        displayScale: 1.7,
        attachment: "target-fixed",
        anchor: "center",
        layer: "front",
        trigger: "impact",
        playbackMode: "once"
      },
      phases: {
        vanish: {
          assetId: "pack:capture:sprite-teleportation-2",
          attachment: "source-fixed",
          anchor: "center",
          trigger: "vanish",
          playbackMode: "once"
        }
      }
    },
    audio: {
      cast: {
        assetId: "gensrpg:sound:fire-cast-01",
        volume: 0.8,
        loop: false,
        trigger: "preparation-start"
      },
      impact: {
        assetId: "gensrpg:sound:melee-impact-01",
        volume: 1,
        loop: false,
        trigger: "impact"
      },
      phases: {
        vanish: {
          assetId: "gensrpg:sound:teleport-01",
          volume: 0.7,
          loop: false,
          trigger: "vanish"
        }
      }
    }
  };
}

test("SkillPresentationBindingV1 normalizes editor-facing visual and audio slots", () => {
  const binding = normalizeSkillPresentationBindingV1(
    fullBinding()
  );

  assert.equal(binding.version, 1);
  assert.equal(binding.skillId, "fireball");
  assert.equal(
    binding.visual.cast.assetId,
    "pack:capture:sprite-fireball-cast-01"
  );
  assert.equal(binding.visual.cast.displayScale, 1.45);
  assert.equal(binding.visual.cast.attachment, "source");
  assert.equal(binding.visual.cast.anchor, "mouth");
  assert.equal(binding.visual.cast.offsetX, 2);
  assert.equal(binding.visual.cast.offsetY, -3);
  assert.equal(binding.visual.cast.layer, "behind");
  assert.equal(binding.visual.cast.trigger, "preparation-start");
  assert.equal(binding.visual.cast.playbackMode, "loop");
  assert.equal(binding.visual.cast.opacity, 0.95);
  assert.equal(
    binding.visual.phases.vanish.attachment,
    "source-fixed"
  );
  assert.equal(binding.audio.cast.volume, 0.8);
  assert.equal(binding.audio.cast.loop, false);
  assert.equal(binding.audio.phases.vanish.trigger, "vanish");

  assert.ok(Object.isFrozen(binding));
  assert.ok(Object.isFrozen(binding.visual));
  assert.ok(Object.isFrozen(binding.visual.cast));
  assert.ok(Object.isFrozen(binding.visual.phases));
  assert.ok(Object.isFrozen(binding.audio));
});

test("missing optional slots normalize to null and empty phase maps", () => {
  const binding = normalizeSkillPresentationBindingV1({
    version: 1,
    skillId: "claw",
    visual: {
      impact: {
        assetId: "pack:capture:sprite-claw-impact-01"
      }
    }
  });

  assert.equal(binding.visual.icon, null);
  assert.equal(binding.visual.cast, null);
  assert.equal(binding.visual.travel, null);
  assert.equal(binding.visual.impact.assetId, "pack:capture:sprite-claw-impact-01");
  assert.equal(binding.visual.hit, null);
  assert.equal(binding.visual.miss, null);
  assert.equal(binding.visual.ko, null);
  assert.deepEqual(binding.visual.phases, {});

  assert.equal(binding.audio.cast, null);
  assert.equal(binding.audio.release, null);
  assert.equal(binding.audio.travel, null);
  assert.equal(binding.audio.impact, null);
  assert.equal(binding.audio.hit, null);
  assert.equal(binding.audio.miss, null);
  assert.deepEqual(binding.audio.phases, {});
});

test("assetId must be a logical namespaced id and never a physical path or URL", () => {
  for (const assetId of [
    "assets/library/capture/fire.png",
    "../fire.png",
    "https://example.com/fire.png",
    "fire.png"
  ]) {
    assert.throws(
      () =>
        normalizeSkillPresentationBindingV1({
          version: 1,
          skillId: "fireball",
          visual: {
            impact: { assetId }
          }
        }),
      /assetId must be a stable namespaced id/
    );
  }
});

test("visual editor ranges and enums are guarded by the contract", () => {
  const invalidCases = [
    ["displayScale", 4.01, /displayScale/],
    ["displayScale", 0.24, /displayScale/],
    ["attachment", "dom-node", /attachment/],
    ["layer", "z-index-999", /layer/],
    ["trigger", "internal-teleport-label", /trigger/],
    ["playbackMode", "whatever", /playbackMode/],
    ["opacity", 1.01, /opacity/],
    ["offsetX", Infinity, /offsetX/],
    ["rotationDeg", NaN, /rotationDeg/]
  ];

  for (const [field, value, expected] of invalidCases) {
    const input = {
      version: 1,
      skillId: "skill",
      visual: {
        cast: {
          assetId: "core:fx-test"
        }
      }
    };
    input.visual.cast[field] = value;
    assert.throws(
      () => normalizeSkillPresentationBindingV1(input),
      expected
    );
  }
});

test("audio volume and trigger are guarded", () => {
  assert.throws(
    () =>
      normalizeSkillPresentationBindingV1({
        version: 1,
        skillId: "skill",
        audio: {
          impact: {
            assetId: "core:sound-impact",
            volume: 1.5
          }
        }
      }),
    /volume/
  );

  assert.throws(
    () =>
      normalizeSkillPresentationBindingV1({
        version: 1,
        skillId: "skill",
        audio: {
          impact: {
            assetId: "core:sound-impact",
            trigger: "damage-applied-in-rules"
          }
        }
      }),
    /trigger/
  );
});

test("gameplay fields are rejected from presentation bindings", () => {
  for (const field of [
    "damage",
    "heal",
    "energyCost",
    "cooldownMs",
    "allowedDistances"
  ]) {
    const input = fullBinding();
    input[field] = field === "allowedDistances" ? ["short"] : 10;
    assert.throws(
      () => normalizeSkillPresentationBindingV1(input),
      /gameplay field/
    );
  }
});

test("phase labels stay presentation-defined and are not Animation Core enums", () => {
  const input = fullBinding();
  input.visual.phases = {
    "creator-custom-phase": {
      assetId: "project:custom-phase-fx",
      attachment: "arena",
      trigger: "release"
    }
  };

  const binding = normalizeSkillPresentationBindingV1(input);
  assert.equal(
    binding.visual.phases["creator-custom-phase"].assetId,
    "project:custom-phase-fx"
  );
});
