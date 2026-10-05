import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillPresentationBinding
} from "../../src/contracts/skill-presentation-binding.js";
import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

function bindingV4() {
  return {
    id: "skill:fireball",
    version: 4,
    subjectType: "skill",
    subjectId: "fireball",
    visual: {
      impact: {
        assetId:
          "pack:capture:sprite-fireball-impact-01",
        attachment: "fixed-target",
        anchor: null,
        trigger: "impact",
        playbackMode: "once",
        layerByView: {
          player: "front",
          opponent: "front"
        }
      }
    },
    audio: {},
    statusVisuals: {},
    feedback: {
      glow: {
        color: "#ff7a2d",
        strength: 0.8,
        radiusPx: 18
      },
      impactFlash: {
        color: "#fff2c2",
        opacity: 0.72,
        durationMs: 120,
        scale: 1.55
      },
      cameraShake: {
        amplitudePx: 5,
        durationMs: 150
      }
    }
  };
}

test("SkillPresentationBindingV4 adds presentation-only glow flash and camera shake", () => {
  const result =
    normalizeSkillPresentationBinding(
      bindingV4()
    );

  assert.equal(result.version, 4);
  assert.deepEqual(result.feedback.glow, {
    color: "#ff7a2d",
    strength: 0.8,
    radiusPx: 18
  });
  assert.deepEqual(
    result.feedback.impactFlash,
    {
      color: "#fff2c2",
      opacity: 0.72,
      durationMs: 120,
      scale: 1.55
    }
  );
  assert.deepEqual(
    result.feedback.cameraShake,
    {
      amplitudePx: 5,
      durationMs: 150
    }
  );

  for (const forbidden of [
    "damage",
    "heal",
    "energyCost",
    "cooldownMs",
    "travelMs"
  ]) {
    assert.equal(
      forbidden in result.feedback,
      false
    );
  }
});

test("presentation resolver carries V4 feedback without giving it gameplay authority", () => {
  const assets =
    createCaptureSkillPresentationAssetsV2({
      skillPresentations: {
        fireball: bindingV4()
      },
      assetForId(assetId) {
        return {
          assetId,
          url: "blob:impact"
        };
      }
    });

  const presentation =
    assets.presentationForSkill(
      "fireball",
      {
        targetView: "opponent",
        fxType: "impact"
      }
    );

  assert.equal(
    presentation.impact.assetId,
    "pack:capture:sprite-fireball-impact-01"
  );
  assert.deepEqual(
    presentation.feedback.cameraShake,
    {
      amplitudePx: 5,
      durationMs: 150
    }
  );
});

test("impact renderer uses the existing FX owner for glow/flash and delegates shake to the camera owner", () => {
  const appended = [];
  const cameraPlans = [];
  const animations = [];

  const arena = {
    ownerDocument: {
      createElement() {
        return {
          className: "",
          dataset: {},
          style: {},
          children: [],
          append(child) {
            this.children.push(child);
          },
          remove() {
            this.removed = true;
          }
        };
      }
    },
    append(node) {
      appended.push(node);
    },
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: 600,
        height: 300
      };
    }
  };
  const anchors = {
    player: {
      getBoundingClientRect() {
        return {
          left: 40,
          top: 100,
          width: 40,
          height: 40
        };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return {
          left: 500,
          top: 100,
          width: 40,
          height: 40
        };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    presentationForSkill() {
      return {
        impact: {
          assetId:
            "pack:capture:sprite-fireball-impact-01",
          url: "blob:impact",
          displayScale: 1,
          opacity: 1,
          offsetX: 0,
          offsetY: 0
        },
        impactLayer: "front",
        feedback: bindingV4().feedback
      };
    },
    playCameraFx(plan) {
      cameraPlans.push(plan);
      return {
        status: "running",
        finished: Promise.resolve({
          status: "finished"
        })
      };
    },
    animate(node, keyframes, options) {
      animations.push({
        node,
        keyframes,
        options
      });
      return {
        finished: new Promise(() => {}),
        cancel() {}
      };
    }
  });

  const handle = renderer.play({
    type: "impact",
    skillId: "fireball",
    targetSlot: "opponent",
    durationMs: 420
  });

  assert.equal(handle.status, "running");
  assert.equal(
    appended.some(
      (node) =>
        node.dataset.skillFx ===
        "impact-flash"
    ),
    true,
    "impact flash must be rendered by the FX renderer"
  );

  const impact = appended.find(
    (node) =>
      node.dataset.skillFx === "impact"
  );
  assert.match(
    impact.style.filter,
    /drop-shadow/
  );

  assert.deepEqual(cameraPlans, [
    {
      type: "camera-shake",
      amplitudePx: 5,
      durationMs: 150
    }
  ]);

  assert.equal(
    animations.some(
      ({ node }) =>
        node.dataset.skillFx ===
        "impact-flash"
    ),
    true
  );
});
