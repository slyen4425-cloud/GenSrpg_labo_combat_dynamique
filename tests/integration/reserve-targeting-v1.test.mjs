import test from "node:test";
import assert from "node:assert/strict";

import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  createRosterSession
} from "../../src/core/combat/roster-session.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  normalizeStatusEffectV1
} from "../../src/contracts/status-effect-v1.js";

function fighter(id, overrides = {}) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: 20,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0,
    resistancePctByChannel: {
      fire: 50
    },
    ...overrides
  };
}

function battleFormat() {
  return {
    actors: [
      { actorId: "player", teamId: "players" },
      { actorId: "ally", teamId: "players" },
      { actorId: "opponent", teamId: "enemies" }
    ],
    teamOf(actorId) {
      return this.actors.find(
        (entry) => entry.actorId === actorId
      )?.teamId ?? null;
    }
  };
}

function skill({
  id,
  relations = ["enemy"],
  locations = ["reserve"],
  energyCost = 3,
  cooldownMs = 2000,
  effects = []
}) {
  return normalizeSkillDefinition({
    id,
    name: id,
    category: "buff_debuff",
    form: "aura",
    element: "fire",
    approachMode: "none",
    energyCost,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: relations,
    targetLocations: locations,
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

function harness() {
  const configs = {
    playerA: fighter("playerA"),
    playerB: fighter("playerB"),
    allyA: fighter("allyA"),
    allyB: fighter("allyB"),
    enemyA: fighter("enemyA"),
    enemyB: fighter("enemyB")
  };

  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...configs.playerA, id: "player" },
      { ...configs.allyA, id: "ally" },
      { ...configs.enemyA, id: "opponent" }
    ],
    battleFormat: battleFormat()
  });

  const roster = createRosterSession({
    combatSession: session,
    fighterConfigs: configs,
    roster: {
      teams: {
        player: {
          slotId: "player",
          activeMemberId: "player-a",
          members: [
            { id: "player-a", creatureId: "playerA", displayName: "Player A", fighterConfigId: "playerA" },
            { id: "player-b", creatureId: "playerB", displayName: "Player B", fighterConfigId: "playerB" }
          ]
        },
        ally: {
          slotId: "ally",
          activeMemberId: "ally-a",
          members: [
            { id: "ally-a", creatureId: "allyA", displayName: "Ally A", fighterConfigId: "allyA" },
            { id: "ally-b", creatureId: "allyB", displayName: "Ally B", fighterConfigId: "allyB" }
          ]
        },
        opponent: {
          slotId: "opponent",
          activeMemberId: "enemy-a",
          members: [
            { id: "enemy-a", creatureId: "enemyA", displayName: "Enemy A", fighterConfigId: "enemyA" },
            { id: "enemy-b", creatureId: "enemyB", displayName: "Enemy B", fighterConfigId: "enemyB" }
          ]
        }
      }
    },
    battleFormat: battleFormat()
  });

  return { session, roster };
}

function reserve(teamId, memberId) {
  return {
    scope: "reserve",
    teamId,
    memberId
  };
}

test("active-only skill refuses a reserve target without spending resources", () => {
  const { session, roster } = harness();
  const before =
    session.snapshot().fighters.player;
  const result = roster.useSkillOnTarget({
    actorId: "player",
    targetRef: reserve("opponent", "enemy-b"),
    skill: skill({
      id: "active-only",
      locations: ["active"],
      effects: [
        {
          kind: "damage",
          targetScope: "target",
          amount: 20,
          channel: "fire"
        }
      ]
    })
  });

  assert.equal(result.ok, false);
  assert.equal(result.outcome, "target_location");
  assert.equal(
    session.snapshot().fighters.player.energy,
    before.energy
  );
});

test("reserve damage uses native resistance and updates source stats without putting reserve into CombatState", () => {
  const { session, roster } = harness();
  const result = roster.useSkillOnTarget({
    actorId: "player",
    targetRef: reserve("opponent", "enemy-b"),
    skill: skill({
      id: "reserve-fire",
      effects: [
        {
          kind: "damage",
          targetScope: "target",
          amount: 20,
          channel: "fire"
        }
      ]
    })
  });

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "resolved");
  const reserveView = roster.snapshot()
    .opponent.members.find(
      (member) => member.id === "enemy-b"
    );
  assert.equal(reserveView.hp, 90);
  assert.equal(
    session.snapshot().fighters.player
      .damageDealtTotal,
    10
  );
  assert.equal(
    Object.keys(session.snapshot().fighters)
      .some((id) => id.includes("enemy-b")),
    false
  );
  assert.equal(
    session.snapshot().fighters.player.energy,
    17
  );
});

