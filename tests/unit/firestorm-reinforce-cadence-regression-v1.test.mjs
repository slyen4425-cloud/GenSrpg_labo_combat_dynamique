import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
    maxEnergy: 100,
    initialEnergy: 100,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0
  };
}

function format1v1() {
  return {
    actors: [
      { actorId: "local" },
      { actorId: "enemy" }
    ],
    teamOf(actorId) {
      return actorId === "local"
        ? "local"
        : actorId === "enemy"
          ? "enemy"
          : null;
    }
  };
}

async function fireStorm({
  reactivation = "reinforce"
} = {}) {
  const transfer = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const source = transfer.draft.definition;

  return normalizeSkillDefinition({
    ...source,
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    maxUsesPerCombat: null,
    activationRequirements: {
      mode: "all",
      conditions: []
    },
    effects: source.effects.map(
      (effect) =>
        effect.kind === "persistent_zone"
          ? {
              ...effect,
              reactivation
            }
          : effect
    )
  });
}

test("Firestorm reinforce preserves the already scheduled persistent-zone tick", async () => {
  const skill = await fireStorm();
  const session = createCombatSession({
    distance: "medium",
    battleFormat: format1v1(),
    fighters: [
      fighter("local"),
      fighter("enemy")
    ]
  });

  assert.equal(
    session.useSkill({
      actorId: "local",
      targetId: "enemy",
      skill
    }).ok,
    true
  );

  let zone = session.snapshot().persistentZones[0];
  assert.equal(zone.radius, "short");
  assert.equal(zone.nextTickAtMs, 1000);
  assert.equal(zone.expiresAtMs, 7000);

  session.advanceMs(600);

  assert.equal(
    session.useSkill({
      actorId: "local",
      targetId: "enemy",
      skill
    }).ok,
    true
  );

  zone = session.snapshot().persistentZones[0];
  assert.equal(zone.radius, "medium");
  assert.equal(
    zone.nextTickAtMs,
    1000,
    "reinforce must grow/extend the zone without postponing a tick that was already due"
  );
  assert.equal(zone.appliedAtMs, 600);
  assert.equal(zone.expiresAtMs, 7600);

  session.advanceMs(400);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    95,
    "the original 1000 ms tick must still fire after reinforcement"
  );
});


test("persistent-zone refresh remains the explicit mode that resets tick origin", async () => {
  const skill = await fireStorm({
    reactivation: "refresh"
  });
  const session = createCombatSession({
    distance: "medium",
    battleFormat: format1v1(),
    fighters: [
      fighter("local"),
      fighter("enemy")
    ]
  });

  assert.equal(
    session.useSkill({
      actorId: "local",
      targetId: "enemy",
      skill
    }).ok,
    true
  );

  session.advanceMs(600);

  assert.equal(
    session.useSkill({
      actorId: "local",
      targetId: "enemy",
      skill
    }).ok,
    true
  );

  const zone = session.snapshot().persistentZones[0];
  assert.equal(zone.radius, "short");
  assert.equal(zone.appliedAtMs, 600);
  assert.equal(zone.nextTickAtMs, 1600);
  assert.equal(zone.expiresAtMs, 7600);
});
