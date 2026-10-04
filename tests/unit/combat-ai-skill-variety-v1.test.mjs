import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createBattleActorAiController
} from "../../src/core/combat/battle-actor-ai-controller.js";

function state() {
  return {
    fighters: {
      ai: { id: "ai", hp: 100, energy: 10 },
      target: { id: "target", hp: 100, energy: 10 }
    }
  };
}

function controller({
  previewSkill,
  skillIds = ["skill-a", "skill-b", "skill-c"]
}) {
  const started = [];
  const skillsById = Object.fromEntries(
    skillIds.map((id) => [id, { id, name: id, energyCost: 1 }])
  );

  const ai = createBattleActorAiController({
    session: {
      snapshot: state,
      previewSkill
    },
    runtime: {
      hasActiveActionFor() {
        return false;
      },
      startSkill(args) {
        started.push(args.skill.id);
        return {
          ok: true,
          outcome: "started",
          action: { actorId: args.actorId, actionId: args.skill.id }
        };
      }
    },
    actorId: "ai",
    targetIds: ["target"],
    skillIds,
    skillsById
  });

  return { ai, started };
}

test("AI skips an unavailable next skill and starts the next usable skill", () => {
  const { ai, started } = controller({
    previewSkill({ skill }) {
      return skill.id === "skill-a"
        ? { ok: false, outcome: "cooldown", remainingCooldownMs: 1200 }
        : { ok: true };
    }
  });

  const result = ai.takeTurn();

  assert.equal(result.status, "skill_started");
  assert.equal(result.skillId, "skill-b");
  assert.deepEqual(started, ["skill-b"]);
});

test("AI keeps deterministic round-robin variety when several skills are usable", () => {
  const { ai, started } = controller({
    previewSkill() {
      return { ok: true };
    }
  });

  assert.equal(ai.takeTurn().skillId, "skill-a");
  assert.equal(ai.takeTurn().skillId, "skill-b");
  assert.equal(ai.takeTurn().skillId, "skill-c");
  assert.deepEqual(started, ["skill-a", "skill-b", "skill-c"]);
});

test("Capture test opponents keep their configured skill variety through the canonical owners", async () => {
  const source = await readFile(new URL("../../src/ui/capture-editor-combat-test-v1.js", import.meta.url), "utf8");
  assert.match(source, /skillDrafts: \[\.\.\.configuredSkills\.values\(\)\]/);
  assert.match(source, /loadouts: records\.map\(record => record\.loadout\)/);
  const page = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.js", import.meta.url), "utf8");
  assert.doesNotMatch(page, /enemy-hit|enemy-burst|enemy-heavy-hit/);
});
