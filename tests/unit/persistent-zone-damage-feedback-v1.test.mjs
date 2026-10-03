import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";
import {
  createDomDamageFeedbackRenderer
} from "../../src/adapters/renderer/dom-damage-feedback.js";

function fakeElement(rect) {
  return {
    className: "",
    dataset: {},
    style: {},
    textContent: "",
    children: [],
    ownerDocument: null,
    append(child) {
      this.children.push(child);
    },
    remove() {
      this.removed = true;
    },
    getBoundingClientRect() {
      return rect;
    }
  };
}

test("damage number follows the live motion anchor, not the stable slot", async () => {
  const arena = fakeElement({
    left: 0,
    top: 0,
    width: 500,
    height: 300
  });
  const liveMotion = fakeElement({
    left: 300,
    top: 80,
    width: 80,
    height: 80
  });
  const stableSlot = fakeElement({
    left: 40,
    top: 80,
    width: 80,
    height: 80
  });

  arena.ownerDocument = {
    createElement() {
      const node = fakeElement({
        left: 0,
        top: 0,
        width: 0,
        height: 0
      });
      node.ownerDocument = arena.ownerDocument;
      return node;
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors: { enemy: liveMotion },
    targetAnchors: { enemy: stableSlot },
    presentationForSkill() {
      return null;
    },
    animate() {
      return {
        finished: Promise.resolve(),
        cancel() {}
      };
    },
    requestFrame() {
      return null;
    },
    cancelFrame() {}
  });

  const handle = renderer.play({
    type: "damage",
    targetSlot: "enemy",
    amount: 5,
    durationMs: 700
  });

  assert.equal(handle.status, "running");
  assert.equal(
    arena.children[0].style.left,
    "340px",
    "damage number must be centered on the live moving model"
  );
  assert.equal(
    arena.children[0].style.top,
    "120px"
  );
  await handle.finished;
  renderer.dispose();
});

test("damage flash animates only the image so attack/movement animation remains owned by motion renderer", async () => {
  const imageAnimations = [];
  let motionAnimateCalls = 0;

  const firstAnimation = {
    cancelled: false,
    finished: Promise.resolve(),
    cancel() {
      this.cancelled = true;
    }
  };

  const image = {
    animate(keyframes, options) {
      imageAnimations.push({
        keyframes,
        options
      });
      return firstAnimation;
    }
  };

  const motion = {
    animate() {
      motionAnimateCalls += 1;
      throw new Error(
        "damage flash must never animate the motion container"
      );
    }
  };

  const renderer = createDomDamageFeedbackRenderer({
    targetFor(actorId) {
      assert.equal(actorId, "enemy");
      return { image, motion };
    }
  });

  const handle = renderer.flash("enemy");

  assert.equal(handle.status, "running");
  assert.equal(imageAnimations.length, 1);
  assert.equal(motionAnimateCalls, 0);
  assert.equal(
    imageAnimations[0].options.duration,
    280
  );
  assert.deepEqual(
    imageAnimations[0].keyframes.map(
      (frame) => frame.opacity
    ),
    [1, 0.32, 1, 0.45, 1]
  );

  await handle.finished;
  renderer.dispose();
});

test("1v1 and 2v2 use the same health delta to show number and non-blocking flash", async () => {
  for (const relative of [
    "src/ui/combat-test-ui.js",
    "src/ui/combat-2v2-test-ui.js"
  ]) {
    const source = await readFile(
      new URL(
        "../../" + relative,
        import.meta.url
      ),
      "utf8"
    );

    assert.match(
      source,
      /createDomDamageFeedbackRenderer/
    );
    assert.match(
      source,
      /onHealthDelta\(feedback\)[\s\S]*fx\.play\([\s\S]*type:\s*"damage"/
    );
    assert.match(
      source,
      /onHealthDelta\(feedback\)[\s\S]*damageFeedback\.flash\(\s*feedback\.actorId\s*\)/
    );
  }
});
