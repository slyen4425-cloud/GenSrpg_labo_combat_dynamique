import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  battleOutcomeForDefeatedActorV1,
  combatTeamIsDefeatedV1
} from "../../src/ui/combat-2v2-test-ui.js";

const format = Object.freeze({
  localActorId: "player-slot",
  actors: Object.freeze([
    Object.freeze({ actorId: "player-slot", teamId: "player-team" }),
    Object.freeze({ actorId: "enemy-slot", teamId: "enemy-team" })
  ]),
  teamOf(actorId) {
    if (actorId === "player-slot") return "player-team";
    if (actorId === "enemy-slot") return "enemy-team";
    return null;
  }
});

test("battle end projection returns victory only when the defeated actor belongs to the opposing team", () => {
  assert.equal(
    battleOutcomeForDefeatedActorV1({
      format,
      defeatedActorId: "enemy-slot",
      rosterOutcome: "team_defeated"
    }),
    "victory"
  );

  assert.equal(
    battleOutcomeForDefeatedActorV1({
      format,
      defeatedActorId: "player-slot",
      rosterOutcome: "team_defeated"
    }),
    "defeat"
  );

  assert.equal(
    battleOutcomeForDefeatedActorV1({
      format,
      defeatedActorId: "enemy-slot",
      rosterOutcome: "ko_replaced"
    }),
    null
  );
});

test("combat team defeat reads canonical Combat State for non-roster slots", () => {
  assert.equal(
    combatTeamIsDefeatedV1({
      format,
      state: {
        fighters: {
          "player-slot": { hp: 12 },
          "enemy-slot": { hp: 0 }
        }
      },
      teamId: "enemy-team"
    }),
    true
  );

  assert.equal(
    combatTeamIsDefeatedV1({
      format,
      state: {
        fighters: {
          "player-slot": { hp: 12 },
          "enemy-slot": { hp: 3 }
        }
      },
      teamId: "enemy-team"
    }),
    false
  );
});

test("mountCoop2v2Test keeps an explicit onBattleEnd callback contract", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/combat-2v2-test-ui.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /onBattleEnd\s*=\s*\(\)\s*=>\s*\{\}/
  );
  const callbackMentions =
    source.match(/\bonBattleEnd\b/g) ?? [];
  assert.ok(callbackMentions.length >= 2);
  assert.match(source, /battleEnded\s*=\s*true/);
});
