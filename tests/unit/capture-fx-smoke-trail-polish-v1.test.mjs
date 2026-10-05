import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillPresentationBinding
} from "../../src/contracts/skill-presentation-binding.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

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
