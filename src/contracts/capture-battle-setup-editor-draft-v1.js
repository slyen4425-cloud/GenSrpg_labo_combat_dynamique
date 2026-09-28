export const CAPTURE_BATTLE_SETUP_EDITOR_DRAFT_SCHEMA =
  "capture-battle-setup-editor-draft-v1";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "id",
  "localActorId",
  "skillSpeedMultiplier",
  "teams"
]);

const TEAM_FIELDS = new Set([
  "id",
  "slots"
]);

const SLOT_FIELDS = new Set([
  "actorId",
  "creatureId",
  "displayName",
  "controllerId",
  "roster"
]);

const ROSTER_FIELDS = new Set([
  "activeMemberId",
  "members"
]);

const MEMBER_FIELDS = new Set([
  "id",
  "creatureId",
  "displayName"
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

function positiveFiniteNumber(value, field, fallback = 1) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number)) {
    throw new RangeError(`${field} must be finite`);
  }
  if (number <= 0) {
    throw new RangeError(`${field} must be greater than 0`);
  }
  return number;
}

function normalizeMember(raw, field) {
  const value = objectValue(raw, field);
  assertKnownFields(value, MEMBER_FIELDS, field);

  return Object.freeze({
    id: requiredString(value.id, `${field}.id`),
    creatureId: requiredString(
      value.creatureId,
      `${field}.creatureId`
    ),
    displayName: requiredString(
      value.displayName,
      `${field}.displayName`
    )
  });
}

function normalizeRoster(raw, field, engagedCreatureId) {
  if (raw == null) {
    return null;
  }

  const value = objectValue(raw, field);
  assertKnownFields(value, ROSTER_FIELDS, field);

  if (!Array.isArray(value.members) || value.members.length === 0) {
    throw new TypeError(
      `${field}.members must be a non-empty array`
    );
  }

  const members = value.members.map((member, index) =>
    normalizeMember(member, `${field}.members[${index}]`)
  );

  const memberIds = members.map((member) => member.id);
  if (new Set(memberIds).size !== memberIds.length) {
    throw new RangeError(
      `${field}.members contains duplicate member ids`
    );
  }

  const activeMemberId = optionalString(
    value.activeMemberId,
    `${field}.activeMemberId`
  );

  if (activeMemberId !== null) {
    const activeMember = members.find(
      (member) => member.id === activeMemberId
    );

    if (!activeMember) {
      throw new RangeError(
        `${field}.activeMemberId must reference a roster member`
      );
    }

    if (activeMember.creatureId !== engagedCreatureId) {
      throw new RangeError(
        `${field} active creature must match slot creature`
      );
    }
  }

  return Object.freeze({
    activeMemberId,
    members: Object.freeze(members)
  });
}

function normalizeSlot(raw, field) {
  const value = objectValue(raw, field);
  assertKnownFields(value, SLOT_FIELDS, field);

  const creatureId = requiredString(
    value.creatureId,
    `${field}.creatureId`
  );

  return Object.freeze({
    actorId: requiredString(
      value.actorId,
      `${field}.actorId`
    ),
    creatureId,
    displayName: requiredString(
      value.displayName,
      `${field}.displayName`
    ),
    controllerId: requiredString(
      value.controllerId,
      `${field}.controllerId`
    ),
    roster: normalizeRoster(
      value.roster,
      `${field}.roster`,
      creatureId
    )
  });
}

function normalizeTeam(raw, index) {
  const field = `teams[${index}]`;
  const value = objectValue(raw, field);
  assertKnownFields(value, TEAM_FIELDS, field);

  if (!Array.isArray(value.slots) || value.slots.length === 0) {
    throw new TypeError(
      `${field}.slots must be a non-empty array`
    );
  }

  return Object.freeze({
    id: requiredString(value.id, `${field}.id`),
    slots: Object.freeze(
      value.slots.map((slot, slotIndex) =>
        normalizeSlot(
          slot,
          `${field}.slots[${slotIndex}]`
        )
      )
    )
  });
}

export function normalizeCaptureBattleSetupEditorDraftV1(input) {
  const value = objectValue(
    input,
    "CaptureBattleSetupEditorDraftV1"
  );

  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureBattleSetupEditorDraftV1"
  );

  if (value.schema !== CAPTURE_BATTLE_SETUP_EDITOR_DRAFT_SCHEMA) {
    throw new RangeError(
      `schema must be ${CAPTURE_BATTLE_SETUP_EDITOR_DRAFT_SCHEMA}`
    );
  }

  if (!Array.isArray(value.teams) || value.teams.length !== 2) {
    throw new TypeError(
      "teams must contain exactly two teams"
    );
  }

  const teams = value.teams.map(normalizeTeam);

  for (const team of teams) {
    if (team.slots.length < 1 || team.slots.length > 2) {
      throw new RangeError(
        "battle format supports only 1v1 or 2v2 active slots"
      );
    }
  }

  if (teams[0].slots.length !== teams[1].slots.length) {
    throw new RangeError(
      "both teams must have the same active slot count"
    );
  }

  const teamIds = teams.map((team) => team.id);
  if (new Set(teamIds).size !== teamIds.length) {
    throw new RangeError("duplicate team id");
  }

  const actorIds = [];
  for (const team of teams) {
    for (const slot of team.slots) {
      actorIds.push(slot.actorId);
    }
  }

  if (new Set(actorIds).size !== actorIds.length) {
    throw new RangeError("duplicate actor id");
  }

  const localActorId = requiredString(
    value.localActorId,
    "localActorId"
  );

  if (!actorIds.includes(localActorId)) {
    throw new RangeError(
      "localActorId must reference a declared actor"
    );
  }

  return Object.freeze({
    schema: CAPTURE_BATTLE_SETUP_EDITOR_DRAFT_SCHEMA,
    id: requiredString(value.id, "id"),
    localActorId,
    skillSpeedMultiplier: positiveFiniteNumber(
      value.skillSpeedMultiplier,
      "skillSpeedMultiplier"
    ),
    teams: Object.freeze(teams)
  });
}
