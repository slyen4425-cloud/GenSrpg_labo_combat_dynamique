import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function fighter(id, {
  hp = 100,
  energy = 5
} = {}) {
  return {
    id,
    maxHp: 100,
    initialHp: hp,
    maxEnergy: 10,
    initialEnergy: energy
  };
}

function skill(id, {
  damage = 0,
  heal = 0,
  energyCost = 0,
  effects = [],
  form = "contact"
} = {}) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: damage > 0 ? "offensive" : "heal",
    form,
    element: null,
    approachMode:
      form === "contact" ? "ground" : "none",
    energyCost,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 1000,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy", "ally", "self"],
    effect: {
      damage,
      heal,
      tags: []
    },
    effects
  });
}

test("SkillDefinition transports normalized SkillEffectV1 effects", () => {
  const value = skill("heal-skill", {
    effects: [
      {
        kind: "heal",
        targetScope: "target",
        amount: 15
      },
      {
        kind: "energy_restore",
        targetScope: "self",
        amount: 2
      }
    ]
  });

  assert.deepEqual(value.effects, [
    {
      kind: "heal",
      targetScope: "target",
      amount: 15
    },
    {
      kind: "energy_restore",
      targetScope: "self",
      amount: 2
    }
  ]);
  assert.equal(Object.isFrozen(value.effects), true);
});

test("SkillDefinition refuses duplicate heal authority between legacy effect and tactical effects", () => {
  assert.throws(
    () =>
      skill("duplicate-heal", {
        heal: 5,
        effects: [
          {
            kind: "heal",
            targetScope: "target",
            amount: 5
          }
        ]
      }),
    /heal.*authority|duplicate.*heal/i
  );
});

test("target heal applies at real impact and clamps to max HP", () => {
  const heal = skill("heal-target", {
    energyCost: 1,
    effects: [
      {
        kind: "heal",
        targetScope: "target",
        amount: 70
      }
    ]
  });
  const session = createCombatSession({
    fighters: [
      fighter("a", { hp: 100, energy: 5 }),
      fighter("b", { hp: 40, energy: 5 })
    ]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: heal
  });

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "hit");
  assert.equal(
    session.snapshot().fighters.b.hp,
    100
  );
  assert.equal(
    session.snapshot().fighters.a.energy,
    4
  );

  const event = result.events.find(
    (item) => item.type === "heal"
  );
  assert.deepEqual(
    {
      actorId: event.actorId,
      sourceActorId: event.sourceActorId,
      requested: event.requested,
      applied: event.applied
    },
    {
      actorId: "b",
      sourceActorId: "a",
      requested: 70,
      applied: 60
    }
  );
});

test("self heal composes with a real damaging hit for explicit lifesteal-style skills", () => {
  const lifesteal = skill("lifesteal", {
    damage: 30,
    effects: [
      {
        kind: "heal",
        targetScope: "self",
        amount: 10
      }
    ]
  });
  const session = createCombatSession({
    fighters: [
      fighter("a", { hp: 50 }),
      fighter("b", { hp: 100 })
    ]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: lifesteal
  });

  assert.equal(result.outcome, "hit");
  assert.equal(
    session.snapshot().fighters.b.hp,
    70
  );
  assert.equal(
    session.snapshot().fighters.a.hp,
    60
  );
});

test("energy restore and drain use Combat State bounds", () => {
  const energySkill = skill("energy-shift", {
    effects: [
      {
        kind: "energy_restore",
        targetScope: "self",
        amount: 20
      },
      {
        kind: "energy_drain",
        targetScope: "target",
        amount: 20
      }
    ]
  });

  const session = createCombatSession({
    fighters: [
      fighter("a", { energy: 3 }),
      fighter("b", { energy: 4 })
    ]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: energySkill
  });

  assert.equal(result.ok, true);
  assert.equal(
    session.snapshot().fighters.a.energy,
    10
  );
  assert.equal(
    session.snapshot().fighters.b.energy,
    0
  );

  assert.equal(
    result.events.some(
      (item) =>
        item.type === "energy-restored" &&
        item.applied === 7
    ),
    true
  );
  assert.equal(
    result.events.some(
      (item) =>
        item.type === "energy-drained" &&
        item.applied === 4
    ),
    true
  );
});

test("multi-target tactical effects without BattleFormat are rejected before energy and cooldown are spent", () => {
  const candidate = skill("area-heal", {
    energyCost: 2,
    effects: [
      {
        kind: "heal",
        targetScope: "all_allies",
        amount: 10
      }
    ]
  });

  const session = createCombatSession({
    fighters: [
      fighter("a", { energy: 5 }),
      fighter("b", { energy: 5 })
    ]
  });

  const result = session.startSkill({
    actorId: "a",
    targetId: "b",
    skill: candidate
  });

  assert.equal(result.ok, false);
  assert.equal(
    result.outcome,
    "unsupported_tactical_effect"
  );
  assert.equal(
    session.snapshot().fighters.a.energy,
    5
  );
  assert.equal(
    Object.hasOwn(
      session.snapshot().fighters.a.skillCooldowns,
      candidate.id
    ),
    false
  );
});

test("evaded attack does not apply self tactical heal", () => {
  const attack = skill("attack-heal", {
    damage: 20,
    form: "contact",
    effects: [
      {
        kind: "heal",
        targetScope: "self",
        amount: 10
      }
    ]
  });
  const dodge = normalizeSkillDefinition({
    id: "dodge-test",
    name: "dodge-test",
    category: "defensive",
    form: "self",
    element: null,
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["self"],
    reaction: {
      evadeForms: ["contact"]
    },
    effect: {
      damage: 0,
      heal: 0,
      tags: []
    }
  });

  const session = createCombatSession({
    fighters: [
      fighter("a", { hp: 50 }),
      fighter("b")
    ]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: attack,
    reactionSkill: dodge
  });

  assert.equal(result.outcome, "evaded");
  assert.equal(
    session.snapshot().fighters.a.hp,
    50
  );
  assert.equal(
    result.events.some(
      (item) => item.type === "heal"
    ),
    false
  );
});
