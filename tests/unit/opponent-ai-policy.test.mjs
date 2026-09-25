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

test("linear opponent policy normalizes deterministic reaction and turn plans", () => {
  const policy = normalizeOpponentAiPolicy(raw);

  assert.equal(policy.id, "linear-opponent-v1");
  assert.equal(policy.actorId, "opponent");
  assert.equal(policy.targetId, "player");
  assert.equal(policy.reactionRules[0].skillId, "fire-immunity");
  assert.deepEqual(policy.reactionRules[0].when, {
    element: "fire"
  });
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
  assert.equal(Object.isFrozen(policy), true);
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
