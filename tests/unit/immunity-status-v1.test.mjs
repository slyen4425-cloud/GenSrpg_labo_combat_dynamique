import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeStatusEffectV1
} from "../../src/contracts/status-effect-v1.js";
import {
  createCombatState
} from "../../src/core/combat/combat-state.js";
import {
  applyCombatDamageV1
} from "../../src/core/combat/combat-damage-application-v1.js";
import {
  applyStatusEffectV1,
  advanceStatusEffectsV1
} from "../../src/core/combat/status-effect-runtime-v1.js";

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

function state() {
  return createCombatState({
    fighters: [
      fighter("source"),
      fighter("target")
    ]
  });
}

function immunity({
  id = "total-immunity",
  domains = ["damage", "negative_status"],
  durationMs = 3000
} = {}) {
  return normalizeStatusEffectV1({
    id,
    kind: "immunity",
    polarity: "beneficial",
    durationMs,
    stacking: "refresh",
    domains,
    tags: ["immunity"]
  });
}

function applyStatus(
  combatState,
  status,
  {
    sourceActorId = "source",
    targetActorId = "target",
    sourceSkillId = "test-skill"
  } = {}
) {
  return applyStatusEffectV1({
    state: combatState,
    targetActorId,
    sourceActorId,
    sourceSkillId,
    status
  });
}

test("StatusEffectV1 accepts immunity domains and rejects unsupported domains", () => {
  const status = immunity();
  assert.equal(status.kind, "immunity");
  assert.deepEqual(
    status.domains,
    ["damage", "negative_status"]
  );

  assert.throws(
    () =>
      immunity({
        domains: ["damage", "telepathy"]
      }),
    /Unsupported StatusEffectV1.immunity domain/
  );
});

test("damage immunity blocks direct damage without recording damage or knockout", () => {
  let combatState = state();
  combatState = applyStatus(
    combatState,
    immunity({
      domains: ["damage"]
    }),
    {
      sourceActorId: "target",
      targetActorId: "target",
      sourceSkillId: "invulnerability"
    }
  );

  const result = applyCombatDamageV1({
    state: combatState,
    sourceActorId: "source",
    targetActorId: "target",
    damage: 150
  });

  assert.equal(result.requestedDamage, 150);
  assert.equal(result.appliedDamage, 0);
  assert.equal(result.immuneDamage, 150);
  assert.equal(result.hpBefore, 100);
  assert.equal(result.hpAfter, 100);
  assert.equal(
    result.state.fighters.source.damageDealtTotal,
    0
  );
  assert.equal(
    result.state.fighters.target.damageTakenTotal,
    0
  );
  assert.equal(
    result.state.fighters.source.knockoutsTotal,
    0
  );
});

test("damage immunity blocks an existing DoT tick through the same damage owner", () => {
  let combatState = state();

  combatState = applyStatus(
    combatState,
    normalizeStatusEffectV1({
      id: "poison",
      kind: "damage_over_time",
      polarity: "detrimental",
      durationMs: 3000,
      stacking: "refresh",
      amount: 7,
      channel: "poison",
      tickIntervalMs: 1000
    })
  );

  combatState = applyStatus(
    combatState,
    immunity({
      domains: ["damage"],
      durationMs: 2500
    }),
    {
      sourceActorId: "target",
      targetActorId: "target",
      sourceSkillId: "damage-immunity"
    }
  );

  combatState = advanceStatusEffectsV1({
    state: combatState,
    deltaMs: 1000
  });

  assert.equal(
    combatState.fighters.target.hp,
    100
  );
  assert.equal(
    combatState.fighters.target.damageTakenTotal,
    0
  );
});

test("negative-status immunity rejects detrimental status but allows beneficial status", () => {
  let combatState = state();
  combatState = applyStatus(
    combatState,
    immunity({
      domains: ["negative_status"]
    }),
    {
      sourceActorId: "target",
      targetActorId: "target",
      sourceSkillId: "status-immunity"
    }
  );

  combatState = applyStatus(
    combatState,
    normalizeStatusEffectV1({
      id: "stun",
      kind: "stun",
      polarity: "detrimental",
      durationMs: 1000,
      stacking: "refresh"
    })
  );

  assert.equal(
    combatState.fighters.target.statusEffects.some(
      (entry) => entry.definition.id === "stun"
    ),
    false
  );

  combatState = applyStatus(
    combatState,
    normalizeStatusEffectV1({
      id: "shield",
      kind: "shield",
      polarity: "beneficial",
      durationMs: 1000,
      stacking: "replace",
      amount: 12
    }),
    {
      sourceActorId: "target",
      targetActorId: "target",
      sourceSkillId: "beneficial-shield"
    }
  );

  assert.equal(
    combatState.fighters.target.statusEffects.some(
      (entry) => entry.definition.id === "shield"
    ),
    true
  );
});

test("expired immunity stops protecting through the existing combat clock", () => {
  let combatState = state();
  combatState = applyStatus(
    combatState,
    immunity({
      domains: ["damage"],
      durationMs: 1000
    }),
    {
      sourceActorId: "target",
      targetActorId: "target",
      sourceSkillId: "short-immunity"
    }
  );

  combatState = advanceStatusEffectsV1({
    state: combatState,
    deltaMs: 1000
  });

  const result = applyCombatDamageV1({
    state: combatState,
    sourceActorId: "source",
    targetActorId: "target",
    damage: 10
  });

  assert.equal(result.appliedDamage, 10);
  assert.equal(result.hpAfter, 90);
});
