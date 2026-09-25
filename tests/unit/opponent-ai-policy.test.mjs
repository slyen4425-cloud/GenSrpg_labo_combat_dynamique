import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeOpponentAiPolicy } from "../../src/contracts/opponent-ai-policy.js";

const raw = JSON.parse(
  await readFile(
    "data/combat/ai/linear-opponent.policy.json",
    "utf8"
  )
);

test("normal V9 opponent policy has no automatic reactions and keeps deterministic offense", () => {
  const policy = normalizeOpponentAiPolicy(raw);

  assert.equal(policy.id, "linear-opponent-v1");
  assert.equal(policy.actorId, "opponent");
  assert.equal(policy.targetId, "player");
  assert.deepEqual(policy.reactionRules, []);
  assert.deepEqual(
    policy.turnPlan.map((step) => [
      step.skillId,
      step.preferredDistance
    ]),
    [
      ["claw", "short"],
      ["fireball", "medium"],
      ["aerial-dive", "long"],
      ["teleport-strike", "medium"]
    ]
  );
  assert.deepEqual(policy.energyStrategy, {
    decisionModes: ["quick", "strong"],
    quickSkillIds: ["claw", "aerial-dive"],
    strongSkillIds: ["fireball", "teleport-strike"]
  });
  assert.equal(Object.isFrozen(policy), true);
  assert.equal(Object.isFrozen(policy.energyStrategy), true);
});

test("opponent policy rejects unsupported energy modes and empty skill groups", () => {
  assert.throws(
    () =>
      normalizeOpponentAiPolicy({
        ...raw,
        energyStrategy: {
          ...raw.energyStrategy,
          decisionModes: ["berserk"]
        }
      }),
    /Unsupported energy decision mode/
  );

  assert.throws(
    () =>
      normalizeOpponentAiPolicy({
        ...raw,
        energyStrategy: {
          ...raw.energyStrategy,
          quickSkillIds: []
        }
      }),
    /quickSkillIds must be a non-empty array/
  );
});

test("opponent policy rejects unsupported distance and empty reaction matchers", () => {
  assert.throws(
    () =>
      normalizeOpponentAiPolicy({
        ...raw,
        turnPlan: [
          { skillId: "claw", preferredDistance: "very-far" }
        ]
      }),
    /Unsupported preferred distance/
  );

  assert.throws(
    () =>
      normalizeOpponentAiPolicy({
        ...raw,
        reactionRules: [
          { skillId: "dodge", when: {} }
        ]
      }),
    /must define a supported matcher/
  );
});
