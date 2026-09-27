import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  adaptCaptureCombatSkill,
  adaptCaptureCombatCreatureSkills
} from "../../src/adapters/input/capture/skill-to-skill-definition.js";

function fixture() {
  return {
    schema: "capture-combat-export-v1",
    battle: {
      id: "duel-test",
      localActorId: "player"
    },
    teams: {
      players: ["player"],
      enemies: ["opponent"]
    },
    actors: [
      {
        actorId: "player",
        teamId: "players",
        creatureId: "maraileron",
        displayName: "Maraileron",
        controllerId: "human-local"
      },
      {
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "braisombre",
        displayName: "Braisombre",
        controllerId: "ai-enemy"
      }
    ],
    creatures: [
      {
        id: "maraileron",
        displayName: "Maraileron",
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
        skillIds: ["water-wave", "claw"],
        presentationId: "creature:maraileron",
        metadata: {
          level: 12
        }
      },
      {
        id: "braisombre",
        displayName: "Braisombre",
        combat: {
          maxHp: 120,
          initialHp: 120,
          maxEnergy: 10,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 3,
          chargeTimeModifierPct: 0
        },
        skillIds: ["fireball"],
        presentationId: "creature:braisombre"
      }
    ],
    skills: [
      {
        id: "water-wave",
        definition: {
          id: "water-wave",
          name: "Vague",
          category: "offensive",
          form: "projectile",
          element: "water",
          approachMode: "none",
          energyCost: 2,
          preparationMs: 700,
          travelMs: 650,
          recoveryMs: 400,
          allowedDistances: ["short", "medium", "long"],
          targetRelations: ["enemy"],
          effect: {
            damage: 18,
            tags: ["water"]
          }
        },
        presentationId: "skill:water-wave",
        metadata: {
          category: "heal",
          form: "self",
          note: "must never override definition"
        }
      },
      {
        id: "claw",
        definition: {
          id: "claw",
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
        presentationId: "skill:claw"
      },
      {
        id: "fireball",
        definition: {
          id: "fireball",
          name: "Boule de feu",
          category: "offensive",
          form: "projectile",
          element: "fire",
          approachMode: "none",
          energyCost: 3,
          preparationMs: 1100,
          travelMs: 700,
          recoveryMs: 500,
          allowedDistances: ["short", "medium", "long"],
          targetRelations: ["enemy"],
          projectileClash: {
            mode: "mutual_cancel",
            group: "fire-orb",
            interactsWith: ["fire-orb"]
          },
          effect: {
            damage: 30
          }
        },
        presentationId: "skill:fireball"
      },
      {
        id: "unused-heal",
        definition: {
          id: "unused-heal",
          name: "Soin non équipé",
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
      }
    ],
    rosters: [],
    presentation: {
      skills: {
        "skill:water-wave": {
          icon: "core:icon-water",
          category: "defensive",
          damage: 9999
        }
      }
    }
  };
}

test("Capture combat skill adapter returns the native normalized SkillDefinition", () => {
  const skill = adaptCaptureCombatSkill(fixture(), "water-wave");

  assert.equal(skill.id, "water-wave");
  assert.equal(skill.category, "offensive");
  assert.equal(skill.form, "projectile");
  assert.equal(skill.element, "water");
  assert.equal(skill.energyCost, 2);
  assert.equal(skill.effect.damage, 18);
  assert.deepEqual([...skill.targetRelations], ["enemy"]);
  assert.equal(Object.isFrozen(skill), true);
});

test("Capture combat creature skills preserve the declared skill order", () => {
  const skills = adaptCaptureCombatCreatureSkills(
    fixture(),
    "maraileron"
  );

  assert.deepEqual(
    skills.map((skill) => skill.id),
    ["water-wave", "claw"]
  );
  assert.equal(Object.isFrozen(skills), true);
});

test("Capture combat creature skills never inject unassigned skills", () => {
  const skills = adaptCaptureCombatCreatureSkills(
    fixture(),
    "maraileron"
  );

  assert.equal(
    skills.some((skill) => skill.id === "unused-heal"),
    false
  );
  assert.equal(
    skills.some((skill) => skill.id === "fireball"),
    false
  );
});

test("Capture combat skill adapter rejects an unknown skill", () => {
  assert.throws(
    () => adaptCaptureCombatSkill(fixture(), "legacy_magic_fire"),
    /Unknown Capture combat skill/i
  );
});

test("Capture combat creature skills reject an unknown creature", () => {
  assert.throws(
    () => adaptCaptureCombatCreatureSkills(fixture(), "missing"),
    /Unknown Capture combat creature/i
  );
});

test("invalid semantic definitions fail in SkillDefinition instead of being repaired", () => {
  const input = fixture();
  input.skills[0].definition.category = "legacy_magic";
  input.skills[0].definition.form = "mystery";

  assert.throws(
    () => adaptCaptureCombatSkill(input, "water-wave"),
    /Unsupported skill category/i
  );
});

test("metadata and presentation cannot override skill gameplay semantics", () => {
  const input = fixture();
  input.skills[0].metadata.category = "heal";
  input.skills[0].metadata.damage = 9999;
  input.presentation.skills["skill:water-wave"].category = "defensive";
  input.presentation.skills["skill:water-wave"].damage = 9999;

  const skill = adaptCaptureCombatSkill(input, "water-wave");

  assert.equal(skill.category, "offensive");
  assert.equal(skill.form, "projectile");
  assert.equal(skill.effect.damage, 18);
});

test("Capture combat skill adapter has no GenSrpG, DOM, storage or network authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/skill-to-skill-definition.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|github\.com|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
  );
});
