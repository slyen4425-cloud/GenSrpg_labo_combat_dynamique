import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureAttemptRulesV1,
  captureChanceV1,
  evaluateCaptureAttemptV1
} from "../../src/contracts/capture-attempt-rules-v1.js";

async function defaultRules() {
  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-attempt-rules.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  return normalizeCaptureAttemptRulesV1(raw);
}

test("default Capture chance uses one explicit HP/item formula", async () => {
  const rules = await defaultRules();

  assert.equal(
    captureChanceV1(rules, {
      encounterType: "wild",
      baseCaptureRate: 60,
      hpPct: 20,
      itemBonusPct: 10
    }),
    95
  );

  assert.equal(
    captureChanceV1(rules, {
      encounterType: "wild",
      baseCaptureRate: 60,
      hpPct: 40,
      itemBonusPct: 10
    }),
    31
  );

  assert.equal(
    captureChanceV1(rules, {
      encounterType: "wild",
      baseCaptureRate: 60,
      hpPct: 80,
      itemBonusPct: 10
    }),
    16
  );
});

test("capture eligibility is data-driven per encounter type", async () => {
  const rules = await defaultRules();

  assert.equal(
    evaluateCaptureAttemptV1(rules, {
      encounterType: "trainer",
      baseCaptureRate: 60,
      hpPct: 20,
      itemBonusPct: 10,
      hasCaptureItem: true,
      roll: 0
    }).reason,
    "encounter_not_capturable"
  );

  assert.equal(
    evaluateCaptureAttemptV1(rules, {
      encounterType: "wild",
      baseCaptureRate: 60,
      hpPct: 20,
      itemBonusPct: 10,
      hasCaptureItem: false,
      roll: 0
    }).reason,
    "capture_item_required"
  );
});

test("allowed attempts consume the item according to rules on success and failure", async () => {
  const rules = await defaultRules();

  assert.deepEqual(
    evaluateCaptureAttemptV1(rules, {
      encounterType: "wild",
      baseCaptureRate: 60,
      hpPct: 20,
      itemBonusPct: 10,
      hasCaptureItem: true,
      roll: 0.94
    }),
    {
      allowed: true,
      reason: "captured",
      chancePct: 95,
      success: true,
      consumeItem: true
    }
  );

  assert.deepEqual(
    evaluateCaptureAttemptV1(rules, {
      encounterType: "wild",
      baseCaptureRate: 60,
      hpPct: 20,
      itemBonusPct: 10,
      hasCaptureItem: true,
      roll: 0.95
    }),
    {
      allowed: true,
      reason: "capture_failed",
      chancePct: 95,
      success: false,
      consumeItem: true
    }
  );
});

test("world creators can replace the HP bands and all formula coefficients", () => {
  const rules = normalizeCaptureAttemptRulesV1({
    schema: "capture-attempt-rules-v1",
    requiresCaptureItem: false,
    consumeItemOnAttempt: false,
    minChancePct: 5,
    maxChancePct: 90,
    baseRateMultiplier: 0.5,
    itemBonusScale: 2,
    globalMultiplier: 1,
    encounterTypes: {
      wild: true,
      trainer: true
    },
    hpBands: [
      {
        maxHpPct: 50,
        operation: "add",
        value: 20
      },
      {
        maxHpPct: 100,
        operation: "multiply",
        value: 0.5
      }
    ]
  });

  assert.equal(
    captureChanceV1(rules, {
      encounterType: "trainer",
      baseCaptureRate: 80,
      hpPct: 40,
      itemBonusPct: 5
    }),
    70
  );

  assert.equal(
    captureChanceV1(rules, {
      encounterType: "trainer",
      baseCaptureRate: 80,
      hpPct: 90,
      itemBonusPct: 5
    }),
    30
  );
});

test("attempt evaluator has no hidden item-name rule", async () => {
  const rules = await defaultRules();

  const result = evaluateCaptureAttemptV1(rules, {
    encounterType: "wild",
    baseCaptureRate: 40,
    hpPct: 40,
    itemBonusPct: 25,
    hasCaptureItem: true,
    roll: 0
  });

  assert.equal(result.chancePct, 39);
});

test("unknown fields are rejected to prevent a second formula authority", async () => {
  const raw = structuredClone(await defaultRules());
  raw.hiddenBattleFormula = "legacy";

  assert.throws(
    () => normalizeCaptureAttemptRulesV1(raw),
    /unknown field/i
  );
});
