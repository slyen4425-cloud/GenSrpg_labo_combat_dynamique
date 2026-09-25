import test from "node:test";
import assert from "node:assert/strict";

import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";

function createHarness() {
  const calls = [];
  const fxCalls = [];
  const queue = [];
  let nextId = 1;

  const visuals = {
    playEventFor(slot, event) {
      calls.push(["play", slot, event]);
      return Promise.resolve({ status: "finished" });
    },
    playApproachFor(slot, approachMode, options) {
      calls.push([
        "approach",
        slot,
        approachMode,
        options?.travelMs
      ]);
      return Promise.resolve({ status: "finished" });
    },
    cancelFor(slot) {
      calls.push(["cancel", slot]);
    }
  };

  const presenter = createCombatResolutionPresenter({
    visuals,
    fx: {
      play(plan) {
        fxCalls.push(plan);
        return { status: "running" };
      }
    },
    setTimer(callback, delayMs) {
      const item = { id: nextId++, callback, delayMs };
      queue.push(item);
      queue.sort((a, b) => a.delayMs - b.delayMs);
      return item.id;
    },
    clearTimer(id) {
      const index = queue.findIndex((item) => item.id === id);
      if (index >= 0) queue.splice(index, 1);
    }
  });

  return {
    calls,
    fxCalls,
    queue,
    presenter,
    fireNext() {
      const item = queue.shift();
      item?.callback();
      return item;
    }
  };
}

function resolution(outcome = "hit") {
  return {
    ok: true,
    outcome,
    events: [
      { type: "skill-start", atMs: 0, skillId: "fireball" },
      {
        type: "skill-release",
        atMs: 700,
        skillId: "fireball",
        form: "projectile",
        element: "fire"
      },
      {
        type: "skill-arrive",
        atMs: 1250,
        skillId: "fireball",
        outcome
      }
    ]
  };
}

test("scheduled presenter waits for semantic release before attack animation", () => {
  const h = createHarness();

  const result = h.presenter.present({
    resolution: resolution("hit")
  });

  assert.equal(result.status, "scheduled");
  assert.equal(h.calls.length, 0);
  assert.equal(h.queue[0].delayMs, 700);

  h.fireNext();
  assert.deepEqual(h.calls[0], ["play", "player", "attack"]);
});

test("live release starts attack and projectile without recomputing combat rules", () => {
  const h = createHarness();

  h.presenter.presentRelease({
    action: {
      travelMs: 550,
      skill: {
        form: "projectile",
        element: "fire"
      }
    }
  });

  assert.deepEqual(h.calls, [["play", "player", "attack"]]);
  assert.equal(h.fxCalls.length, 1);
  assert.equal(h.fxCalls[0].type, "projectile");
  assert.equal(h.fxCalls[0].durationMs, 550);
});

test("live outcome reflection and immunity only present resolved result", () => {
  const reflected = createHarness();
  reflected.presenter.presentOutcome({
    resolution: { ok: true, outcome: "reflected" }
  });

  assert.deepEqual(reflected.calls, [
    ["cancel", "player"],
    ["play", "player", "hit"]
  ]);

  const immune = createHarness();
  immune.presenter.presentOutcome({
    resolution: { ok: true, outcome: "immune" }
  });

  assert.deepEqual(immune.calls, [["cancel", "player"]]);
});

test("early counter can resolve without ever presenting attacker release", async () => {
  const h = createHarness();

  h.presenter.present({
    resolution: {
      ok: true,
      outcome: "countered",
      events: [
        { type: "skill-start", atMs: 0, skillId: "claw" },
        { type: "skill-countered", atMs: 400, skillId: "claw" }
      ]
    }
  });

  assert.equal(h.queue.length, 1);
  assert.equal(h.queue[0].delayMs, 400);

  h.fireNext();
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(h.calls.slice(0, 3), [
    ["cancel", "player"],
    ["play", "opponent", "attack"],
    ["play", "player", "hit"]
  ]);
  assert.equal(
    h.calls.some((call) =>
      call[0] === "play" && call[1] === "player" && call[2] === "attack"
    ),
    false
  );
});

test("dispose clears pending presentation timers", () => {
  const h = createHarness();
  h.presenter.present({
    resolution: resolution("hit")
  });

  assert.ok(h.presenter.pendingCount > 0);
  h.presenter.dispose();
  assert.equal(h.presenter.pendingCount, 0);
  assert.equal(h.queue.length, 0);
});


test("special live release delegates aerial and teleport motion to visual controller", () => {
  const teleport = createHarness();
  teleport.presenter.presentRelease({
    action: {
      travelMs: 120,
      skill: {
        form: "contact",
        approachMode: "teleport",
        element: null
      }
    }
  });

  assert.deepEqual(teleport.calls, [
    ["approach", "player", "teleport", 120]
  ]);

  const aerial = createHarness();
  aerial.presenter.presentRelease({
    action: {
      travelMs: 850,
      skill: {
        form: "contact",
        approachMode: "aerial",
        element: null
      }
    }
  });

  assert.deepEqual(aerial.calls, [
    ["approach", "player", "aerial", 850]
  ]);
});

test("KO presentation chains hit then KO and exposes real completion", async () => {
  const h = createHarness();
  const result = h.presenter.presentOutcome({
    resolution: {
      ok: true,
      outcome: "hit",
      events: [
        {
          type: "hit",
          actorId: "opponent",
          hpBefore: 20,
          hpAfter: 0
        }
      ]
    }
  });

  assert.equal(result.ko, true);
  await result.finished;

  assert.deepEqual(h.calls, [
    ["play", "opponent", "hit"],
    ["play", "opponent", "ko"]
  ]);
});


test("ground live release delegates configured travel timing to visual controller", () => {
  const h = createHarness();

  h.presenter.presentRelease({
    action: {
      travelMs: 1500,
      skill: {
        form: "contact",
        approachMode: "ground",
        element: null
      }
    }
  });

  assert.deepEqual(h.calls, [
    ["approach", "player", "ground", 1500]
  ]);
});
