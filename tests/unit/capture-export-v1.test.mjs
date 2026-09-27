import test from "node:test";
import assert from "node:assert/strict";

import { normalizeCaptureExportV1 } from "../../src/contracts/capture-export-v1.js";

function validExport() {
  return {
    version: 1,
    localMemberId: "player-loup",
    creatures: [
      {
        id: "loup_volcanique",
        displayName: "Loup volcanique",
        combat: {
          maxHp: 120,
          initialHp: 120,
          maxEnergy: 10,
          initialEnergy: 2,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: -10
        },
        stats: {
          agilite: 17,
          defense: 8,
          custom_editor_stat: 42
        },
        progression: {
          level: 6
        },
        skillIds: ["fireball"]
      },
      {
        id: "golem_moussu",
        displayName: "Golem moussu",
        combat: {
          maxHp: 180,
          initialHp: 165,
          maxEnergy: 8,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2500,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 5
        },
        stats: {
          defense: 25
        },
        progression: {
          level: 5
        },
        skillIds: ["mirror-shield"]
      },
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
        stats: {},
        progression: {
          level: 4
        },
        skillIds: ["fireball"]
      },
      {
        id: "braisombre",
        displayName: "Braisombre",
        combat: {
          maxHp: 110,
          initialHp: 110,
          maxEnergy: 10,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        stats: {},
        progression: {
          level: 4
        },
        skillIds: ["fireball"]
      }
    ],
    skills: [
      {
        id: "fireball",
        name: "Boule de feu",
        category: "offensive",
        form: "projectile",
        element: "fire",
        approachMode: "none",
        energyCost: 3,
        preparationMs: 2000,
        travelMs: 700,
        recoveryMs: 700,
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
      {
        id: "mirror-shield",
        name: "Bouclier miroir",
        category: "defensive",
        form: "self",
        element: null,
        approachMode: "none",
        energyCost: 2,
        preparationMs: 500,
        travelMs: 0,
        recoveryMs: 500,
        allowedDistances: ["short", "medium", "long"],
        targetRelations: ["self"],
        reaction: {
          blockForms: ["projectile"],
          reflectForms: ["projectile"]
        }
      }
    ],
    teams: [
      {
        id: "players",
        members: [
          {
            id: "player-loup",
            creatureId: "loup_volcanique",
            controllerId: "human-local",
            active: true
          },
          {
            id: "player-golem",
            creatureId: "golem_moussu",
            controllerId: "ai-ally",
            active: true
          }
        ]
      },
      {
        id: "enemies",
        members: [
          {
            id: "enemy-maraileron",
            creatureId: "maraileron",
            controllerId: "ai-enemy-a",
            active: true
          },
          {
            id: "enemy-braisombre",
            creatureId: "braisombre",
            controllerId: "ai-enemy-b",
            active: true
          }
        ]
      }
    ]
  };
}

test("CaptureExportV1 normalizes a neutral 2v2 export", () => {
  const normalized = normalizeCaptureExportV1(validExport());

  assert.equal(normalized.version, 1);
  assert.equal(normalized.localMemberId, "player-loup");
  assert.equal(normalized.creatures.length, 4);
  assert.equal(normalized.skills.length, 2);
  assert.equal(normalized.teams.length, 2);

  const loup = normalized.creatures.find(
    (creature) => creature.id === "loup_volcanique"
  );
  assert.deepEqual(loup.stats, {
    agilite: 17,
    defense: 8,
    custom_editor_stat: 42
  });
  assert.equal(loup.combat.maxHp, 120);
  assert.equal(loup.progression.level, 6);

  const local = normalized.teams
    .flatMap((team) => team.members)
    .find((member) => member.id === normalized.localMemberId);
  assert.equal(local.active, true);
  assert.equal(local.creatureId, "loup_volcanique");

  assert.ok(Object.isFrozen(normalized));
  assert.ok(Object.isFrozen(normalized.creatures));
  assert.ok(Object.isFrozen(normalized.skills));
  assert.ok(Object.isFrozen(normalized.teams));
});

test("CaptureExportV1 rejects unknown versions", () => {
  const input = validExport();
  input.version = 2;
  assert.throws(
    () => normalizeCaptureExportV1(input),
    /Unsupported CaptureExport version/
  );
});

test("CaptureExportV1 rejects duplicate creature ids", () => {
  const input = validExport();
  input.creatures.push({ ...input.creatures[0] });
  assert.throws(
    () => normalizeCaptureExportV1(input),
    /duplicate creature id/
  );
});

test("CaptureExportV1 delegates skill semantics to SkillDefinition", () => {
  const input = validExport();
  input.skills[0].category = "legacy-fire-magic";
  assert.throws(
    () => normalizeCaptureExportV1(input),
    /Unsupported skill category/
  );
});

test("CaptureExportV1 rejects unknown skill references from creatures", () => {
  const input = validExport();
  input.creatures[0].skillIds = ["legacy_unknown_skill"];
  assert.throws(
    () => normalizeCaptureExportV1(input),
    /unknown skill/
  );
});

test("CaptureExportV1 rejects members referencing unknown creatures", () => {
  const input = validExport();
  input.teams[0].members[0].creatureId = "missing-creature";
  assert.throws(
    () => normalizeCaptureExportV1(input),
    /unknown creature/
  );
});

test("CaptureExportV1 rejects an inactive local member", () => {
  const input = validExport();
  input.teams[0].members[0].active = false;
  assert.throws(
    () => normalizeCaptureExportV1(input),
    /localMemberId must reference an active member/
  );
});

test("CaptureExportV1 rejects duplicate member ids across teams", () => {
  const input = validExport();
  input.teams[1].members[0].id = "player-loup";
  assert.throws(
    () => normalizeCaptureExportV1(input),
    /duplicate member id/
  );
});

test("CaptureExportV1 rejects duplicate team ids", () => {
  const input = validExport();
  input.teams[1].id = "players";
  assert.throws(
    () => normalizeCaptureExportV1(input),
    /duplicate team id/
  );
});

test("CaptureExportV1 treats source stats as numeric data, not gameplay aliases", () => {
  const input = validExport();
  input.creatures[0].stats = {
    agility: 12,
    agilite: 99,
    mystery: -4
  };

  const normalized = normalizeCaptureExportV1(input);
  const stats = normalized.creatures[0].stats;

  assert.deepEqual(stats, {
    agility: 12,
    agilite: 99,
    mystery: -4
  });
  assert.equal(stats.agility, 12);
  assert.equal(stats.agilite, 99);
});

test("CaptureExportV1 rejects non-numeric source stats", () => {
  const input = validExport();
  input.creatures[0].stats = {
    agilite: "fast"
  };
  assert.throws(
    () => normalizeCaptureExportV1(input),
    /stats\.agilite must be a finite number/
  );
});
