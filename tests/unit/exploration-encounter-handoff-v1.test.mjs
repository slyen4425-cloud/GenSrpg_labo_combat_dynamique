import test from "node:test";
import assert from "node:assert/strict";

import {
  readExplorationCombatHandoffV1,
  completeExplorationCombatHandoffV1
} from "../../src/ui/exploration-encounter-handoff-v1.js";

function storageWith(value) {
  const map = new Map([
    [
      "gensrpg.capture.combat-handoff.v1",
      JSON.stringify(value)
    ]
  ]);
  return {
    getItem(key) { return map.get(key) ?? null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

function envelope() {
  return {
    version: 1,
    snapshot: {
      schema: "capture-encounter-snapshot-v1",
      version: 1,
      encounterId: "encounter-1",
      source: "terrain-random",
      player: {
        partyRef: "capture-party-preview"
      },
      opponents: [
        { creatureId: "crea_nat_3" }
      ],
      rules: {
        rulesetId: "capture.standard.1v1"
      },
      context: {
        areaId: "forest-exterior",
        terrainFamilyId: "forest",
        elementId: "nature"
      },
      returnToken: "return-1"
    },
    returnState: {
      areaId: "forest-exterior",
      x: 123,
      y: 456,
      returnUrl: "/laboratoire_dynamique_exploration-/index.html?combatReturn=1"
    },
    result: null
  };
}

test("Combat handoff reads snapshot but treats Exploration return state as transport-owned", () => {
  const storage = storageWith(envelope());
  const handoff =
    readExplorationCombatHandoffV1(storage);

  assert.equal(
    handoff.snapshot.opponents[0].creatureId,
    "crea_nat_3"
  );
  assert.equal(
    handoff.returnUrl,
    "/laboratoire_dynamique_exploration-/index.html?combatReturn=1"
  );
});

test("Combat completion writes matching CaptureCombatResult v1 and preserves return state untouched", () => {
  const initial = envelope();
  const storage = storageWith(initial);

  const completed =
    completeExplorationCombatHandoffV1({
      storage,
      outcome: "victory"
    });

  assert.equal(
    completed.returnUrl,
    initial.returnState.returnUrl
  );

  const stored = JSON.parse(
    storage.getItem(
      "gensrpg.capture.combat-handoff.v1"
    )
  );

  assert.deepEqual(
    stored.returnState,
    initial.returnState
  );
  assert.equal(
    stored.result.encounterId,
    "encounter-1"
  );
  assert.equal(
    stored.result.returnToken,
    "return-1"
  );
  assert.equal(
    stored.result.outcome,
    "victory"
  );
});
