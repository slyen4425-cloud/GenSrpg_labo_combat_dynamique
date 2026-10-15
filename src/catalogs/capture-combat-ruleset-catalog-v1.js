import {
  normalizeCaptureCombatRulesEditorDraftV1
} from "../contracts/capture-combat-rules-editor-draft-v1.js";

const RULESETS = Object.freeze({
  "capture.standard.1v1":
    normalizeCaptureCombatRulesEditorDraftV1({
      schema:
        "capture-combat-rules-editor-draft-v1",
      maxEnergy: 12,
      initialEnergy: 2,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 1800,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: 0
    })
});

export function captureCombatRulesetByIdV1(
  rulesetId
) {
  if (
    typeof rulesetId !== "string" ||
    rulesetId.trim() === ""
  ) {
    return null;
  }

  return RULESETS[rulesetId.trim()] ?? null;
}

export function requireCaptureCombatRulesetV1(
  rulesetId
) {
  const rules =
    captureCombatRulesetByIdV1(
      rulesetId
    );

  if (!rules) {
    throw new RangeError(
      "Unknown Capture Combat ruleset: " +
        String(rulesetId)
    );
  }

  return rules;
}
