import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_COMBAT_EXPORT_SCHEMA,
  normalizeCaptureCombatExportV1
} from "../../src/contracts/capture-combat-export-v1.js";

function validExport() {
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
          initialEnergy: 0
        },
        skillIds: ["water-wave"],
        presentationId: "creature:maraileron"
      },
      {
        id: "braisombre",
        displayName: "Braisombre",
        combat: {
          maxHp: 120,
          initialHp: 120,
          maxEnergy: 10,
          initialEnergy: 0
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
          element: "water"
        },
        presentationId: "skill:water-wave"
      },
      {
        id: "fireball",
        definition: {
          id: "fireball",
          name: "Boule de feu",
          category: "offensive",
          form: "projectile",
          element: "fire"
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
      creatures: {
        "creature:maraileron": {
          playerAssetId: "project:maraileron-player",
          opponentAssetId: "project:maraileron-opponent"
        }
      },
      skills: {
        "skill:fireball": {
          icon: "core:icon-skill-fireball-01",
          travelFx: "pack:capture:sprite-projectile-fire-01"
        }
      }
    },
    metadata: {
      producer: "fixture-only",
      sourceStats: {
        agility: 12
      }
    }
  };
}

test("CaptureCombatExportV1 normalizes a portable 1v1 snapshot", () => {
  const value = normalizeCaptureCombatExportV1(validExport());

  assert.equal(CAPTURE_COMBAT_EXPORT_SCHEMA, "capture-combat-export-v1");
  assert.equal(value.schema, CAPTURE_COMBAT_EXPORT_SCHEMA);
  assert.equal(value.battle.localActorId, "player");
  assert.equal(value.actors.length, 2);
  assert.equal(value.creatures.length, 2);
  assert.equal(value.skills.length, 2);
  assert.equal(value.rosters.length, 2);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.creatures[0].combat), true);
  assert.equal(Object.isFrozen(value.presentation), true);
});

test("CaptureCombatExportV1 rejects duplicate identifiers", () => {
  const input = validExport();
  input.creatures.push({
    ...input.creatures[0],
    displayName: "Duplicate"
  });

  assert.throws(
    () => normalizeCaptureCombatExportV1(input),
    /duplicate creature id/i
  );
});

test("CaptureCombatExportV1 validates actor creature references", () => {
  const input = validExport();
  input.actors[0].creatureId = "missing";

  assert.throws(
    () => normalizeCaptureCombatExportV1(input),
    /unknown creature/i
  );
});

test("CaptureCombatExportV1 validates team membership and actor teamId together", () => {
  const input = validExport();
  input.actors[0].teamId = "enemies";

  assert.throws(
    () => normalizeCaptureCombatExportV1(input),
    /team/i
  );
});

test("CaptureCombatExportV1 requires localActorId to reference an actor", () => {
  const input = validExport();
  input.battle.localActorId = "ghost";

  assert.throws(
    () => normalizeCaptureCombatExportV1(input),
    /localActorId/i
  );
});

test("CaptureCombatExportV1 resolves every creature skill id", () => {
  const input = validExport();
  input.creatures[0].skillIds.push("missing-skill");

  assert.throws(
    () => normalizeCaptureCombatExportV1(input),
    /unknown skill/i
  );
});

test("CaptureCombatExportV1 validates roster active member and creature references", () => {
  const badActive = validExport();
  badActive.rosters[0].activeMemberId = "missing-member";
  assert.throws(
    () => normalizeCaptureCombatExportV1(badActive),
    /activeMemberId/i
  );

  const badCreature = validExport();
  badCreature.rosters[0].members[0].creatureId = "missing-creature";
  assert.throws(
    () => normalizeCaptureCombatExportV1(badCreature),
    /unknown creature/i
  );
});

test("CaptureCombatExportV1 requires JSON-compatible opaque definition and presentation data", () => {
  const badDefinition = validExport();
  badDefinition.skills[0].definition.compute = () => 1;
  assert.throws(
    () => normalizeCaptureCombatExportV1(badDefinition),
    /JSON-compatible/i
  );

  const badPresentation = validExport();
  badPresentation.presentation.skills["skill:fireball"].node = {
    ownerDocument: undefined
  };
  assert.throws(
    () => normalizeCaptureCombatExportV1(badPresentation),
    /JSON-compatible/i
  );
});

test("CaptureCombatExportV1 never infers skill identity from labels", () => {
  const input = validExport();
  input.skills[0].definition.id = "other-id";

  assert.throws(
    () => normalizeCaptureCombatExportV1(input),
    /definition\.id/i
  );
});

test("CaptureCombatExportV1 contract has no GenSrpG, DOM, storage or network authority", async () => {
  const source = await readFile(
    "src/contracts/capture-combat-export-v1.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|github\.com|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
  );
});
