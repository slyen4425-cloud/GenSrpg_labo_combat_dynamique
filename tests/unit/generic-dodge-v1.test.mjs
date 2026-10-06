import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  skillCooldownRemainingMs
} from "../../src/core/combat/combat-state.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: 20,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0
  };
}

function incoming({
  id,
  dodgeable = undefined,
  withStatus = false
}) {
  const input = {
    id,
    name: id,
    category: "offensive",
    form: "projectile",
    element: null,
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 1000,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: [
      "short",
      "medium",
      "long"
    ],
    targetRelations: ["enemy"],
    effect: {
      damage: 10,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    },
    effects: withStatus
      ? [
          {
            kind: "apply_status",
            targetScope: "target",
            status: {
              id: id + "-slow",
              kind: "approach_time_modifier",
              polarity: "detrimental",
              durationMs: 3000,
              stacking: "refresh",
              modifierPct: 50
            }
          }
        ]
      : []
  };

  if (dodgeable !== undefined) {
    input.dodgeable = dodgeable;
  }

  return normalizeSkillDefinition(input);
}

function dodge({
  cooldownMs = 2500
} = {}) {
  return normalizeSkillDefinition({
    id: "generic-dodge",
    name: "Esquive",
    category: "defensive",
    form: "self",
    element: null,
    approachMode: "none",
    energyCost: 2,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs,
    allowedDistances: [
      "short",
      "medium",
      "long"
    ],
    targetRelations: ["self"],
    reaction: {
      evadeForms: [
        "contact",
        "projectile",
        "beam",
        "area",
        "aura"
      ],
      evadeApproaches: [
        "ground",
        "aerial",
        "teleport",
        "burrow"
      ]
    },
    effect: {
      damage: 0,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    }
  });
}

function block() {
  return normalizeSkillDefinition({
    id: "generic-block",
    name: "Blocage",
    category: "defensive",
    form: "self",
    element: null,
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: [
      "short",
      "medium",
      "long"
    ],
    targetRelations: ["self"],
    reaction: {
      blockForms: ["projectile"]
    },
    effect: {
      damage: 0,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    }
  });
}

function session() {
  return createCombatSession({
    distance: "medium",
    fighters: [
      fighter("attacker"),
      fighter("defender")
    ]
  });
}

test("SkillDefinition defaults dodgeable to true and preserves explicit false", () => {
  assert.equal(
    incoming({
      id: "legacy-default"
    }).dodgeable,
    true
  );
  assert.equal(
    incoming({
      id: "undodgeable",
      dodgeable: false
    }).dodgeable,
    false
  );
  assert.throws(
    () =>
      normalizeSkillDefinition({
        ...incoming({ id: "invalid-source" }),
        id: "invalid-dodgeable",
        dodgeable: "no"
      }),
    /dodgeable/
  );
});

test("generic dodge avoids both direct damage and detrimental status through the existing evaded outcome", () => {
  const combat = session();
  const attack = incoming({
    id: "damage-and-status",
    withStatus: true
  });
  const dodgeSkill = dodge();

  const started = combat.startSkill({
    actorId: "attacker",
    targetId: "defender",
    skill: attack
  });
  assert.equal(started.ok, true);

  const reacted = combat.reactToSkill({
    action: started.action,
    reactionSkill: dodgeSkill,
    elapsedMs: 0
  });
  assert.equal(reacted.ok, true);
  assert.equal(reacted.outcome, "evaded");

  const resolved = combat.completeSkill({
    action: started.action,
    reaction: reacted.reaction
  });

  assert.equal(resolved.outcome, "evaded");
  assert.equal(
    combat.snapshot().fighters.defender.hp,
    100
  );
  assert.deepEqual(
    combat.snapshot().fighters.defender.statusEffects,
    []
  );
});

test("generic dodge consumes the existing skill cooldown and cannot be reused before expiry", () => {
  const combat = session();
  const attackA = incoming({ id: "incoming-a" });
  const attackB = incoming({ id: "incoming-b" });
  const dodgeSkill = dodge({
    cooldownMs: 2500
  });

  const actionA = combat.startSkill({
    actorId: "attacker",
    targetId: "defender",
    skill: attackA
  }).action;

  const first = combat.reactToSkill({
    action: actionA,
    reactionSkill: dodgeSkill,
    elapsedMs: 0
  });
  assert.equal(first.ok, true);
  assert.equal(
    skillCooldownRemainingMs(
      combat.snapshot(),
      "defender",
      dodgeSkill.id
    ),
    2500
  );

  const actionB = combat.startSkill({
    actorId: "attacker",
    targetId: "defender",
    skill: attackB
  }).action;
  const second = combat.reactToSkill({
    action: actionB,
    reactionSkill: dodgeSkill,
    elapsedMs: 0
  });

  assert.equal(second.ok, false);
  assert.equal(second.outcome, "cooldown");

  combat.advanceMs(2500);

  const third = combat.reactToSkill({
    action: actionB,
    reactionSkill: dodgeSkill,
    elapsedMs: 0
  });
  assert.equal(third.ok, true);
});

test("non-dodgeable attack rejects dodge before energy cooldown or usage is committed", () => {
  const combat = session();
  const attack = incoming({
    id: "cannot-dodge",
    dodgeable: false
  });
  const dodgeSkill = dodge({
    cooldownMs: 4000
  });
  const action = combat.startSkill({
    actorId: "attacker",
    targetId: "defender",
    skill: attack
  }).action;

  const before =
    combat.snapshot().fighters.defender;

  const result = combat.reactToSkill({
    action,
    reactionSkill: dodgeSkill,
    elapsedMs: 0
  });

  assert.equal(result.ok, false);
  assert.equal(
    result.outcome,
    "not_dodgeable"
  );
  assert.equal(
    combat.snapshot().fighters.defender.energy,
    before.energy
  );
  assert.equal(
    skillCooldownRemainingMs(
      combat.snapshot(),
      "defender",
      dodgeSkill.id
    ),
    0
  );
  assert.equal(
    combat.snapshot().fighters.defender
      .skillUseCounts[dodgeSkill.id] ?? 0,
    0
  );
});

test("non-dodgeable does not disable a matching non-evasion reaction", () => {
  const combat = session();
  const attack = incoming({
    id: "cannot-dodge-but-blockable",
    dodgeable: false
  });
  const action = combat.startSkill({
    actorId: "attacker",
    targetId: "defender",
    skill: attack
  }).action;

  const result = combat.reactToSkill({
    action,
    reactionSkill: block(),
    elapsedMs: 0
  });

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "blocked");
});
