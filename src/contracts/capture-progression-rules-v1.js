export const CAPTURE_PROGRESSION_RULES_V1_SCHEMA =
  "capture-progression-rules-v1";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "maxActiveSkills",
  "slotUnlockSchedule"
]);

const SCHEDULE_FIELDS = new Set([
  "level",
  "slots"
]);

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(field + " must be an object");
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

export function normalizeCaptureProgressionRulesV1(
  input
) {
  const value = objectValue(
    input,
    "CaptureProgressionRulesV1"
  );

  for (const key of Object.keys(value)) {
    if (!TOP_LEVEL_FIELDS.has(key)) {
      throw new TypeError(
        "CaptureProgressionRulesV1 contains unknown field: " +
          key
      );
    }
  }

  if (
    value.schema !==
    CAPTURE_PROGRESSION_RULES_V1_SCHEMA
  ) {
    throw new RangeError(
      "schema must be " +
        CAPTURE_PROGRESSION_RULES_V1_SCHEMA
    );
  }

  const maxActiveSkills = positiveInteger(
    value.maxActiveSkills,
    "maxActiveSkills"
  );

  if (
    !Array.isArray(value.slotUnlockSchedule) ||
    value.slotUnlockSchedule.length === 0
  ) {
    throw new TypeError(
      "slotUnlockSchedule must be a non-empty array"
    );
  }

  let previousLevel = 0;
  let previousSlots = 0;

  const slotUnlockSchedule =
    value.slotUnlockSchedule.map(
      (raw, index) => {
        const field =
          "slotUnlockSchedule[" + index + "]";
        const entry = objectValue(raw, field);

        for (const key of Object.keys(entry)) {
          if (!SCHEDULE_FIELDS.has(key)) {
            throw new TypeError(
              field + " contains unknown field: " + key
            );
          }
        }

        const level = positiveInteger(
          entry.level,
          field + ".level"
        );
        const slots = positiveInteger(
          entry.slots,
          field + ".slots"
        );

        if (index === 0 && level !== 1) {
          throw new RangeError(
            "slotUnlockSchedule must start at level 1"
          );
        }
        if (level <= previousLevel) {
          throw new RangeError(
            "slotUnlockSchedule levels must be strictly increasing"
          );
        }
        if (slots < previousSlots) {
          throw new RangeError(
            "slotUnlockSchedule slots must not decrease"
          );
        }
        if (slots > maxActiveSkills) {
          throw new RangeError(
            "slotUnlockSchedule slots cannot exceed maxActiveSkills"
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
    schema:
      CAPTURE_PROGRESSION_RULES_V1_SCHEMA,
    maxActiveSkills,
    slotUnlockSchedule:
      Object.freeze(slotUnlockSchedule)
  });
}

export function captureActiveSkillSlotsForLevelV1(
  rulesInput,
  levelInput
) {
  const rules =
    normalizeCaptureProgressionRulesV1(rulesInput);
  const level = positiveInteger(
    levelInput,
    "level"
  );

  let slots = 0;
  for (const step of rules.slotUnlockSchedule) {
    if (level < step.level) {
      break;
    }
    slots = step.slots;
  }

  return Math.min(
    rules.maxActiveSkills,
    slots
  );
}
