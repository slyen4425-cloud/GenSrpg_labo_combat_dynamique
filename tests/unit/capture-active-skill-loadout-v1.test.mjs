import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_ACTIVE_SKILL_LOADOUT_SCHEMA,
  captureActiveSkillIdsV1,
  normalizeCaptureActiveSkillLoadoutV1
} from "../../src/contracts/capture-active-skill-loadout-v1.js";

function validInput() {
  return {
    schema: "capture-active-skill-loadout-v1",
    creatureId: "crea-braiseau",
    slots: [
      { id: "slot-1", skillId: "fireball" },
      { id: "slot-2", skillId: "claw" },
      { id: "slot-3", skillId: null },
      { id: "slot-4", skillId: "aerial-dive" }
    ]
  };
}

test("CaptureActiveSkillLoadoutV1 migrates four legacy slots to five canonical slots", () => {
  const value = normalizeCaptureActiveSkillLoadoutV1(validInput());

  assert.equal(
    CAPTURE_ACTIVE_SKILL_LOADOUT_SCHEMA,
    "capture-active-skill-loadout-v1"
  );
  assert.equal(value.creatureId, "crea-braiseau");
  assert.deepEqual(
    value.slots.map((slot) => slot.id),
    ["slot-1", "slot-2", "slot-3", "slot-4", "slot-ultimate"]
  );
  const equippedSkillIds =
    captureActiveSkillIdsV1(value);
  assert.deepEqual(
    equippedSkillIds,
    ["fireball", "claw", "aerial-dive"]
  );
  assert.equal("equippedSkillIds" in value, false);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.slots), true);
  assert.equal(Object.isFrozen(value.slots[0]), true);
  assert.equal(Object.isFrozen(equippedSkillIds), true);
});

test("CaptureActiveSkillLoadoutV1 allows empty slots", () => {
  const input = validInput();
  input.slots = [
    { id: "slot-1", skillId: null },
    { id: "slot-2", skillId: null },
    { id: "slot-3", skillId: null },
    { id: "slot-4", skillId: null }
  ];

  const value = normalizeCaptureActiveSkillLoadoutV1(input);

  assert.deepEqual(
    captureActiveSkillIdsV1(value),
    []
  );
});

test("CaptureActiveSkillLoadoutV1 refuses fewer than four or more than five slots instead of trimming", () => {
  const tooFew = validInput();
  tooFew.slots.pop();

  assert.throws(
    () => normalizeCaptureActiveSkillLoadoutV1(tooFew),
    /four legacy|five canonical/i
  );

  const tooMany = validInput();
  tooMany.slots.push({
    id: "slot-ultimate",
    skillId: null
  });
  tooMany.slots.push({
    id: "slot-6",
    skillId: "teleport-strike"
  });

  assert.throws(
    () => normalizeCaptureActiveSkillLoadoutV1(tooMany),
    /four legacy|five canonical/i
  );
});

test("CaptureActiveSkillLoadoutV1 requires canonical slot ids and order", () => {
  const input = validInput();
  input.slots[1].id = "ability-2";

  assert.throws(
    () => normalizeCaptureActiveSkillLoadoutV1(input),
    /slots\[1\]\.id.*slot-2/i
  );

  const swapped = validInput();
  [swapped.slots[0], swapped.slots[1]] = [
    swapped.slots[1],
    swapped.slots[0]
  ];

  assert.throws(
    () => normalizeCaptureActiveSkillLoadoutV1(swapped),
    /slots\[0\]\.id.*slot-1/i
  );
});

test("CaptureActiveSkillLoadoutV1 refuses duplicate equipped skills", () => {
  const input = validInput();
  input.slots[2].skillId = "fireball";

  assert.throws(
    () => normalizeCaptureActiveSkillLoadoutV1(input),
    /duplicate.*skill/i
  );
});

test("CaptureActiveSkillLoadoutV1 derives equipped skill IDs only through the pure helper and rejects a second source", () => {
  const input = validInput();
  input.equippedSkillIds = ["fireball"];

  assert.throws(
    () => normalizeCaptureActiveSkillLoadoutV1(input),
    /unknown field/i
  );
});

test("CaptureActiveSkillLoadoutV1 rejects unknown slot fields", () => {
  const input = validInput();
  input.slots[0].definition = { damage: 999 };

  assert.throws(
    () => normalizeCaptureActiveSkillLoadoutV1(input),
    /unknown field/i
  );
});

test("CaptureActiveSkillLoadoutV1 stays independent from UI, runtime, storage and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/contracts/capture-active-skill-loadout-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
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
