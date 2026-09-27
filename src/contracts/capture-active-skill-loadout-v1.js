export const CAPTURE_ACTIVE_SKILL_LOADOUT_SCHEMA =
  "capture-active-skill-loadout-v1";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "creatureId",
  "slots"
]);

const SLOT_FIELDS = new Set([
  "id",
  "skillId"
]);

const SLOT_IDS = Object.freeze([
  "slot-1",
  "slot-2",
  "slot-3",
  "slot-4"
]);

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function assertKnownFields(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(`${field} contains unknown field: ${key}`);
    }
  }
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value, field) {
  return value == null
    ? null
    : requiredString(value, field);
}

function normalizeSlots(raw) {
  if (!Array.isArray(raw) || raw.length !== SLOT_IDS.length) {
    throw new RangeError(
      "slots must contain exactly four entries"
    );
  }

  const slots = raw.map((rawSlot, index) => {
    const field = `slots[${index}]`;
    const value = objectValue(rawSlot, field);
    assertKnownFields(value, SLOT_FIELDS, field);

    const expectedId = SLOT_IDS[index];
    const id = requiredString(value.id, `${field}.id`);

    if (id !== expectedId) {
      throw new RangeError(
        `${field}.id must be ${expectedId}`
      );
    }

    return Object.freeze({
      id,
      skillId: optionalString(
        value.skillId,
        `${field}.skillId`
      )
    });
  });

  const equippedSkillIds = slots
    .map((slot) => slot.skillId)
    .filter((skillId) => skillId !== null);

  if (
    new Set(equippedSkillIds).size !==
    equippedSkillIds.length
  ) {
    throw new RangeError(
      "duplicate equipped skill ids are not allowed"
    );
  }

  return Object.freeze({
    slots: Object.freeze(slots),
    equippedSkillIds: Object.freeze(equippedSkillIds)
  });
}

export function normalizeCaptureActiveSkillLoadoutV1(input) {
  const value = objectValue(
    input,
    "CaptureActiveSkillLoadoutV1"
  );

  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureActiveSkillLoadoutV1"
  );

  if (value.schema !== CAPTURE_ACTIVE_SKILL_LOADOUT_SCHEMA) {
    throw new RangeError(
      `schema must be ${CAPTURE_ACTIVE_SKILL_LOADOUT_SCHEMA}`
    );
  }

  const normalizedSlots = normalizeSlots(value.slots);

  return Object.freeze({
    schema: CAPTURE_ACTIVE_SKILL_LOADOUT_SCHEMA,
    creatureId: requiredString(
      value.creatureId,
      "creatureId"
    ),
    slots: normalizedSlots.slots,
    equippedSkillIds: normalizedSlots.equippedSkillIds
  });
}
