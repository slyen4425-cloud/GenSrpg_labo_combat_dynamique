export const CAPTURE_COMBAT_RESULT_SCHEMA =
  "capture-combat-result-v1";

const OUTCOMES = new Set([
  "victory",
  "defeat",
  "fled"
]);

function requiredText(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }
  return value.trim();
}

export function createCaptureCombatResultV1(
  input = {}
) {
  const outcome = requiredText(
    input.outcome,
    "outcome"
  );

  if (!OUTCOMES.has(outcome)) {
    throw new RangeError(
      "outcome must be victory, defeat or fled"
    );
  }

  return Object.freeze({
    schema: CAPTURE_COMBAT_RESULT_SCHEMA,
    version: 1,
    encounterId: requiredText(
      input.encounterId,
      "encounterId"
    ),
    returnToken: requiredText(
      input.returnToken,
      "returnToken"
    ),
    outcome,
    partyState:
      input.partyState === undefined
        ? null
        : structuredClone(input.partyState),
    rewards: Object.freeze(
      Array.isArray(input.rewards)
        ? structuredClone(input.rewards)
        : []
    ),
    capture:
      input.capture === undefined
        ? null
        : structuredClone(input.capture),
    worldEffects: Object.freeze(
      Array.isArray(input.worldEffects)
        ? structuredClone(input.worldEffects)
        : []
    )
  });
}
