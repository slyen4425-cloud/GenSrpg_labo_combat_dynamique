import test from "node:test";
import assert from "node:assert/strict";

import {
  adaptCaptureSkill,
  adaptCaptureCreatureSkills
} from "../../src/adapters/input/capture/skill-adapter-v1.js";

function fixture() {
  return {
    version: 1,
    localMemberId: "player-a",
    creatures: [
      {
        id: "creature-a",
        displayName: "Créature A",
        combat: {
          maxHp: 100,
          initialHp: 100,
          maxEnergy: 10,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        stats: {},
        progression: { level: 1 },
        skillIds: ["skill-fire", "skill-claw"]
      },
      {
        id: "creature-b",
        displayName: "Créature B",
        combat: {
          maxHp: 100,
          initialHp: 100,
          maxEnergy: 10,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        stats: {},
        progression: { level: 1 },
        skillIds: []
      }
    ],
    skills: [
      {
        id: "skill-fire",
        name: "Nom libre sans importance moteur",
        category: "offensive",
        form: "projectile",
        element: "fire",
        approachMode: "none",
        energyCost: 3,
        preparationMs: 1100,
        travelMs: 650,
        recoveryMs: 400,
        allowedDistances: ["short", "medium", "long"],
        targetRelations: ["enemy"],
        projectileClash: {
          mode: "mutual_cancel",
          group: "fire-orb",
          interactsWith: ["fire-orb", "ice-bolt"]
        },
        effect: {
          damage: 21,
          tags: ["burn-capable"]
        }
      },
      {
        id: "skill-claw",
        name: "Griffe",
        category: "offensive",
        form: "contact",
        element: null,
        approachMode: "ground",
        energyCost: 2,
        preparationMs: 350,
        travelMs: 900,
        recoveryMs: 450,
        allowedDistances: ["short"],
        targetRelations: ["enemy"],
        effect: {
          damage: 13
        }
      },
      {
        id: "skill-unused",
        name: "Non équipée",
        category: "heal",
        form: "self",
        element: null,
        approachMode: "none",
        energyCost: 1,
        preparationMs: 200,
        travelMs: 0,
        recoveryMs: 200,
        allowedDistances: ["short", "medium", "long"],
        targetRelations: ["self"],
        effect: {
          heal: 5
        }
      }
    ],
    teams: [
      {
        id: "players",
        members: [
          {
            id: "player-a",
            creatureId: "creature-a",
            controllerId: "human-local",
            active: true
          }
        ]
      },
      {
        id: "enemies",
        members: [
          {
            id: "enemy-b",
            creatureId: "creature-b",
            controllerId: "ai-enemy",
            active: true
          }
        ]
      }
    ]
  };
}

test("Capture skill adapter exposes the native normalized SkillDefinition", () => {
  const skill = adaptCaptureSkill(fixture(), "skill-fire");

  assert.equal(skill.id, "skill-fire");
  assert.equal(skill.category, "offensive");
  assert.equal(skill.form, "projectile");
  assert.equal(skill.element, "fire");
  assert.equal(skill.energyCost, 3);
  assert.equal(skill.preparationMs, 1100);
  assert.equal(skill.travelMs, 650);
  assert.equal(skill.effect.damage, 21);
  assert.deepEqual(
    [...skill.projectileClash.interactsWith],
    ["fire-orb", "ice-bolt"]
  );
  assert.ok(Object.isFrozen(skill));
});

test("Capture creature skill adapter preserves the declared skill order", () => {
  const skills = adaptCaptureCreatureSkills(
    fixture(),
    "creature-a"
  );

  assert.deepEqual(
    skills.map((skill) => skill.id),
    ["skill-fire", "skill-claw"]
  );
  assert.ok(Object.isFrozen(skills));
});

test("Capture creature skill adapter never injects unassigned skills", () => {
  const skills = adaptCaptureCreatureSkills(
    fixture(),
    "creature-a"
  );

  assert.equal(
    skills.some((skill) => skill.id === "skill-unused"),
    false
  );
});

test("Capture skill adapter rejects an unknown skill id", () => {
  assert.throws(
    () => adaptCaptureSkill(fixture(), "legacy_magic_fire"),
    /Unknown Capture skill/
  );
});

test("Capture creature skill adapter rejects an unknown creature id", () => {
  assert.throws(
    () => adaptCaptureCreatureSkills(fixture(), "missing"),
    /Unknown Capture creature/
  );
});

test("invalid semantic skills fail upstream instead of being repaired by the adapter", () => {
  const input = fixture();
  input.skills[0] = {
    id: "skill-fire",
    name: "Boule de feu",
    category: "legacy_magic",
    form: "???",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0
  };

  assert.throws(
    () => adaptCaptureSkill(input, "skill-fire"),
    /Unsupported skill category/
  );
});
