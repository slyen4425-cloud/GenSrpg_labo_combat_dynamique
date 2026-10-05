import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillPresentationBinding
} from "../../src/contracts/skill-presentation-binding.js";
import {
  CAPTURE_FX_PARTICLE_PRESETS_V1,
  applyCaptureFxParticlePresetV1,
  captureFxParticlePresetIdForValuesV1
} from "../../src/catalogs/capture-fx-particle-presets-v1.js";
import {
  CAPTURE_FX_STARTER_PROFILES_V1
} from "../../src/catalogs/capture-fx-starter-profile-catalog-v1.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

function v5Binding() {
  return {
    id: "skill:fireball",
    version: 5,
    subjectType: "skill",
    subjectId: "fireball",
    visual: {},
    audio: {},
    statusVisuals: {},
    feedback: {
      glow: null,
      impactFlash: null,
      cameraShake: null,
      projectileTrail: {
        color: "#ff6a1f",
        count: 6,
        lengthPx: 46,
        sizePx: 7,
        opacity: 0.8
      },
      impactBurst: {
        color: "#ffd27a",
        count: 10,
        spreadPx: 62,
        sizePx: 8,
        durationMs: 360,
        opacity: 0.9
      }
    }
  };
}

test("SkillPresentationBindingV5 adds bounded particle feedback only", () => {
  const result =
    normalizeSkillPresentationBinding(
      v5Binding()
    );

  assert.equal(result.version, 5);
  assert.deepEqual(
    result.feedback.projectileTrail,
    {
      color: "#ff6a1f",
      count: 6,
      lengthPx: 46,
      sizePx: 7,
      opacity: 0.8
    }
  );
  assert.deepEqual(
    result.feedback.impactBurst,
    {
      color: "#ffd27a",
      count: 10,
      spreadPx: 62,
      sizePx: 8,
      durationMs: 360,
      opacity: 0.9
    }
  );

  const tooMany = v5Binding();
  tooMany.feedback.impactBurst.count = 99;
  assert.throws(
    () =>
      normalizeSkillPresentationBinding(
        tooMany
      ),
    /count/i
  );
});

test("particle presets expose a mobile-bounded simple scale from none to very intense", () => {
  assert.deepEqual(
    CAPTURE_FX_PARTICLE_PRESETS_V1.map(
      (preset) => preset.label
    ),
    [
      "Aucune",
      "Discrète",
      "Visible",
      "Intense",
      "Très intense"
    ]
  );

  const veryIntense =
    CAPTURE_FX_PARTICLE_PRESETS_V1.at(-1);

  assert.equal(
    veryIntense.trail.count <= 10,
    true
  );
  assert.equal(
    veryIntense.burst.count <= 18,
    true
  );
});

test("particle preset application preserves colors and unrelated feedback", () => {
  const applied =
    applyCaptureFxParticlePresetV1({
      presetId: "intense",
      presentation: {
        projectileTrailColor: "#ff6a1f",
        impactBurstColor: "#ffd27a",
        fxGlowStrength: 0.85,
        impactShakeAmplitudePx: 5
      }
    });

  assert.equal(
    applied.projectileTrailColor,
    "#ff6a1f"
  );
  assert.equal(
    applied.impactBurstColor,
    "#ffd27a"
  );
  assert.equal(
    applied.fxGlowStrength,
    0.85
  );
  assert.equal(
    applied.impactShakeAmplitudePx,
    5
  );
  assert.equal(
    applied.projectileTrailCount,
    7
  );
  assert.equal(
    applied.impactBurstCount,
    12
  );
});

test("DOM renderer creates projectile trail particles and an impact burst without gameplay callbacks", () => {
  const appended = [];
  const animations = [];
  const created = [];

  function node() {
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

  const arena = {
    ownerDocument: {
      createElement() {
        const value = node();
        created.push(value);
        return value;
      }
    },
    append(value) {
      appended.push(value);
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

  const feedback = v5Binding().feedback;

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
          cancel() {
            this.cancelled = true;
          }
        };
        animations.push(animation);
        return animation;
      }
    });

  renderer.play({
    type: "projectile",
    skillId: "fireball",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 500
  });

  const projectile =
    appended.find(
      (entry) =>
        entry.dataset.skillFx ===
        "projectile"
    );
  assert.ok(projectile);

  const trailParticles =
    projectile.children.filter(
      (entry) =>
        entry.dataset.skillFx ===
        "projectile-trail-particle"
    );
  assert.equal(
    trailParticles.length,
    6
  );

  renderer.play({
    type: "impact",
    skillId: "fireball",
    targetSlot: "opponent",
    durationMs: 420
  });

  const burst =
    appended.find(
      (entry) =>
        entry.dataset.skillFx ===
        "impact-burst"
    );
  assert.ok(burst);
  assert.equal(
    burst.children.length,
    10
  );
  assert.equal(
    burst.children.every(
      (entry) =>
        entry.dataset.skillFx ===
        "impact-burst-particle"
    ),
    true
  );

  assert.equal(
    animations.some(
      ({ target }) =>
        target.dataset.skillFx ===
        "impact-burst-particle"
    ),
    true
  );
});

test("editor exposes simple particle presence before expert particle values", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    html,
    /data-skill-fx-particle-preset/
  );
  assert.match(
    html,
    /Très intense/
  );
  assert.match(
    html,
    /data-skill-projectile-trail-count/
  );
  assert.match(
    html,
    /data-skill-impact-burst-count/
  );
});


test("showcase FX profiles stay mapped to readable particle levels", () => {
  const levels = Object.fromEntries(
    CAPTURE_FX_STARTER_PROFILES_V1.map(
      (profile) => [
        profile.label,
        captureFxParticlePresetIdForValuesV1(
          profile.presentation
        )
      ]
    )
  );

  assert.deepEqual(levels, {
    "Boule de feu": "intense",
    "Projectile d’eau": "visible",
    "Projectile électrique": "very-intense",
    "Épine naturelle": "visible",
    "Griffe physique": "discreet",
    "Zone de flammes": "intense",
    "Aura de soins": "discreet",
    "Bouclier d’énergie": "none"
  });
});
