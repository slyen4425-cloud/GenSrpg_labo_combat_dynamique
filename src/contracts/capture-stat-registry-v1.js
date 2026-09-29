export const CAPTURE_STAT_REGISTRY_V1_SCHEMA =
  "capture-stat-registry-v1";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "stats"
]);

const STAT_FIELDS = new Set([
  "id",
  "label",
  "damageChannel",
  "resistanceChannel",
  "damagePctPerPoint",
  "resistancePctPerPoint",
  "chargeTimeReductionPctPerPoint"
]);

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(field + " must be an object");
  }
  return value;
}

function assertKnownFields(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(field + " contains unknown field: " + key);
    }
  }
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(field + " must be a non-empty string");
  }
  return value.trim();
}

function optionalString(value, field) {
  return value == null
    ? null
    : requiredString(value, field);
}

function nonNegativeNumber(value, field, fallback = 0) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(
      field + " must be a non-negative finite number"
    );
  }
  return number;
}

function normalizeStat(raw, index) {
  const field = "stats[" + index + "]";
  const value = objectValue(raw, field);
  assertKnownFields(value, STAT_FIELDS, field);

  const damageChannel = optionalString(
    value.damageChannel,
    field + ".damageChannel"
  );
  const resistanceChannel = optionalString(
    value.resistanceChannel,
    field + ".resistanceChannel"
  );

  return Object.freeze({
    id: requiredString(value.id, field + ".id"),
    label: requiredString(value.label, field + ".label"),
    damageChannel,
    resistanceChannel,
    damagePctPerPoint:
      damageChannel === null
        ? 0
        : nonNegativeNumber(
            value.damagePctPerPoint,
            field + ".damagePctPerPoint",
            1
          ),
    resistancePctPerPoint:
      resistanceChannel === null
        ? 0
        : nonNegativeNumber(
            value.resistancePctPerPoint,
            field + ".resistancePctPerPoint",
            1
          ),
    chargeTimeReductionPctPerPoint:
      nonNegativeNumber(
        value.chargeTimeReductionPctPerPoint,
        field + ".chargeTimeReductionPctPerPoint",
        0
      )
  });
}

export function normalizeCaptureStatRegistryV1(input) {
  const value = objectValue(input, "CaptureStatRegistryV1");
  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureStatRegistryV1"
  );

  if (value.schema !== CAPTURE_STAT_REGISTRY_V1_SCHEMA) {
    throw new RangeError(
      "schema must be " + CAPTURE_STAT_REGISTRY_V1_SCHEMA
    );
  }

  if (!Array.isArray(value.stats)) {
    throw new TypeError("stats must be an array");
  }

  const stats = value.stats.map(normalizeStat);
  const ids = stats.map((entry) => entry.id);

  if (new Set(ids).size !== ids.length) {
    throw new RangeError("stats must not contain duplicate ids");
  }

  return Object.freeze({
    schema: CAPTURE_STAT_REGISTRY_V1_SCHEMA,
    stats: Object.freeze(stats)
  });
}

export function captureStatDefinitionForIdV1(
  registryInput,
  statId
) {
  const registry =
    normalizeCaptureStatRegistryV1(registryInput);
  const id = requiredString(statId, "statId");
  return (
    registry.stats.find((entry) => entry.id === id) ??
    null
  );
}
