import test from "node:test";
import assert from "node:assert/strict";

import {
  adaptCaptureCreature,
  adaptCaptureRosterMember
} from "../../src/adapters/input/capture/creature-adapter-v1.js";

function exportFixture() {
  return {
    version: 1,
    localMemberId: "player-wolf",
    creatures: [
      {
        id: "wolf",
        displayName: "Loup",
        combat: {
          maxHp: 125,
          initialHp: 117,
          maxEnergy: 11,
          initialEnergy: 3,
          energyChargeAmount: 2,
          energyChargeIntervalMs: 1750,
          movementEnergyPerStep: 2,
          chargeTimeModifierPct: -15
        },
        stats: {
          speed: 999,
          agilite: 777,
          defense: 555
        },
        progression: {
          level: 42
        },
        skillIds: ["claw"]
      },
      {
        id: "dummy",
        displayName: "Cible",
        combat: {
          maxHp: 100,
          initialHp: 100,
          maxEnergy: 0,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 0,
          chargeTimeModifierPct: 0
        },
        stats: {},
        progression: {
          level: 1
        },
        skillIds: []
      }
    ],
    skills: [
      {
        id: "claw",
        name: "Griffe",
        category: "offensive",
        form: "contact",
        element: null,
        approachMode: "ground",
        energyCost: 2,
        preparationMs: 500,
        travelMs: 900,
        recoveryMs: 500,
        allowedDistances: ["short"],
        targetRelations: ["enemy"],
        effect: {
          damage: 12
        }
      }
    ],
    teams: [
      {
        id: "players",
        members: [
          {
            id: "player-wolf",
            creatureId: "wolf",
            controllerId: "human-local",
            active: true
          }
        ]
      },
      {
        id: "enemies",
        members: [
          {
            id: "enemy-dummy",
            creatureId: "dummy",
            controllerId: "ai-enemy",
            active: true
          }
        ]
      }
    ]
  };
}

test("Capture creature adapter produces a native FighterConfig from combat data only", () => {
  const result = adaptCaptureCreature(exportFixture(), "wolf");

  assert.deepEqual(result.fighterConfig, {
    id: "wolf",
    maxHp: 125,
    initialHp: 117,
    maxEnergy: 11,
    initialEnergy: 3,
    energyChargeAmount: 2,
    energyChargeIntervalMs: 1750,
    movementEnergyPerStep: 2,
    chargeTimeModifierPct: -15
  });

  assert.deepEqual(result.sourceMetadata, {
    stats: {
      speed: 999,
      agilite: 777,
      defense: 555
    },
    progression: {
      level: 42
    },
    skillIds: ["claw"]
  });

  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.fighterConfig));
  assert.ok(Object.isFrozen(result.sourceMetadata));
});

test("source stats and level never mutate FighterConfig semantics", () => {
  const first = exportFixture();
  const second = exportFixture();

  second.creatures[0].stats = {
    speed: -99999,
    agilite: 1,
    defense: 999999,
    strange_editor_stat: 123456
  };
  second.creatures[0].progression.level = 999;

  assert.deepEqual(
    adaptCaptureCreature(first, "wolf").fighterConfig,
    adaptCaptureCreature(second, "wolf").fighterConfig
  );
});

test("Capture creature adapter rejects an unknown creature id", () => {
  assert.throws(
    () => adaptCaptureCreature(exportFixture(), "missing"),
    /Unknown Capture creature/
  );
});

test("Capture roster member adapter produces the native roster member shape", () => {
  const result = adaptCaptureRosterMember(
    exportFixture(),
    "player-wolf"
  );

  assert.deepEqual(result, {
    id: "player-wolf",
    creatureId: "wolf",
    displayName: "Loup",
    fighterConfigId: "wolf"
  });
  assert.ok(Object.isFrozen(result));
});

test("Capture roster member adapter rejects an unknown member id", () => {
  assert.throws(
    () => adaptCaptureRosterMember(exportFixture(), "missing-member"),
    /Unknown Capture roster member/
  );
});
