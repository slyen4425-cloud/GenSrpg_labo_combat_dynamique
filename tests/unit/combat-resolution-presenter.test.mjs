import test from "node:test";
import assert from "node:assert/strict";

import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";

function createHarness() {
  const calls = [];
  const fxCalls = [];
  let fxCancelCount = 0;
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
        return {
          status: "running",
          animation: {
            cancel() {
              fxCancelCount += 1;
            }
          },
          finished: new Promise(() => {})
        };
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
    get fxCancelCount() {
      return fxCancelCount;
    },
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

test("preparation cast is presentation-only and is cancelled at real release", () => {
  const h = createHarness();
  const action = {
    actionType: "skill",
    actorId: "player",
    targetId: "opponent",
    preparationMs: 2000,
    travelMs: 700,
    skill: {
      id: "fireball",
      name: "Boule de feu",
      form: "projectile",
      element: "fire",
      approachMode: "none"
    }
  };

  const preparing = h.presenter.presentPreparation({
    action,
    actorSlot: "player"
  });

  assert.equal(preparing.status, "preparing");
  assert.deepEqual(h.fxCalls[0], {
    type: "cast",
    skillId: "fireball",
    actorSlot: "player",
    durationMs: 2000
  });
  assert.equal(h.fxCancelCount, 0);

  h.presenter.presentRelease({
    action,
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(h.fxCancelCount, 1);
  assert.equal(h.fxCalls[1].type, "projectile");
  assert.equal(h.fxCalls[1].durationMs, 700);
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

test("evaded outcome renders miss feedback without playing hit", () => {
  const h = createHarness();

  const result = h.presenter.presentOutcome({
    resolution: {
      ok: true,
      outcome: "evaded",
      events: []
    },
    actorSlot: "opponent",
    targetSlot: "player"
  });

  assert.equal(result.outcome, "evaded");
  assert.deepEqual(h.calls, []);
  assert.deepEqual(h.fxCalls, [
    {
      type: "miss",
      targetSlot: "player",
      durationMs: 650
    }
  ]);
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


test("live release delegates ground aerial and teleport motion to visual controller", () => {
  const ground = createHarness();
  ground.presenter.presentRelease({
    action: {
      travelMs: 1500,
      skill: {
        form: "contact",
        approachMode: "ground",
        element: null
      }
    }
  });

  assert.deepEqual(ground.calls, [
    ["approach", "player", "ground", 1500]
  ]);


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

test("teleport approach phases route presentation FX from the animation plan", () => {
  const fxCalls = [];
  const visuals = {
    playEventFor() {
      return Promise.resolve({ status: "finished" });
    },
    playApproachFor(_slot, _approachMode, options) {
      options.onPhase({
        label: "teleport-vanish",
        phaseDurationMs: 48
      });
      options.onPhase({
        label: "teleport-return-vanish",
        phaseDurationMs: 90
      });
      return Promise.resolve({ status: "finished" });
    },
    cancelFor() {}
  };

  const presenter = createCombatResolutionPresenter({
    visuals,
    fx: {
      play(plan) {
        fxCalls.push(plan);
        return { status: "ignored" };
      }
    }
  });

  presenter.presentRelease({
    action: {
      travelMs: 120,
      skill: {
        id: "teleport-strike",
        form: "contact",
        approachMode: "teleport",
        element: null
      }
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.deepEqual(fxCalls, [
    {
      type: "phase",
      skillId: "teleport-strike",
      actorSlot: "player",
      phase: "teleport-vanish",
      durationMs: 48
    },
    {
      type: "phase",
      skillId: "teleport-strike",
      actorSlot: "player",
      phase: "teleport-return-vanish",
      durationMs: 90
    }
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
  assert.equal(result.koActorId, "opponent");
  await result.finished;

  assert.deepEqual(h.calls, [
    ["play", "opponent", "hit"],
    ["play", "opponent", "ko"]
  ]);
});


test("live presentation starts cast audio, stops it at release, and plays hit impact", async () => {
  const audioCalls = [];
  const stopped = [];
  const visuals = {
    playEventFor() {
      return Promise.resolve({ status: "finished" });
    },
    playApproachFor() {
      return Promise.resolve({ status: "finished" });
    },
    cancelFor() {}
  };

  const presenter = createCombatResolutionPresenter({
    visuals,
    audio: {
      play(plan) {
        audioCalls.push(plan);
        if (plan.type === "cast") {
          return {
            status: "running",
            stop() {
              stopped.push(plan.skillId);
            },
            finished: new Promise(() => {})
          };
        }
        return {
          status: "running",
          stop() {},
          finished: Promise.resolve({ status: "finished" })
        };
      }
    }
  });

  const action = {
    actionType: "skill",
    actorId: "player",
    targetId: "opponent",
    preparationMs: 900,
    travelMs: 850,
    skill: {
      id: "aerial-dive",
      form: "contact",
      approachMode: "aerial",
      element: null
    }
  };

  presenter.presentPreparation({
    action,
    actorSlot: "player"
  });

  assert.equal(audioCalls[0].type, "cast");
  assert.equal(audioCalls[0].skillId, "aerial-dive");

  presenter.presentRelease({
    action,
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.deepEqual(stopped, ["aerial-dive"]);

  presenter.presentOutcome({
    resolution: {
      ok: true,
      outcome: "hit",
      events: [
        {
          type: "skill-arrive",
          atMs: 850,
          skillId: "aerial-dive"
        },
        {
          type: "hit",
          actorId: "opponent",
          hpBefore: 100,
          hpAfter: 78
        }
      ]
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(
    audioCalls.some(
      (call) =>
        call.type === "impact" &&
        call.skillId === "aerial-dive"
    ),
    true
  );

  presenter.dispose();
});
