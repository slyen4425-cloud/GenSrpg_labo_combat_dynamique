import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function fighter(id, hp = 100) {
  return {
    id,
    maxHp: 100,
    initialHp: hp,
    maxEnergy: 10,
    initialEnergy: 10
  };
}

function battleFormat() {
  const teams = {
    a: "local",
    ally: "local",
    b: "enemy",
    enemy2: "enemy"
  };
  return {
    actors: Object.keys(teams).map((actorId) => ({
      actorId
    })),
    teamOf(actorId) {
      return teams[actorId] ?? null;
    }
  };
}

function skill(id, activationRequirements = undefined) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "offensive",
    form: "contact",
    element: null,
    approachMode: "ground",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    activationRequirements,
    effect: {
      damage: 200,
      tags: []
    }
  });
}

test("activation contract accepts ally/enemy defeat counts and kills by self", () => {
  const candidate = skill("gated", {
    mode: "all",
    conditions: [
      { type: "allies_defeated", threshold: 1 },
      { type: "enemies_defeated", threshold: 2 },
      { type: "kills_by_self", threshold: 2 }
    ]
  });

  assert.deepEqual(
    candidate.activationRequirements.conditions.map(
      (entry) => entry.type
    ),
    [
      "allies_defeated",
      "enemies_defeated",
      "kills_by_self"
    ]
  );
});

test("Combat State credits a knockout once to the damage source", () => {
  const session = createCombatSession({
    fighters: [
      fighter("a"),
      fighter("b", 20)
    ]
  });

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: skill("finisher")
  });

  assert.equal(
    session.snapshot().fighters.a.knockoutsTotal,
    1
  );

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: skill("overkill")
  });

  assert.equal(
    session.snapshot().fighters.a.knockoutsTotal,
    1,
    "a fighter already at 0 HP must not be counted twice"
  );
});

test("team defeat and self kill activation conditions read the real battle state", () => {
  const format = battleFormat();
  const session = createCombatSession({
    battleFormat: format,
    fighters: [
      fighter("a"),
      fighter("ally", 20),
      fighter("b", 20),
      fighter("enemy2", 20)
    ]
  });

  const gated = skill("ultimate-gated", {
    mode: "all",
    conditions: [
      { type: "allies_defeated", threshold: 1 },
      { type: "enemies_defeated", threshold: 2 },
      { type: "kills_by_self", threshold: 2 }
    ]
  });

  assert.equal(
    session.startSkill({
      actorId: "a",
      targetId: "b",
      skill: gated
    }).ok,
    false
  );

  session.useSkill({
    actorId: "b",
    targetId: "ally",
    skill: skill("enemy-finisher")
  });
  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: skill("kill-b")
  });
  session.useSkill({
    actorId: "a",
    targetId: "enemy2",
    skill: skill("kill-enemy2")
  });

  const ready = session.startSkill({
    actorId: "a",
    targetId: "b",
    skill: gated
  });

  assert.equal(ready.ok, true);
  assert.equal(
    session.snapshot().fighters.a.knockoutsTotal,
    2
  );
});
