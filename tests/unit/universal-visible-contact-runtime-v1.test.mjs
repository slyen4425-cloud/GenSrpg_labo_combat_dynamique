import test from "node:test";
import assert from "node:assert/strict";

import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";

function action({
  form = "projectile",
  approachMode = "none",
  releaseAtMs = 0,
  impactAtMs = 1000,
  skillId = "test-skill"
} = {}) {
  return Object.freeze({
    actionType: "skill",
    actionId: skillId,
    actorId: "player",
    targetId: "opponent",
    skill: Object.freeze({
      id: skillId,
      name: skillId,
      form,
      approachMode
    }),
    preparationMs: releaseAtMs,
    travelMs: impactAtMs - releaseAtMs,
    recoveryMs: 300,
    releaseAtMs,
    impactAtMs,
    interruptibleDuringPreparation: true
  });
}

function harness(nextAction) {
  let clock = 0;
  const completions = [];
  const resolutions = [];

  const state = {
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

  const session = {
    advanceMs() {},
    snapshot() {
      return state;
    },
    startSkill() {
      return Object.freeze({
        ok: true,
        outcome: "started",
        action: nextAction
      });
    },
    completeAction(input) {
      completions.push(input);
      const resolution = Object.freeze({
        ok: true,
        actionType: "skill",
        actorId: input.action.actorId,
        targetId: input.action.targetId,
        skillId: input.action.skill.id,
        outcome: "hit",
        state,
        events: Object.freeze([
          Object.freeze({
            type: "skill-release",
            form: input.action.skill.form,
            atMs: input.action.releaseAtMs
          }),
          Object.freeze({
            type: "skill-arrive",
            atMs: input.action.impactAtMs
          })
        ])
      });
      resolutions.push(resolution);
      return resolution;
    }
  };

  const runtime = createCombatRuntime({
    session,
    now() {
      return clock;
    }
  });

  runtime.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill: { id: nextAction.skill.id }
  });

  return {
    runtime,
    completions,
    resolutions,
    setClock(value) {
      clock = value;
    }
  };
}

for (const [label, form, approachMode] of [
  ["projectile", "projectile", "none"],
  ["ground contact", "contact", "ground"],
  ["aerial contact", "contact", "aerial"],
  ["teleport contact", "contact", "teleport"]
]) {
  test(`Combat Runtime accepts ${label} through one reportActionContact authority`, () => {
    const h = harness(action({ form, approachMode }));
    h.setClock(320);

    const result = h.runtime.reportActionContact({
      actorId: "player",
      targetId: "opponent"
    });

    assert.equal(result.ok, true);
    assert.equal(result.outcome, "contact_resolved");
    assert.equal(result.impactAtMs, 320);
    assert.equal(h.completions.length, 1);
    assert.equal(h.completions[0].action.impactAtMs, 320);
    assert.equal(h.completions[0].action.travelMs, 320);
    assert.equal(h.runtime.hasActiveActionFor("player"), false);
    h.runtime.dispose();
  });
}

test("Combat Runtime rejects non-moving contact and unrelated forms from visual contact reports", () => {
  for (const [form, approachMode] of [
    ["contact", "none"],
    ["area", "none"],
    ["beam", "none"]
  ]) {
    const h = harness(action({ form, approachMode }));
    h.setClock(320);

    const result = h.runtime.reportActionContact({
      actorId: "player",
      targetId: "opponent"
    });

    assert.equal(result.ok, false);
    assert.equal(result.outcome, "contact_not_authoritative");
    assert.equal(h.completions.length, 0);
    h.runtime.dispose();
  }
});

test("Combat Runtime exposes one generic visual-contact authority, not a projectile-specific owner", () => {
  const h = harness(action());

  assert.equal(
    typeof h.runtime.reportActionContact,
    "function"
  );
  assert.equal(
    h.runtime.reportProjectileContact,
    undefined
  );

  h.runtime.dispose();
});
