export const CAPTURE_COMBAT_RULES_EDITOR_DRAFT_V1_SCHEMA =
  "capture-combat-rules-editor-draft-v1";

const FIELDS = new Set([
  "schema",
  "maxEnergy",
  "initialEnergy",
  "energyChargeAmount",
  "energyChargeIntervalMs",
  "movementEnergyPerStep",
  "chargeTimeModifierPct"
]);

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(field + " must be an object");
  }
  return value;
}

function finiteNumber(value, field) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new RangeError(
      field + " must be a finite number"
    );
  }
  return value;
}

function nonNegativeNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number < 0) {
    throw new RangeError(
      field + " must be non-negative"
    );
  }
  return number;
}

export function normalizeCaptureCombatRulesEditorDraftV1(
  input
) {
  const value = objectValue(
    input,
    "CaptureCombatRulesEditorDraftV1"
  );

  for (const key of Object.keys(value)) {
    if (!FIELDS.has(key)) {
      throw new TypeError(
        "CaptureCombatRulesEditorDraftV1 contains unknown field: " +
          key
      );
    }
  }

  if (
    value.schema !==
    CAPTURE_COMBAT_RULES_EDITOR_DRAFT_V1_SCHEMA
  ) {
    throw new RangeError(
      "schema must be " +
        CAPTURE_COMBAT_RULES_EDITOR_DRAFT_V1_SCHEMA
    );
  }

  const maxEnergy = nonNegativeNumber(
    value.maxEnergy,
    "maxEnergy"
  );
  const initialEnergy = nonNegativeNumber(
    value.initialEnergy,
    "initialEnergy"
  );

  if (initialEnergy > maxEnergy) {
    throw new RangeError(
      "initialEnergy cannot exceed maxEnergy"
    );
  }

  return Object.freeze({
    schema:
      CAPTURE_COMBAT_RULES_EDITOR_DRAFT_V1_SCHEMA,
    maxEnergy,
    initialEnergy,
    energyChargeAmount: nonNegativeNumber(
      value.energyChargeAmount,
      "energyChargeAmount"
    ),
    energyChargeIntervalMs: nonNegativeNumber(
      value.energyChargeIntervalMs,
      "energyChargeIntervalMs"
    ),
    movementEnergyPerStep: nonNegativeNumber(
      value.movementEnergyPerStep,
      "movementEnergyPerStep"
    ),
    chargeTimeModifierPct: finiteNumber(
      value.chargeTimeModifierPct,
      "chargeTimeModifierPct"
    )
  });
}
