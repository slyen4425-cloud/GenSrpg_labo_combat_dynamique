import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";
import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function projectileHarness() {
  const done = deferred();
  let removed = false;
  let cancelled = false;
  let scheduledFrame = null;

  const projectileNode = {
    className: "",
    dataset: {},
    style: {},
    getBoundingClientRect() {
      return {
        left: 145,
        top: 95,
        width: 10,
        height: 10
      };
    },
    remove() {
      removed = true;
    }
  };

  const arena = {
    ownerDocument: {
      createElement() {
        return projectileNode;
      }
    },
    append() {},
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: 400,
        height: 300
      };
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return {
          left: 40,
          top: 220,
          width: 40,
          height: 40
        };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return {
          left: 130,
          top: 80,
          width: 50,
          height: 50
        };
      }
    }
  };

  const targetAnchors = {
    player: anchors.player,
    opponent: {
      getBoundingClientRect() {
        return {
          left: 300,
          top: 120,
          width: 40,
          height: 40
        };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    targetAnchors,
    animate() {
      return {
        finished: done.promise,
        cancel() {
          cancelled = true;
        }
      };
    },
    requestFrame(callback) {
      scheduledFrame = callback;
      return 1;
    },
    cancelFrame() {}
  });

  const handle = renderer.play({
    type: "projectile",
    skillId: "fireball",
    element: "fire",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 700
  });

  return {
    done,
    renderer,
    handle,
    get removed() {
      return removed;
    },
    get cancelled() {
      return cancelled;
    },
    get scheduledFrame() {
      return scheduledFrame;
    }
  };
}

test("projectile visual does not disappear from DOM geometry before semantic impact", () => {
  const h = projectileHarness();

  assert.equal(h.renderer.activeCount, 1);

  if (typeof h.scheduledFrame === "function") {
    h.scheduledFrame();
  }

  assert.equal(
    h.renderer.activeCount,
    1,
    "geometry must not own projectile arrival"
  );
  assert.equal(h.removed, false);
  assert.equal(h.cancelled, false);
});

test("projectile keeps its final filled frame after travel animation until semantic outcome removes it", async () => {
  const h = projectileHarness();

  h.done.resolve();
  assert.deepEqual(
    await h.handle.finished,
    { status: "arrived" }
  );

  assert.equal(
    h.renderer.activeCount,
    1,
    "projectile must remain visible at destination until outcome"
  );
  assert.equal(h.removed, false);

  assert.equal(
    h.renderer.cancelProjectileFor("player"),
    1
  );
  assert.equal(h.renderer.activeCount, 0);
  assert.equal(h.removed, true);
});

test("presentOutcome removes an arrived projectile before presenting hit impact", () => {
  const order = [];
  const presenter = createCombatResolutionPresenter({
    visuals: {
      playEventFor() {
        order.push("hit-motion");
        return Promise.resolve({
          status: "finished"
        });
      },
      cancelFor() {}
    },
    fx: {
      cancelProjectileFor(slot) {
        order.push("remove-projectile:" + slot);
        return 1;
      },
      play(plan) {
        order.push("fx:" + plan.type);
        return { status: "ignored" };
      }
    }
  });

  presenter.presentOutcome({
    resolution: {
      ok: true,
      actionType: "skill",
      actorId: "player",
      targetId: "opponent",
      skillId: "fireball",
      outcome: "hit",
      events: [
        {
          type: "skill-release",
          skillId: "fireball",
          form: "projectile",
          atMs: 2000
        },
        {
          type: "skill-arrive",
          skillId: "fireball",
          atMs: 2700
        },
        {
          type: "hit",
          actorId: "opponent",
          hpBefore: 100,
          hpAfter: 70
        }
      ]
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.deepEqual(
    order.slice(0, 2),
    [
      "remove-projectile:player",
      "fx:impact"
    ]
  );
});

test("projectile clash still removes the projectile immediately", () => {
  const cancelled = [];
  const presenter = createCombatResolutionPresenter({
    visuals: {
      playEventFor() {
        return Promise.resolve({
          status: "finished"
        });
      },
      cancelFor() {}
    },
    fx: {
      cancelProjectileFor(slot) {
        cancelled.push(slot);
        return 1;
      },
      play() {
        return { status: "ignored" };
      }
    }
  });

  presenter.presentOutcome({
    resolution: {
      ok: true,
      actionType: "skill",
      actorId: "player",
      targetId: "opponent",
      skillId: "fireball",
      outcome: "clashed",
      events: [
        {
          type: "projectile-clash",
          otherActorId: "opponent",
          progress: 0.5
        }
      ]
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.deepEqual(cancelled, ["player"]);
});


test("interrupted action presentation explicitly clears any released projectile", async () => {
  const cancelled = [];
  const presenter = createCombatResolutionPresenter({
    visuals: {
      playEventFor() {
        return Promise.resolve({
          status: "finished"
        });
      },
      cancelFor() {}
    },
    fx: {
      cancelProjectileFor(slot) {
        cancelled.push(slot);
        return 1;
      },
      play() {
        return { status: "ignored" };
      }
    }
  });

  assert.equal(
    presenter.cancelActionPresentation("player"),
    true
  );
  assert.deepEqual(cancelled, ["player"]);

  const [coopSource, duelSource] =
    await Promise.all([
      readFile(
        new URL(
          "../../src/ui/combat-2v2-test-ui.js",
          import.meta.url
        ),
        "utf8"
      ),
      readFile(
        new URL(
          "../../src/ui/combat-test-ui.js",
          import.meta.url
        ),
        "utf8"
      )
    ]);

  assert.match(
    coopSource,
    /onInterrupted[\s\S]*cancelActionPresentation/
  );
  assert.match(
    duelSource,
    /onInterrupted[\s\S]*cancelActionPresentation/
  );
});
