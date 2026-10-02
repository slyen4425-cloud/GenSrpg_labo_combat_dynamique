import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  combatHealthDeltaEventsV1
} from "../../src/core/combat/combat-health-feedback-v1.js";
import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

function state(hp, elapsedMs = 0) {
  return {
    elapsedMs,
    distance: "medium",
    persistentZones: [],
    fighters: {
      local: {
        id: "local", hp: 100, maxHp: 100,
        energy: 10, maxEnergy: 10,
        energyChargeProgressMs: 0,
        chargeTimeEffects: [],
        skillCooldowns: {},
        statusEffects: []
      },
      enemy: {
        id: "enemy", hp, maxHp: 100,
        energy: 10, maxEnergy: 10,
        energyChargeProgressMs: 0,
        chargeTimeEffects: [],
        skillCooldowns: {},
        statusEffects: []
      }
    }
  };
}

function fakeElement(rect = { left: 0, top: 0, width: 20, height: 20 }) {
  return {
    className: "",
    dataset: {},
    style: {},
    textContent: "",
    children: [],
    ownerDocument: null,
    append(child) { this.children.push(child); },
    remove() { this.removed = true; },
    getBoundingClientRect() { return rect; }
  };
}

test("health feedback reports actual applied HP loss without recomputing damage", () => {
  assert.deepEqual(
    combatHealthDeltaEventsV1(
      state(100, 1000),
      state(87, 1050)
    ),
    [{
      type: "health-delta",
      kind: "damage",
      actorId: "enemy",
      amount: 13,
      delta: -13,
      hpBefore: 100,
      hpAfter: 87,
      atMs: 1050
    }]
  );
});

test("CombatRuntime emits one health delta for any session HP mutation", () => {
  let nowMs = 0;
  let scheduled = null;
  let current = state(100, 0);
  const feedback = [];

  const runtime = createCombatRuntime({
    session: {
      snapshot() { return current; },
      advanceMs(deltaMs) {
        current = state(94, current.elapsedMs + deltaMs);
        return current;
      }
    },
    now() { return nowMs; },
    setTimer(callback) {
      scheduled = callback;
      return 1;
    },
    clearTimer() {},
    onHealthDelta(event) {
      feedback.push(event);
    }
  });

  runtime.start();
  assert.equal(feedback.length, 0);
  nowMs = 50;
  scheduled();
  assert.equal(feedback.length, 1);
  assert.equal(feedback[0].kind, "damage");
  assert.equal(feedback[0].amount, 6);
  runtime.dispose();
});

test("DOM skill FX renders floating damage amount on the actual target", async () => {
  const arena = fakeElement({ left: 0, top: 0, width: 400, height: 300 });
  const target = fakeElement({ left: 280, top: 80, width: 40, height: 40 });
  arena.ownerDocument = {
    createElement() {
      const node = fakeElement();
      node.ownerDocument = arena.ownerDocument;
      return node;
    }
  };
  const animations = [];
  const renderer = createDomSkillFxRenderer({
    arena,
    anchors: { enemy: target },
    targetAnchors: { enemy: target },
    animate(_node, keyframes, options) {
      animations.push({ keyframes, options });
      return { finished: Promise.resolve(), cancel() {} };
    },
    requestFrame() { return null; },
    cancelFrame() {}
  });

  const handle = renderer.play({
    type: "damage",
    targetSlot: "enemy",
    amount: 12,
    durationMs: 700
  });

  assert.equal(handle.status, "running");
  assert.equal(arena.children[0].dataset.skillFx, "damage");
  assert.equal(arena.children[0].textContent, "-12");
  assert.equal(animations[0].options.duration, 700);
  await handle.finished;
});

test("both combat clients consume Runtime health delta without damage math", async () => {
  for (const relative of [
    "src/ui/combat-test-ui.js",
    "src/ui/combat-2v2-test-ui.js"
  ]) {
    const source = await readFile(
      new URL("../../" + relative, import.meta.url),
      "utf8"
    );
    assert.match(source, /onHealthDelta\(feedback\)/);
    assert.match(source, /type:\s*"damage"/);
    assert.match(source, /amount:\s*feedback\.amount/);
    assert.doesNotMatch(
      source,
      /feedback\.amount\s*[*/+-]\s*(?:resistance|damage|bonus)/i
    );
  }
});
