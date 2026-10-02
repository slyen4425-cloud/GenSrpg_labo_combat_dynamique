import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";

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


function realFighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 10,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  };
}

for (const [label, file] of [
  ["ground", "../../data/combat/skills/claw.skill.json"],
  ["aerial", "../../data/combat/skills/aerial-dive.skill.json"],
  ["teleport", "../../data/combat/skills/teleport-strike.skill.json"]
]) {
  test(`real ${label} contact skill applies damage at accepted visible contact timestamp`, async () => {
    const raw = JSON.parse(
      await readFile(
        new URL(file, import.meta.url),
        "utf8"
      )
    );
    const skill = normalizeSkillDefinition(raw);
    const session = createCombatSession({
      distance: "medium",
      fighters: [
        realFighter("player"),
        realFighter("opponent")
      ]
    });

    let clock = 0;
    const resolutions = [];
    const runtime = createCombatRuntime({
      session,
      now() {
        return clock;
      },
      onResolved(resolution) {
        resolutions.push(resolution);
      }
    });

    assert.equal(
      runtime.startSkill({
        actorId: "player",
        targetId: "opponent",
        skill
      }).ok,
      true
    );

    const contactAt =
      skill.preparationMs +
      Math.max(1, Math.floor(skill.travelMs / 2));
    clock = contactAt;

    assert.equal(
      session.snapshot().fighters.opponent.hp,
      100,
      "damage must not be applied before visible contact"
    );

    const result = runtime.reportActionContact({
      actorId: "player",
      targetId: "opponent",
      skillId: skill.id
    });

    assert.equal(result.ok, true);
    assert.equal(result.impactAtMs, contactAt);
    assert.equal(resolutions.length, 1);
    assert.ok(
      session.snapshot().fighters.opponent.hp < 100,
      "accepted visible contact must apply real damage immediately"
    );

    const arrive = resolutions[0].events.find(
      (event) => event.type === "skill-arrive"
    );
    const hit = resolutions[0].events.find(
      (event) => event.type === "hit"
    );

    assert.equal(arrive?.atMs, contactAt);
    assert.equal(hit?.atMs, contactAt);
    runtime.dispose();
  });
}

test("stale visual contact from a previous skill cannot resolve a newer active skill", () => {
  const h = harness(
    action({
      form: "contact",
      approachMode: "ground",
      skillId: "new-skill"
    })
  );
  h.setClock(320);

  const result = h.runtime.reportActionContact({
    actorId: "player",
    targetId: "opponent",
    skillId: "old-skill"
  });

  assert.equal(result.ok, false);
  assert.equal(result.outcome, "skill_mismatch");
  assert.equal(h.completions.length, 0);
  assert.equal(h.runtime.hasActiveActionFor("player"), true);
  h.runtime.dispose();
});
