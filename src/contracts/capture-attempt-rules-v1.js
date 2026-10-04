export const CAPTURE_ATTEMPT_RULES_V1_SCHEMA =
  "capture-attempt-rules-v1";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "requiresCaptureItem",
  "consumeItemOnAttempt",
  "minChancePct",
  "maxChancePct",
  "baseRateMultiplier",
  "itemBonusScale",
  "globalMultiplier",
  "encounterTypes",
  "hpBands"
]);

const HP_BAND_FIELDS = new Set([
  "maxHpPct",
  "operation",
  "value"
]);

const HP_OPERATIONS = new Set([
  "add",
  "multiply"
]);

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      field + " must be an object"
    );
  }
  return value;
}

function rejectUnknownFields(
  value,
  allowed,
  field
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field +
          " contains unknown field: " +
          key
      );
    }
  }
}

function booleanValue(value, field) {
  if (typeof value !== "boolean") {
    throw new TypeError(
      field + " must be a boolean"
    );
  }
  return value;
}

function finiteNumber(value, field) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new TypeError(
      field + " must be a finite number"
    );
  }
  return value;
}

function nonNegativeNumber(value, field) {
  const number = finiteNumber(
    value,
    field
  );
  if (number < 0) {
    throw new RangeError(
      field + " must be >= 0"
    );
  }
  return number;
}

function percentage(value, field) {
  const number = finiteNumber(
    value,
    field
  );
  if (number < 0 || number > 100) {
    throw new RangeError(
      field + " must be between 0 and 100"
    );
  }
  return number;
}

function unitRoll(value, field) {
  const number = finiteNumber(
    value,
    field
  );
  if (number < 0 || number > 1) {
    throw new RangeError(
      field + " must be between 0 and 1"
    );
  }
  return number;
}

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

function normalizeEncounterTypes(input) {
  const value = objectValue(
    input,
    "encounterTypes"
  );
  const entries = Object.entries(value);

  if (entries.length === 0) {
    throw new TypeError(
      "encounterTypes must not be empty"
    );
  }

  const normalized = {};

  for (const [rawId, rawAllowed] of entries) {
    const id = requiredText(
      rawId,
      "encounterType id"
    );
    normalized[id] = booleanValue(
      rawAllowed,
      "encounterTypes." + id
    );
  }

  return Object.freeze(normalized);
}

function normalizeHpBands(input) {
  if (
    !Array.isArray(input) ||
    input.length === 0
  ) {
    throw new TypeError(
      "hpBands must be a non-empty array"
    );
  }

  let previousMax = -1;

  const bands = input.map(
    (raw, index) => {
      const field =
        "hpBands[" + index + "]";
      const value = objectValue(
        raw,
        field
      );

      rejectUnknownFields(
        value,
        HP_BAND_FIELDS,
        field
      );

      const maxHpPct = percentage(
        value.maxHpPct,
        field + ".maxHpPct"
      );

      if (maxHpPct <= previousMax) {
        throw new RangeError(
          "hpBands maxHpPct values must be strictly increasing"
        );
      }

      if (
        !HP_OPERATIONS.has(
          value.operation
        )
      ) {
        throw new RangeError(
          field +
            ".operation must be add or multiply"
        );
      }

      const bandValue =
        value.operation === "multiply"
          ? nonNegativeNumber(
              value.value,
              field + ".value"
            )
          : finiteNumber(
              value.value,
              field + ".value"
            );

      previousMax = maxHpPct;

      return Object.freeze({
        maxHpPct,
        operation: value.operation,
        value: bandValue
      });
    }
  );

  if (
    bands[
      bands.length - 1
    ].maxHpPct !== 100
  ) {
    throw new RangeError(
      "hpBands must end at maxHpPct 100"
    );
  }

  return Object.freeze(bands);
}

