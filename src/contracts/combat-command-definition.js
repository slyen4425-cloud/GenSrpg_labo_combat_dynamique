export const COMBAT_COMMAND_KINDS = Object.freeze([
  "item",
  "recall",
  "summon"
]);

const KIND_SET = new Set(COMBAT_COMMAND_KINDS);

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function nonNegativeNumber(value, field) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${field} must be a non-negative finite number`);
  }
  return number;
}

function optionalString(value, field) {
  if (value == null) {
    return null;
  }
  return nonEmptyString(value, field);
}

export function normalizeCombatCommandDefinition(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("CombatCommandDefinition must be an object");
  }

  const id = nonEmptyString(input.id, "id");
  const name = nonEmptyString(input.name, "name");
  const kind = nonEmptyString(input.kind, "kind");

  if (!KIND_SET.has(kind)) {
    throw new RangeError(`Unsupported combat command kind: ${kind}`);
  }

  const effect = input.effect ?? {};
  if (typeof effect !== "object" || Array.isArray(effect)) {
    throw new TypeError("effect must be an object");
  }

  return Object.freeze({
    id,
    name,
    kind,
    energyCost: nonNegativeNumber(input.energyCost, "energyCost"),
    preparationMs: nonNegativeNumber(input.preparationMs, "preparationMs"),
    recoveryMs: nonNegativeNumber(input.recoveryMs, "recoveryMs"),
    interruptibleDuringPreparation:
      input.interruptibleDuringPreparation !== false,
    effect: Object.freeze({
      heal: nonNegativeNumber(effect.heal, "effect.heal"),
      itemId: optionalString(effect.itemId, "effect.itemId"),
      summonCreatureId: optionalString(
        effect.summonCreatureId,
        "effect.summonCreatureId"
      )
    })
  });
}
