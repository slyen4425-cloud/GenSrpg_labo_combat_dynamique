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
import {
  buildHumanSkillDraftV1,
  humanSkillEditorFieldsFromDraftV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  applyCaptureFxStarterProfileV1
} from "../../src/catalogs/capture-fx-starter-profile-catalog-v1.js";
import { readFile } from "node:fs/promises";

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


test("starter fireball copies visible enhancement defaults into the editable presentation fields", () => {
  const presentation =
    applyCaptureFxStarterProfileV1({
      profileId:
        "capture:fx-profile:fireball-classic",
      presentation: {
        socketId: "mouth",
        statusVisuals: {}
      }
    });

  assert.equal(
    presentation.fxGlowStrength > 0,
    true
  );
  assert.equal(
    presentation.impactFlashOpacity > 0,
    true
  );
  assert.equal(
    presentation.impactShakeAmplitudePx > 0,
    true
  );
  assert.equal(
    presentation.socketId,
    "mouth"
  );
});

test("Human Editor round-trips V4 feedback without changing gameplay fields", async () => {
  const fields = {
    id: "fx-roundtrip",
    name: "FX Roundtrip",
    description: "Presentation only.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "projectile",
    element: "fire",
    approachMode: "none",
    energyCost: 3,
    preparationMs: 600,
    travelMs: 700,
    recoveryMs: 300,
    cooldownMs: 2400,
    maxUsesPerCombat: null,
    activationRequirements: {
      mode: "all",
      conditions: []
    },
    effects: [
      {
        kind: "damage",
        targetScope: "target",
        amount: 5,
        channel: "fire"
      }
    ],
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: {
      power: 1
    },
    presentation: {
      iconAssetId:
        "core:icon-skill-fireball-01",
      castAssetId:
        "pack:capture:sprite-fireball-cast-01",
      castDisplayScale: 1.5,
      castPlaybackMode: "loop",
      castOffsetX: 0,
      castOffsetY: 0,
      castLayerPlayer: "front",
      castLayerOpponent: "front",
      travelAssetId:
        "pack:capture:sprite-fireball-travel-01",
      travelDisplayScale: 1.6,
      travelPlaybackMode: "loop",
      travelLayerPlayer: "front",
      travelLayerOpponent: "front",
      impactAssetId:
        "pack:capture:sprite-fireball-impact-01",
      impactDisplayScale: 1.7,
      impactPlaybackMode: "once",
      impactDurationMs: 0,
      impactOffsetX: 0,
      impactOffsetY: 0,
      impactLayerPlayer: "front",
      impactLayerOpponent: "front",
      zoneAssetId: "",
      zoneDisplayScale: 1,
      zoneDisplayScaleX: 1,
      zoneDisplayScaleY: 1,
      zonePlaybackMode: "loop",
      zoneOffsetX: 0,
      zoneOffsetY: 0,
      zoneLayerPlayer: "behind",
      zoneLayerOpponent: "behind",
      socketId: "mouth",
      statusVisuals: {},
      castAudioAssetId: "",
      travelAudioAssetId: "",
      impactAudioAssetId: "",
      zoneAudioAssetId: "",
      fxGlowColor: "#ff6a1f",
      fxGlowStrength: 0.8,
      fxGlowRadiusPx: 19,
      impactFlashColor: "#fff2c2",
      impactFlashOpacity: 0.75,
      impactFlashDurationMs: 125,
      impactFlashScale: 1.6,
      impactShakeAmplitudePx: 4.5,
      impactShakeDurationMs: 145
    }
  };

  const draft =
    buildHumanSkillDraftV1(fields);
  assert.equal(
    draft.presentation.version,
    4
  );
  assert.deepEqual(
    draft.presentation.feedback.cameraShake,
    {
      amplitudePx: 4.5,
      durationMs: 145
    }
  );

  const restored =
    humanSkillEditorFieldsFromDraftV1(
      JSON.parse(JSON.stringify(draft))
    );
  assert.equal(
    restored.presentation.fxGlowColor,
    "#ff6a1f"
  );
  assert.equal(
    restored.presentation.fxGlowStrength,
    0.8
  );
  assert.equal(
    restored.presentation.impactFlashOpacity,
    0.75
  );
  assert.equal(
    restored.presentation.impactShakeAmplitudePx,
    4.5
  );

  const second =
    buildHumanSkillDraftV1(restored);
  assert.deepEqual(
    second.definition,
    draft.definition
  );
  assert.deepEqual(
    second.presentation,
    draft.presentation
  );

  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );
  for (const marker of [
    "data-skill-fx-glow-color",
    "data-skill-fx-glow-strength",
    "data-skill-fx-glow-radius",
    "data-skill-impact-flash-opacity",
    "data-skill-impact-shake-amplitude"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      "missing FX enhancement control " +
        marker
    );
  }
});
