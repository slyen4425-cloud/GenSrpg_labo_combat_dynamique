export const CAPTURE_PROGRESSION_RULES_V2_SCHEMA =
  "capture-progression-rules-v2";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "xp",
  "progression",
  "skills"
]);

const XP_FIELDS = new Set([
  "enabled",
  "globalMultiplier",
  "minimumReward",
  "distribution",
  "reward",
  "levelCurve"
]);

const REWARD_FIELDS = new Set([
  "base",
  "enemyLevelCoefficient",
  "levelRatio",
  "encounterTypeMultipliers"
]);

const LEVEL_RATIO_FIELDS = new Set([
  "enabled",
  "min",
  "max",
  "exponent"
]);

const LEVEL_CURVE_FIELDS = new Set([
  "base",
  "linearPerLevel",
  "quadraticPerLevel",
  "multiplier",
  "minimumRequired"
]);

const PROGRESSION_FIELDS = new Set([
  "statCap",
  "statPointsPerLevel",
  "talentEveryLevels"
]);

const SKILLS_FIELDS = new Set([
  "maxActiveSkills",
  "slotUnlockSchedule"
]);

const SCHEDULE_FIELDS = new Set([
  "level",
  "slots"
]);

const XP_DISTRIBUTIONS = new Set([
  "participants-full",
  "active-only-full",
  "shared-participants",
  "shared-active"
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
  const number = finiteNumber(value, field);
  if (number < 0) {
    throw new RangeError(
      field + " must be >= 0"
    );
  }
  return number;
}

function positiveNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number <= 0) {
    throw new RangeError(
      field + " must be > 0"
    );
  }
  return number;
}

function nonNegativeInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      field + " must be a non-negative integer"
    );
  }
  return value;
}

function positiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(
      field + " must be a positive integer"
    );
  }
  return value;
}

function normalizeEncounterTypeMultipliers(
  input
) {
  const value = objectValue(
    input,
    "xp.reward.encounterTypeMultipliers"
  );
  const entries = Object.entries(value);

  if (entries.length === 0) {
    throw new TypeError(
      "xp.reward.encounterTypeMultipliers must not be empty"
    );
  }

  const normalized = {};

  for (const [rawId, rawMultiplier] of entries) {
    const id = String(rawId).trim();

    if (!id) {
      throw new TypeError(
        "encounter type id must not be empty"
      );
    }

    normalized[id] = nonNegativeNumber(
      rawMultiplier,
      "xp.reward.encounterTypeMultipliers." +
        id
    );
  }

  return Object.freeze(normalized);
}

function normalizeLevelRatio(input) {
  const value = objectValue(
    input,
    "xp.reward.levelRatio"
  );
  rejectUnknownFields(
    value,
    LEVEL_RATIO_FIELDS,
    "xp.reward.levelRatio"
  );

  const enabled = booleanValue(
    value.enabled,
    "xp.reward.levelRatio.enabled"
  );
  const min = nonNegativeNumber(
    value.min,
    "xp.reward.levelRatio.min"
  );
  const max = nonNegativeNumber(
    value.max,
    "xp.reward.levelRatio.max"
  );
  const exponent = positiveNumber(
    value.exponent,
    "xp.reward.levelRatio.exponent"
  );

  if (max < min) {
    throw new RangeError(
      "xp.reward.levelRatio.max must be >= min"
    );
  }

  return Object.freeze({
    enabled,
    min,
    max,
    exponent
  });
}

function normalizeReward(input) {
  const value = objectValue(
    input,
    "xp.reward"
  );
  rejectUnknownFields(
    value,
    REWARD_FIELDS,
    "xp.reward"
  );

  return Object.freeze({
    base: nonNegativeNumber(
      value.base,
      "xp.reward.base"
    ),
    enemyLevelCoefficient:
      nonNegativeNumber(
        value.enemyLevelCoefficient,
        "xp.reward.enemyLevelCoefficient"
      ),
    levelRatio:
      normalizeLevelRatio(
        value.levelRatio
      ),
    encounterTypeMultipliers:
      normalizeEncounterTypeMultipliers(
        value.encounterTypeMultipliers
      )
  });
}

