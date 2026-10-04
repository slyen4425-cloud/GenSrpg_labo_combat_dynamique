import test from "node:test";
import assert from "node:assert/strict";

import {
  captureCombatRulesetByIdV1,
  requireCaptureCombatRulesetV1
} from "../../src/catalogs/capture-combat-ruleset-catalog-v1.js";

test("capture.standard.1v1 resolves one explicit Capture Combat ruleset", () => {
  const rules =
    requireCaptureCombatRulesetV1(
      "capture.standard.1v1"
    );

  assert.deepEqual(rules, {
    schema:
      "capture-combat-rules-editor-draft-v1",
    maxEnergy: 12,
    initialEnergy: 2,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 1800,
    movementEnergyPerStep: 2,
    chargeTimeModifierPct: 0
  });
});

test("ruleset lookup never silently falls back", () => {
  assert.equal(
    captureCombatRulesetByIdV1(
      "capture.unknown"
    ),
    null
  );

  assert.throws(
    () =>
      requireCaptureCombatRulesetV1(
        "capture.unknown"
      ),
    /Unknown Capture Combat ruleset/
  );
});
