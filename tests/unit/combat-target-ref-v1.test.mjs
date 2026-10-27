import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCombatTargetRefV1
} from "../../src/contracts/combat-target-ref-v1.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";

function skill(targetLocations) {
  return normalizeSkillDefinition({
    id: "reserve-capable",
    name: "Reserve capable",
    category: "buff_debuff",
    form: "aura",
    element: null,
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["ally", "enemy"],
    targetLocations,
    effect: {
      damage: 0,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    }
  });
}

test("CombatTargetRefV1 normalizes active and reserve references", () => {
  assert.deepEqual(
    normalizeCombatTargetRefV1({
      scope: "active",
      actorId: "opponent"
    }),
    {
      scope: "active",
      actorId: "opponent"
    }
  );

  assert.deepEqual(
    normalizeCombatTargetRefV1({
      scope: "reserve",
      teamId: "opponent",
      memberId: "opponent-marai"
    }),
    {
      scope: "reserve",
      teamId: "opponent",
      memberId: "opponent-marai"
    }
  );

  assert.throws(
    () =>
      normalizeCombatTargetRefV1({
        scope: "reserve",
        memberId: "missing-team"
      }),
    /teamId/
  );
});

test("SkillDefinition defaults targetLocations to active and accepts reserve opt-in", () => {
  assert.deepEqual(
    skill(undefined).targetLocations,
    ["active"]
  );
  assert.deepEqual(
    skill(["active", "reserve"]).targetLocations,
    ["active", "reserve"]
  );
  assert.throws(
    () => skill(["bench"]),
    /Unsupported targetLocations value/
  );
});
