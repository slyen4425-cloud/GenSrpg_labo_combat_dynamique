import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  battleOutcomeForDefeatedActorV1
} from "../../src/ui/combat-2v2-test-ui.js";

const format = Object.freeze({
  localActorId: "player-slot",
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
  assert.match(
    source,
    /onBattleEnd\s*\(\s*\{[\s\S]*outcome/
  );
});
