import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  humanSkillSelectorGroupsV1
} from "../../src/ui/capture-editor-human-v2.js";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

test("skill selector groups by element then required level then name", () => {
  const groups = humanSkillSelectorGroupsV1([
    { id: "shadow-5", name: "Voile noir", element: "shadow", requiredLevel: 5 },
    { id: "fire-8", name: "Brasier", element: "fire", requiredLevel: 8 },
    { id: "fire-2-z", name: "Zéphyr rouge", element: "fire", requiredLevel: 2 },
    { id: "water-1", name: "Écume", element: "water", requiredLevel: 1 },
    { id: "fire-2-a", name: "Ardeur", element: "fire", requiredLevel: 2 },
    { id: "neutral-1", name: "Charge", element: null, requiredLevel: 1 }
  ]);

  assert.deepEqual(
    groups.map((group) => [group.element, group.label]),
    [
      ["fire", "Feu"],
      ["water", "Eau"],
      ["shadow", "Ombre"],
      [null, "Neutre"]
    ]
  );

  assert.deepEqual(
    groups[0].entries.map((entry) => entry.id),
    ["fire-2-a", "fire-2-z", "fire-8"]
  );
});

test("skill selector grouping does not mutate source entries", () => {
  const entries = [
    { id: "late", name: "Tardive", element: "air", requiredLevel: 9 },
    { id: "early", name: "Précoce", element: "air", requiredLevel: 1 }
  ];
  const before = JSON.stringify(entries);

  humanSkillSelectorGroupsV1(entries);

  assert.equal(JSON.stringify(entries), before);
});

test("editor renders element optgroups for both skill editing and creature loadout selectors", async () => {
  const source = await text("src/ui/capture-editor-human-v2.js");

  const libraryStart = source.indexOf(
    "function refreshSkillLibraryOptions"
  );
  const loadoutStart = source.indexOf(
    "function refreshLoadoutOptions",
    libraryStart
  );

  assert.ok(libraryStart >= 0);
  assert.ok(loadoutStart > libraryStart);

  const libraryBlock = source.slice(
    libraryStart,
    loadoutStart
  );
  const loadoutBlock = source.slice(
    loadoutStart,
    source.indexOf(
      "function persistCurrentSkill",
      loadoutStart
    )
  );

  assert.match(
    libraryBlock,
    /humanSkillSelectorGroupsV1/
  );
  assert.match(
    libraryBlock,
    /document\.createElement\("optgroup"\)/
  );
  assert.match(
    loadoutBlock,
    /humanSkillSelectorGroupsV1/
  );
  assert.match(
    loadoutBlock,
    /document\.createElement\("optgroup"\)/
  );
  assert.match(
    loadoutBlock,
    /for \(const select of standardSlots\)[\s\S]*populate\([\s\S]*standardSkills[\s\S]*"Vide"[\s\S]*\)/
  );
  assert.match(
    loadoutBlock,
    /populate\([\s\S]*ultimateSlot[\s\S]*ultimateSkills[\s\S]*"Aucune ultime"[\s\S]*\)/
  );
});
