import test from "node:test";
import assert from "node:assert/strict";

import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

function snapshot() {
  return {
    distance: "medium",
    fighters: {
      player: {
        id: "player",
        hp: 100,
        maxHp: 100,
        energy: 10,
        chargeTimeEffects: []
      },
      opponent: {
        id: "opponent",
        hp: 100,
        maxHp: 100,
        energy: 10,
        chargeTimeEffects: []
      }
    }
  };
}

test("combat runtime exposes action start without changing action timing", () => {
  const action = Object.freeze({
    actionType: "skill",
    actionId: "fireball",
    actorId: "player",
    targetId: "opponent",
    skill: Object.freeze({
      id: "fireball",
      name: "Boule de feu"
    }),
    preparationMs: 2000,
    travelMs: 700,
    recoveryMs: 300,
    releaseAtMs: 2000,
    impactAtMs: 2700,
    interruptibleDuringPreparation: true
  });

  const started = [];
  const session = {
    advanceMs() {},
    snapshot,
    startSkill() {
      return Object.freeze({
        ok: true,
        outcome: "started",
        action
      });
    }
  };

  const runtime = createCombatRuntime({
    session,
    now: () => 1000,
    onStarted(payload) {
      started.push(payload);
    }
  });

  const result = runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: action.skill
  });

  assert.equal(result.ok, true);
  assert.equal(started.length, 1);
  assert.equal(started[0].action, action);
  assert.equal(started[0].elapsedMs, 0);
  assert.equal(started[0].action.releaseAtMs, 2000);
  assert.equal(started[0].action.impactAtMs, 2700);
  assert.equal(started[0].action.travelMs, 700);

  runtime.dispose();
});
