import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("teleport and aerial skills declare configurable travel evasion", async () => {
  const teleport = normalizeSkillDefinition(
    await json("data/combat/skills/teleport-strike.skill.json")
  );
  const aerial = normalizeSkillDefinition(
    await json("data/combat/skills/aerial-dive.skill.json")
  );
  const claw = normalizeSkillDefinition(
    await json("data/combat/skills/claw.skill.json")
  );

  assert.deepEqual(teleport.evasion, {
    window: "travel",
    incomingForms: ["contact", "projectile"]
  });
  assert.deepEqual(aerial.evasion, {
    window: "travel",
    incomingForms: ["contact", "projectile"]
  });
  assert.deepEqual(claw.evasion, {
    window: null,
    incomingForms: []
  });
});

test("skill evasion configuration rejects unsupported windows and orphan forms", () => {
  assert.throws(
    () =>
      normalizeSkillDefinition({
        id: "bad-window",
        name: "Bad Window",
        category: "offensive",
        form: "contact",
        approachMode: "teleport",
        energyCost: 1,
        preparationMs: 100,
        travelMs: 100,
        recoveryMs: 0,
        allowedDistances: ["short"],
        evasion: {
          window: "preparation",
          incomingForms: ["contact"]
        },
        effect: { damage: 1 }
      }),
    /Unsupported evasion\.window/
  );

  assert.throws(
    () =>
      normalizeSkillDefinition({
        id: "missing-window",
        name: "Missing Window",
        category: "offensive",
        form: "contact",
        approachMode: "teleport",
        energyCost: 1,
        preparationMs: 100,
        travelMs: 100,
        recoveryMs: 0,
        allowedDistances: ["short"],
        evasion: {
          incomingForms: ["contact"]
        },
        effect: { damage: 1 }
      }),
    /evasion\.window is required/
  );
});
