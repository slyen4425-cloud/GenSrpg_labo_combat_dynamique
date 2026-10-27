import test from "node:test";
import assert from "node:assert/strict";

import {
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
      { id: "slot-4", skillId: null }
    ]
  };
}

test("CaptureActiveSkillLoadoutV1 normalized output is valid input to the same normalizer", () => {
  const first = normalizeCaptureActiveSkillLoadoutV1(validInput());
  const second = normalizeCaptureActiveSkillLoadoutV1(first);

  assert.deepEqual(second, first);
});

test("CaptureActiveSkillLoadoutV1 keeps slots as the single source of equipped skills", () => {
  const value = normalizeCaptureActiveSkillLoadoutV1(validInput());

  assert.equal("equippedSkillIds" in value, false);
});
