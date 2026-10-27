import test from "node:test";
import assert from "node:assert/strict";

import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

function node() {
  return {
    className: "",
    dataset: {},
    style: {},
    children: [],
    append(child) {
      this.children.push(child);
    },
    remove() {},
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: 80,
        height: 80
      };
    }
  };
}

test("projectile renderer honors the contract/editor 8x display scale", () => {
  const animations = [];
  const arena = {
    ownerDocument: {
      createElement() {
        return node();
      }
    },
    append() {},
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: 900,
        height: 600
      };
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return { left: 80, top: 360, width: 80, height: 80 };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return { left: 720, top: 160, width: 80, height: 80 };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    targetAnchors: anchors,
    presentationForSkill() {
      return {
        travelLayer: "front",
        travelSourceAnchor: null,
        travel: {
          assetId: "pack:capture:sprite-fireball-2-projectile-01",
          url: "data:image/png;base64,AA==",
          frameCount: 1,
          displayScale: 8,
          coreAnchor: { x: 0.5, y: 0.5 },
          headingRad: 0
        }
      };
    },
    animate(_element, keyframes, options) {
      animations.push({ keyframes, options });
      return {
        finished: new Promise(() => {}),
        cancel() {}
      };
    }
  });

  renderer.play({
    type: "projectile",
    skillId: "fireball-2",
    element: "fire",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 900
  });

  assert.equal(animations.length, 1);
  assert.match(
    animations[0].keyframes[0].transform,
    /scale\(7\.52\)/,
    "0.94 × 8 must reach the projectile shell"
  );
  assert.match(
    animations[0].keyframes[1].transform,
    /scale\(8\.32\)/,
    "1.04 × 8 must reach the projectile shell"
  );
  assert.match(
    animations[0].keyframes[2].transform,
    /scale\(7\.84\)/,
    "0.98 × 8 must reach the projectile shell"
  );
});
