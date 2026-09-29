import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeStatusEffectV1
} from "../../src/contracts/status-effect-v1.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  applyStatusEffectV1
} from "../../src/core/combat/status-effect-runtime-v1.js";
import {
  createCombatState
} from "../../src/core/combat/combat-state.js";
import {
  projectStatusStatEffectsV1
} from "../../src/core/combat/status-effect-projection-v1.js";
import {
  computeCombatDamageV1
} from "../../src/core/combat/combat-damage-v1.js";
import {
  monsterCaptureStandardStatIdForLegacyAliasV1
} from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";
import {
  captureComplexSkillMigrationEntriesV1
} from "../../src/adapters/input/capture/capture-complex-skill-migration-v1.js";

function fighter(id, overrides = {}) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 10,
    ...overrides
  };
}

function basicSkill(id = "basic") {
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
    effect: {
      damage: 0,
      heal: 0,
      tags: []
    }
  });
}

test("StatusEffectV1 supports owner-action-end duration without inventing milliseconds", () => {
  const status = normalizeStatusEffectV1({
    id: "legacy-poison",
    kind: "damage_over_time",
    polarity: "detrimental",
    durationModel: "owner_action_end",
    durationActions: 3,
    stacking: "refresh",
    amount: 2,
    channel: "poison",
    damageMode: "fixed",
    tags: ["legacy"]
  });

  assert.equal(status.durationModel, "owner_action_end");
  assert.equal(status.durationActions, 3);
  assert.equal("durationMs" in status, false);
  assert.equal("tickIntervalMs" in status, false);
  assert.equal(status.damageMode, "fixed");
});

test("modern time-based StatusEffectV1 stays backwards compatible", () => {
  const status = normalizeStatusEffectV1({
    id: "modern-poison",
    kind: "damage_over_time",
    polarity: "detrimental",
    durationMs: 6000,
    stacking: "refresh",
    amount: 2,
    channel: "poison",
    tickIntervalMs: 2000
  });

  assert.equal(status.durationModel, "time_ms");
  assert.equal(status.durationMs, 6000);
  assert.equal(status.tickIntervalMs, 2000);
  assert.equal(status.damageMode, "combat");
});

test("legacy DoT ticks and decrements only on the affected fighter own completed action", () => {
  const session = createCombatSession({
    fighters: [
      fighter("a"),
      fighter("b")
    ]
  });

  let state = applyStatusEffectV1({
    state: session.snapshot(),
    targetActorId: "b",
    sourceActorId: "a",
    status: {
      id: "legacy-dot",
      kind: "damage_over_time",
      polarity: "detrimental",
      durationModel: "owner_action_end",
      durationActions: 2,
      stacking: "refresh",
      amount: 7,
      channel: "poison",
      damageMode: "fixed"
    }
  });

  // Recreate a session from the authoritative state snapshot.
  const withStatus = createCombatSession({
    fighters: Object.values(state.fighters)
  });

  withStatus.advanceMs(60000);
  assert.equal(withStatus.snapshot().fighters.b.hp, 100);

  withStatus.useSkill({
    actorId: "a",
    targetId: "b",
    skill: basicSkill("a-action")
  });
  assert.equal(withStatus.snapshot().fighters.b.hp, 100);

  withStatus.useSkill({
    actorId: "b",
    targetId: "a",
    skill: basicSkill("b-action-1")
  });
  assert.equal(withStatus.snapshot().fighters.b.hp, 93);
  assert.equal(
    withStatus.snapshot().fighters.b.statusEffects[0].remainingActionEnds,
    1
  );

  withStatus.useSkill({
    actorId: "b",
    targetId: "a",
    skill: basicSkill("b-action-2")
  });
  assert.equal(withStatus.snapshot().fighters.b.hp, 86);
  assert.equal(withStatus.snapshot().fighters.b.statusEffects.length, 0);
});

test("self HoT applied by a skill ticks at the end of the casting fighter action", () => {
  const hotSkill = normalizeSkillDefinition({
    id: "legacy-regen",
    name: "legacy-regen",
    category: "heal",
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
    effect: {
      damage: 0,
      heal: 0,
      tags: []
    },
    effects: [
      {
        kind: "apply_status",
        targetScope: "self",
        status: {
          id: "legacy-hot",
          kind: "heal_over_time",
          polarity: "beneficial",
          durationModel: "owner_action_end",
          durationActions: 3,
          stacking: "refresh",
          amount: 5
        }
      }
    ]
  });

  const session = createCombatSession({
    fighters: [
      fighter("a", { initialHp: 50 }),
      fighter("b")
    ]
  });

  session.useSkill({
    actorId: "a",
    targetId: "a",
    skill: hotSkill
  });

  assert.equal(session.snapshot().fighters.a.hp, 55);
  assert.equal(
    session.snapshot().fighters.a.statusEffects[0].remainingActionEnds,
    2
  );
});

