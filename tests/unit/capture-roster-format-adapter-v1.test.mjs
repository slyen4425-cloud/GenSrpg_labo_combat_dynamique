import test from "node:test";
import assert from "node:assert/strict";

import {
  adaptCaptureBattleFormat,
  adaptCaptureSingleActiveRoster
} from "../../src/adapters/input/capture/roster-format-adapter-v1.js";

function creature(id, name) {
  return {
    id,
    displayName: name,
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
    skillIds: ["basic"]
  };
}

function fixture() {
  return {
    version: 1,
    localMemberId: "p1",
    creatures: [
      creature("wolf", "Loup"),
      creature("golem", "Golem"),
      creature("dolphin", "Maraileron"),
      creature("dragon", "Dragon"),
      creature("reserve", "Réserve")
    ],
    skills: [
      {
        id: "basic",
        name: "Attaque",
        category: "offensive",
        form: "contact",
        element: null,
        approachMode: "ground",
        energyCost: 1,
        preparationMs: 100,
        travelMs: 300,
        recoveryMs: 100,
        allowedDistances: ["short"],
        targetRelations: ["enemy"],
        effect: { damage: 5 }
      }
    ],
    teams: [
      {
        id: "players",
        members: [
          {
            id: "p1",
            creatureId: "wolf",
            controllerId: "human-local",
            active: true
          },
          {
            id: "p2",
            creatureId: "golem",
            controllerId: "ai-ally",
            active: true
          },
          {
            id: "p-reserve",
            creatureId: "reserve",
            controllerId: "reserve",
            active: false
          }
        ]
      },
      {
        id: "enemies",
        members: [
          {
            id: "e1",
            creatureId: "dolphin",
            controllerId: "ai-enemy-a",
            active: true
          },
          {
            id: "e2",
            creatureId: "dragon",
            controllerId: "ai-enemy-b",
            active: true
          }
        ]
      }
    ]
  };
}

test("Capture format adapter produces a native 2v2 BattleFormatDefinition", () => {
  const format = adaptCaptureBattleFormat(
    fixture(),
    { id: "capture-2v2-preview" }
  );

  assert.equal(format.id, "capture-2v2-preview");
  assert.equal(format.localActorId, "p1");
  assert.deepEqual([...format.teams.players], ["p1", "p2"]);
  assert.deepEqual([...format.teams.enemies], ["e1", "e2"]);
  assert.deepEqual(
    format.actors.map((actor) => actor.actorId),
    ["p1", "p2", "e1", "e2"]
  );

  assert.deepEqual(format.actor("p2"), {
    actorId: "p2",
    teamId: "players",
    creatureId: "golem",
    displayName: "Golem",
    fighterConfigId: "golem",
    controllerId: "ai-ally"
  });
  assert.equal(format.teamOf("e2"), "enemies");
  assert.ok(Object.isFrozen(format));
});

test("Capture format adapter excludes reserve members from active actors", () => {
  const format = adaptCaptureBattleFormat(fixture());

  assert.equal(
    format.actors.some((actor) => actor.actorId === "p-reserve"),
    false
  );
  assert.equal(
    format.teams.players.includes("p-reserve"),
    false
  );
});

test("Capture format adapter copies controller ids without deciding AI behavior", () => {
  const input = fixture();
  input.teams[1].members[0].controllerId =
    "future-custom-controller";

  const format = adaptCaptureBattleFormat(input);
  assert.equal(
    format.actor("e1").controllerId,
    "future-custom-controller"
  );
});

test("single-active Capture roster keeps active member and reserves", () => {
  const input = fixture();
  input.teams[0].members[1].active = false;
  input.teams[1].members[1].active = false;

  const roster = adaptCaptureSingleActiveRoster(input);

  assert.deepEqual(roster.teams.players, {
    slotId: "players",
    activeMemberId: "p1",
    members: [
      {
        id: "p1",
        creatureId: "wolf",
        displayName: "Loup",
        fighterConfigId: "wolf"
      },
      {
        id: "p2",
        creatureId: "golem",
        displayName: "Golem",
        fighterConfigId: "golem"
      },
      {
        id: "p-reserve",
        creatureId: "reserve",
        displayName: "Réserve",
        fighterConfigId: "reserve"
      }
    ]
  });

  assert.deepEqual(roster.teams.enemies, {
    slotId: "enemies",
    activeMemberId: "e1",
    members: [
      {
        id: "e1",
        creatureId: "dolphin",
        displayName: "Maraileron",
        fighterConfigId: "dolphin"
      },
      {
        id: "e2",
        creatureId: "dragon",
        displayName: "Dragon",
        fighterConfigId: "dragon"
      }
    ]
  });

  assert.ok(Object.isFrozen(roster));
  assert.ok(Object.isFrozen(roster.teams));
});

test("single-active roster adapter rejects 2v2 instead of inventing extra slots", () => {
  assert.throws(
    () => adaptCaptureSingleActiveRoster(fixture()),
    /exactly one active member per team/
  );
});
