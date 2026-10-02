import test from "node:test";
import assert from "node:assert/strict";

import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";

function state() {
  return {
    elapsedMs: 0,
    distance: "medium",
    persistentZones: [],
    fighters: {
      player: {
        id: "player",
        hp: 100,
        maxHp: 100,
        energy: 10,
        maxEnergy: 10,
        energyChargeProgressMs: 0,
        chargeTimeEffects: [],
        skillCooldowns: {},
        statusEffects: []
      },
      opponent: {
        id: "opponent",
        hp: 100,
        maxHp: 100,
        energy: 10,
        maxEnergy: 10,
        energyChargeProgressMs: 0,
        chargeTimeEffects: [],
        skillCooldowns: {},
        statusEffects: []
      }
    }
  };
}

function makeAction({
  recoveryMs = 300,
  preparationMs = 100,
  travelMs = 100,
  form = "area",
  approachMode = "none"
} = {}) {
  return Object.freeze({
    actionType: "skill",
    actionId: "test-skill",
    actorId: "player",
    targetId: "opponent",
    skill: Object.freeze({
      id: "test-skill",
      name: "Test",
      form,
      approachMode
    }),
    preparationMs,
    travelMs,
    recoveryMs,
    releaseAtMs: preparationMs,
    impactAtMs: preparationMs + travelMs,
    interruptibleDuringPreparation: true
  });
}

function harness(action) {
  let clock = 0;
  let scheduled = null;
  let currentState = state();
  const resolutions = [];
  const progress = [];
  const completions = [];

  const session = {
    advanceMs(deltaMs) {
      currentState = {
        ...currentState,
        elapsedMs:
          Number(currentState.elapsedMs ?? 0) +
          Number(deltaMs)
      };
      return currentState;
    },
    snapshot() {
      return currentState;
    },
    startSkill() {
      return Object.freeze({
        ok: true,
        outcome: "started",
        action
      });
    },
    startCommand() {
      return Object.freeze({
        ok: true,
        outcome: "started",
        action
      });
    },
    completeAction({ action: effectiveAction }) {
      completions.push(effectiveAction);
      const resolutionAt =
        effectiveAction.impactAtMs;
      const resolution = Object.freeze({
        ok: true,
        actionType: "skill",
        actorId: effectiveAction.actorId,
        targetId: effectiveAction.targetId,
        skillId: effectiveAction.actionId,
        outcome: "hit",
        state: currentState,
        events: Object.freeze([
          Object.freeze({
            type: "skill-arrive",
            atMs: resolutionAt
          }),
          Object.freeze({
            type: "skill-recovery-complete",
            actorId: effectiveAction.actorId,
            skillId: effectiveAction.actionId,
            atMs:
              resolutionAt +
              effectiveAction.recoveryMs
          })
        ])
      });
      resolutions.push(resolution);
      return resolution;
    }
  };

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now() {
      return clock;
    },
    setTimer(callback) {
      scheduled = callback;
      return 1;
    },
    clearTimer() {},
    onProgress(value) {
      progress.push(value);
    }
  });

  runtime.start();

  function tickAt(value) {
    clock = value;
    assert.equal(
      typeof scheduled,
      "function",
      "runtime tick must be scheduled"
    );
    const callback = scheduled;
    scheduled = null;
    callback();
  }

  return {
    runtime,
    progress,
    resolutions,
    completions,
    tickAt,
    setClock(value) {
      clock = value;
    }
  };
}

test("recovery keeps the same action lifecycle occupied after impact and blocks a new action", () => {
  const action = makeAction({
    recoveryMs: 300
  });
  const h = harness(action);

  assert.equal(
    h.runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: action.skill
    }).ok,
    true
  );

  h.tickAt(200);

  assert.equal(
    h.completions.length,
    1,
    "impact must resolve on time"
  );
  assert.equal(
    h.runtime.hasActiveActionFor("player"),
    true,
    "actor must remain owned by the same action during recovery"
  );
  assert.equal(
    h.progress.at(-1)?.phase,
    "recovery"
  );

  const retry =
    h.runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: action.skill
    });
  assert.equal(retry.ok, false);
  assert.equal(retry.outcome, "recovering");

  h.tickAt(499);
  assert.equal(
    h.runtime.hasActiveActionFor("player"),
    true
  );

  h.tickAt(500);
  assert.equal(
    h.runtime.hasActiveActionFor("player"),
    false
  );

  assert.equal(
    h.runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: action.skill
    }).ok,
    true,
    "actor must be available again exactly after recovery"
  );

  h.runtime.dispose();
});

test("zero recovery preserves immediate release after impact", () => {
  const action = makeAction({
    recoveryMs: 0
  });
  const h = harness(action);

  h.runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: action.skill
  });
  h.tickAt(200);

  assert.equal(h.completions.length, 1);
  assert.equal(
    h.runtime.hasActiveActionFor("player"),
    false
  );
  assert.equal(
    h.progress.at(-1)?.phase,
    "idle"
  );

  h.runtime.dispose();
});

test("visible contact starts recovery from the real observed impact time", () => {
  const action = makeAction({
    preparationMs: 0,
    travelMs: 1000,
    recoveryMs: 300,
    form: "projectile"
  });
  const h = harness(action);

  h.runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: action.skill
  });

  h.setClock(320);
  const contact =
    h.runtime.reportActionContact({
      actorId: "player",
      targetId: "opponent",
      skillId: "test-skill"
    });

  assert.equal(contact.ok, true);
  assert.equal(contact.impactAtMs, 320);
  assert.equal(h.completions.length, 1);
  assert.equal(
    h.completions[0].impactAtMs,
    320
  );
  assert.equal(
    h.runtime.hasActiveActionFor("player"),
    true
  );

  h.tickAt(619);
  assert.equal(
    h.runtime.hasActiveActionFor("player"),
    true
  );

  h.tickAt(620);
  assert.equal(
    h.runtime.hasActiveActionFor("player"),
    false
  );

  h.runtime.dispose();
});

test("recovery records are not reaction or visible-contact candidates after impact", () => {
  const action = makeAction({
    preparationMs: 0,
    travelMs: 100,
    recoveryMs: 300,
    form: "projectile"
  });
  const h = harness(action);

  h.runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: action.skill
  });
  h.tickAt(100);

  assert.equal(
    h.runtime.hasActiveActionFor("player"),
    true
  );

  const repeatedContact =
    h.runtime.reportActionContact({
      actorId: "player",
      targetId: "opponent",
      skillId: "test-skill"
    });
  assert.equal(repeatedContact.ok, false);
  assert.equal(
    repeatedContact.outcome,
    "already_resolved"
  );

  h.runtime.dispose();
});
