import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  PRIVATE_AUDIO_ROLE_LABELS_V1,
  buildPrivateAudioRoleGroupsV1
} from "../../src/ui/private-audio-role-groups-v1.js";

const ENTRIES = [
  {
    assetId: "sound:release:1",
    label: "Attaque inferno",
    category: "inferno",
    roles: ["release"],
    tags: ["fire"]
  },
  {
    assetId: "sound:voice:1",
    label: "Cri créature",
    category: "xel",
    roles: ["voice"],
    tags: ["creature"]
  },
  {
    assetId: "sound:impact:1",
    label: "Impact",
    category: "effect",
    roles: ["impact"],
    tags: []
  },
  {
    assetId: "sound:multi:1",
    label: "Impact UI",
    category: "divers_mp3",
    roles: ["impact", "ui"],
    tags: []
  }
];

test("audio option model groups by accepted business role in declared order", () => {
  const groups = buildPrivateAudioRoleGroupsV1(
    ENTRIES,
    ["release", "voice"]
  );

  assert.deepEqual(
    groups.map((group) => group.role),
    ["release", "voice"]
  );
  assert.equal(groups[0].label, PRIVATE_AUDIO_ROLE_LABELS_V1.release);
  assert.equal(groups[1].label, PRIVATE_AUDIO_ROLE_LABELS_V1.voice);
  assert.deepEqual(
    groups[0].entries.map((entry) => entry.assetId),
    ["sound:release:1"]
  );
  assert.deepEqual(
    groups[1].entries.map((entry) => entry.assetId),
    ["sound:voice:1"]
  );
});

test("audio option model assigns multi-role entries to the first accepted role only", () => {
  const groups = buildPrivateAudioRoleGroupsV1(
    ENTRIES,
    ["ui", "impact"]
  );

  assert.deepEqual(
    groups.map((group) => group.role),
    ["ui", "impact"]
  );
  assert.deepEqual(
    groups[0].entries.map((entry) => entry.assetId),
    ["sound:multi:1"]
  );
  assert.deepEqual(
    groups[1].entries.map((entry) => entry.assetId),
    ["sound:impact:1"]
  );
});

test("audio option model preserves source category as secondary option metadata", () => {
  const groups = buildPrivateAudioRoleGroupsV1(
    ENTRIES,
    ["impact"]
  );

  assert.equal(groups[0].entries[0].category, "effect");
  assert.equal(
    groups[0].entries[0].displayLabel,
    "Impact — effect"
  );
});

test("human editor delegates audio grouping to the role taxonomy model", async () => {
  const source = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
    "utf8"
  );

  assert.equal(
    source.includes("buildPrivateAudioRoleGroupsV1"),
    true
  );
  assert.equal(
    source.includes('const category = entry.category || "autres"'),
    false
  );
});