function normalizeLevelCurve(input) {
  const value = objectValue(
    input,
    "xp.levelCurve"
  );
  rejectUnknownFields(
    value,
    LEVEL_CURVE_FIELDS,
    "xp.levelCurve"
  );

  return Object.freeze({
    base: nonNegativeNumber(
      value.base,
      "xp.levelCurve.base"
    ),
    linearPerLevel:
      nonNegativeNumber(
        value.linearPerLevel,
        "xp.levelCurve.linearPerLevel"
      ),
    quadraticPerLevel:
      nonNegativeNumber(
        value.quadraticPerLevel,
        "xp.levelCurve.quadraticPerLevel"
      ),
    multiplier: nonNegativeNumber(
      value.multiplier,
      "xp.levelCurve.multiplier"
    ),
    minimumRequired:
      nonNegativeInteger(
        value.minimumRequired,
        "xp.levelCurve.minimumRequired"
      )
  });
}

function normalizeXp(input) {
  const value = objectValue(
    input,
    "xp"
  );
  rejectUnknownFields(
    value,
    XP_FIELDS,
    "xp"
  );

  if (
    !XP_DISTRIBUTIONS.has(
      value.distribution
    )
  ) {
    throw new RangeError(
      "xp.distribution must be one of: " +
        [...XP_DISTRIBUTIONS].join(", ")
    );
  }

  return Object.freeze({
    enabled: booleanValue(
      value.enabled,
      "xp.enabled"
    ),
    globalMultiplier:
      nonNegativeNumber(
        value.globalMultiplier,
        "xp.globalMultiplier"
      ),
    minimumReward:
      nonNegativeInteger(
        value.minimumReward,
        "xp.minimumReward"
      ),
    distribution: value.distribution,
    reward: normalizeReward(
      value.reward
    ),
    levelCurve: normalizeLevelCurve(
      value.levelCurve
    )
  });
}

function normalizeProgression(input) {
  const value = objectValue(
    input,
    "progression"
  );
  rejectUnknownFields(
    value,
    PROGRESSION_FIELDS,
    "progression"
  );

  return Object.freeze({
    statCap: positiveInteger(
      value.statCap,
      "progression.statCap"
    ),
    statPointsPerLevel:
      nonNegativeInteger(
        value.statPointsPerLevel,
        "progression.statPointsPerLevel"
      ),
    talentEveryLevels:
      positiveInteger(
        value.talentEveryLevels,
        "progression.talentEveryLevels"
      )
  });
}

function normalizeSkills(input) {
  const value = objectValue(
    input,
    "skills"
  );
  rejectUnknownFields(
    value,
    SKILLS_FIELDS,
    "skills"
  );

  const maxActiveSkills =
    positiveInteger(
      value.maxActiveSkills,
      "skills.maxActiveSkills"
    );

  if (
    !Array.isArray(
      value.slotUnlockSchedule
    ) ||
    value.slotUnlockSchedule.length === 0
  ) {
    throw new TypeError(
      "skills.slotUnlockSchedule must be a non-empty array"
    );
  }

  let previousLevel = 0;
  let previousSlots = 0;

  const slotUnlockSchedule =
    value.slotUnlockSchedule.map(
      (raw, index) => {
        const field =
          "skills.slotUnlockSchedule[" +
          index +
          "]";
        const entry = objectValue(
          raw,
          field
        );

        rejectUnknownFields(
          entry,
          SCHEDULE_FIELDS,
          field
        );

        const level = positiveInteger(
          entry.level,
          field + ".level"
        );
        const slots = positiveInteger(
          entry.slots,
          field + ".slots"
        );

        if (
          index === 0 &&
          level !== 1
        ) {
          throw new RangeError(
            "skills.slotUnlockSchedule must start at level 1"
          );
        }

        if (level <= previousLevel) {
          throw new RangeError(
            "skills.slotUnlockSchedule levels must be strictly increasing"
          );
        }

        if (slots < previousSlots) {
          throw new RangeError(
            "skills.slotUnlockSchedule slots must not decrease"
          );
        }

        if (slots > maxActiveSkills) {
          throw new RangeError(
            "skills.slotUnlockSchedule slots cannot exceed maxActiveSkills"
          );
        }

        previousLevel = level;
        previousSlots = slots;

        return Object.freeze({
          level,
          slots
        });
      }
    );

  return Object.freeze({
    maxActiveSkills,
    slotUnlockSchedule:
      Object.freeze(
        slotUnlockSchedule
      )
  });
}

