import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillEffectV1
} from "../../src/contracts/skill-effect-v1.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 10,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0
  };
}

function skill(id, effects) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "offensive",
    form: "area",
    element: "fire",
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
    targetRelations: ["enemy"],
    effect: {
      damage: 0,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    },
    effects
  });
}

function scheduled({
  delayMs,
  effects
}) {
  return {
    kind: "scheduled_effect",
    targetScope: "target",
    trigger: {
      type: "after_ms",
      delayMs
    },
    effects
  };
}

function damage(amount = 10) {
  return {
    kind: "damage",
    targetScope: "target",
    amount,
    channel: "fire"
  };
}

function status(id = "future-stun") {
  return {
    kind: "apply_status",
    targetScope: "target",
    status: {
      id,
      kind: "stun",
      polarity: "detrimental",
      durationMs: 2000,
      stacking: "refresh"
    }
  };
}

function session() {
  return createCombatSession({
    fighters: [
      fighter("source"),
      fighter("target")
    ]
  });
}

test("SkillEffectV1 normalizes after_ms scheduled effects and rejects nested schedulers/zones", () => {
  const normalized =
    normalizeSkillEffectV1(
      scheduled({
        delayMs: 30000,
        effects: [damage(25)]
      })
    );

  assert.equal(
    normalized.kind,
    "scheduled_effect"
  );
  assert.deepEqual(
    normalized.trigger,
    {
      type: "after_ms",
      delayMs: 30000
    }
  );
  assert.equal(
    normalized.effects[0].kind,
    "damage"
  );

  assert.throws(
    () =>
      normalizeSkillEffectV1(
        scheduled({
          delayMs: 1000,
          effects: [
            scheduled({
              delayMs: 1000,
              effects: [damage()]
            })
          ]
        })
      ),
    /scheduled_effect cannot contain/
  );

  assert.throws(
    () =>
      normalizeSkillEffectV1(
        scheduled({
          delayMs: 1000,
          effects: [
            {
              kind: "persistent_zone",
              targetScope: "target",
              zoneId: "nested-zone",
              radius: "short",
              durationMs: 3000,
              tickIntervalMs: 1000,
              reactivation: "refresh",
              maxActivations: 1,
              radiusGrowthSteps: 0,
              tickEffect: damage(2)
            }
          ]
        })
      ),
    /scheduled_effect cannot contain/
  );
});

test("scheduled damage stays pending before due time and resolves exactly once at after_ms", () => {
  const combat = session();
  const comet = skill(
    "comet",
    [
      scheduled({
        delayMs: 3000,
        effects: [damage(25)]
      })
    ]
  );

  const used = combat.useSkill({
    actorId: "source",
    targetId: "target",
    skill: comet
  });

  assert.equal(used.ok, true);
  assert.equal(
    combat.snapshot().fighters.target.hp,
    100
  );
  assert.equal(
    combat.snapshot().scheduledEffects.length,
    1
  );
  assert.equal(
    combat.snapshot().scheduledEffects[0].dueAtMs,
    3000
  );

  combat.advanceMs(2999);
  assert.equal(
    combat.snapshot().fighters.target.hp,
    100
  );
  assert.equal(
    combat.snapshot().scheduledEffects.length,
    1
  );

  combat.advanceMs(1);
  assert.equal(
    combat.snapshot().fighters.target.hp,
    75
  );
  assert.deepEqual(
    combat.snapshot().scheduledEffects,
    []
  );

  combat.advanceMs(5000);
  assert.equal(
    combat.snapshot().fighters.target.hp,
    75
  );
});

test("scheduled status uses its actual due timestamp instead of the enclosing advance end", () => {
  const combat = session();
  const delayedStun = skill(
    "delayed-stun",
    [
      scheduled({
        delayMs: 1000,
        effects: [status()]
      })
    ]
  );

  combat.useSkill({
    actorId: "source",
    targetId: "target",
    skill: delayedStun
  });

  combat.advanceMs(1500);

  const instance =
    combat.snapshot()
      .fighters.target.statusEffects
      .find(
        (entry) =>
          entry.definition.id ===
          "future-stun"
      );

  assert.ok(instance);
  assert.equal(instance.appliedAtMs, 1000);
  assert.equal(instance.expiresAtMs, 3000);
});

test("scheduled damage reuses immunity state that is active at the due timestamp", () => {
  const combat = session();

  const invulnerability = normalizeSkillDefinition({
    id: "invulnerability",
    name: "invulnerability",
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
    effect: {
      damage: 0,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    },
    effects: [
      {
        kind: "apply_status",
        targetScope: "self",
        status: {
          id: "damage-immunity",
          kind: "immunity",
          polarity: "beneficial",
          durationMs: 2000,
          stacking: "refresh",
          domains: ["damage"]
        }
      }
    ]
  });

  combat.useSkill({
    actorId: "target",
    targetId: "target",
    skill: invulnerability
  });

  combat.useSkill({
    actorId: "source",
    targetId: "target",
    skill: skill(
      "future-hit",
      [
        scheduled({
          delayMs: 1000,
          effects: [damage(40)]
        })
      ]
    )
  });

  combat.advanceMs(1000);

  assert.equal(
    combat.snapshot().fighters.target.hp,
    100
  );
  assert.deepEqual(
    combat.snapshot().scheduledEffects,
    []
  );
});


test("scheduled delay is anchored to absolute combat time, not action-relative impact time", () => {
  const combat = session();
  combat.advanceMs(10000);

  combat.useSkill({
    actorId: "source",
    targetId: "target",
    skill: skill(
      "late-comet",
      [
        scheduled({
          delayMs: 3000,
          effects: [damage(15)]
        })
      ]
    )
  });

  assert.equal(
    combat.snapshot().scheduledEffects[0].dueAtMs,
    13000
  );

  combat.advanceMs(2999);
  assert.equal(
    combat.snapshot().fighters.target.hp,
    100
  );

  combat.advanceMs(1);
  assert.equal(
    combat.snapshot().fighters.target.hp,
    85
  );
});
