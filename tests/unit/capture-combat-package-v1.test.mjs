import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_COMBAT_PACKAGE_SCHEMA,
  adaptCaptureCombatExportToPackage
} from "../../src/adapters/input/capture/capture-combat-package-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";

function creature(id, hp = 100) {
  return {
    id,
    displayName: id,
    combat: {
      maxHp: hp,
      initialHp: hp,
      maxEnergy: 10,
      initialEnergy: 10
    },
    skillIds: id === "maraileron" ? ["fireball"] : []
  };
}

function fireballPresentation() {
  return {
    id: "skill:fireball",
    version: 1,
    subjectType: "skill",
    subjectId: "fireball",
    visual: {
      icon: {
        assetId: "core:icon-skill-fireball-01"
      },
      travel: {
        assetId: "pack:capture:sprite-projectile-fire-01",
        attachment: "trajectory",
        trigger: "travel-start"
      },
      impact: {
        assetId: "pack:capture:sprite-impact-fire-01",
        attachment: "target",
        trigger: "impact"
      }
    },
    audio: {}
  };
}

function export1v1() {
  return {
    schema: "capture-combat-export-v1",
    battle: {
      id: "capture-duel",
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
      creature("maraileron"),
      creature("braisombre", 120),
      creature("golem", 150)
    ],
    skills: [
      {
        id: "fireball",
        definition: {
          id: "fireball",
          name: "Boule de feu",
          category: "offensive",
          form: "projectile",
          element: "fire",
          energyCost: 3,
          preparationMs: 1000,
          travelMs: 700,
          recoveryMs: 400,
          allowedDistances: ["medium", "long"],
          effect: {
            damage: 30
          }
        },
        presentationId: "skill:fireball"
      }
    ],
    rosters: [
      {
        slotId: "player",
        activeMemberId: "player-marai",
        members: [
          {
            id: "player-marai",
            creatureId: "maraileron",
            displayName: "Maraileron"
          },
          {
            id: "player-golem",
            creatureId: "golem",
            displayName: "Golem"
          }
        ]
      },
      {
        slotId: "opponent",
        activeMemberId: "opponent-braisombre",
        members: [
          {
            id: "opponent-braisombre",
            creatureId: "braisombre",
            displayName: "Braisombre"
          }
        ]
      }
    ],
    presentation: {
      skills: {
        "skill:fireball": fireballPresentation()
      }
    }
  };
}

function export2v2() {
  const input = export1v1();
  input.battle.id = "capture-2v2";
  input.teams = {
    players: ["player", "ally"],
    enemies: ["opponent", "opponent-b"]
  };
  input.actors = [
    input.actors[0],
    {
      actorId: "ally",
      teamId: "players",
      creatureId: "golem",
      displayName: "Golem",
      controllerId: "ai-ally"
    },
    input.actors[1],
    {
      actorId: "opponent-b",
      teamId: "enemies",
      creatureId: "dragon",
      displayName: "Dragon",
      controllerId: "ai-enemy-b"
    }
  ];
  input.creatures.push(creature("dragon", 130));
  input.rosters.push(
    {
      slotId: "ally",
      activeMemberId: "ally-golem",
      members: [
        {
          id: "ally-golem",
          creatureId: "golem",
          displayName: "Golem"
        }
      ]
    },
    {
      slotId: "opponent-b",
      activeMemberId: "opponent-dragon",
      members: [
        {
          id: "opponent-dragon",
          creatureId: "dragon",
          displayName: "Dragon"
        }
      ]
    }
  );
  return input;
}

function fightersFor(packageValue) {
  return packageValue.battleFormat.actors.map((actor) => ({
    ...packageValue.fighterConfigs[actor.fighterConfigId],
    id: actor.actorId
  }));
}

test("CaptureCombatPackageV1 composes all existing Capture adapters", () => {
  const packageValue = adaptCaptureCombatExportToPackage(export1v1());

  assert.equal(
    CAPTURE_COMBAT_PACKAGE_SCHEMA,
    "capture-combat-package-v1"
  );
  assert.equal(packageValue.schema, CAPTURE_COMBAT_PACKAGE_SCHEMA);
  assert.equal(packageValue.fighterConfigs.maraileron.maxHp, 100);
  assert.equal(packageValue.fighterConfigs.braisombre.maxHp, 120);
  assert.equal(packageValue.skills.fireball.form, "projectile");
  assert.equal(packageValue.battleFormat.id, "capture-duel");
  assert.equal(
    packageValue.roster.teams.player.activeMemberId,
    "player-marai"
  );
  assert.equal(
    packageValue.skillPresentations.fireball.id,
    "skill:fireball"
  );
  assert.equal(Object.isFrozen(packageValue), true);
  assert.equal(Object.isFrozen(packageValue.fighterConfigs), true);
  assert.equal(Object.isFrozen(packageValue.skills), true);
});

test("CaptureCombatPackageV1 does not mutate exported data", () => {
  const input = export1v1();
  adaptCaptureCombatExportToPackage(input);

  assert.equal(input.creatures[0].combat.maxHp, 100);
  assert.equal(input.skills[0].definition.id, "fireball");
  assert.equal(
    input.presentation.skills["skill:fireball"].subjectId,
    "fireball"
  );
});

test("CaptureCombatPackageV1 preserves null presentation fallback", () => {
  const input = export1v1();
  input.skills[0].presentationId = null;
  input.presentation = {};

  const packageValue = adaptCaptureCombatExportToPackage(input);

  assert.equal(packageValue.skillPresentations.fireball, null);
});

test("Capture package feeds the real Combat Session skill preview path", () => {
  const packageValue = adaptCaptureCombatExportToPackage(export1v1());
  const session = createCombatSession({
    distance: "medium",
    fighters: fightersFor(packageValue)
  });

  const result = session.previewSkill({
    actorId: "player",
    targetId: "opponent",
    skill: packageValue.skills.fireball
  });

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "hit");
});

test("Capture package roster feeds the real Roster Session", () => {
  const packageValue = adaptCaptureCombatExportToPackage(export1v1());
  const session = createCombatSession({
    fighters: fightersFor(packageValue)
  });

  const roster = createRosterSession({
    combatSession: session,
    roster: packageValue.roster,
    fighterConfigs: packageValue.fighterConfigs
  });

  const snapshot = roster.snapshot();

  assert.equal(snapshot.player.activeMemberId, "player-marai");
  assert.equal(snapshot.player.members.length, 2);
  assert.equal(snapshot.opponent.activeMemberId, "opponent-braisombre");
});

test("Capture package uses the same composition path for 2v2", () => {
  const packageValue = adaptCaptureCombatExportToPackage(export2v2());
  const fighters = fightersFor(packageValue);
  const session = createCombatSession({ fighters });

  assert.equal(packageValue.battleFormat.actors.length, 4);
  assert.equal(fighters.length, 4);
  assert.equal(Object.keys(session.snapshot().fighters).length, 4);
  assert.deepEqual(
    packageValue.battleFormat.teams.players,
    ["player", "ally"]
  );
  assert.deepEqual(
    packageValue.battleFormat.teams.enemies,
    ["opponent", "opponent-b"]
  );
});

test("Capture package assembler contains no second gameplay mapping or runtime authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/capture-combat-package-v1.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /maxHp|energyCost|targetRelations|projectileClash|is2v2|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest|Zombicide-40k|github\.com/
  );
});
