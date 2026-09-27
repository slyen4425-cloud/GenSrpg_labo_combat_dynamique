import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import {
  captureCreatureToFighterConfig
} from "../../src/adapters/input/capture/creature-to-fighter-config.js";
import {
  adaptCaptureCombatBattleFormat,
  adaptCaptureCombatRoster
} from "../../src/adapters/input/capture/roster-format-adapter.js";

function combat(maxHp = 100, movementEnergyPerStep = 1) {
  return {
    maxHp,
    initialHp: maxHp,
    maxEnergy: 10,
    initialEnergy: 0,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep,
    chargeTimeModifierPct: 0
  };
}

function fixture2v2() {
  return {
    schema: "capture-combat-export-v1",
    battle: {
      id: "capture-coop-test",
      localActorId: "player"
    },
    teams: {
      players: ["player", "ally"],
      enemies: ["opponent", "opponent-b"]
    },
    actors: [
      {
        actorId: "player",
        teamId: "players",
        creatureId: "wolf",
        displayName: "Loup",
        controllerId: "human-local"
      },
      {
        actorId: "ally",
        teamId: "players",
        creatureId: "golem",
        displayName: "Golem",
        controllerId: "ai-ally"
      },
      {
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "maraileron",
        displayName: "Maraileron",
        controllerId: "ai-enemy-a"
      },
      {
        actorId: "opponent-b",
        teamId: "enemies",
        creatureId: "braisombre",
        displayName: "Braisombre",
        controllerId: "ai-enemy-b"
      }
    ],
    creatures: [
      { id: "wolf", displayName: "Loup", combat: combat(110, 1), skillIds: [] },
      { id: "golem", displayName: "Golem", combat: combat(150, 2), skillIds: [] },
      { id: "maraileron", displayName: "Maraileron", combat: combat(100, 1), skillIds: [] },
      { id: "braisombre", displayName: "Braisombre", combat: combat(120, 3), skillIds: [] }
    ],
    skills: [],
    rosters: [
      {
        slotId: "player",
        activeMemberId: "player-wolf",
        members: [
          { id: "player-wolf", creatureId: "wolf", displayName: "Loup" },
          { id: "player-marai", creatureId: "maraileron", displayName: "Maraileron" }
        ]
      },
      {
        slotId: "opponent",
        activeMemberId: "enemy-marai",
        members: [
          { id: "enemy-marai", creatureId: "maraileron", displayName: "Maraileron" },
          { id: "enemy-braisombre", creatureId: "braisombre", displayName: "Braisombre" }
        ]
      }
    ],
    presentation: {
      arena: { assetId: "core:arena-test" }
    },
    metadata: {
      modeLabel: "whatever"
    }
  };
}

function fixture1v1() {
  const input = fixture2v2();
  input.battle.id = "capture-duel-test";
  input.teams = {
    players: ["player"],
    enemies: ["opponent"]
  };
  input.actors = input.actors.filter(
    (actor) => actor.actorId === "player" || actor.actorId === "opponent"
  );
  return input;
}

test("Capture battle format adapter maps a 2v2 export through BattleFormatDefinition", () => {
  const format = adaptCaptureCombatBattleFormat(fixture2v2());

  assert.equal(format.id, "capture-coop-test");
  assert.equal(format.localActorId, "player");
  assert.deepEqual([...format.teams.players], ["player", "ally"]);
  assert.deepEqual([...format.teams.enemies], ["opponent", "opponent-b"]);
  assert.equal(format.actors.length, 4);
  assert.equal(format.teamOf("ally"), "players");
  assert.equal(format.teamOf("opponent-b"), "enemies");
  assert.equal(format.actor("player").fighterConfigId, "wolf");
  assert.equal(format.actor("ally").controllerId, "ai-ally");
  assert.equal(format.actor("opponent-b").controllerId, "ai-enemy-b");
});

test("the same Capture battle format adapter maps 1v1 without a special mode branch", () => {
  const format = adaptCaptureCombatBattleFormat(fixture1v1());

  assert.equal(format.id, "capture-duel-test");
  assert.deepEqual(format.actors.map((actor) => actor.actorId), [
    "player",
    "opponent"
  ]);
  assert.deepEqual([...format.teams.players], ["player"]);
  assert.deepEqual([...format.teams.enemies], ["opponent"]);
});

test("Capture roster adapter preserves slot, active member, member order and fighter config identity", () => {
  const roster = adaptCaptureCombatRoster(fixture2v2());

  assert.deepEqual(Object.keys(roster.teams), ["player", "opponent"]);
  assert.equal(roster.teams.player.slotId, "player");
  assert.equal(roster.teams.player.activeMemberId, "player-wolf");
  assert.deepEqual(
    roster.teams.player.members.map((member) => member.id),
    ["player-wolf", "player-marai"]
  );
  assert.equal(
    roster.teams.player.members[1].fighterConfigId,
    "maraileron"
  );
  assert.equal(Object.isFrozen(roster), true);
  assert.equal(Object.isFrozen(roster.teams.player.members), true);
});

test("Capture roster output is accepted by the real RosterSession", () => {
  const input = fixture1v1();
  const fighterConfigs = Object.fromEntries(
    input.creatures.map((creature) => [
      creature.id,
      captureCreatureToFighterConfig(creature)
    ])
  );
  const format = adaptCaptureCombatBattleFormat(input);
  const fighters = format.actors.map((actor) => ({
    ...fighterConfigs[actor.fighterConfigId],
    id: actor.actorId
  }));
  const combatSession = createCombatSession({ fighters });
  const roster = adaptCaptureCombatRoster(input);
  const rosterSession = createRosterSession({
    combatSession,
    roster,
    fighterConfigs
  });

  const snapshot = rosterSession.snapshot();
  assert.equal(snapshot.player.activeMemberId, "player-wolf");
  assert.equal(snapshot.player.members.length, 2);
  assert.equal(snapshot.opponent.activeMemberId, "enemy-marai");
  assert.equal(snapshot.opponent.members.length, 2);
});

test("controllers are copied from export and never decided by the roster/format adapter", () => {
  const input = fixture2v2();
  input.actors[1].controllerId = "human-remote";

  const format = adaptCaptureCombatBattleFormat(input);

  assert.equal(format.actor("ally").controllerId, "human-remote");
});

test("Capture roster and format adapters do not propagate presentation or metadata", () => {
  const input = fixture2v2();
  const format = adaptCaptureCombatBattleFormat(input);
  const roster = adaptCaptureCombatRoster(input);

  assert.equal("presentation" in format, false);
  assert.equal("metadata" in format, false);
  assert.equal("presentation" in roster, false);
  assert.equal("metadata" in roster, false);
});

test("Capture roster/format adapter has no mode hack, GenSrpG, DOM, storage or network authority", async () => {
  const source = await readFile(
    "src/adapters/input/capture/roster-format-adapter.js",
    "utf8"
  );

  assert.doesNotMatch(source, /\bis2v2\b|Zombicide-40k|github\.com/);
  assert.doesNotMatch(
    source,
    /window\.|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|fetch\(|XMLHttpRequest/
  );
});
