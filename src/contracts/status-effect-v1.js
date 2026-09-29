export const STATUS_EFFECT_V1_KINDS = Object.freeze([
  "stat_modifier",
  "damage_over_time",
  "heal_over_time",
  "shield",
  "immobilize",
  "silence",
  "stun",
  "taunt"
]);

export const STATUS_EFFECT_V1_POLARITIES = Object.freeze([
  "beneficial",
  "detrimental",
  "neutral"
]);

export const STATUS_EFFECT_V1_STACKING = Object.freeze([
  "replace",
  "refresh",
  "stack"
]);

const KIND_SET = new Set(STATUS_EFFECT_V1_KINDS);
const POLARITY_SET = new Set(
  STATUS_EFFECT_V1_POLARITIES
);
const STACKING_SET = new Set(
  STATUS_EFFECT_V1_STACKING
);

const COMMON_FIELDS = new Set([
  "id",
  "kind",
  "polarity",
  "durationMs",
  "stacking",
  "maxStacks",
  "tags"
]);

const FIELDS_BY_KIND = Object.freeze({
  stat_modifier: new Set([
    ...COMMON_FIELDS,
    "statId",
    "deltaPoints"
  ]),
  damage_over_time: new Set([
    ...COMMON_FIELDS,
    "amount",
    "channel",
    "tickIntervalMs"
  ]),
  heal_over_time: new Set([
    ...COMMON_FIELDS,
    "amount",
    "tickIntervalMs"
  ]),
  shield: new Set([
    ...COMMON_FIELDS,
    "amount"
  ]),
  immobilize: COMMON_FIELDS,
  silence: COMMON_FIELDS,
  stun: COMMON_FIELDS,
  taunt: COMMON_FIELDS
});

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

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(
      field + " must be a finite number"
    );
  }
  return number;
}

function positiveNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number <= 0) {
    throw new RangeError(
      field + " must be greater than 0"
    );
  }
  return number;
}

function positiveInteger(value, field) {
  const number = positiveNumber(value, field);
  if (!Number.isInteger(number)) {
    throw new RangeError(
      field + " must be a positive integer"
    );
  }
  return number;
}

function stringArray(value, field) {
  const list = value ?? [];
  if (!Array.isArray(list)) {
    throw new TypeError(field + " must be an array");
  }
  return Object.freeze([
    ...new Set(
      list.map((entry, index) =>
        requiredString(
          entry,
          field + "[" + index + "]"
        )
      )
    )
  ]);
}

function assertKnownFields(
  value,
  allowed,
  field
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field + " contains unknown field: " + key
      );
    }
  }
}

export function normalizeStatusEffectV1(input) {
  const value = objectValue(
    input,
    "StatusEffectV1"
  );

  const kind = requiredString(
    value.kind,
    "StatusEffectV1.kind"
  );
  if (!KIND_SET.has(kind)) {
    throw new RangeError(
      "Unsupported StatusEffectV1.kind: " + kind
    );
  }

  assertKnownFields(
    value,
    FIELDS_BY_KIND[kind],
    "StatusEffectV1"
  );

  const polarity = requiredString(
    value.polarity,
    "StatusEffectV1.polarity"
  );
  if (!POLARITY_SET.has(polarity)) {
    throw new RangeError(
      "Unsupported StatusEffectV1.polarity: " +
        polarity
    );
  }

  const stacking = requiredString(
    value.stacking,
    "StatusEffectV1.stacking"
  );
  if (!STACKING_SET.has(stacking)) {
    throw new RangeError(
      "Unsupported StatusEffectV1.stacking: " +
        stacking
    );
  }

  const output = {
    id: requiredString(
      value.id,
      "StatusEffectV1.id"
    ),
    kind,
    polarity,
    durationMs: positiveNumber(
      value.durationMs,
      "StatusEffectV1.durationMs"
    ),
    stacking,
    maxStacks:
      stacking === "stack"
        ? positiveInteger(
            value.maxStacks ?? 1,
            "StatusEffectV1.maxStacks"
          )
        : 1,
    tags: stringArray(
      value.tags,
      "StatusEffectV1.tags"
    )
  };

  if (kind === "stat_modifier") {
    output.statId = requiredString(
      value.statId,
      "StatusEffectV1.statId"
    );
    output.deltaPoints = finiteNumber(
      value.deltaPoints,
      "StatusEffectV1.deltaPoints"
    );
  }

  if (kind === "damage_over_time") {
    output.amount = positiveNumber(
      value.amount,
      "StatusEffectV1.amount"
    );
    output.channel = requiredString(
      value.channel,
      "StatusEffectV1.channel"
    );
    output.tickIntervalMs = positiveNumber(
      value.tickIntervalMs,
      "StatusEffectV1.tickIntervalMs"
    );
  }

  if (kind === "heal_over_time") {
    output.amount = positiveNumber(
      value.amount,
      "StatusEffectV1.amount"
    );
    output.tickIntervalMs = positiveNumber(
      value.tickIntervalMs,
      "StatusEffectV1.tickIntervalMs"
    );
  }

  if (kind === "shield") {
    output.amount = positiveNumber(
      value.amount,
      "StatusEffectV1.amount"
    );
  }

  return Object.freeze(output);
}
