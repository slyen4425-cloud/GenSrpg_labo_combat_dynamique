import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildExplorationEncounterCombatSourceV1
} from "../../src/adapters/input/capture/exploration-encounter-combat-source-v1.js";

async function records() {
  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-creatures.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  return raw.entries;
}

function snapshot(opponentCreatureId = "crea_nat_3") {
  return {
    schema: "capture-encounter-snapshot-v1",
    version: 1,
    encounterId: "encounter-42",
    source: "terrain-random",
    player: {
      partyRef: "capture-party-preview"
    },
    opponents: [
      { creatureId: opponentCreatureId }
    ],
    rules: {
      rulesetId: "capture.standard.1v1"
    },
    context: {
      areaId: "forest-exterior",
      terrainFamilyId: "forest",
      elementId: "nature"
    },
    returnToken: "return-42"
  };
}

test("Exploration snapshot builds real 1v1 Combat source with the encountered creature", async () => {
  const source =
    buildExplorationEncounterCombatSourceV1({
      snapshot: snapshot(),
      creatureRecords: await records()
    });

  assert.equal(
    source.battleFormat.localActorId,
    "local-1"
  );
  assert.deepEqual(
    source.battleFormat.teams["local-team"],
    ["local-1"]
  );
  assert.deepEqual(
    source.battleFormat.teams["enemy-team"],
    ["enemy-1"]
  );

  const enemy =
    source.battleFormat.actors.find(
      (actor) => actor.actorId === "enemy-1"
    );

  assert.equal(enemy.creatureId, "crea_nat_3");
  assert.equal(enemy.displayName, "Ancêtronc");

  const enemyFighter =
    source.fighters.find(
      (fighter) => fighter.id === "enemy-1"
    );

  assert.equal(enemyFighter.maxHp, 70);
  assert.ok(
    source.skillIdsByActor["enemy-1"].length > 0
  );
  assert.ok(
    source.skillIdsByActor["enemy-1"].every(
      (skillId) => skillId.startsWith("cap_earth_")
    )
  );
});

test("preview party ref resolves explicitly to Maraileron without changing opponent identity", async () => {
  const source =
    buildExplorationEncounterCombatSourceV1({
      snapshot: snapshot("crea_nat_3"),
      creatureRecords: await records()
    });

  const local =
    source.battleFormat.actors.find(
      (actor) => actor.actorId === "local-1"
    );

  assert.equal(local.creatureId, "crea_maraileron");
  assert.equal(local.displayName, "Maraileron");
});

test("bridge rejects unknown party refs instead of inventing a player roster", async () => {
  const raw = snapshot();
  raw.player.partyRef = "unknown-party";
  const sourceRecords = await records();

  assert.throws(
    () =>
      buildExplorationEncounterCombatSourceV1({
        snapshot: raw,
        creatureRecords: sourceRecords
      }),
    /partyRef/
  );
});

test("bridge rejects an unknown encountered creature instead of substituting a demo fighter", async () => {
  const sourceRecords = await records();

  assert.throws(
    () =>
      buildExplorationEncounterCombatSourceV1({
        snapshot: snapshot("crea_missing"),
        creatureRecords: sourceRecords
      }),
    /opponent/
  );
});
