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
  energy = 10
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
  energyCost = 0,
  cooldownMs = 0,
  activationRequirements = undefined,
  category = "offensive",
  form = "contact"
} = {}) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category,
    form,
    element: null,
    approachMode: form === "contact" ? "ground" : "none",
    energyCost,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    activationRequirements,
    effect: {
      damage,
      tags: []
    }
  });
}

test("SkillDefinition owns data-driven activation requirements independently from requiredLevel", () => {
  const ultimate = skill("ultimate", {
    activationRequirements: {
      mode: "all",
      conditions: [
        {
          type: "combat_elapsed_ms",
          threshold: 10000
        },
        {
          type: "damage_taken",
          threshold: 30
        },
        {
          type: "damage_dealt",
          threshold: 50
        },
        {
          type: "hp_at_or_below_pct",
          threshold: 40
        }
      ]
    }
  });

  assert.deepEqual(
    ultimate.activationRequirements,
    {
      mode: "all",
      conditions: [
        {
          type: "combat_elapsed_ms",
          threshold: 10000
        },
        {
          type: "damage_taken",
          threshold: 30
        },
        {
          type: "damage_dealt",
          threshold: 50
        },
        {
          type: "hp_at_or_below_pct",
          threshold: 40
        }
      ]
    }
  );
  assert.equal(
    "requiredLevel" in ultimate,
    false,
    "requiredLevel must remain Capture editor progression ownership"
  );
});

test("activation requirement contract rejects unsupported types and invalid HP percentage", () => {
  assert.throws(
    () =>
      skill("bad-type", {
        activationRequirements: {
          mode: "all",
          conditions: [
            {
              type: "made_up_condition",
              threshold: 1
            }
          ]
        }
      }),
    /activation.*type|unsupported.*condition/i
  );

  assert.throws(
    () =>
      skill("bad-hp", {
        activationRequirements: {
          mode: "all",
          conditions: [
            {
              type: "hp_at_or_below_pct",
              threshold: 101
            }
          ]
        }
      }),
    /100|percentage|hp/i
  );
});

test("time activation uses CombatState elapsedMs and rejects before spending energy or cooldown", () => {
  const ultimate = skill("time-ultimate", {
    damage: 40,
    energyCost: 3,
    cooldownMs: 5000,
    activationRequirements: {
      mode: "all",
      conditions: [
        {
          type: "combat_elapsed_ms",
          threshold: 5000
        }
      ]
    }
  });

  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  const locked = session.startSkill({
    actorId: "a",
    targetId: "b",
    skill: ultimate
  });

  assert.equal(locked.ok, false);
  assert.equal(
    locked.outcome,
    "activation_requirements"
  );
  assert.equal(
    locked.activationRequirements.satisfied,
    false
  );
  assert.equal(
    locked.activationRequirements.conditions[0].current,
    0
  );
  assert.equal(
    session.snapshot().fighters.a.energy,
    10
  );
  assert.equal(
    Object.hasOwn(
      session.snapshot().fighters.a.skillCooldowns,
      ultimate.id
    ),
    false
  );

  session.advanceMs(5000);

  const ready = session.startSkill({
    actorId: "a",
    targetId: "b",
    skill: ultimate
  });

  assert.equal(ready.ok, true);
  assert.equal(ready.outcome, "started");
  assert.equal(
    session.snapshot().fighters.a.energy,
    7
  );
});

test("Combat State counts actual damage dealt and taken exactly once", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });
  const jab = skill("jab", { damage: 30 });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: jab
  });

  assert.equal(result.ok, true);
  assert.equal(
    session.snapshot().fighters.a.damageDealtTotal,
    30
  );
  assert.equal(
    session.snapshot().fighters.a.damageTakenTotal,
    0
  );
  assert.equal(
    session.snapshot().fighters.b.damageDealtTotal,
    0
  );
  assert.equal(
    session.snapshot().fighters.b.damageTakenTotal,
    30
  );

  const overkillSession = createCombatSession({
    fighters: [
      fighter("a"),
      fighter("b", { hp: 10 })
    ]
  });

  overkillSession.useSkill({
    actorId: "a",
    targetId: "b",
    skill: jab
  });

  assert.equal(
    overkillSession.snapshot().fighters.a.damageDealtTotal,
    10,
    "overkill must count actual HP loss only"
  );
  assert.equal(
    overkillSession.snapshot().fighters.b.damageTakenTotal,
    10
  );
});