test("reserve target respects shield and immunity through the existing effect owners", () => {
  const { roster } = harness();

  assert.equal(
    roster.applyStatusToReserveForTest({
      teamId: "opponent",
      memberId: "enemy-b",
      status: normalizeStatusEffectV1({
        id: "bench-immunity",
        kind: "immunity",
        polarity: "beneficial",
        durationMs: 5000,
        stacking: "refresh",
        domains: ["damage"]
      }),
      sourceActorId: "opponent",
      sourceSkillId: "bench-protect"
    }).ok,
    true
  );

  const result = roster.useSkillOnTarget({
    actorId: "player",
    targetRef: reserve("opponent", "enemy-b"),
    skill: skill({
      id: "blocked-reserve-fire",
      effects: [
        {
          kind: "damage",
          targetScope: "target",
          amount: 30,
          channel: "fire"
        }
      ]
    })
  });

  assert.equal(result.ok, true);
  const reserveView = roster.snapshot()
    .opponent.members.find(
      (member) => member.id === "enemy-b"
    );
  assert.equal(reserveView.hp, 100);
});

test("ally reserve can be healed and buffed while enemy-only relation is rejected before cost", () => {
  const { session, roster } = harness();

  roster.useSkillOnTarget({
    actorId: "opponent",
    targetRef: reserve("ally", "ally-b"),
    skill: skill({
      id: "chip-ally-bench",
      relations: ["enemy"],
      energyCost: 0,
      cooldownMs: 0,
      effects: [
        {
          kind: "damage",
          targetScope: "target",
          amount: 20,
          channel: "physical"
        }
      ]
    })
  });

  const healBuff = skill({
    id: "bench-support",
    relations: ["ally"],
    energyCost: 2,
    cooldownMs: 1000,
    effects: [
      {
        kind: "heal",
        targetScope: "target",
        amount: 8
      },
      {
        kind: "apply_status",
        targetScope: "target",
        status: {
          id: "bench-shield",
          kind: "shield",
          polarity: "beneficial",
          durationMs: 5000,
          stacking: "replace",
          amount: 12
        }
      }
    ]
  });

  const ok = roster.useSkillOnTarget({
    actorId: "player",
    targetRef: reserve("ally", "ally-b"),
    skill: healBuff
  });
  assert.equal(ok.ok, true);

  const allyReserve = roster.reserveMemberSnapshot(
    "ally",
    "ally-b"
  );
  assert.equal(allyReserve.hp, 88);
  assert.equal(
    allyReserve.statusEffects.some(
      (entry) =>
        entry.definition.id === "bench-shield"
    ),
    true
  );

  const beforeEnergy =
    session.snapshot().fighters.player.energy;
  const rejected = roster.useSkillOnTarget({
    actorId: "player",
    targetRef: reserve("ally", "ally-b"),
    skill: skill({
      id: "enemy-only",
      relations: ["enemy"],
      effects: [
        {
          kind: "damage",
          targetScope: "target",
          amount: 5,
          channel: "physical"
        }
      ]
    })
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.outcome, "target_relation");
  assert.equal(
    session.snapshot().fighters.player.energy,
    beforeEnergy
  );
});

test("reserve skill uses the same cooldown and usage authority exactly once", () => {
  const { session, roster } = harness();
  const reserveSkill = skill({
    id: "bench-bolt",
    cooldownMs: 2000,
    effects: [
      {
        kind: "damage",
        targetScope: "target",
        amount: 10,
        channel: "physical"
      }
    ]
  });

  assert.equal(
    roster.useSkillOnTarget({
      actorId: "player",
      targetRef: reserve("opponent", "enemy-b"),
      skill: reserveSkill
    }).ok,
    true
  );

  const actor =
    session.snapshot().fighters.player;
  assert.equal(actor.energy, 17);
  assert.equal(
    actor.skillUseCounts["bench-bolt"],
    1
  );

  const second = roster.useSkillOnTarget({
    actorId: "player",
    targetRef: reserve("opponent", "enemy-b"),
    skill: reserveSkill
  });
  assert.equal(second.ok, false);
  assert.equal(second.outcome, "cooldown");
  assert.equal(
    session.snapshot().fighters.player.energy,
    17
  );
});

test("scheduled effects and persistent zones are rejected for reserve target in V1", () => {
  const { roster } = harness();

  const rejected = roster.useSkillOnTarget({
    actorId: "player",
    targetRef: reserve("opponent", "enemy-b"),
    skill: skill({
      id: "bench-scheduled",
      effects: [
        {
          kind: "scheduled_effect",
          targetScope: "target",
          trigger: {
            type: "after_ms",
            delayMs: 1000
          },
          effects: [
            {
              kind: "damage",
              targetScope: "target",
              amount: 10,
              channel: "fire"
            }
          ]
        }
      ]
    })
  });

  assert.equal(rejected.ok, false);
  assert.equal(
    rejected.outcome,
    "unsupported_reserve_effect"
  );
});
