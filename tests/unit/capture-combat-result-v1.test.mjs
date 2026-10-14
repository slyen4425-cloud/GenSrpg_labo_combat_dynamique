import test from "node:test";
import assert from "node:assert/strict";

import {
  createCaptureCombatResultV1
} from "../../src/contracts/capture-combat-result-v1.js";

test("Combat result echoes encounter identity and never owns world position", () => {
  const result = createCaptureCombatResultV1({
    encounterId: "encounter-1",
    returnToken: "return-1",
    outcome: "victory",
    position: { x: 9, y: 9 }
  });

  assert.deepEqual(result, {
    schema: "capture-combat-result-v1",
    version: 1,
    encounterId: "encounter-1",
    returnToken: "return-1",
    outcome: "victory",
    partyState: null,
    rewards: [],
    capture: null,
    worldEffects: []
  });
  assert.equal("position" in result, false);
});
