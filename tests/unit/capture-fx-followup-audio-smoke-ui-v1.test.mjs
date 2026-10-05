import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillPresentationBinding
} from "../../src/contracts/skill-presentation-binding.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";
import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";
import {
  applyCaptureFxParticlePresetV1
} from "../../src/catalogs/capture-fx-particle-presets-v1.js";

function v7Binding() {
  return {
    id: "skill:fireball",
    version: 7,
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
      projectileTrail: null,
      impactBurst: null,
      aftermathSmoke: null,
      castBurst: {
        color: "#ff9a3d",
        count: 8,
        spreadPx: 54,
        sizePx: 7,
        durationMs: 520,
        opacity: 0.78
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

test("SkillPresentationBindingV7 adds bounded cast particles as presentation only", () => {
  const result =
    normalizeSkillPresentationBinding(
      v7Binding()
    );

  assert.equal(result.version, 7);
  assert.deepEqual(
    result.feedback.castBurst,
    {
      color: "#ff9a3d",
      count: 8,
      spreadPx: 54,
      sizePx: 7,
      durationMs: 520,
      opacity: 0.78
    }
  );

  const invalid = v7Binding();
  invalid.feedback.castBurst.count = 99;
  assert.throws(
    () =>
      normalizeSkillPresentationBinding(
        invalid
      ),
    /count/i
  );
});

test("simple particle preset also drives cast particles", () => {
  const applied =
    applyCaptureFxParticlePresetV1({
      presetId: "intense",
      presentation: {
        castBurstColor: "#ff9a3d",
        projectileTrailColor: "#ff6a1f",
        impactBurstColor: "#ffd27a",
        aftermathSmokeColor: "#594943"
      }
    });

  assert.equal(
    applied.castBurstCount > 0,
    true
  );
  assert.equal(
    applied.castBurstSpreadPx > 0,
    true
  );
  assert.equal(
    applied.castBurstDurationMs > 0,
    true
  );
});

test("DOM renderer draws cast particles through the existing FX owner", () => {
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
          left: 60,
          top: 120,
          width: 40,
          height: 40
        };
      }
    }
  };

  const renderer =
    createDomSkillFxRenderer({
      arena,
      anchors,
      targetAnchors: anchors,
      presentationForSkill() {
        return {
          cast: {
            assetId: "cast",
            url: "blob:cast",
            frameCount: 1,
            displayScale: 1,
            opacity: 1,
            offsetX: 0,
            offsetY: 0
          },
          castAnchor: null,
          castLayer: "front",
          feedback: v7Binding().feedback
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

  renderer.play({
    type: "cast",
    skillId: "fireball",
    actorSlot: "player",
    durationMs: 1000
  });

  const castBurst =
    appended.find(
      (node) =>
        node.dataset.skillFx ===
        "cast-burst"
    );

  assert.ok(castBurst);
  assert.equal(
    castBurst.children.length,
    8
  );
  assert.equal(
    castBurst.children.every(
      (node) =>
        node.dataset.skillFx ===
        "cast-burst-particle"
    ),
    true
  );
});

test("showcase Fireball ships with smoke, cast particles and its configured impact sound", async () => {
  const json = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/showcase/fireball.capture-skill-transfer-v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );

  const presentation =
    json.draft.presentation;

  assert.equal(
    presentation.version,
    7
  );
  assert.equal(
    presentation.feedback?.castBurst?.count > 0,
    true
  );
  assert.equal(
    presentation.feedback?.projectileTrail?.count > 0,
    true
  );
  assert.equal(
    presentation.feedback?.impactBurst?.count > 0,
    true
  );
  assert.equal(
    presentation.feedback?.aftermathSmoke?.count > 0,
    true
  );
  assert.equal(
    typeof presentation.audio?.impact?.assetId,
    "string"
  );
});

test("Capture preview contains no literal escaped newline beside creature visuals", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    html.includes("</span>\\n"),
    false
  );
  assert.equal(
    html.includes("\\n        <div class=\"fighter__motion\""),
    false
  );
});

test("projectile clash reuses the owning skill impact sound exactly once", () => {
  const audioCalls = [];
  const fxCalls = [];

  const presenter =
    createCombatResolutionPresenter({
      visuals: {
        playEventFor() {
          return Promise.resolve({
            status: "finished"
          });
        },
        cancelFor() {}
      },
      fx: {
        play(plan) {
          fxCalls.push(plan);
          return {
            status: "running",
            finished:
              Promise.resolve({
                status: "finished"
              })
          };
        },
        cancelProjectileFor() {}
      },
      audio: {
        play(plan) {
          audioCalls.push(plan);
          return {
            status: "running",
            finished:
              Promise.resolve({
                status: "finished"
              })
          };
        }
      }
    });

  presenter.presentOutcome({
    resolution: {
      ok: true,
      outcome: "clashed",
      actorId: "local-1",
      skillId: "fireball",
      events: [
        {
          type: "skill-release",
          skillId: "fireball",
          form: "projectile"
        },
        {
          type: "projectile-clash",
          otherActorId: "opponent-1",
          progress: 0.5
        }
      ]
    },
    actorSlot: "local-1",
    targetSlot: "opponent-1"
  });

  assert.equal(
    fxCalls.filter(
      (plan) =>
        plan.type === "clash-impact"
    ).length,
    1
  );

  assert.deepEqual(
    audioCalls.filter(
      (plan) =>
        plan.type === "impact"
    ),
    [
      {
        type: "impact",
        skillId: "fireball",
        actorSlot: "local-1",
        targetSlot: "opponent-1"
      }
    ]
  );

  presenter.dispose();
});