export function normalizeCaptureProgressionRulesV2(
  input
) {
  const value = objectValue(
    input,
    "CaptureProgressionRulesV2"
  );

  rejectUnknownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureProgressionRulesV2"
  );

  if (
    value.schema !==
    CAPTURE_PROGRESSION_RULES_V2_SCHEMA
  ) {
    throw new RangeError(
      "schema must be " +
        CAPTURE_PROGRESSION_RULES_V2_SCHEMA
    );
  }

  return Object.freeze({
    schema:
      CAPTURE_PROGRESSION_RULES_V2_SCHEMA,
    xp: normalizeXp(value.xp),
    progression:
      normalizeProgression(
        value.progression
      ),
    skills: normalizeSkills(
      value.skills
    )
  });
}

export function captureXpForDefeatV2(
  rulesInput,
  {
    enemyLevel,
    allyLevel,
    encounterType
  } = {}
) {
  const rules =
    normalizeCaptureProgressionRulesV2(
      rulesInput
    );

  if (!rules.xp.enabled) {
    return 0;
  }

  const enemy = positiveInteger(
    enemyLevel,
    "enemyLevel"
  );
  const ally = positiveInteger(
    allyLevel,
    "allyLevel"
  );
  const type =
    typeof encounterType === "string"
      ? encounterType.trim()
      : "";

  if (
    !type ||
    !Object.prototype.hasOwnProperty.call(
      rules.xp.reward
        .encounterTypeMultipliers,
      type
    )
  ) {
    throw new RangeError(
      "encounterType has no configured XP multiplier"
    );
  }

  const reward = rules.xp.reward;
  const rawBase =
    reward.base +
    enemy *
      reward.enemyLevelCoefficient;

  let levelFactor = 1;

  if (reward.levelRatio.enabled) {
    const rawRatio = enemy / ally;
    const boundedRatio = Math.max(
      reward.levelRatio.min,
      Math.min(
        reward.levelRatio.max,
        rawRatio
      )
    );

    levelFactor =
      boundedRatio **
      reward.levelRatio.exponent;
  }

  const typeMultiplier =
    reward
      .encounterTypeMultipliers[
        type
      ];

  const amount = Math.round(
    rawBase *
      levelFactor *
      typeMultiplier *
      rules.xp.globalMultiplier
  );

  return Math.max(
    rules.xp.minimumReward,
    amount
  );
}

export function captureXpToNextLevelV2(
  rulesInput,
  levelInput
) {
  const rules =
    normalizeCaptureProgressionRulesV2(
      rulesInput
    );
  const level = positiveInteger(
    levelInput,
    "level"
  );
  const curve = rules.xp.levelCurve;

  const amount = Math.round(
    (
      curve.base +
      curve.linearPerLevel *
        level +
      curve.quadraticPerLevel *
        level *
        level
    ) *
      curve.multiplier
  );

  return Math.max(
    curve.minimumRequired,
    amount
  );
}

export function captureActiveSkillSlotsForLevelV2(
  rulesInput,
  levelInput
) {
  const rules =
    normalizeCaptureProgressionRulesV2(
      rulesInput
    );
  const level = positiveInteger(
    levelInput,
    "level"
  );

  let slots = 0;

  for (
    const step of
      rules.skills
        .slotUnlockSchedule
  ) {
    if (level < step.level) {
      break;
    }
    slots = step.slots;
  }

  return Math.min(
    rules.skills.maxActiveSkills,
    slots
  );
}
