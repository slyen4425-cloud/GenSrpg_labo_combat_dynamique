import test from "node:test";
import assert from "node:assert/strict";

import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";

function fakeResolution(outcome, atMs = 250) {
  return {
    ok: true,
    outcome,
    events: [
      { type: "skill-start", atMs: 0 },
      { type: "skill-arrive", atMs }
    ]
  };
}

function createHarness() {
  const calls = [];
  const queue = [];
  let nextId = 1;

  const visuals = {
    playEventFor(slot, event) {
      calls.push(["play", slot, event]);
      return Promise.resolve({ status: "finished" });
    },
    cancelFor(slot) {
      calls.push(["cancel", slot]);
    }
  };

  const presenter = createCombatResolutionPresenter({
    visuals,
    setTimer(callback, delayMs) {
      const item = { id: nextId++, callback, delayMs };
      queue.push(item);
      return item.id;
    },
    clearTimer(id) {
      const index = queue.findIndex((item) => item.id === id);
      if (index >= 0) queue.splice(index, 1);
    }
  });

  return {
    calls,
    queue,
    presenter,
    fireNext() {
      const item = queue.shift();
      item?.callback();
      return item;
    }
  };
}

test("presenter starts attacker animation immediately", () => {
  const h = createHarness();

  const result = h.presenter.present({
    resolution: fakeResolution("hit", 600)
  });

  assert.equal(result.status, "scheduled");
  assert.equal(result.impactAtMs, 600);
  assert.deepEqual(h.calls[0], ["play", "player", "attack"]);
  assert.equal(h.queue[0].delayMs, 600);
});

test("counter cancels the attacker before presenting retaliation", async () => {
  const h = createHarness();

  h.presenter.present({
    resolution: fakeResolution("countered", 250)
  });

  h.fireNext();
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(h.calls.slice(0, 3), [
    ["play", "player", "attack"],
    ["cancel", "player"],
    ["play", "opponent", "attack"]
  ]);
});

test("reflection hits the original attacker while immunity cancels without hit", () => {
  const reflected = createHarness();
  reflected.presenter.present({
    resolution: fakeResolution("reflected", 100)
  });
  reflected.fireNext();

  assert.deepEqual(reflected.calls, [
    ["play", "player", "attack"],
    ["cancel", "player"],
    ["play", "player", "hit"]
  ]);

  const immune = createHarness();
  immune.presenter.present({
    resolution: fakeResolution("immune", 100)
  });
  immune.fireNext();

  assert.deepEqual(immune.calls, [
    ["play", "player", "attack"],
    ["cancel", "player"]
  ]);
});

test("dispose clears pending presentation timers", () => {
  const h = createHarness();
  h.presenter.present({
    resolution: fakeResolution("hit", 500)
  });

  assert.equal(h.presenter.pendingCount, 1);
  h.presenter.dispose();
  assert.equal(h.presenter.pendingCount, 0);
  assert.equal(h.queue.length, 0);
});
