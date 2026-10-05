import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillPresentationBinding
} from "../../src/contracts/skill-presentation-binding.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";
import {
  buildHumanSkillDraftV1,
  humanSkillEditorFieldsFromDraftV1
} from "../../src/ui/capture-editor-human-v2.js";

function v6Binding() {
  return {
    id: "skill:fireball",
    version: 6,
    subjectType: "skill",
    subjectId: "fireball",
    visual: {},
    audio: {},
    statusVisuals: {},
    feedback: {
      glow: {
        color: "#ff6a1f",
        strength: 0.85,
        radiusPx: 32
      },
      impactFlash: null,
      cameraShake: null,
      projectileTrail: {
        color: "#ff6a1f",
        count: 6,
        lengthPx: 52,
        sizePx: 8,
        opacity: 0.72
      },
      impactBurst: {
        color: "#ffd27a",
        count: 10,
        spreadPx: 64,
        sizePx: 8,
        durationMs: 360,
        opacity: 0.86
      },
      aftermathSmoke: {
        color: "#594943",
        count: 5,
        spreadPx: 46,
        sizePx: 28,
        risePx: 42,
        durationMs: 760,
        opacity: 0.42
      }
    }
  };
}

function domNode() {
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

function rendererHarness() {
  const appended = [];
  const animations = [];

  const arena = {
    ownerDocument: {
      createElement() {
        return domNode();
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
          top: 120,
          width: 40,
          height: 40
        };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return {
          left: 500,
          top: 120,
          width: 40,
          height: 40
        };
      }
    }
  };

  const feedback = v6Binding().feedback;

  const renderer =
    createDomSkillFxRenderer({
      arena,
      anchors,
      targetAnchors: anchors,
      presentationForSkill() {
        return {
          travel: null,
          travelLayer: "front",
          impact: null,
          impactLayer: "front",
          feedback
        };
      },
      animate(target, keyframes, options) {
        const animation = {
          target,
          keyframes,
          options,
          finished: new Promise(() => {}),
          cancel() {}
        };
        animations.push(animation);
        return animation;
      }
    });

  return {
    renderer,
    appended,
    animations
  };
}

test("SkillPresentationBindingV6 owns bounded aftermath smoke as presentation only", () => {
  const binding =
    normalizeSkillPresentationBinding(
      v6Binding()
    );

  assert.equal(binding.version, 6);
  assert.deepEqual(
    binding.feedback.aftermathSmoke,
    {
      color: "#594943",
      count: 5,
      spreadPx: 46,
      sizePx: 28,
      risePx: 42,
      durationMs: 760,
      opacity: 0.42
    }
  );

  const invalid = v6Binding();
  invalid.feedback.aftermathSmoke.count = 50;

  assert.throws(
    () =>
      normalizeSkillPresentationBinding(
        invalid
      ),
    /count/i
  );
});

