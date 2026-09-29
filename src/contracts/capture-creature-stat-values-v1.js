import {
  normalizeCaptureStatRegistryV1
} from "./capture-stat-registry-v1.js";

export const CAPTURE_CREATURE_STAT_VALUES_V1_SCHEMA =
  "capture-creature-stat-values-v1";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "creatureId",
  "values"
]);

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(field + " must be an object");
  }
  return value;
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(field + " must be a non-empty string");
  }
  return value.trim();
}

function nonNegativeNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(
      field + " must be a non-negative finite number"
    );
  }
  return number;
}

export function normalizeCaptureCreatureStatValuesV1(
  input,
  registryInput
) {
  const value = objectValue(
    input,
    "CaptureCreatureStatValuesV1"
  );

  for (const key of Object.keys(value)) {
    if (!TOP_LEVEL_FIELDS.has(key)) {
      throw new TypeError(
        "CaptureCreatureStatValuesV1 contains unknown field: " +
          key
      );
    }
  }

  if (
    value.schema !==
    CAPTURE_CREATURE_STAT_VALUES_V1_SCHEMA
  ) {
    throw new RangeError(
      "schema must be " +
        CAPTURE_CREATURE_STAT_VALUES_V1_SCHEMA
    );
  }

  const registry =
    normalizeCaptureStatRegistryV1(registryInput);
  const rawValues = objectValue(value.values, "values");
  const allowed = new Set(
    registry.stats.map((entry) => entry.id)
  );

  for (const statId of Object.keys(rawValues)) {
    if (!allowed.has(statId)) {
      throw new RangeError(
        "unknown stat id: " + statId
      );
    }
  }

  const output = {};
  for (const entry of registry.stats) {
    if (
      Object.prototype.hasOwnProperty.call(
        rawValues,
        entry.id
      )
    ) {
      output[entry.id] = nonNegativeNumber(
        rawValues[entry.id],
        "values." + entry.id
      );
    }
  }

  return Object.freeze({
    schema:
      CAPTURE_CREATURE_STAT_VALUES_V1_SCHEMA,
    creatureId: requiredString(
      value.creatureId,
      "creatureId"
    ),
    values: Object.freeze(output)
  });
}
