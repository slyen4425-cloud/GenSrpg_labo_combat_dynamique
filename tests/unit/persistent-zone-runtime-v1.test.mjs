import test from "node:test";
import assert from "node:assert/strict";

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
    initialEnergy: 10
  };
}

function format1v1() {
  const teams = {
    a: "local",
    b: "enemy"
  };
  return {
    actors: [
      { actorId: "a" },
      { actorId: "b" }
    ],
    teamOf(actorId) {
      return teams[actorId] ?? null;
    }
  };
}

function fireAura() {
  return normalizeSkillDefinition({
    id: "fire-aura",
    name: "Aura de feu",
    category: "offensive",
    form: "aura",
    element: "fire",
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: {
      damage: 0,
      tags: []
    },
    effects: [
      {
        kind: "persistent_zone",
        targetScope: "all_enemies",
        zoneId: "flames",
        radius: "short",
        durationMs: 10000,
        tickIntervalMs: 1000,
        reactivation: "reinforce",
        maxActivations: 3,
        radiusGrowthSteps: 1,
        tickEffect: {
          kind: "damage",
          targetScope: "all_enemies",
          amount: 5,
          channel: "fire"
        }
      }
    ]
  });
}

test("SkillEffectV1 normalizes a persistent damage zone", () => {
  const aura = fireAura();
  const zone = aura.effects[0];

  assert.equal(zone.kind, "persistent_zone");
  assert.equal(zone.zoneId, "flames");
  assert.equal(zone.radius, "short");
  assert.equal(zone.durationMs, 10000);
  assert.equal(zone.tickIntervalMs, 1000);
  assert.equal(zone.reactivation, "reinforce");
  assert.equal(zone.maxActivations, 3);
  assert.equal(zone.radiusGrowthSteps, 1);
  assert.deepEqual(zone.tickEffect, {
    kind: "damage",
    targetScope: "all_enemies",
    amount: 5,
    channel: "fire"
  });
});

test("persistent zone ticks only when enemy is inside its current distance radius", () => {
  const session = createCombatSession({
    distance: "medium",
    battleFormat: format1v1(),
    fighters: [fighter("a"), fighter("b")]
  });
  const aura = fireAura();

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: aura
  });

  assert.equal(
    session.snapshot().persistentZones.length,
    1
  );
  assert.equal(
    session.snapshot().persistentZones[0].radius,
    "short"
  );

  session.advanceMs(1000);
  assert.equal(
    session.snapshot().fighters.b.hp,
    100,
    "medium distance must remain outside a short zone"
  );

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: aura
  });

  assert.equal(
    session.snapshot().persistentZones[0].activations,
    2
  );
  assert.equal(
    session.snapshot().persistentZones[0].radius,
    "medium"
  );

  session.advanceMs(1000);
  assert.equal(
    session.snapshot().fighters.b.hp,
    95
  );
});

test("reinforcement grows radius up to long and stops at configured max activations", () => {
  const session = createCombatSession({
    distance: "long",
    battleFormat: format1v1(),
    fighters: [fighter("a"), fighter("b")]
  });
  const aura = fireAura();

  for (let index = 0; index < 4; index += 1) {
    session.useSkill({
      actorId: "a",
      targetId: "b",
      skill: aura
    });
  }

  const zone = session.snapshot().persistentZones[0];
  assert.equal(zone.activations, 3);
  assert.equal(zone.radius, "long");

  session.advanceMs(1000);
  assert.equal(
    session.snapshot().fighters.b.hp,
    95
  );
});

test("persistent zone expires and stops ticking", () => {
  const session = createCombatSession({
    distance: "short",
    battleFormat: format1v1(),
    fighters: [fighter("a"), fighter("b")]
  });
  const aura = fireAura();

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: aura
  });
  session.advanceMs(10000);

  assert.equal(
    session.snapshot().persistentZones.length,
    0
  );

  const hp = session.snapshot().fighters.b.hp;
  session.advanceMs(3000);
  assert.equal(session.snapshot().fighters.b.hp, hp);
});
