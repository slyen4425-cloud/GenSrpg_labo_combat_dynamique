import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";
import {
  normalizeSkillPresentationBinding
} from "../../src/contracts/skill-presentation-binding.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

async function text(path) {
  return readFile(
    new URL("../../" + path, import.meta.url),
    "utf8"
  );
}

test("Capture preview template contains no literal \\n text beside creature visuals", async () => {
  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );

  assert.equal(
    html.includes("</span>\\n"),
    false
  );
});

test("projectile clash reuses the configured impact audio exactly once", () => {
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
            finished: Promise.resolve({
              status: "finished"
            })
          };
        },
        cancelProjectileFor() {
          return 1;
        }
      },
      audio: {
        play(plan) {
          audioCalls.push(plan);
          return {
            status: "running",
            stop() {},
            finished: Promise.resolve({
              status: "finished"
            })
          };
        }
      }
    });

  presenter.presentOutcome({
    resolution: {
      ok: true,
      actionType: "skill",
      actorId: "a",
      targetId: "b",
      skillId: "fireball",
      outcome: "clashed",
      events: [
        {
          type: "projectile-clash",
          otherActorId: "b",
          progress: 0.42
        }
      ]
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.deepEqual(
    fxCalls.map((plan) => plan.type),
    ["clash-impact"]
  );
  assert.deepEqual(audioCalls, [
    {
      type: "impact",
      skillId: "fireball",
      actorSlot: "player",
      targetSlot: "opponent"
    }
  ]);
});

test("showcase fireball ships with the active presentation feedback instead of legacy V2", async () => {
  const transfer =
    importCaptureTransferJsonV1(
      await text(
        "data/capture/showcase/fireball.capture-skill-transfer-v1.json"
      )
    );
  const presentation =
    transfer.value.draft.presentation;

  assert.equal(
    presentation.version >= 7,
    true
  );
  assert.equal(
    presentation.feedback.projectileTrail.count > 0,
    true
  );
  assert.equal(
    presentation.feedback.impactBurst.count > 0,
    true
  );
  assert.equal(
    presentation.feedback.aftermathSmoke.count > 0,
    true
  );
  assert.equal(
    presentation.feedback.castBurst.count > 0,
    true
  );
});

test("SkillPresentationBinding V7 owns bounded cast particles and renderer uses them on cast", () => {
  const raw = {
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
        color: "#ffb347",
        count: 6,
        spreadPx: 42,
        sizePx: 7,
        risePx: 28,
        durationMs: 620,
        opacity: 0.8
      }
    }
  };

  const binding =
    normalizeSkillPresentationBinding(raw);

  assert.equal(binding.version, 7);
  assert.deepEqual(
    binding.feedback.castBurst,
    raw.feedback.castBurst
  );

  const appended = [];
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
          remove() {}
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
          left: 60,
          top: 140,
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
      presentationForSkill() {
        return {
          cast: {
            assetId: "cast",
            url: "blob:cast",
            displayScale: 1,
            displayScaleX: 1,
            displayScaleY: 1,
            opacity: 1,
            offsetX: 0,
            offsetY: 0
          },
          castLayer: "front",
          castAnchor: null,
          feedback: raw.feedback
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
    durationMs: 1200
  });

  const castNode =
    appended.find(
      (node) =>
        node.dataset.skillFx ===
        "cast"
    );

  assert.ok(castNode);

  const castParticles =
    castNode.children.filter(
      (node) =>
        node.dataset.skillFx ===
        "cast-burst-particle"
    );

  assert.equal(
    castParticles.length,
    6
  );
  assert.equal(
    castNode.dataset.fxCastBurstCount,
    "6"
  );
  assert.equal(
    animations.some(
      ({ target }) =>
        target.dataset.skillFx ===
        "cast-burst-particle"
    ),
    true
  );
});