export function normalizeCaptureAttemptRulesV1(
  input
) {
  const value = objectValue(
    input,
    "CaptureAttemptRulesV1"
  );

  rejectUnknownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureAttemptRulesV1"
  );

  if (
    value.schema !==
    CAPTURE_ATTEMPT_RULES_V1_SCHEMA
  ) {
    throw new RangeError(
      "schema must be " +
        CAPTURE_ATTEMPT_RULES_V1_SCHEMA
    );
  }

  const minChancePct = percentage(
    value.minChancePct,
    "minChancePct"
  );
  const maxChancePct = percentage(
    value.maxChancePct,
    "maxChancePct"
  );

  if (maxChancePct < minChancePct) {
    throw new RangeError(
      "maxChancePct must be >= minChancePct"
    );
  }

  return Object.freeze({
    schema:
      CAPTURE_ATTEMPT_RULES_V1_SCHEMA,
    requiresCaptureItem:
      booleanValue(
        value.requiresCaptureItem,
        "requiresCaptureItem"
      ),
    consumeItemOnAttempt:
      booleanValue(
        value.consumeItemOnAttempt,
        "consumeItemOnAttempt"
      ),
    minChancePct,
    maxChancePct,
    baseRateMultiplier:
      nonNegativeNumber(
        value.baseRateMultiplier,
        "baseRateMultiplier"
      ),
    itemBonusScale:
      nonNegativeNumber(
        value.itemBonusScale,
        "itemBonusScale"
      ),
    globalMultiplier:
      nonNegativeNumber(
        value.globalMultiplier,
        "globalMultiplier"
      ),
    encounterTypes:
      normalizeEncounterTypes(
        value.encounterTypes
      ),
    hpBands:
      normalizeHpBands(
        value.hpBands
      )
  });
}

function encounterAllowed(
  rules,
  encounterType
) {
  const id = requiredText(
    encounterType,
    "encounterType"
  );

  if (
    !Object.prototype.hasOwnProperty.call(
      rules.encounterTypes,
      id
    )
  ) {
    throw new RangeError(
      "encounterType has no configured capture rule"
    );
  }

  return rules.encounterTypes[id];
}

function hpBandFor(
  rules,
  hpPct
) {
  for (const band of rules.hpBands) {
    if (hpPct <= band.maxHpPct) {
      return band;
    }
  }

  return rules.hpBands[
    rules.hpBands.length - 1
  ];
}

export function captureChanceV1(
  rulesInput,
  {
    encounterType,
    baseCaptureRate,
    hpPct,
    itemBonusPct = 0
  } = {}
) {
  const rules =
    normalizeCaptureAttemptRulesV1(
      rulesInput
    );

  if (
    !encounterAllowed(
      rules,
      encounterType
    )
  ) {
    return 0;
  }

  const baseRate = percentage(
    baseCaptureRate,
    "baseCaptureRate"
  );
  const hp = percentage(
    hpPct,
    "hpPct"
  );
  const itemBonus =
    nonNegativeNumber(
      itemBonusPct,
      "itemBonusPct"
    );

  const band = hpBandFor(
    rules,
    hp
  );

  let chance =
    baseRate *
    rules.baseRateMultiplier;

  if (band.operation === "add") {
    chance += band.value;
  } else {
    chance *= band.value;
  }

  chance +=
    itemBonus *
    rules.itemBonusScale;

  chance *=
    rules.globalMultiplier;

  return Math.max(
    rules.minChancePct,
    Math.min(
      rules.maxChancePct,
      Math.round(chance)
    )
  );
}

export function evaluateCaptureAttemptV1(
  rulesInput,
  {
    encounterType,
    baseCaptureRate,
    hpPct,
    itemBonusPct = 0,
    hasCaptureItem = false,
    roll
  } = {}
) {
  const rules =
    normalizeCaptureAttemptRulesV1(
      rulesInput
    );

  if (
    !encounterAllowed(
      rules,
      encounterType
    )
  ) {
    return Object.freeze({
      allowed: false,
      reason:
        "encounter_not_capturable",
      chancePct: 0,
      success: false,
      consumeItem: false
    });
  }

  if (
    rules.requiresCaptureItem &&
    !hasCaptureItem
  ) {
    return Object.freeze({
      allowed: false,
      reason:
        "capture_item_required",
      chancePct: 0,
      success: false,
      consumeItem: false
    });
  }

  const chancePct =
    captureChanceV1(
      rules,
      {
        encounterType,
        baseCaptureRate,
        hpPct,
        itemBonusPct:
          hasCaptureItem
            ? itemBonusPct
            : 0
      }
    );

  const captureRoll = unitRoll(
    roll,
    "roll"
  );

  const success =
    chancePct >= 100 ||
    (
      chancePct > 0 &&
      captureRoll <
        chancePct / 100
    );

  return Object.freeze({
    allowed: true,
    reason: success
      ? "captured"
      : "capture_failed",
    chancePct,
    success,
    consumeItem:
      rules.consumeItemOnAttempt &&
      hasCaptureItem
  });
}