test("damage and HP activation conditions unlock from authoritative combat metrics", () => {
  const damageTakenUltimate = skill(
    "damage-taken-ultimate",
    {
      energyCost: 1,
      activationRequirements: {
        mode: "all",
        conditions: [
          {
            type: "damage_taken",
            threshold: 25
          },
          {
            type: "hp_at_or_below_pct",
            threshold: 75
          }
        ]
      }
    }
  );
  const jab = skill("enemy-jab", { damage: 30 });

  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  assert.equal(
    session.startSkill({
      actorId: "a",
      targetId: "b",
      skill: damageTakenUltimate
    }).ok,
    false
  );

  session.useSkill({
    actorId: "b",
    targetId: "a",
    skill: jab
  });

  const ready = session.startSkill({
    actorId: "a",
    targetId: "b",
    skill: damageTakenUltimate
  });

  assert.equal(ready.ok, true);
});

test("any-mode activation succeeds when one condition is satisfied", () => {
  const ultimate = skill("any-ultimate", {
    activationRequirements: {
      mode: "any",
      conditions: [
        {
          type: "combat_elapsed_ms",
          threshold: 60000
        },
        {
          type: "damage_dealt",
          threshold: 20
        }
      ]
    }
  });
  const jab = skill("jab", { damage: 20 });

  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  assert.equal(
    session.startSkill({
      actorId: "a",
      targetId: "b",
      skill: ultimate
    }).ok,
    false
  );

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: jab
  });

  const ready = session.startSkill({
    actorId: "a",
    targetId: "b",
    skill: ultimate
  });

  assert.equal(ready.ok, true);
});


test("activation rejection exposes deterministic reason data", () => {
  const ultimate = skill("locked", {
    energyCost: 4,
    cooldownMs: 1000,
    activationRequirements: {
      mode: "all",
      conditions: [
        {
          type: "damage_dealt",
          threshold: 50
        }
      ]
    }
  });
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  const result = session.startSkill({
    actorId: "a",
    targetId: "b",
    skill: ultimate
  });

  assert.equal(
    result.events[0].reason,
    "activation_requirements"
  );
  assert.deepEqual(
    result.activationRequirements.conditions[0],
    {
      type: "damage_dealt",
      threshold: 50,
      current: 0,
      satisfied: false
    }
  );
  assert.equal(
    session.snapshot().fighters.a.energy,
    10
  );
});

test("reflected damage credits the reflector and the damaged attacker exactly once", () => {
  const projectile = skill("projectile", {
    damage: 20,
    form: "projectile"
  });
  const reflect = normalizeSkillDefinition({
    id: "reflect",
    name: "reflect",
    category: "counter",
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
      reflectForms: ["projectile"]
    },
    effect: {
      damage: 0,
      tags: []
    }
  });

  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: projectile,
    reactionSkill: reflect
  });

  assert.equal(result.outcome, "reflected");
  assert.equal(
    session.snapshot().fighters.a.damageTakenTotal,
    20
  );
  assert.equal(
    session.snapshot().fighters.a.damageDealtTotal,
    0
  );
  assert.equal(
    session.snapshot().fighters.b.damageDealtTotal,
    20
  );
  assert.equal(
    session.snapshot().fighters.b.damageTakenTotal,
    0
  );
});

test("reaction skills consume the same activation evaluator before spending energy", () => {
  const incoming = skill("incoming", {
    damage: 20,
    form: "projectile"
  });
  const gatedReflect = normalizeSkillDefinition({
    id: "gated-reflect",
    name: "gated-reflect",
    category: "counter",
    form: "self",
    element: null,
    approachMode: "none",
    energyCost: 3,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 1000,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["self"],
    activationRequirements: {
      mode: "all",
      conditions: [
        {
          type: "damage_taken",
          threshold: 10
        }
      ]
    },
    reaction: {
      reflectForms: ["projectile"]
    },
    effect: {
      damage: 0,
      tags: []
    }
  });

  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });
  const started = session.startSkill({
    actorId: "a",
    targetId: "b",
    skill: incoming
  });

  const reaction = session.reactToSkill({
    action: started.action,
    reactionSkill: gatedReflect,
    elapsedMs: 0
  });

  assert.equal(reaction.ok, false);
  assert.equal(
    reaction.outcome,
    "activation_requirements"
  );
  assert.equal(
    session.snapshot().fighters.b.energy,
    10
  );
  assert.equal(
    Object.hasOwn(
      session.snapshot().fighters.b.skillCooldowns,
      gatedReflect.id
    ),
    false
  );
});

test("combat reset clears runtime activation metrics with the fighter state", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });
  const jab = skill("jab-reset", {
    damage: 20
  });

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: jab
  });
  assert.equal(
    session.snapshot().fighters.a.damageDealtTotal,
    20
  );

  session.reset();

  assert.equal(
    session.snapshot().fighters.a.damageDealtTotal,
    0
  );
  assert.equal(
    session.snapshot().fighters.b.damageTakenTotal,
    0
  );
});
