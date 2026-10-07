import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  PRIVATE_AUDIO_ROLE_LABELS_V1,
  buildPrivateAudioRoleGroupsV1
} from "../../src/ui/private-audio-role-groups-v1.js";

const ENTRIES = [
  {
    assetId: "sound:cast:1",
    label: "Incantation eau",
    category: "xel",
    roles: ["cast"],
    tags: ["water", "magic"]
  },
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

function flattenedIds(groups) {
  return groups.flatMap((group) =>
    group.entries.map((entry) => entry.assetId)
  );
}

test("audio role hints prioritize recommended groups but never filter the catalog", () => {
  const groups = buildPrivateAudioRoleGroupsV1(
    ENTRIES,
    ["cast"]
  );

  assert.equal(groups[0].role, "cast");
  assert.equal(
    groups[0].label,
    PRIVATE_AUDIO_ROLE_LABELS_V1.cast
  );

  const ids = flattenedIds(groups);
  assert.equal(ids.length, ENTRIES.length);
  assert.deepEqual(
    new Set(ids),
    new Set(ENTRIES.map((entry) => entry.assetId))
  );
});

test("audio role hints keep every sound once even when an asset has multiple roles", () => {
  const groups = buildPrivateAudioRoleGroupsV1(
    ENTRIES,
    ["ui", "impact"]
  );

  assert.deepEqual(
    groups.slice(0, 2).map((group) => group.role),
    ["ui", "impact"]
  );

  const ids = flattenedIds(groups);
  assert.equal(ids.length, ENTRIES.length);
  assert.equal(new Set(ids).size, ENTRIES.length);
  assert.equal(
    groups[0].entries.some(
      (entry) => entry.assetId === "sound:multi:1"
    ),
    true
  );
  assert.equal(
    groups[1].entries.some(
      (entry) => entry.assetId === "sound:impact:1"
    ),
    true
  );
});

test("audio option model keeps role tags and source category as searchable metadata", () => {
  const groups = buildPrivateAudioRoleGroupsV1(
    ENTRIES,
    ["cast"]
  );
  const impact = groups
    .flatMap((group) => group.entries)
    .find((entry) => entry.assetId === "sound:impact:1");

  assert.deepEqual(impact.roles, ["impact"]);
  assert.equal(impact.category, "effect");
  assert.equal(
    impact.displayLabel,
    "Impact — effect"
  );
});

test("audio option model without a preferred role still exposes the whole catalog by taxonomy order", () => {
  const groups =
    buildPrivateAudioRoleGroupsV1(
      ENTRIES,
      []
    );

  const ids = flattenedIds(groups);
  assert.equal(ids.length, ENTRIES.length);
  assert.equal(new Set(ids).size, ENTRIES.length);
  assert.deepEqual(
    groups.map((group) => group.role),
    ["cast", "release", "impact", "voice"]
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


test("every real editor audio selector hint still exposes all 203 catalog sounds", async () => {
  const catalog = JSON.parse(
    await readFile(
      new URL(
        "../../data/presentation/audio/private-audio-catalog.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const entries = catalog.entries ?? [];
  assert.equal(entries.length, 203);

  for (const hints of [
    ["release", "voice"],
    ["impact"],
    ["death"],
    ["cast", "release", "preparation"],
    ["travel"],
    ["impact"],
    ["aura"]
  ]) {
    const groups =
      buildPrivateAudioRoleGroupsV1(
        entries,
        hints
      );
    const ids = flattenedIds(groups);

    assert.equal(
      ids.length,
      203,
      "selector hints " + hints.join(",") + " must not filter audio"
    );
    assert.equal(
      new Set(ids).size,
      203,
      "selector hints " + hints.join(",") + " must not duplicate audio"
    );
  }
});
