import test from "node:test";
import assert from "node:assert/strict";

import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

function rect({ left, top = 100, width = 10, height = 10 }) {
  return { left, top, width, height };
}

function precisionHarness({
  projectileStart,
  targetStart,
  projectileNext,
  targetNext
}) {
  let frameCallback = null;
  let projectileRect = { ...projectileStart };
  let targetRect = { ...targetStart };
  const contacts = [];

  const projectileNode = {
    className: "",
    dataset: {},
    style: {},
    append() {},
    remove() {},
    getBoundingClientRect() {
      return { ...projectileRect };
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
      return rect({ left: 0, top: 0, width: 400, height: 300 });
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return rect({ left: 30, top: 210, width: 40, height: 40 });
      }
    },
    opponent: {
      getBoundingClientRect() {
        return { ...targetRect };
      }
    }
  };

  const targetAnchors = {
    player: anchors.player,
    opponent: {
      getBoundingClientRect() {
        return rect({ left: 300, top: 120, width: 40, height: 40 });
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    targetAnchors,
    animate() {
      return {
        finished: new Promise(() => {}),
        cancel() {}
      };
    },
    requestFrame(callback) {
      frameCallback = callback;
      return 1;
    },
    cancelFrame() {},
    onProjectileContact(contact) {
      contacts.push(contact);
    }
  });

  renderer.play({
    type: "projectile",
    skillId: "fireball",
    element: "fire",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 700
  });

  projectileRect = { ...projectileNext };
  targetRect = { ...targetNext };

  return {
    renderer,
    contacts,
    runFrame() {
      assert.equal(typeof frameCallback, "function");
      const callback = frameCallback;
      frameCallback = null;
      callback();
    },
    get hasScheduledFrame() {
      return typeof frameCallback === "function";
    }
  };
}

test("continuous projectile sensor catches tunneling across a stationary model between animation frames", () => {
  const h = precisionHarness({
    projectileStart: rect({ left: 80, width: 10 }),
    targetStart: rect({ left: 120, width: 20, height: 30 }),
    projectileNext: rect({ left: 150, width: 10 }),
    targetNext: rect({ left: 120, width: 20, height: 30 })
  });

  h.runFrame();

  assert.deepEqual(h.contacts, [
    {
      actorId: "player",
      targetId: "opponent",
      skillId: "fireball"
    }
  ]);
  assert.equal(h.renderer.activeCount, 1);
});

test("projectile surface overlap counts as contact even when projectile center is still outside the model", () => {
  const h = precisionHarness({
    projectileStart: rect({ left: 105, width: 10 }),
    targetStart: rect({ left: 120, width: 30, height: 30 }),
    projectileNext: rect({ left: 111, width: 10 }),
    targetNext: rect({ left: 120, width: 30, height: 30 })
  });

  h.runFrame();

  assert.equal(h.contacts.length, 1);
});

test("continuous projectile sensor uses relative motion when projectile and target cross between frames", () => {
  const h = precisionHarness({
    projectileStart: rect({ left: 80, width: 10 }),
    targetStart: rect({ left: 120, width: 20, height: 30 }),
    projectileNext: rect({ left: 120, width: 10 }),
    targetNext: rect({ left: 80, width: 20, height: 30 })
  });

  h.runFrame();

  assert.equal(h.contacts.length, 1);
  assert.equal(
    h.hasScheduledFrame,
    false,
    "contact detection must stop scheduling frames after the first report"
  );
});

test("continuous projectile sensor does not invent contact when moving paths stay separated", () => {
  const h = precisionHarness({
    projectileStart: rect({ left: 80, top: 40, width: 10, height: 10 }),
    targetStart: rect({ left: 120, top: 100, width: 20, height: 30 }),
    projectileNext: rect({ left: 150, top: 40, width: 10, height: 10 }),
    targetNext: rect({ left: 80, top: 100, width: 20, height: 30 })
  });

  h.runFrame();

  assert.equal(h.contacts.length, 0);
  assert.equal(h.hasScheduledFrame, true);
});
