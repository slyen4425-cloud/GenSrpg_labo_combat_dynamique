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
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

function node() {
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

function harness(feedback) {
  const appended = [];
  const arena = {
    ownerDocument: {
      createElement() {
        return node();
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
          left: 60,
          top: 140,
          width: 40,
          height: 40
        };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return {
          left: 500,
          top: 110,
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
          travel: {
            assetId: "travel",
            url: "blob:travel",
            displayScale: 3,
            opacity: 1
          },
          travelLayer: "front",
          travelSourceAnchor: null,
          impact: {
            assetId: "impact",
            url: "blob:impact",
            displayScale: 2,
            opacity: 1
          },
          impactLayer: "front",
          feedback
        };
      },
      animate(target, keyframes, options) {
        return {
          target,
          keyframes,
          options,
          finished: new Promise(() => {}),
          cancel() {}
        };
      }
    });

  return { renderer, appended };
}

test("SkillPresentationBinding V8 owns a normalized projectile-trail anchor", () => {
  const raw = {
    id: "skill:fireball",
    version: 8,
    subjectType: "skill",
    subjectId: "fireball",
    visual: {},
    audio: {},
    statusVisuals: {},
    feedback: {
      glow: null,
      impactFlash: null,
      cameraShake: null,
      impactBurst: null,
      aftermathSmoke: null,
      castBurst: null,
      projectileTrail: {
        color: "#ff6a1f",
        count: 7,
        lengthPx: 56,
        sizePx: 7,
        opacity: 0.8,
        anchorX: 0.5,
        anchorY: 0.36
      }
    }
  };

  const binding =
    normalizeSkillPresentationBinding(raw);

  assert.equal(binding.version, 8);
  assert.equal(
    binding.feedback.projectileTrail.anchorX,
    0.5
  );
  assert.equal(
    binding.feedback.projectileTrail.anchorY,
    0.36
  );
});

test("projectile trail uses its visual anchor instead of the shell center", () => {
  const feedback = {
    glow: {
      color: "#ff6a1f",
      strength: 0.85,
      radiusPx: 32
    },
    projectileTrail: {
      color: "#ff6a1f",
      count: 3,
      lengthPx: 40,
      sizePx: 7,
      opacity: 0.8,
      anchorX: 0.5,
      anchorY: 0.36
    },
    impactBurst: null,
    aftermathSmoke: null,
    castBurst: null,
    impactFlash: null,
    cameraShake: null
  };

  const { renderer, appended } =
    harness(feedback);

  renderer.play({
    type: "projectile",
    skillId: "fireball",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 600
  });

  const projectile =
    appended.find(
      (entry) =>
        entry.dataset.skillFx ===
        "projectile"
    );
  assert.ok(projectile);

  const trail =
    projectile.children.filter(
      (entry) =>
        entry.dataset.skillFx ===
        "projectile-trail-particle"
    );
  assert.equal(trail.length, 3);
  assert.equal(
    projectile.dataset.fxTrailAnchorY,
    "0.36"
  );
  assert.match(
    trail[0].style.top,
    /^calc\(36%/
  );
});

test("fireball showcase ships a raised trail anchor and clearly visible smoke", async () => {
  const raw = await readFile(
    new URL(
      "../../data/capture/showcase/fireball.capture-skill-transfer-v1.json",
      import.meta.url
    ),
    "utf8"
  );
  const transfer =
    importCaptureTransferJsonV1(raw);
  const presentation =
    transfer.value.draft.presentation;
  const trail =
    presentation.feedback.projectileTrail;
  const smoke =
    presentation.feedback.aftermathSmoke;

  assert.equal(
    presentation.version >= 8,
    true
  );
  assert.equal(
    trail.anchorY < 0.5,
    true
  );
  assert.equal(
    smoke.count >= 6,
    true
  );
  assert.equal(
    smoke.sizePx >= 34,
    true
  );
  assert.equal(
    smoke.durationMs >= 1100,
    true
  );
  assert.equal(
    smoke.opacity >= 0.58,
    true
  );
});

test("aftermath smoke is rendered above the impact sprite so it cannot be hidden on mobile", () => {
  const feedback = {
    glow: null,
    projectileTrail: null,
    impactBurst: null,
    castBurst: null,
    impactFlash: null,
    cameraShake: null,
    aftermathSmoke: {
      color: "#75665f",
      count: 6,
      spreadPx: 56,
      sizePx: 36,
      risePx: 56,
      durationMs: 1200,
      opacity: 0.64
    }
  };

  const { renderer, appended } =
    harness(feedback);

  renderer.play({
    type: "impact",
    skillId: "fireball",
    targetSlot: "opponent",
    durationMs: 420
  });

  const smoke =
    appended.find(
      (entry) =>
        entry.dataset.skillFx ===
        "aftermath-smoke"
    );
  const impact =
    appended.find(
      (entry) =>
        entry.dataset.skillFx ===
        "impact"
    );

  assert.ok(smoke);
  assert.ok(impact);
  assert.equal(
    Number(smoke.style.zIndex) >
      Number(impact.style.zIndex || 10),
    true
  );
  assert.equal(
    smoke.dataset.fxSmokeVisible,
    "true"
  );
});