test("stat_modifier percent projects from base stat values rather than pretending percent is deltaPoints", () => {
  let state = createCombatState({
    fighters: [
      fighter("a", {
        statValuesById: { speed: 10 },
        statEffectRulesById: {
          speed: {
            damageChannel: null,
            resistanceChannel: null,
            damagePctPerPoint: 0,
            resistancePctPerPoint: 0,
            chargeTimeReductionPctPerPoint: 1,
            damageReductionPctPerPoint: 0
          }
        }
      }),
      fighter("b")
    ]
  });

  state = applyStatusEffectV1({
    state,
    targetActorId: "a",
    sourceActorId: "a",
    status: {
      id: "speed-buff",
      kind: "stat_modifier",
      polarity: "beneficial",
      durationModel: "owner_action_end",
      durationActions: 2,
      stacking: "refresh",
      statId: "speed",
      modifierMode: "percent",
      percent: 30
    }
  });

  const projected = projectStatusStatEffectsV1({
    fighter: state.fighters.a,
    atMs: state.elapsedMs
  });

  assert.equal(projected.chargeTimeReductionPct, 3);
});

test("standard Capture registry owns defense as readable global damage reduction per point", async () => {
  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-stat-registry.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );

  const defense = raw.stats.find(
    (entry) => entry.id === "defense"
  );

  assert.ok(defense);
  assert.equal(defense.label, "Défense");
  assert.equal(defense.damageReductionPctPerPoint, 1);
});

test("combat damage combines channel resistance with global defense reduction", () => {
  const state = createCombatState({
    fighters: [
      fighter("a", {
        damagePctByChannel: { fire: 0 }
      }),
      fighter("b", {
        resistancePctByChannel: { fire: 20 },
        damageReductionPct: 10
      })
    ]
  });

  const damage = computeCombatDamageV1({
    state,
    attackerId: "a",
    targetId: "b",
    baseDamage: 100,
    channel: "fire"
  });

  assert.equal(damage.resistancePct, 20);
  assert.equal(damage.damageReductionPct, 10);
  assert.equal(damage.damage, 72);
});

test("legacy defense and armor aliases resolve to the modern defense owner", () => {
  for (const alias of [
    "defense",
    "def",
    "armor",
    "armure",
    "défense"
  ]) {
    assert.equal(
      monsterCaptureStandardStatIdForLegacyAliasV1(alias),
      "defense"
    );
  }
});

test("all 33 complex Capture abilities become runtime-ready with exact legacy action-duration and percent semantics", () => {
  const entries =
    captureComplexSkillMigrationEntriesV1();

  assert.equal(entries.length, 33);
  assert.equal(
    entries.filter(
      (entry) =>
        entry.migrationState === "runtime-ready"
    ).length,
    33
  );

  for (const entry of entries) {
    assert.deepEqual(entry.blockers, []);
    assert.ok(Array.isArray(entry.tacticalEffects));
    assert.ok(entry.tacticalEffects.length > 0);
  }

  const regen = entries.find(
    (entry) => entry.id === "lib_regen"
  );
  assert.deepEqual(
    regen.tacticalEffects[0],
    {
      kind: "apply_status",
      targetScope: "self",
      status: {
        id: "lib_regen:0",
        kind: "heal_over_time",
        polarity: "beneficial",
        durationModel: "owner_action_end",
        durationActions: 3,
        stacking: "refresh",
        maxStacks: 1,
        tags: ["legacy", "hot"],
        amount: 2
      }
    }
  );

  const heatWave = entries.find(
    (entry) => entry.id === "lib_heat_wave"
  );
  assert.equal(
    heatWave.tacticalEffects[0].status.statId,
    "defense"
  );
  assert.equal(
    heatWave.tacticalEffects[0].status.modifierMode,
    "percent"
  );
  assert.equal(
    heatWave.tacticalEffects[0].status.percent,
    -30
  );
  assert.equal(
    heatWave.tacticalEffects[0].status.durationActions,
    2
  );
});
