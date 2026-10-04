import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureProgressionRulesV2,
  captureXpForDefeatV2,
  captureXpToNextLevelV2,
  captureActiveSkillSlotsForLevelV2
} from "../../src/contracts/capture-progression-rules-v2.js";

async function defaultRules() {
  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-progression-rules.v2.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  return normalizeCaptureProgressionRulesV2(raw);
}

test("Monster Capture V2 default preset reproduces the audited historical XP formula", async () => {
  const rules = await defaultRules();

  assert.equal(
    captureXpForDefeatV2(rules, {
      enemyLevel: 5,
      allyLevel: 5,
      encounterType: "wild"
    }),
    30
  );

  assert.equal(
    captureXpForDefeatV2(rules, {
      enemyLevel: 5,
      allyLevel: 5,
      encounterType: "trainer"
    }),
    36
  );

  assert.equal(
    captureXpForDefeatV2(rules, {
      enemyLevel: 10,
      allyLevel: 5,
      encounterType: "wild"
    }),
    100
  );

  assert.equal(
    captureXpForDefeatV2(rules, {
      enemyLevel: 1,
      allyLevel: 10,
      encounterType: "wild"
    }),
    3
  );
});

test("XP reward coefficients are data-configurable and can disable level-ratio scaling", () => {
  const rules = normalizeCaptureProgressionRulesV2({
    schema: "capture-progression-rules-v2",
    xp: {
      enabled: true,
      globalMultiplier: 2,
      minimumReward: 0,
      distribution: "active-only-full",
      reward: {
        base: 0,
        enemyLevelCoefficient: 10,
        levelRatio: {
          enabled: false,
          min: 0.5,
          max: 2,
          exponent: 1
        },
        encounterTypeMultipliers: {
          wild: 1,
          trainer: 3
        }
      },
      levelCurve: {
        base: 10,
        linearPerLevel: 5,
        quadraticPerLevel: 0,
        multiplier: 1,
        minimumRequired: 1
      }
    },
    progression: {
      statCap: 99,
      statPointsPerLevel: 2,
      talentEveryLevels: 4
    },
    skills: {
      maxActiveSkills: 4,
      slotUnlockSchedule: [
        { level: 1, slots: 2 },
        { level: 10, slots: 3 },
        { level: 20, slots: 4 }
      ]
    }
  });

  assert.equal(
    captureXpForDefeatV2(rules, {
      enemyLevel: 3,
      allyLevel: 40,
      encounterType: "wild"
    }),
    60
  );

  assert.equal(
    captureXpForDefeatV2(rules, {
      enemyLevel: 3,
      allyLevel: 40,
      encounterType: "trainer"
    }),
    180
  );
});

test("level curve and progression gains are explicit data instead of runtime magic numbers", async () => {
  const rules = await defaultRules();

  assert.equal(captureXpToNextLevelV2(rules, 1), 57);
  assert.equal(captureXpToNextLevelV2(rules, 5), 225);

  assert.equal(rules.progression.statCap, 300);
  assert.equal(rules.progression.statPointsPerLevel, 5);
  assert.equal(rules.progression.talentEveryLevels, 5);
});

test("skill-slot progression remains configurable in the V2 authority", async () => {
  const rules = await defaultRules();

  assert.equal(captureActiveSkillSlotsForLevelV2(rules, 1), 2);
  assert.equal(captureActiveSkillSlotsForLevelV2(rules, 9), 2);
  assert.equal(captureActiveSkillSlotsForLevelV2(rules, 10), 3);
  assert.equal(captureActiveSkillSlotsForLevelV2(rules, 20), 4);
});

test("XP can be disabled without changing Combat Runtime", async () => {
  const raw = structuredClone(await defaultRules());
  raw.xp.enabled = false;
  const rules = normalizeCaptureProgressionRulesV2(raw);

  assert.equal(
    captureXpForDefeatV2(rules, {
      enemyLevel: 50,
      allyLevel: 1,
      encounterType: "trainer"
    }),
    0
  );
});

test("distribution policy is explicit and invalid values are rejected", async () => {
  const raw = structuredClone(await defaultRules());
  raw.xp.distribution = "shared-active";
  assert.equal(
    normalizeCaptureProgressionRulesV2(raw).xp.distribution,
    "shared-active"
  );

  raw.xp.distribution = "hidden-ui-rule";
  assert.throws(
    () => normalizeCaptureProgressionRulesV2(raw),
    /distribution/
  );
});

test("unknown fields are rejected so UI cannot become a second progression authority", async () => {
  const raw = structuredClone(await defaultRules());
  raw.secretRuntimeMultiplier = 9;

  assert.throws(
    () => normalizeCaptureProgressionRulesV2(raw),
    /unknown field/i
  );
});
