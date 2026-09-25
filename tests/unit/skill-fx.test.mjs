import test from "node:test";
import assert from "node:assert/strict";

import {
  planSkillFx,
  planSkillOutcomeFx,
  planSkillReleaseFx
} from "../../src/core/fx/skill-fx-plan.js";
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

test("evaded outcome plans a local miss feedback only", () => {
  assert.deepEqual(
    planSkillOutcomeFx({
      resolution: { ok: true, outcome: "evaded" },
      targetSlot: "player"
    }),
    [
      {
        type: "miss",
        targetSlot: "player",
        durationMs: 650
      }
    ]
  );

  assert.deepEqual(
    planSkillOutcomeFx({
      resolution: { ok: true, outcome: "hit" },
      targetSlot: "player"
    }),
    []
  );
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

test("DOM projectile source follows live motion but target uses stable slot anchor", async () => {
  const done = deferred();
  let capturedKeyframes = null;

  const arena = {
    ownerDocument: {
      createElement() {
        return {
          className: "",
          dataset: {},
          style: {},
          remove() {}
        };
      }
    },
    append() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 400, height: 300 };
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return { left: 40, top: 220, width: 40, height: 40 };
      }
    },
    opponent: {
      // Simulates a transient aerial motion anchor.
      getBoundingClientRect() {
        return { left: 300, top: 20, width: 40, height: 40 };
      }
    }
  };

  const targetAnchors = {
    player: {
      getBoundingClientRect() {
        return { left: 40, top: 220, width: 40, height: 40 };
      }
    },
    opponent: {
      // Stable combat slot stays on the ground.
      getBoundingClientRect() {
        return { left: 300, top: 120, width: 40, height: 40 };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    targetAnchors,
    animate(_element, keyframes) {
      capturedKeyframes = keyframes;
      return {
        finished: done.promise,
        cancel() {}
      };
    }
  });

  renderer.play({
    type: "projectile",
    element: "fire",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 700
  });

  assert.match(
    capturedKeyframes[1].transform,
    /translate3d\(260px, -100px, 0\)/
  );
  assert.doesNotMatch(
    capturedKeyframes[1].transform,
    /translate3d\(260px, -200px, 0\)/
  );

  done.resolve();
  await Promise.resolve();
});

test("DOM miss feedback renders RATÉ on the stable target point and cleans itself", async () => {
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
          textContent: "",
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
    type: "miss",
    targetSlot: "opponent",
    durationMs: 650
  });

  assert.equal(handle.status, "running");
  assert.equal(renderer.activeCount, 1);
  assert.equal(appended.length, 1);
  assert.equal(appended[0].dataset.skillFx, "miss");
  assert.equal(appended[0].textContent, "RATÉ");
  assert.equal(appended[0].style.left, "240px");
  assert.equal(appended[0].style.top, "60px");
  assert.equal(capturedKeyframes.length, 3);
  assert.equal(capturedOptions.duration, 650);

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


test("live projectile release carries the skill identity for presentation binding", () => {
  assert.deepEqual(
    planSkillReleaseFx({
      action: {
        skill: {
          id: "fireball",
          form: "projectile",
          element: "fire"
        },
        travelMs: 700
      }
    }),
    [
      {
        type: "projectile",
        skillId: "fireball",
        element: "fire",
        fromSlot: "player",
        targetSlot: "opponent",
        delayMs: 0,
        durationMs: 700
      }
    ]
  );
});

test("resolved fireball hit can request a presentation-only impact FX", () => {
  assert.deepEqual(
    planSkillOutcomeFx({
      resolution: {
        ok: true,
        outcome: "hit",
        skillId: "fireball"
      },
      targetSlot: "opponent"
    }),
    [
      {
        type: "impact",
        skillId: "fireball",
        targetSlot: "opponent",
        durationMs: 420
      }
    ]
  );
});

test("DOM projectile adapter anchors the fireball core on the path and orients the sprite", async () => {
  const done = deferred();
  const appended = [];
  let capturedKeyframes = null;
  let capturedOptions = null;

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
      return { left: 0, top: 0, width: 400, height: 300 };
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return { left: 40, top: 220, width: 40, height: 40 };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return { left: 300, top: 120, width: 40, height: 40 };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    presentationForSkill(skillId) {
      assert.equal(skillId, "fireball");
      return {
        travel: {
          assetId: "pack:capture:sprite-fireball-travel-01",
          url: "fireball-atlas.png",
          frameCount: 8,
          coreAnchor: { x: 0.29, y: 0.5 },
          headingRad: Math.PI
        }
      };
    },
    animate(_node, keyframes, options) {
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
    skillId: "fireball",
    element: "fire",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 700
  });

  assert.equal(handle.status, "running");
  assert.equal(appended.length, 1);

  const shell = appended[0];
  assert.match(shell.className, /skill-fx--sprite-shell/);
  assert.equal(
    shell.dataset.assetId,
    "pack:capture:sprite-fireball-travel-01"
  );
  assert.equal(shell.children.length, 1);

  const sprite = shell.children[0];
  assert.match(sprite.className, /skill-fx__sprite/);
  assert.match(sprite.className, /skill-fx--sprite/);
  assert.equal(
    sprite.style.backgroundImage,
    'url("fireball-atlas.png")'
  );
  assert.equal(sprite.style.backgroundSize, "800% 100%");
  assert.equal(sprite.style.left, "21%");
  assert.equal(sprite.style.top, "0%");
  assert.equal(sprite.style.transformOrigin, "29% 50%");

  const rotationMatch = sprite.style.transform.match(
    /rotate\(([-0-9.]+)rad\)/
  );
  assert.ok(rotationMatch);
  const expectedRotation = Math.atan2(-100, 260) - Math.PI;
  assert.ok(
    Math.abs(Number(rotationMatch[1]) - expectedRotation) < 1e-9
  );

  assert.equal(capturedKeyframes.length, 3);
  assert.match(
    capturedKeyframes[2].transform,
    /translate3d\(260px, -100px, 0\)/
  );
  assert.equal(capturedOptions.duration, 700);

  done.resolve();
  assert.deepEqual(await handle.finished, { status: "finished" });
});

test("DOM impact adapter uses the bound fireball impact strip on the target anchor", async () => {
  const done = deferred();
  const appended = [];

  const arena = {
    ownerDocument: {
      createElement() {
        return {
          className: "",
          dataset: {},
          style: {},
          remove() {}
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
    presentationForSkill() {
      return {
        impact: {
          assetId: "pack:capture:sprite-fireball-impact-01",
          url: "fireball-impact.png",
          frameCount: 6
        }
      };
    },
    animate() {
      return {
        finished: done.promise,
        cancel() {}
      };
    }
  });

  const handle = renderer.play({
    type: "impact",
    skillId: "fireball",
    targetSlot: "opponent",
    durationMs: 420
  });

  assert.equal(handle.status, "running");
  assert.equal(appended[0].dataset.skillFx, "impact");
  assert.equal(appended[0].style.left, "240px");
  assert.equal(appended[0].style.top, "60px");
  assert.equal(appended[0].style.backgroundSize, "600% 100%");

  done.resolve();
  assert.deepEqual(await handle.finished, { status: "finished" });
});
