import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureBattleSetupEditorDraftV1
} from "../../src/contracts/capture-battle-setup-editor-draft-v1.js";

function slot(actorId, creatureId, roster = null) {
  return {
    actorId,
    creatureId,
    displayName: actorId,
    controllerId: actorId === "player" ? "human-local" : "ai",
    roster
  };
}

function setup(playerCount = 1, enemyCount = playerCount) {
  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "format-test",
    localActorId: "player",
    teams: [
      {
        id: "players",
        slots: Array.from({ length: playerCount }, (_, index) =>
          slot(
            index === 0 ? "player" : "ally-" + index,
            "creature-player-" + index,
            index === 0
              ? {
                  activeMemberId: "member-active",
                  members: [
                    {
                      id: "member-active",
                      creatureId: "creature-player-0",
                      displayName: "Active"
                    },
                    {
                      id: "reserve-1",
                      creatureId: "reserve-creature-1",
                      displayName: "Reserve 1"
                    },
                    {
                      id: "reserve-2",
                      creatureId: "reserve-creature-2",
                      displayName: "Reserve 2"
                    },
                    {
                      id: "reserve-3",
                      creatureId: "reserve-creature-3",
                      displayName: "Reserve 3"
                    }
                  ]
                }
              : null
          )
        )
      },
      {
        id: "enemies",
        slots: Array.from({ length: enemyCount }, (_, index) =>
          slot(
            index === 0 ? "opponent" : "opponent-" + index,
            "creature-enemy-" + index
          )
        )
      }
    ]
  };
}

test("Capture battle active format accepts only symmetric 1v1 or 2v2", () => {
  assert.equal(
    normalizeCaptureBattleSetupEditorDraftV1(setup(1)).teams[0].slots.length,
    1
  );
  assert.equal(
    normalizeCaptureBattleSetupEditorDraftV1(setup(2)).teams[0].slots.length,
    2
  );

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(setup(3)),
    /1v1|2v2|one or two|1 or 2|maximum.*2/i
  );

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(setup(1, 2)),
    /same.*slots|symmetric|same active/i
  );
});

test("Capture battle active format has exactly two teams", () => {
  const input = setup(1);
  input.teams.push({
    id: "third",
    slots: [slot("third-actor", "third-creature")]
  });

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(input),
    /exactly two teams|two teams/i
  );
});

test("roster size is independent from simultaneous active format", () => {
  const value = normalizeCaptureBattleSetupEditorDraftV1(setup(1));
  assert.equal(value.teams[0].slots.length, 1);
  assert.equal(
    value.teams[0].slots[0].roster.members.length,
    4,
    "1v1 must not cap the player roster at one or two creatures"
  );
});

test("Capture editor exposes only 1v1 and 2v2 active formats", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  const select = html.match(
    /<select data-active-per-team>[\s\S]*?<\/select>/
  )?.[0] ?? "";

  assert.match(select, /value="1"/);
  assert.match(select, /value="2"/);
  assert.doesNotMatch(select, /value="3"/);
  assert.doesNotMatch(select, /value="4"/);
  assert.doesNotMatch(
    html,
    /1v1, 2v2, 3v3 ou 4v4/i
  );
});


test("Capture editor defaults the integrated combat test to 1v1", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  const select = html.match(
    /<select data-active-per-team>[\s\S]*?<\/select>/
  )?.[0] ?? "";

  assert.match(select, /<option value="1" selected>/);
  assert.doesNotMatch(select, /<option value="2" selected>/);
});
