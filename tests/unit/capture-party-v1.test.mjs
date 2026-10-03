import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCapturePartyV1
} from "../../src/contracts/capture-party-v1.js";

async function partyFile() {
  return JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/parties/player-party.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
}

test("CaptureParty v1 stores only member references and one active member", async () => {
  const party = normalizeCapturePartyV1(
    await partyFile()
  );

  assert.equal(
    party.id,
    "capture-party-player-v1"
  );
  assert.equal(
    party.activeMemberId,
    "member-loup"
  );
  assert.deepEqual(
    party.members,
    [
      {
        id: "member-loup",
        creatureId: "crea-loup"
      },
      {
        id: "member-moussados",
        creatureId: "crea_mossback"
      }
    ]
  );

  for (const member of party.members) {
    assert.deepEqual(
      Object.keys(member).sort(),
      ["creatureId", "id"]
    );
  }
});

test("CaptureParty v1 rejects an active member outside the party", () => {
  assert.throws(
    () =>
      normalizeCapturePartyV1({
        schema: "capture-party-v1",
        version: 1,
        id: "party",
        activeMemberId: "missing",
        members: [
          {
            id: "one",
            creatureId: "crea-loup"
          }
        ]
      }),
    /activeMemberId/
  );
});

test("CaptureParty v1 rejects duplicate member ids", () => {
  assert.throws(
    () =>
      normalizeCapturePartyV1({
        schema: "capture-party-v1",
        version: 1,
        id: "party",
        activeMemberId: "same",
        members: [
          {
            id: "same",
            creatureId: "crea-loup"
          },
          {
            id: "same",
            creatureId: "crea_mossback"
          }
        ]
      }),
    /duplicate/
  );
});
