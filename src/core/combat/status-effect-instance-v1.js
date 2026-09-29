import {
  normalizeStatusEffectV1
} from "../../contracts/status-effect-v1.js";

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

function requiredString(value, field) {
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

function nonNegative(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(
      field +
        " must be a non-negative finite number"
    );
  }
  return number;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (
    !Number.isInteger(number) ||
    number < 1
  ) {
    throw new RangeError(
      field + " must be a positive integer"
    );
  }
  return number;
}

function optionalNonNegative(value, field) {
  return value == null
    ? null
    : nonNegative(value, field);
}

export function normalizeStatusEffectRuntimeInstanceV1(
  input,
  field = "StatusEffectRuntimeInstanceV1"
) {
  const value = objectValue(input, field);
  const definition = normalizeStatusEffectV1(
    value.definition
  );
  const appliedAtMs = nonNegative(
    value.appliedAtMs,
    field + ".appliedAtMs"
  );
  const expiresAtMs = nonNegative(
    value.expiresAtMs,
    field + ".expiresAtMs"
  );

  if (expiresAtMs < appliedAtMs) {
    throw new RangeError(
      field +
        ".expiresAtMs cannot be before appliedAtMs"
    );
  }

  const nextTickAtMs = optionalNonNegative(
    value.nextTickAtMs,
    field + ".nextTickAtMs"
  );
  const shieldRemaining =
    optionalNonNegative(
      value.shieldRemaining,
      field + ".shieldRemaining"
    );

  return Object.freeze({
    definition,
    sourceActorId: requiredString(
      value.sourceActorId,
      field + ".sourceActorId"
    ),
    appliedAtMs,
    expiresAtMs,
    nextTickAtMs,
    stacks: positiveInteger(
      value.stacks ?? 1,
      field + ".stacks"
    ),
    shieldRemaining
  });
}

export function createStatusEffectRuntimeInstanceV1({
  definition: definitionInput,
  sourceActorId,
  appliedAtMs,
  stacks = 1
}) {
  const definition =
    normalizeStatusEffectV1(
      definitionInput
    );
  const applied = nonNegative(
    appliedAtMs,
    "appliedAtMs"
  );
  const tickIntervalMs =
    definition.kind === "damage_over_time" ||
    definition.kind === "heal_over_time"
      ? definition.tickIntervalMs
      : null;

  return normalizeStatusEffectRuntimeInstanceV1({
    definition,
    sourceActorId,
    appliedAtMs: applied,
    expiresAtMs:
      applied + definition.durationMs,
    nextTickAtMs:
      tickIntervalMs === null
        ? null
        : applied + tickIntervalMs,
    stacks,
    shieldRemaining:
      definition.kind === "shield"
        ? definition.amount * stacks
        : null
  });
}
