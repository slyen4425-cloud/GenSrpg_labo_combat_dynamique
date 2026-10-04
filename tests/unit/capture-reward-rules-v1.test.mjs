import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureRewardRulesV1,
  captureCurrencyRewardV1,
  captureItemRewardV1
} from "../../src/contracts/capture-reward-rules-v1.js";

async function defaultRules() {
  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-reward-rules.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  return normalizeCaptureRewardRulesV1(raw);
}

test("default reward preset reproduces audited trainer currency rules", async () => {
  const rules = await defaultRules();

  const reward = captureCurrencyRewardV1(rules, {
    encounterType: "trainer",
    averageEnemyLevel: 10,
    chanceRoll: 0.99,
    amountRoll: 0
  });

  assert.deepEqual(reward, {
    granted: true,
    currencyId: "gold",
    amount: 38
  });
});

test("default wild currency chance and amount are deterministic from injected rolls", async () => {
  const rules = await defaultRules();

  assert.deepEqual(
    captureCurrencyRewardV1(rules, {
      encounterType: "wild",
      averageEnemyLevel: 10,
      chanceRoll: 0.44,
      amountRoll: 0.5
    }),
    {
      granted: true,
      currencyId: "gold",
      amount: 27
    }
  );

  assert.deepEqual(
    captureCurrencyRewardV1(rules, {
      encounterType: "wild",
      averageEnemyLevel: 10,
      chanceRoll: 0.45,
      amountRoll: 0.5
    }),
    {
      granted: false,
      currencyId: "gold",
      amount: 0
    }
  );
});

test("historical item chances are presets and not hardcoded in the evaluator", async () => {
  const rules = await defaultRules();

  assert.equal(
    captureItemRewardV1(rules, {
      encounterType: "wild",
      chanceRoll: 0.17,
      quantityRoll: 0
    }).granted,
    true
  );

  assert.equal(
    captureItemRewardV1(rules, {
      encounterType: "wild",
      chanceRoll: 0.18,
      quantityRoll: 0
    }).granted,
    false
  );

  assert.equal(
    captureItemRewardV1(rules, {
      encounterType: "trainer",
      chanceRoll: 0.24,
      quantityRoll: 0
    }).granted,
    true
  );

  assert.equal(
    captureItemRewardV1(rules, {
      encounterType: "trainer",
      chanceRoll: 0.25,
      quantityRoll: 0
    }).granted,
    false
  );
});

test("custom worlds can configure encounter-specific reward formulas", () => {
  const rules = normalizeCaptureRewardRulesV1({
    schema: "capture-reward-rules-v1",
    currencyId: "crystal",
    encounterTypes: {
      boss: {
        currency: {
          enabled: true,
          chancePct: 100,
          minAmount: 50,
          base: 20,
          enemyAverageLevelCoefficient: 5,
          randomBonusMin: 0,
          randomBonusMax: 0
        },
        item: {
          enabled: true,
          chancePct: 100,
          tableId: "boss-drops",
          quantityMin: 2,
          quantityMax: 4
        }
      }
    }
  });

  assert.deepEqual(
    captureCurrencyRewardV1(rules, {
      encounterType: "boss",
      averageEnemyLevel: 10,
      chanceRoll: 0.5,
      amountRoll: 0.5
    }),
    {
      granted: true,
      currencyId: "crystal",
      amount: 70
    }
  );

  assert.deepEqual(
    captureItemRewardV1(rules, {
      encounterType: "boss",
      chanceRoll: 0.5,
      quantityRoll: 0.5
    }),
    {
      granted: true,
      tableId: "boss-drops",
      quantity: 3
    }
  );
});

test("reward rules reject unknown policy fields", async () => {
  const raw = structuredClone(await defaultRules());
  raw.encounterTypes.wild.currency.secretBonus = 9000;

  assert.throws(
    () => normalizeCaptureRewardRulesV1(raw),
    /unknown field/i
  );
});

test("unknown encounter types fail explicitly instead of using a hidden fallback", async () => {
  const rules = await defaultRules();

  assert.throws(
    () =>
      captureCurrencyRewardV1(rules, {
        encounterType: "secret-mode",
        averageEnemyLevel: 1,
        chanceRoll: 0,
        amountRoll: 0
      }),
    /encounterType/
  );
});
