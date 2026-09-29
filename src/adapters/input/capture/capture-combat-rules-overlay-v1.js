import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../../contracts/capture-creature-editor-draft-v3.js";
import {
  normalizeCaptureCombatRulesEditorDraftV1
} from "../../../contracts/capture-combat-rules-editor-draft-v1.js";

export function applyCaptureCombatRulesToCreatureDraftV1({
  creatureDraft,
  combatRules
}) {
  const rules =
    normalizeCaptureCombatRulesEditorDraftV1(
      combatRules
    );

  return normalizeCaptureCreatureEditorDraftV3({
    ...creatureDraft,
    schema: "capture-creature-editor-draft-v3",
    combat: {
      ...creatureDraft.combat,
      maxEnergy: rules.maxEnergy,
      initialEnergy: rules.initialEnergy,
      energyChargeAmount:
        rules.energyChargeAmount,
      energyChargeIntervalMs:
        rules.energyChargeIntervalMs,
      movementEnergyPerStep:
        rules.movementEnergyPerStep,
      chargeTimeModifierPct:
        rules.chargeTimeModifierPct
    }
  });
}
