import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_ACTIVE_SKILL_LOADOUT_SCHEMA,
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

test("CaptureActiveSkillLoadoutV1 normalizes exactly four explicit slots", () => {
  const value = normalizeCaptureActiveSkillLoadoutV1(validInput());

  assert.equal(
    CAPTURE_ACTIVE_SKILL_LOADOUT_SCHEMA,
    "capture-active-skill-loadout-v1"
  );
  assert.equal(value.creatureId, "crea-braiseau");
  assert.deepEqual(
    value.slots.map((slot) => slot.id),
    ["slot-1", "slot-2", "slot-3", "slot-4"]
  );
  assert.deepEqual(
    value.equippedSkillIds,
    ["fireball", "claw", "aerial-dive"]
  );
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.slots), true);
  assert.equal(Object.isFrozen(value.slots[0]), true);
  assert.equal(Object.isFrozen(value.equippedSkillIds), true);
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

  assert.deepEqual(value.equippedSkillIds, []);
});

test("CaptureActiveSkillLoadoutV1 refuses fewer or more than four slots instead of trimming", () => {
  const tooFew = validInput();
  tooFew.slots.pop();

  assert.throws(
    () => normalizeCaptureActiveSkillLoadoutV1(tooFew),
    /exactly four/i
  );

  const tooMany = validInput();
  tooMany.slots.push({
    id: "slot-5",
    skillId: "teleport-strike"
  });

  assert.throws(
    () => normalizeCaptureActiveSkillLoadoutV1(tooMany),
    /exactly four/i
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

test("CaptureActiveSkillLoadoutV1 derives equippedSkillIds and rejects a second source", () => {
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
