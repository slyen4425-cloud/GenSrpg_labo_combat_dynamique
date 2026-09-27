import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  createRosterSession
} from "../../src/core/combat/roster-session.js";

function creature(id, maxHp = 100) {
  return {
    id,
    displayName: id,
    combat: {
      maxHp,
      initialHp: maxHp,
      maxEnergy: 10,
      initialEnergy: 10,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: 0
    },
    skillIds: id === "maraileron" ? ["fireball"] : []
  };
}

function fireball() {
  return {
    id: "fireball",
    definition: {
      id: "fireball",
      name: "Boule de feu",
      category: "offensive",
      form: "projectile",
      element: "fire",
      energyCost: 3,
      preparationMs: 1000,
      travelMs: 600,
      recoveryMs: 400,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      approachMode: "none",
      effect: {
        damage: 30
      }
    },
    presentationId: "skill:fireball"
  };
}

function fireballBinding() {
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
      }
    }
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
      creature("braisombre", 120)
    ],
    skills: [fireball()],
    rosters: [
      {
        slotId: "player",
        activeMemberId: "player-marai",
        members: [
          {
            id: "player-marai",
            creatureId: "maraileron",
            displayName: "Maraileron"
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
        "skill:fireball": fireballBinding()
      }
    }
  };
}

function export2v2() {
  const input = export1v1();
  input.battle.id = "capture-coop-2v2";
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
  input.creatures.push(
    creature("golem", 150),
    creature("dragon", 130)
  );
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

test("Capture adapter stack composes one native 1v1 package", () => {
  const result = adaptCaptureCombatExportStackV1(export1v1());

  assert.equal(result.battleFormat.id, "capture-duel");
  assert.equal(result.battleFormat.localActorId, "player");
  assert.equal(result.fighterConfigs.maraileron.id, "maraileron");
  assert.equal(result.fighterConfigs.braisombre.maxHp, 120);
  assert.equal(result.fighters.length, 2);
  assert.equal(result.fighters[0].id, "player");
  assert.equal(result.fighters[1].id, "opponent");
  assert.equal(result.skills.fireball.form, "projectile");
  assert.equal(
    result.skillPresentations.fireball.visual.icon.assetId,
    "core:icon-skill-fireball-01"
  );
  assert.equal(Object.isFrozen(result), true);
});

test("Capture adapter stack uses the same path for 2v2 without a mode switch", () => {
  const result = adaptCaptureCombatExportStackV1(export2v2());

  assert.equal(result.battleFormat.actors.length, 4);
  assert.deepEqual(
    result.fighters.map((fighter) => fighter.id),
    ["player", "ally", "opponent", "opponent-b"]
  );
  assert.equal(result.fighterConfigs.golem.maxHp, 150);
  assert.equal(
    result.roster.teams["opponent-b"].activeMemberId,
    "opponent-dragon"
  );
});

test("Capture adapter stack output drives real CombatSession and RosterSession", () => {
  const adapted = adaptCaptureCombatExportStackV1(export1v1());
  const combatSession = createCombatSession({
    fighters: adapted.fighters
  });
  const rosterSession = createRosterSession({
    combatSession,
    roster: adapted.roster,
    fighterConfigs: adapted.fighterConfigs
  });

  const roster = rosterSession.snapshot();
  assert.equal(roster.player.activeMemberId, "player-marai");
  assert.equal(roster.opponent.activeMemberId, "opponent-braisombre");

  const preview = combatSession.previewSkill({
    actorId: "player",
    targetId: "opponent",
    skill: adapted.skills.fireball
  });

  assert.equal(preview.ok, true);
  assert.equal(preview.outcome, "hit");
});

test("Capture adapter stack keeps missing presentation as null and out of gameplay", () => {
  const input = export1v1();
  input.skills[0].presentationId = null;
  input.presentation = {};

  const result = adaptCaptureCombatExportStackV1(input);

  assert.equal(result.skillPresentations.fireball, null);
  assert.equal("presentationId" in result.skills.fireball, false);
  assert.equal("assetId" in result.skills.fireball, false);
});

test("Capture adapter stack delegates validation instead of duplicating domain rules", async () => {
  const source = await readFile(
    "src/adapters/input/capture/capture-export-adapter-stack-v1.js",
    "utf8"
  );

  for (const requiredImport of [
    "normalizeCaptureCombatExportV1",
    "adaptCaptureCreatureToFighterConfig",
    "adaptCaptureSkillToSkillDefinition",
    "adaptCaptureExportToBattleFormat",
    "adaptCaptureExportToRosterDefinition",
    "adaptCaptureSkillPresentationBinding"
  ]) {
    assert.match(source, new RegExp(requiredImport));
  }

  assert.doesNotMatch(
    source,
    /is2v2|allowedDistances\s*=|targetRelations\s*=|maxHp\s*>|initialHp\s*>|energyCost\s*>|projectileClash\.mode\s*=/
  );
});

test("Capture adapter stack has no GenSrpG, DOM, storage, network or renderer authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/capture-export-adapter-stack-v1.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|captureFix\d+|github\.com|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest|querySelector|Renderer|render\(/
  );
});
