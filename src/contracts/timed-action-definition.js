export const TIMED_ACTION_KINDS = Object.freeze([
  "item",
  "recall",
  "summon"
]);

const KIND_SET = new Set(TIMED_ACTION_KINDS);

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

export function normalizeTimedActionDefinition(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("TimedActionDefinition must be an object");
  }

  const id = nonEmptyString(input.id, "id");
  const name = nonEmptyString(input.name, "name");
  const kind = nonEmptyString(input.kind, "kind");

  if (!KIND_SET.has(kind)) {
    throw new RangeError(`Unsupported timed action kind: ${kind}`);
  }

  const effect = input.effect ?? {};
  if (typeof effect !== "object" || Array.isArray(effect)) {
    throw new TypeError("effect must be an object");
  }

  let summonFighterId = null;
  if (kind === "summon") {
    summonFighterId = nonEmptyString(
      effect.summonFighterId,
      "effect.summonFighterId"
    );
  }

  return Object.freeze({
    id,
    name,
    kind,
    energyCost: nonNegativeNumber(input.energyCost, "energyCost"),
    preparationMs: nonNegativeNumber(input.preparationMs, "preparationMs"),
    recoveryMs: nonNegativeNumber(input.recoveryMs, "recoveryMs"),
    effect: Object.freeze({
      heal: nonNegativeNumber(effect.heal, "effect.heal"),
      summonFighterId
    })
  });
}
