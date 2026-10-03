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

function optionalPositiveInteger(value, field) {
  return value == null
    ? null
    : positiveInteger(value, field);
}

function optionalString(value, field) {
  return value == null
    ? null
    : requiredString(value, field);
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

  const expiresAtMs =
    definition.durationModel === "time_ms"
      ? nonNegative(
          value.expiresAtMs,
          field + ".expiresAtMs"
        )
      : null;

  if (
    expiresAtMs !== null &&
    expiresAtMs < appliedAtMs
  ) {
    throw new RangeError(
      field +
        ".expiresAtMs cannot be before appliedAtMs"
    );
  }

  const remainingActionEnds =
    definition.durationModel === "owner_action_end"
      ? optionalPositiveInteger(
          value.remainingActionEnds,
          field + ".remainingActionEnds"
        )
      : null;

  if (
    definition.durationModel === "owner_action_end" &&
    remainingActionEnds === null
  ) {
    throw new TypeError(
      field +
        ".remainingActionEnds is required for owner_action_end"
    );
  }

  const nextTickAtMs =
    definition.durationModel === "time_ms"
      ? optionalNonNegative(
          value.nextTickAtMs,
          field + ".nextTickAtMs"
        )
      : null;

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
    sourceSkillId: optionalString(
      value.sourceSkillId,
      field + ".sourceSkillId"
    ),
    appliedAtMs,
    expiresAtMs,
    remainingActionEnds,
    nextTickAtMs,
    stacks: positiveInteger(
      value.stacks ?? 1,
      field + ".stacks"
    ),
    shieldRemaining
  });
}

export function isStatusEffectRuntimeInstanceActiveV1(
  instance,
  atMs
) {
  if (
    !instance ||
    typeof instance !== "object"
  ) {
    return false;
  }

  if (
    instance.definition?.durationModel ===
    "owner_action_end"
  ) {
    return Number(
      instance.remainingActionEnds
    ) > 0;
  }

  const time = Number(atMs);
  return (
    Number.isFinite(time) &&
    instance.appliedAtMs <= time &&
    time < instance.expiresAtMs
  );
}

export function createStatusEffectRuntimeInstanceV1({
  definition: definitionInput,
  sourceActorId,
  sourceSkillId = null,
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
  const timed =
    definition.durationModel === "time_ms";
  const tickIntervalMs =
    timed &&
    (
      definition.kind === "damage_over_time" ||
      definition.kind === "heal_over_time"
    )
      ? definition.tickIntervalMs
      : null;

  return normalizeStatusEffectRuntimeInstanceV1({
    definition,
    sourceActorId,
    sourceSkillId,
    appliedAtMs: applied,
    expiresAtMs:
      timed
        ? applied + definition.durationMs
        : null,
    remainingActionEnds:
      timed
        ? null
        : definition.durationActions,
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
