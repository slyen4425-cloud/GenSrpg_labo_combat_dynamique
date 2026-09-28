import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveCombatPreviewFormatV1
} from "../../src/ui/combat-2v2-test-ui.js";
import {
  normalizeBattleFormatDefinition
} from "../../src/contracts/battle-format-definition.js";

function format(activePerTeam) {
  const local = [];
  const enemy = [];
  const actors = [];

  for (let index = 0; index < activePerTeam; index += 1) {
    const n = index + 1;
    const localId = "local-" + n;
    const enemyId = "enemy-" + n;
    local.push(localId);
    enemy.push(enemyId);
    actors.push({
      actorId: localId,
      teamId: "local-team",
      creatureId: "local-creature-" + n,
      displayName: "Local " + n,
      fighterConfigId: "local-creature-" + n,
      controllerId: index === 0 ? "human-local" : "ai-ally"
    });
    actors.push({
      actorId: enemyId,
      teamId: "enemy-team",
      creatureId: "enemy-creature-" + n,
      displayName: "Enemy " + n,
      fighterConfigId: "enemy-creature-" + n,
      controllerId: "ai-enemy"
    });
  }

  return normalizeBattleFormatDefinition({
    id: "preview-" + activePerTeam,
    localActorId: "local-1",
    teams: {
      "local-team": local,
      "enemy-team": enemy
    },
    actors
  });
}

test("generic preview format resolves arbitrary team ids in 1v1", () => {
  const result = resolveCombatPreviewFormatV1(format(1));

  assert.equal(result.localTeamId, "local-team");
  assert.equal(result.enemyTeamId, "enemy-team");
  assert.deepEqual(result.localActorIds, ["local-1"]);
  assert.deepEqual(result.enemyActorIds, ["enemy-1"]);
  assert.equal(result.allyActorId, null);
  assert.equal(result.initialTargetId, "enemy-1");
});

test("generic preview format resolves exactly one ally in 2v2", () => {
  const result = resolveCombatPreviewFormatV1(format(2));

  assert.deepEqual(result.localActorIds, ["local-1", "local-2"]);
  assert.deepEqual(result.enemyActorIds, ["enemy-1", "enemy-2"]);
  assert.equal(result.allyActorId, "local-2");
  assert.equal(result.initialTargetId, "enemy-1");
});

test("generic preview format rejects unsupported team topology", () => {
  const threeTeams = normalizeBattleFormatDefinition({
    id: "bad-three-teams",
    localActorId: "a",
    teams: {
      one: ["a"],
      two: ["b"],
      three: ["c"]
    },
    actors: [
      {
        actorId: "a",
        teamId: "one",
        creatureId: "a",
        displayName: "A",
        fighterConfigId: "a",
        controllerId: "human-local"
      },
      {
        actorId: "b",
        teamId: "two",
        creatureId: "b",
        displayName: "B",
        fighterConfigId: "b",
        controllerId: "ai"
      },
      {
        actorId: "c",
        teamId: "three",
        creatureId: "c",
        displayName: "C",
        fighterConfigId: "c",
        controllerId: "ai"
      }
    ]
  });

  assert.throws(
    () => resolveCombatPreviewFormatV1(threeTeams),
    /exactly two teams|1v1|2v2/i
  );

  const tooMany = normalizeBattleFormatDefinition({
    id: "bad-3v3",
    localActorId: "l1",
    teams: {
      local: ["l1", "l2", "l3"],
      enemy: ["e1", "e2", "e3"]
    },
    actors: [
      ...["l1", "l2", "l3"].map((id, index) => ({
        actorId: id,
        teamId: "local",
        creatureId: "lc" + index,
        displayName: id,
        fighterConfigId: "lc" + index,
        controllerId: index === 0 ? "human-local" : "ai"
      })),
      ...["e1", "e2", "e3"].map((id, index) => ({
        actorId: id,
        teamId: "enemy",
        creatureId: "ec" + index,
        displayName: id,
        fighterConfigId: "ec" + index,
        controllerId: "ai"
      }))
    ]
  });

  assert.throws(
    () => resolveCombatPreviewFormatV1(tooMany),
    /1v1|2v2|one or two|1 or 2/i
  );
});
