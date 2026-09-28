import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_BATTLE_SETUP_EDITOR_DRAFT_SCHEMA,
  normalizeCaptureBattleSetupEditorDraftV1
} from "../../src/contracts/capture-battle-setup-editor-draft-v1.js";

function playerSlot() {
  return {
    actorId: "player",
    creatureId: "crea-braiseau",
    displayName: "Braiseau",
    controllerId: "human-local",
    roster: {
      activeMemberId: "player-braiseau",
      members: [
        {
          id: "player-braiseau",
          creatureId: "crea-braiseau",
          displayName: "Braiseau"
        },
        {
          id: "player-golem",
          creatureId: "crea-golem",
          displayName: "Golem moussu"
        }
      ]
    }
  };
}

function opponentSlot() {
  return {
    actorId: "opponent",
    creatureId: "crea-maraileron",
    displayName: "Maraileron",
    controllerId: "ai-enemy",
    roster: null
  };
}

function valid1v1() {
  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "capture-duel",
    localActorId: "player",
    teams: [
      {
        id: "players",
        slots: [playerSlot()]
      },
      {
        id: "enemies",
        slots: [opponentSlot()]
      }
    ]
  };
}

test("CaptureBattleSetupEditorDraftV1 normalizes a 1v1 setup with reserve data", () => {
  const value = normalizeCaptureBattleSetupEditorDraftV1(valid1v1());

  assert.equal(
    CAPTURE_BATTLE_SETUP_EDITOR_DRAFT_SCHEMA,
    "capture-battle-setup-editor-draft-v1"
  );
  assert.equal(value.id, "capture-duel");
  assert.equal(value.localActorId, "player");
  assert.equal(value.teams.length, 2);
  assert.equal(value.teams[0].slots.length, 1);
  assert.equal(
    value.teams[0].slots[0].roster.members[1].creatureId,
    "crea-golem"
  );
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.teams), true);
  assert.equal(Object.isFrozen(value.teams[0]), true);
  assert.equal(Object.isFrozen(value.teams[0].slots), true);
  assert.equal(
    Object.isFrozen(value.teams[0].slots[0].roster.members),
    true
  );
});

test("CaptureBattleSetupEditorDraftV1 uses the same model for 2v2", () => {
  const input = valid1v1();

  input.teams[0].slots.push({
    actorId: "ally",
    creatureId: "crea-golem",
    displayName: "Golem moussu",
    controllerId: "ai-ally",
    roster: null
  });

  input.teams[1].slots.push({
    actorId: "opponent-b",
    creatureId: "crea-dragon",
    displayName: "Dragon",
    controllerId: "ai-enemy-b",
    roster: null
  });

  const value = normalizeCaptureBattleSetupEditorDraftV1(input);

  assert.equal(value.teams[0].slots.length, 2);
  assert.equal(value.teams[1].slots.length, 2);
  assert.deepEqual(
    value.teams.flatMap((team) =>
      team.slots.map((slot) => slot.actorId)
    ),
    ["player", "ally", "opponent", "opponent-b"]
  );
});

test("CaptureBattleSetupEditorDraftV1 requires exactly two teams and one or two active slots per team", () => {
  const oneTeam = valid1v1();
  oneTeam.teams.pop();

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(oneTeam),
    /exactly two teams/i
  );

  const emptyTeam = valid1v1();
  emptyTeam.teams[1].slots = [];

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(emptyTeam),
    /slots.*non-empty/i
  );
});

test("CaptureBattleSetupEditorDraftV1 requires unique team and actor ids", () => {
  const duplicateTeam = valid1v1();
  duplicateTeam.teams[1].id = "players";

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(duplicateTeam),
    /duplicate team/i
  );

  const duplicateActor = valid1v1();
  duplicateActor.teams[1].slots[0].actorId = "player";

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(duplicateActor),
    /duplicate actor/i
  );
});

test("CaptureBattleSetupEditorDraftV1 validates localActorId", () => {
  const input = valid1v1();
  input.localActorId = "missing";

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(input),
    /localActorId.*declared actor/i
  );
});

test("CaptureBattleSetupEditorDraftV1 validates roster references and active creature coherence", () => {
  const missingMember = valid1v1();
  missingMember.teams[0].slots[0].roster.activeMemberId = "missing";

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(missingMember),
    /activeMemberId.*member/i
  );

  const mismatch = valid1v1();
  mismatch.teams[0].slots[0].roster.activeMemberId = "player-golem";

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(mismatch),
    /active.*creature.*slot/i
  );
});

test("CaptureBattleSetupEditorDraftV1 refuses artificial mode flags", () => {
  const input = valid1v1();
  input.is2v2 = false;

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(input),
    /unknown field/i
  );

  const format = valid1v1();
  format.format = "1v1";

  assert.throws(
    () => normalizeCaptureBattleSetupEditorDraftV1(format),
    /unknown field/i
  );
});

test("CaptureBattleSetupEditorDraftV1 stays independent from runtime, UI, storage and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/contracts/capture-battle-setup-editor-draft-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "is2v2",
    "document.",
    "window.",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "fetch(",
    "XMLHttpRequest",
    "Zombicide-40k",
    "captureFix",
    "combat-runtime",
    "renderer/"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `contract source must not contain ${forbidden}`
    );
  }
});
