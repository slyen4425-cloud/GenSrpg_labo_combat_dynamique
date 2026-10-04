export const CAPTURE_REWARD_RULES_V1_SCHEMA =
  "capture-reward-rules-v1";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "currencyId",
  "encounterTypes"
]);

const ENCOUNTER_FIELDS = new Set([
  "currency",
  "item"
]);

const CURRENCY_FIELDS = new Set([
  "enabled",
  "chancePct",
  "minAmount",
  "base",
  "enemyAverageLevelCoefficient",
  "randomBonusMin",
  "randomBonusMax"
]);

const ITEM_FIELDS = new Set([
  "enabled",
  "chancePct",
  "tableId",
  "quantityMin",
  "quantityMax"
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

function nonNegativeInteger(value, field) {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new RangeError(
      field +
        " must be a non-negative integer"
    );
  }
  return value;
}

function positiveInteger(value, field) {
  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new RangeError(
      field +
        " must be a positive integer"
    );
  }
  return value;
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

function normalizeCurrencyPolicy(
  input,
  field
) {
  const value = objectValue(
    input,
    field
  );
  rejectUnknownFields(
    value,
    CURRENCY_FIELDS,
    field
  );

  const randomBonusMin =
    nonNegativeNumber(
      value.randomBonusMin,
      field + ".randomBonusMin"
    );
  const randomBonusMax =
    nonNegativeNumber(
      value.randomBonusMax,
      field + ".randomBonusMax"
    );

  if (
    randomBonusMax <
    randomBonusMin
  ) {
    throw new RangeError(
      field +
        ".randomBonusMax must be >= randomBonusMin"
    );
  }

  return Object.freeze({
    enabled: booleanValue(
      value.enabled,
      field + ".enabled"
    ),
    chancePct: percentage(
      value.chancePct,
      field + ".chancePct"
    ),
    minAmount:
      nonNegativeInteger(
        value.minAmount,
        field + ".minAmount"
      ),
    base: nonNegativeNumber(
      value.base,
      field + ".base"
    ),
    enemyAverageLevelCoefficient:
      nonNegativeNumber(
        value
          .enemyAverageLevelCoefficient,
        field +
          ".enemyAverageLevelCoefficient"
      ),
    randomBonusMin,
    randomBonusMax
  });
}

function normalizeItemPolicy(
  input,
  field
) {
  const value = objectValue(
    input,
    field
  );
  rejectUnknownFields(
    value,
    ITEM_FIELDS,
    field
  );

  const quantityMin =
    positiveInteger(
      value.quantityMin,
      field + ".quantityMin"
    );
  const quantityMax =
    positiveInteger(
      value.quantityMax,
      field + ".quantityMax"
    );

  if (quantityMax < quantityMin) {
    throw new RangeError(
      field +
        ".quantityMax must be >= quantityMin"
    );
  }

  return Object.freeze({
    enabled: booleanValue(
      value.enabled,
      field + ".enabled"
    ),
    chancePct: percentage(
      value.chancePct,
      field + ".chancePct"
    ),
    tableId: requiredText(
      value.tableId,
      field + ".tableId"
    ),
    quantityMin,
    quantityMax
  });
}

function normalizeEncounterTypes(
  input
) {
  const value = objectValue(
    input,
    "encounterTypes"
  );
  const entries = Object.entries(
    value
  );

  if (entries.length === 0) {
    throw new TypeError(
      "encounterTypes must not be empty"
    );
  }

  const normalized = {};

  for (const [rawId, rawPolicy] of entries) {
    const id = requiredText(
      rawId,
      "encounterType id"
    );
    const field =
      "encounterTypes." + id;
    const policy = objectValue(
      rawPolicy,
      field
    );

    rejectUnknownFields(
      policy,
      ENCOUNTER_FIELDS,
      field
    );

    normalized[id] = Object.freeze({
      currency:
        normalizeCurrencyPolicy(
          policy.currency,
          field + ".currency"
        ),
      item: normalizeItemPolicy(
        policy.item,
        field + ".item"
      )
    });
  }

  return Object.freeze(normalized);
}

export function normalizeCaptureRewardRulesV1(
  input
) {
  const value = objectValue(
    input,
    "CaptureRewardRulesV1"
  );

  rejectUnknownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureRewardRulesV1"
  );

  if (
    value.schema !==
    CAPTURE_REWARD_RULES_V1_SCHEMA
  ) {
    throw new RangeError(
      "schema must be " +
        CAPTURE_REWARD_RULES_V1_SCHEMA
    );
  }

  return Object.freeze({
    schema:
      CAPTURE_REWARD_RULES_V1_SCHEMA,
    currencyId: requiredText(
      value.currencyId,
      "currencyId"
    ),
    encounterTypes:
      normalizeEncounterTypes(
        value.encounterTypes
      )
  });
}

function encounterPolicy(
  rules,
  encounterType
) {
  const id = requiredText(
    encounterType,
    "encounterType"
  );
  const policy =
    rules.encounterTypes[id];

  if (!policy) {
    throw new RangeError(
      "encounterType has no configured reward policy"
    );
  }

  return policy;
}

function chancePasses(
  chancePct,
  chanceRoll
) {
  const roll = unitRoll(
    chanceRoll,
    "chanceRoll"
  );

  if (chancePct >= 100) {
    return true;
  }
  if (chancePct <= 0) {
    return false;
  }
  return roll < chancePct / 100;
}

export function captureCurrencyRewardV1(
  rulesInput,
  {
    encounterType,
    averageEnemyLevel,
    chanceRoll,
    amountRoll
  } = {}
) {
  const rules =
    normalizeCaptureRewardRulesV1(
      rulesInput
    );
  const policy = encounterPolicy(
    rules,
    encounterType
  ).currency;

  if (
    !policy.enabled ||
    !chancePasses(
      policy.chancePct,
      chanceRoll
    )
  ) {
    return Object.freeze({
      granted: false,
      currencyId:
        rules.currencyId,
      amount: 0
    });
  }

  const level =
    nonNegativeNumber(
      averageEnemyLevel,
      "averageEnemyLevel"
    );
  const roll = unitRoll(
    amountRoll,
    "amountRoll"
  );
  const randomBonus =
    policy.randomBonusMin +
    (
      policy.randomBonusMax -
      policy.randomBonusMin
    ) *
      roll;

  const amount = Math.max(
    policy.minAmount,
    Math.round(
      policy.base +
        level *
          policy
            .enemyAverageLevelCoefficient +
        randomBonus
    )
  );

  return Object.freeze({
    granted: true,
    currencyId: rules.currencyId,
    amount
  });
}

export function captureItemRewardV1(
  rulesInput,
  {
    encounterType,
    chanceRoll,
    quantityRoll
  } = {}
) {
  const rules =
    normalizeCaptureRewardRulesV1(
      rulesInput
    );
  const policy = encounterPolicy(
    rules,
    encounterType
  ).item;

  if (
    !policy.enabled ||
    !chancePasses(
      policy.chancePct,
      chanceRoll
    )
  ) {
    return Object.freeze({
      granted: false,
      tableId: policy.tableId,
      quantity: 0
    });
  }

  const roll = unitRoll(
    quantityRoll,
    "quantityRoll"
  );
  const span =
    policy.quantityMax -
    policy.quantityMin +
    1;
  const quantity = Math.min(
    policy.quantityMax,
    policy.quantityMin +
      Math.floor(
        roll * span
      )
  );

  return Object.freeze({
    granted: true,
    tableId: policy.tableId,
    quantity
  });
}
