import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveBattleOutcomeV1
} from "../../src/ui/combat-2v2-test-ui.js";

const format = {
  localActorId: "local-1",
  actors: [
    { actorId: "local-1", teamId: "local-team" },
    { actorId: "enemy-1", teamId: "enemy-team" }
  ],
  teams: {
    "local-team": ["local-1"],
    "enemy-team": ["enemy-1"]
  }
};

test("battle outcome is victory only when every enemy actor is defeated", () => {
  assert.equal(
    resolveBattleOutcomeV1({
      format,
      state: {
        fighters: {
          "local-1": { hp: 10 },
          "enemy-1": { hp: 0 }
        }
      }
    }),
    "victory"
  );
});

test("battle outcome is defeat only when local team is defeated", () => {
  assert.equal(
    resolveBattleOutcomeV1({
      format,
      state: {
        fighters: {
          "local-1": { hp: 0 },
          "enemy-1": { hp: 10 }
        }
      }
    }),
    "defeat"
  );
});

test("battle outcome stays null while both teams still have a living actor", () => {
  assert.equal(
    resolveBattleOutcomeV1({
      format,
      state: {
        fighters: {
          "local-1": { hp: 10 },
          "enemy-1": { hp: 1 }
        }
      }
    }),
    null
  );
});