test("projectile trail renders tapered streaks rather than circular beads", () => {
  const {
    renderer,
    appended
  } = rendererHarness();

  renderer.play({
    type: "projectile",
    skillId: "fireball",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 500
  });

  const projectile =
    appended.find(
      (node) =>
        node.dataset.skillFx ===
        "projectile"
    );
  assert.ok(projectile);

  const trail =
    projectile.children.filter(
      (node) =>
        node.dataset.skillFx ===
        "projectile-trail-particle"
    );

  assert.equal(trail.length, 6);

  for (const particle of trail) {
    assert.equal(
      parseFloat(particle.style.width) >
        parseFloat(particle.style.height),
      true,
      "trail particles must be elongated streaks"
    );
    assert.match(
      particle.style.background,
      /linear-gradient/
    );
    assert.notEqual(
      particle.style.background,
      "#ffffff"
    );
    assert.match(
      particle.style.transform,
      /rotate\(/
    );
  }
});

test("impact creates a soft smoke aftermath after burst without gameplay authority", () => {
  const {
    renderer,
    appended,
    animations
  } = rendererHarness();

  renderer.play({
    type: "impact",
    skillId: "fireball",
    targetSlot: "opponent",
    durationMs: 420
  });

  const smoke =
    appended.find(
      (node) =>
        node.dataset.skillFx ===
        "aftermath-smoke"
    );

  assert.ok(smoke);
  assert.equal(
    smoke.children.length,
    5
  );

  for (const puff of smoke.children) {
    assert.equal(
      puff.dataset.skillFx,
      "aftermath-smoke-puff"
    );
    assert.match(
      puff.style.background,
      /radial-gradient/
    );
    assert.match(
      puff.style.filter,
      /blur/
    );
  }

  assert.equal(
    animations.some(
      ({ target }) =>
        target.dataset.skillFx ===
        "aftermath-smoke-puff"
    ),
    true
  );
});


test("Human Editor round-trips V8 trail anchor, smoke and particle feedback without changing gameplay", () => {
  const fields = {
    id: "fx-smoke-roundtrip",
    name: "FX Smoke Roundtrip",
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
      iconAssetId: "",
      castAssetId: "",
      castDisplayScale: 1,
      castPlaybackMode: "once",
      castOffsetX: 0,
      castOffsetY: 0,
      castLayerPlayer: "front",
      castLayerOpponent: "front",
      travelAssetId: "",
      travelDisplayScale: 1,
      travelPlaybackMode: "stretch",
      travelLayerPlayer: "front",
      travelLayerOpponent: "front",
      impactAssetId: "",
      impactDisplayScale: 1,
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
      socketId: null,
      statusVisuals: {},
      castAudioAssetId: "",
      travelAudioAssetId: "",
      impactAudioAssetId: "",
      zoneAudioAssetId: "",
      fxGlowColor: "#ff6a1f",
      fxGlowStrength: 0.85,
      fxGlowRadiusPx: 32,
      impactFlashColor: "#fff2c2",
      impactFlashOpacity: 0.8,
      impactFlashDurationMs: 120,
      impactFlashScale: 1.65,
      impactShakeAmplitudePx: 5,
      impactShakeDurationMs: 150,
      projectileTrailColor: "#ff6a1f",
      projectileTrailCount: 7,
      projectileTrailLengthPx: 56,
      projectileTrailSizePx: 7,
      projectileTrailOpacity: 0.8,
      projectileTrailAnchorX: 0.5,
      projectileTrailAnchorY: 0.36,
      impactBurstColor: "#ffd27a",
      impactBurstCount: 12,
      impactBurstSpreadPx: 72,
      impactBurstSizePx: 9,
      impactBurstDurationMs: 380,
      impactBurstOpacity: 0.9,
      aftermathSmokeColor: "#594943",
      aftermathSmokeCount: 5,
      aftermathSmokeSpreadPx: 46,
      aftermathSmokeSizePx: 28,
      aftermathSmokeRisePx: 42,
      aftermathSmokeDurationMs: 760,
      aftermathSmokeOpacity: 0.42
    }
  };

  const draft =
    buildHumanSkillDraftV1(fields);

  assert.equal(
    draft.presentation.version,
    8
  );
  assert.deepEqual(
    draft.presentation.feedback.aftermathSmoke,
    {
      color: "#594943",
      count: 5,
      spreadPx: 46,
      sizePx: 28,
      risePx: 42,
      durationMs: 760,
      opacity: 0.42
    }
  );

  const restored =
    humanSkillEditorFieldsFromDraftV1(
      JSON.parse(JSON.stringify(draft))
    );

  assert.equal(
    restored.presentation.aftermathSmokeColor,
    "#594943"
  );
  assert.equal(
    restored.presentation.aftermathSmokeCount,
    5
  );
  assert.equal(
    restored.presentation.aftermathSmokeDurationMs,
    760
  );

  assert.equal(
    restored.presentation.projectileTrailAnchorX,
    0.5
  );
  assert.equal(
    restored.presentation.projectileTrailAnchorY,
    0.36
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
});
