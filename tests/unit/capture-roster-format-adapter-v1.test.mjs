import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  adaptCaptureExportToBattleFormat,
  adaptCaptureExportToRosterDefinition
} from "../../src/adapters/input/capture/capture-roster-format-adapter-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";

function creature(id, maxHp = 100) {
  return {
    id,
    displayName: id,
    combat: {
      maxHp,
      maxEnergy: 10
    },
    skillIds: []
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
    skills: [],
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
            id: "player-reserve",
            creatureId: "braisombre",
            displayName: "Braisombre réserve"
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
    ]
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

test("Capture roster/format adapter produces native 1v1 BattleFormatDefinition", () => {
  const format = adaptCaptureExportToBattleFormat(export1v1());

  assert.equal(format.id, "capture-duel");
  assert.equal(format.localActorId, "player");
  assert.equal(format.teamOf("player"), "players");
  assert.equal(format.teamOf("opponent"), "enemies");
  assert.equal(format.actor("player").fighterConfigId, "maraileron");
  assert.equal(format.actor("opponent").fighterConfigId, "braisombre");
});

test("Capture roster/format adapter uses the same data path for 2v2", () => {
  const format = adaptCaptureExportToBattleFormat(export2v2());

  assert.equal(format.actors.length, 4);
  assert.deepEqual(format.teams.players, ["player", "ally"]);
  assert.deepEqual(format.teams.enemies, ["opponent", "opponent-b"]);
  assert.equal(format.actor("ally").fighterConfigId, "golem");
  assert.equal(format.actor("opponent-b").controllerId, "ai-enemy-b");
});

test("Capture roster adapter output is consumed by the real Roster Session", () => {
  const roster = adaptCaptureExportToRosterDefinition(export1v1());
  const combatSession = createCombatSession({
    fighters: [
      {
        id: "player",
        maxHp: 100,
        maxEnergy: 10
      },
      {
        id: "opponent",
        maxHp: 120,
        maxEnergy: 10
      }
    ]
  });

  const rosterSession = createRosterSession({
    combatSession,
    roster,
    fighterConfigs: {
      maraileron: {
        id: "maraileron",
        maxHp: 100,
        maxEnergy: 10
      },
      braisombre: {
        id: "braisombre",
        maxHp: 120,
        maxEnergy: 10
      }
    }
  });

  const snapshot = rosterSession.snapshot();

  assert.equal(snapshot.player.slotId, "player");
  assert.equal(snapshot.player.activeMemberId, "player-marai");
  assert.equal(snapshot.player.members.length, 2);
  assert.equal(snapshot.opponent.activeMemberId, "opponent-braisombre");
});

test("Capture roster adapter maps fighterConfigId explicitly from creatureId", () => {
  const roster = adaptCaptureExportToRosterDefinition(export1v1());

  assert.equal(
    roster.teams.player.members[0].fighterConfigId,
    "maraileron"
  );
  assert.equal(
    roster.teams.player.members[1].fighterConfigId,
    "braisombre"
  );
});

test("Capture roster adapter rejects active roster creature mismatch with actor slot", () => {
  const input = export1v1();
  input.rosters[0].activeMemberId = "player-reserve";

  assert.throws(
    () => adaptCaptureExportToRosterDefinition(input),
    /active roster creature.*actor/i
  );
});

test("Capture roster adapter permits exports without reserve rosters", () => {
  const input = export1v1();
  delete input.rosters;

  const roster = adaptCaptureExportToRosterDefinition(input);

  assert.deepEqual(roster, { teams: {} });
});

test("Capture roster/format adapter has no special 2v2, GenSrpG, DOM or storage authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/capture-roster-format-adapter-v1.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /is2v2|Zombicide-40k|captureFix\d+|github\.com|window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
  );
});
