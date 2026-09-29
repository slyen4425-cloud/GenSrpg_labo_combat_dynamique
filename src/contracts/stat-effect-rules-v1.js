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

function optionalString(value, field) {
  return value == null
    ? null
    : requiredString(value, field);
}

function nonNegative(value, field) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(
      field +
        " must be a non-negative finite number"
    );
  }
  return number;
}

const RULE_FIELDS = new Set([
  "damageChannel",
  "resistanceChannel",
  "damagePctPerPoint",
  "resistancePctPerPoint",
  "chargeTimeReductionPctPerPoint"
]);

export function normalizeStatEffectRulesByIdV1(
  input,
  field = "statEffectRulesById"
) {
  if (input == null) {
    return Object.freeze({});
  }

  const value = objectValue(input, field);
  const output = {};

  for (
    const [statIdRaw, ruleRaw] of
    Object.entries(value)
  ) {
    const statId = requiredString(
      statIdRaw,
      field + " key"
    );
    const rule = objectValue(
      ruleRaw,
      field + "." + statId
    );

    for (const key of Object.keys(rule)) {
      if (!RULE_FIELDS.has(key)) {
        throw new TypeError(
          field +
            "." +
            statId +
            " contains unknown field: " +
            key
        );
      }
    }

    output[statId] = Object.freeze({
      damageChannel: optionalString(
        rule.damageChannel,
        field +
          "." +
          statId +
          ".damageChannel"
      ),
      resistanceChannel: optionalString(
        rule.resistanceChannel,
        field +
          "." +
          statId +
          ".resistanceChannel"
      ),
      damagePctPerPoint: nonNegative(
        rule.damagePctPerPoint,
        field +
          "." +
          statId +
          ".damagePctPerPoint"
      ),
      resistancePctPerPoint: nonNegative(
        rule.resistancePctPerPoint,
        field +
          "." +
          statId +
          ".resistancePctPerPoint"
      ),
      chargeTimeReductionPctPerPoint:
        nonNegative(
          rule.chargeTimeReductionPctPerPoint,
          field +
            "." +
            statId +
            ".chargeTimeReductionPctPerPoint"
        )
    });
  }

  return Object.freeze(output);
}
