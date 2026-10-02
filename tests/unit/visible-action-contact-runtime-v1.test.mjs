import test from "node:test";
import assert from "node:assert/strict";

import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";

function actionFor({
  form = "contact",
  approachMode = "ground",
  releaseAtMs = 0,
  impactAtMs = 900
} = {}) {
  return Object.freeze({
    actionType: "skill",
    actionId: "skill-action",
    actorId: "player",
    targetId: "opponent",
    skill: Object.freeze({
      id: "generic-skill",
      name: "Generic",
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

function harness(action) {
  let clock = 0;
  const completions = [];
  const resolutions = [];
  const releases = [];

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
        action
      });
    },
    completeAction(input) {
      completions.push(input);
      return Object.freeze({
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
            skillId: input.action.skill.id,
            atMs: input.action.impactAtMs
          })
        ])
      });
    }
  };

  const runtime = createCombatRuntime({
    session,
    now() {
      return clock;
    },
    onRelease(payload) {
      releases.push(payload);
    },
    onResolved(resolution) {
      resolutions.push(resolution);
    }
  });

  return {
    runtime,
    completions,
    resolutions,
    releases,
    setClock(value) {
      clock = value;
    }
  };
}

for (const spec of [
  { form: "projectile", approachMode: "none", label: "projectile" },
  { form: "contact", approachMode: "ground", label: "ground contact" },
  { form: "contact", approachMode: "aerial", label: "aerial contact" },
  { form: "contact", approachMode: "teleport", label: "teleport contact" }
]) {
  test(`generic Runtime contact resolves ${spec.label} at the accepted visible-contact time`, () => {
    const h = harness(actionFor(spec));

    assert.equal(
      h.runtime.startSkill({
        actorId: "player",
        targetId: "opponent",
        skill: { id: "generic-skill" }
      }).ok,
      true
    );
    assert.equal(h.releases.length, 1);

    h.setClock(280);
    const result = h.runtime.reportActionContact({
      actorId: "player",
      targetId: "opponent"
    });

    assert.equal(result.ok, true);
    assert.equal(result.outcome, "contact_resolved");
    assert.equal(result.impactAtMs, 280);
    assert.equal(h.completions.length, 1);
    assert.equal(h.completions[0].action.impactAtMs, 280);
    assert.equal(h.completions[0].action.travelMs, 280);
    assert.equal(h.resolutions.length, 1);
    assert.equal(h.runtime.hasActiveActionFor("player"), false);

    h.runtime.dispose();
  });
}

test("generic Runtime contact refuses wrong target and pre-release contact", () => {
  {
    const h = harness(actionFor());
    h.runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: { id: "generic-skill" }
    });
    h.setClock(100);
    const result = h.runtime.reportActionContact({
      actorId: "player",
      targetId: "player"
    });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "target_mismatch");
    assert.equal(h.completions.length, 0);
    h.runtime.dispose();
  }

  {
    const h = harness(actionFor({
      releaseAtMs: 300,
      impactAtMs: 900
    }));
    h.runtime.startSkill({
      actorId: "player",
      targetId: "opponent",
      skill: { id: "generic-skill" }
    });
    h.setClock(100);
    const result = h.runtime.reportActionContact({
      actorId: "player",
      targetId: "opponent"
    });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "not_released");
    assert.equal(h.completions.length, 0);
    h.runtime.dispose();
  }
});

test("projectile-specific Runtime contact entry is retired", () => {
  const h = harness(actionFor({ form: "projectile", approachMode: "none" }));
  assert.equal(
    "reportProjectileContact" in h.runtime,
    false
  );
  h.runtime.dispose();
});
