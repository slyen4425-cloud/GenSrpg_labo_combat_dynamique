import test from "node:test";
import assert from "node:assert/strict";

import { planSkillFx } from "../../src/core/fx/skill-fx-plan.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("projectile FX plan is derived only from resolved semantic events", () => {
  const plans = planSkillFx({
    resolution: {
      ok: true,
      events: [
        {
          type: "skill-release",
          atMs: 700,
          form: "projectile",
          element: "fire"
        },
        {
          type: "skill-arrive",
          atMs: 1250
        }
      ]
    }
  });

  assert.deepEqual(plans, [
    {
      type: "projectile",
      element: "fire",
      fromSlot: "player",
      targetSlot: "opponent",
      delayMs: 700,
      durationMs: 550
    }
  ]);
});

test("non-projectile skills do not invent a projectile FX", () => {
  const plans = planSkillFx({
    resolution: {
      ok: true,
      events: [
        {
          type: "skill-release",
          atMs: 100,
          form: "contact",
          element: null
        },
        {
          type: "skill-arrive",
          atMs: 100
        }
      ]
    }
  });

  assert.deepEqual(plans, []);
});

test("DOM projectile adapter owns and cleans its temporary node", async () => {
  const done = deferred();
  const appended = [];
  let removed = false;
  let capturedKeyframes = null;
  let capturedOptions = null;

  const arena = {
    ownerDocument: {
      createElement() {
        return {
          className: "",
          dataset: {},
          style: {},
          remove() {
            removed = true;
          }
        };
      }
    },
    append(node) {
      appended.push(node);
    },
    getBoundingClientRect() {
      return { left: 10, top: 20, width: 300, height: 200 };
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return { left: 30, top: 100, width: 40, height: 40 };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return { left: 230, top: 60, width: 40, height: 40 };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    animate(_element, keyframes, options) {
      capturedKeyframes = keyframes;
      capturedOptions = options;
      return {
        finished: done.promise,
        cancel() {}
      };
    }
  });

  const handle = renderer.play({
    type: "projectile",
    element: "fire",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 550
  });

  assert.equal(handle.status, "running");
  assert.equal(renderer.activeCount, 1);
  assert.equal(appended.length, 1);
  assert.equal(appended[0].dataset.element, "fire");
  assert.equal(appended[0].style.left, "40px");
  assert.equal(appended[0].style.top, "100px");
  assert.match(capturedKeyframes[1].transform, /translate3d\(200px, -40px, 0\)/);
  assert.equal(capturedOptions.duration, 550);

  done.resolve();
  assert.deepEqual(await handle.finished, { status: "finished" });
  assert.equal(renderer.activeCount, 0);
  assert.equal(removed, true);
});

test("DOM projectile adapter dispose cancels and removes active FX", () => {
  let cancelled = false;
  let removed = false;

  const arena = {
    ownerDocument: {
      createElement() {
        return {
          dataset: {},
          style: {},
          remove() {
            removed = true;
          }
        };
      }
    },
    append() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 300, height: 200 };
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return { left: 0, top: 0, width: 10, height: 10 };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return { left: 100, top: 0, width: 10, height: 10 };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    animate() {
      return {
        finished: new Promise(() => {}),
        cancel() {
          cancelled = true;
        }
      };
    }
  });

  renderer.play({
    type: "projectile",
    element: "fire",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 300
  });

  renderer.dispose();

  assert.equal(cancelled, true);
  assert.equal(removed, true);
  assert.equal(renderer.activeCount, 0);
});
