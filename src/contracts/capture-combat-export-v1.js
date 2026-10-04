import { normalizeRecallPreparationMs } from "./combat-command-definition.js";

export const CAPTURE_COMBAT_EXPORT_SCHEMA =
  "capture-combat-export-v1";

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value, field) {
  return value == null ? null : requiredString(value, field);
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

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function jsonCompatible(value, field) {
  if (value === null) {
    return null;
  }

  const kind = typeof value;

  if (kind === "string" || kind === "boolean") {
    return value;
  }

  if (kind === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${field} must be JSON-compatible`);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((item, index) =>
        jsonCompatible(item, `${field}[${index}]`)
      )
    );
  }

  if (kind !== "object") {
    throw new TypeError(`${field} must be JSON-compatible`);
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${field} must be JSON-compatible`);
  }

  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) {
      throw new TypeError(`${field}.${key} must be JSON-compatible`);
    }
    output[key] = jsonCompatible(item, `${field}.${key}`);
  }
  return Object.freeze(output);
}

function uniqueStrings(value, field, { allowEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }

  if (!allowEmpty && value.length === 0) {
    throw new TypeError(`${field} must not be empty`);
  }

  const result = value.map((item, index) =>
    requiredString(item, `${field}[${index}]`)
  );

  if (new Set(result).size !== result.length) {
    throw new RangeError(`${field} must not contain duplicates`);
  }

  return Object.freeze(result);
}

function assertUnique(items, field, idOf) {
  const seen = new Set();
  for (const item of items) {
    const id = idOf(item);
    if (seen.has(id)) {
      throw new RangeError(`duplicate ${field} id: ${id}`);
    }
    seen.add(id);
  }
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return number;
}

function normalizeCreatureResistances(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }

  const normalized = value.map((entry, index) => {
    objectValue(entry, `${field}[${index}]`);
    return Object.freeze({
      kind: requiredString(
        entry.kind,
        `${field}[${index}].kind`
      ),
      value: finiteNumber(
        entry.value,
        `${field}[${index}].value`
      )
    });
  });

  const kinds = normalized.map((entry) => entry.kind);
  if (new Set(kinds).size !== kinds.length) {
    throw new RangeError(
      `${field} must not contain duplicate kinds`
    );
  }

  return Object.freeze(normalized);
}

function normalizeCreature(raw, index) {
  objectValue(raw, `creatures[${index}]`);
  const id = requiredString(raw.id, `creatures[${index}].id`);

  return Object.freeze({
    id,
    displayName: requiredString(
      raw.displayName,
      `creatures[${index}].displayName`
    ),
    combat: jsonCompatible(
      objectValue(raw.combat, `creatures[${index}].combat`),
      `creatures[${index}].combat`
    ),
    elements: uniqueStrings(
      raw.elements ?? [],
      `creatures[${index}].elements`
    ),
    resistances: normalizeCreatureResistances(
      raw.resistances ?? [],
      `creatures[${index}].resistances`
    ),
    skillIds: uniqueStrings(
      raw.skillIds ?? [],
      `creatures[${index}].skillIds`
    ),
    presentationId: optionalString(
      raw.presentationId,
      `creatures[${index}].presentationId`
    ),
    metadata:
      raw.metadata == null
        ? Object.freeze({})
        : jsonCompatible(
            objectValue(
              raw.metadata,
              `creatures[${index}].metadata`
            ),
            `creatures[${index}].metadata`
          )
  });
}

function normalizeSkill(raw, index) {
  objectValue(raw, `skills[${index}]`);
  const id = requiredString(raw.id, `skills[${index}].id`);
  const definition = jsonCompatible(
    objectValue(raw.definition, `skills[${index}].definition`),
    `skills[${index}].definition`
  );
  const definitionId = requiredString(
    definition.id,
    `skills[${index}].definition.id`
  );

  if (definitionId !== id) {
    throw new RangeError(
      `skills[${index}].definition.id must match skills[${index}].id`
    );
  }

  return Object.freeze({
    id,
    definition,
    presentationId: optionalString(
      raw.presentationId,
      `skills[${index}].presentationId`
    ),
    metadata:
      raw.metadata == null
        ? Object.freeze({})
        : jsonCompatible(
            objectValue(raw.metadata, `skills[${index}].metadata`),
            `skills[${index}].metadata`
          )
  });
}

function normalizeActor(raw, index) {
  objectValue(raw, `actors[${index}]`);

  return Object.freeze({
    actorId: requiredString(
      raw.actorId,
      `actors[${index}].actorId`
    ),
    teamId: requiredString(
      raw.teamId,
      `actors[${index}].teamId`
    ),
    creatureId: requiredString(
      raw.creatureId,
      `actors[${index}].creatureId`
    ),
    displayName: requiredString(
      raw.displayName,
      `actors[${index}].displayName`
    ),
    controllerId: requiredString(
      raw.controllerId,
      `actors[${index}].controllerId`
    )
  });
}

function normalizeTeams(raw) {
  objectValue(raw, "teams");

  const teams = {};
  for (const [teamIdRaw, actorIdsRaw] of Object.entries(raw)) {
    const teamId = requiredString(teamIdRaw, "teams key");
    teams[teamId] = uniqueStrings(
      actorIdsRaw,
      `teams.${teamId}`,
      { allowEmpty: false }
    );
  }

  if (Object.keys(teams).length < 2) {
    throw new TypeError("teams must contain at least two teams");
  }

  return Object.freeze(teams);
}

function normalizeRoster(raw, index) {
  objectValue(raw, `rosters[${index}]`);
  const membersRaw = raw.members ?? [];

  if (!Array.isArray(membersRaw) || membersRaw.length === 0) {
    throw new TypeError(
      `rosters[${index}].members must be a non-empty array`
    );
  }

  const members = membersRaw.map((member, memberIndex) => {
    objectValue(
      member,
      `rosters[${index}].members[${memberIndex}]`
    );
    return Object.freeze({
      id: requiredString(
        member.id,
        `rosters[${index}].members[${memberIndex}].id`
      ),
      creatureId: requiredString(
        member.creatureId,
        `rosters[${index}].members[${memberIndex}].creatureId`
      ),
      displayName: requiredString(
        member.displayName,
        `rosters[${index}].members[${memberIndex}].displayName`
      )
    });
  });

  assertUnique(
    members,
    `rosters[${index}] member`,
    (member) => member.id
  );

  return Object.freeze({
    slotId: requiredString(
      raw.slotId,
      `rosters[${index}].slotId`
    ),
    activeMemberId: optionalString(
      raw.activeMemberId,
      `rosters[${index}].activeMemberId`
    ),
    members: Object.freeze(members)
  });
}

export function normalizeCaptureCombatExportV1(input) {
  objectValue(input, "CaptureCombatExportV1");

  if (input.schema !== CAPTURE_COMBAT_EXPORT_SCHEMA) {
    throw new RangeError(
      `schema must be ${CAPTURE_COMBAT_EXPORT_SCHEMA}`
    );
  }

  const battleRaw = objectValue(input.battle, "battle");
  const battle = Object.freeze({
    id: requiredString(battleRaw.id, "battle.id"),
    localActorId: requiredString(
      battleRaw.localActorId,
      "battle.localActorId"
    ),
    skillSpeedMultiplier: positiveFiniteNumber(
      battleRaw.skillSpeedMultiplier,
      "battle.skillSpeedMultiplier"
    ),
    ...(battleRaw.recallPreparationMs === undefined ? {} : {
      recallPreparationMs: normalizeRecallPreparationMs(battleRaw.recallPreparationMs, "battle.recallPreparationMs")
    })
  });

  const teams = normalizeTeams(input.teams);

  if (!Array.isArray(input.actors) || input.actors.length < 2) {
    throw new TypeError("actors must contain at least two actors");
  }
  const actors = input.actors.map(normalizeActor);
  assertUnique(actors, "actor", (actor) => actor.actorId);

  if (!Array.isArray(input.creatures) || input.creatures.length === 0) {
    throw new TypeError("creatures must be a non-empty array");
  }
  const creatures = input.creatures.map(normalizeCreature);
  assertUnique(creatures, "creature", (creature) => creature.id);

  if (!Array.isArray(input.skills)) {
    throw new TypeError("skills must be an array");
  }
  const skills = input.skills.map(normalizeSkill);
  assertUnique(skills, "skill", (skill) => skill.id);

  const rostersRaw = input.rosters ?? [];
  if (!Array.isArray(rostersRaw)) {
    throw new TypeError("rosters must be an array");
  }
  const rosters = rostersRaw.map(normalizeRoster);
  assertUnique(rosters, "roster slot", (roster) => roster.slotId);

  const actorById = new Map(
    actors.map((actor) => [actor.actorId, actor])
  );
  const creatureById = new Map(
    creatures.map((creature) => [creature.id, creature])
  );
  const skillById = new Map(
    skills.map((skill) => [skill.id, skill])
  );

  if (!actorById.has(battle.localActorId)) {
    throw new RangeError(
      "battle.localActorId must reference a declared actor"
    );
  }

  const listedTeamByActor = new Map();
  for (const [teamId, actorIds] of Object.entries(teams)) {
    for (const actorId of actorIds) {
      if (!actorById.has(actorId)) {
        throw new RangeError(
          `teams.${teamId} references unknown actor: ${actorId}`
        );
      }
      if (listedTeamByActor.has(actorId)) {
        throw new RangeError(
          `actor ${actorId} cannot belong to more than one team`
        );
      }
      listedTeamByActor.set(actorId, teamId);
    }
  }

  for (const actor of actors) {
    if (!teams[actor.teamId]) {
      throw new RangeError(
        `actor ${actor.actorId} references unknown team: ${actor.teamId}`
      );
    }
    if (listedTeamByActor.get(actor.actorId) !== actor.teamId) {
      throw new RangeError(
        `actor ${actor.actorId} teamId must match teams membership`
      );
    }
    if (!creatureById.has(actor.creatureId)) {
      throw new RangeError(
        `actor ${actor.actorId} references unknown creature: ${actor.creatureId}`
      );
    }
  }

  for (const creature of creatures) {
    for (const skillId of creature.skillIds) {
      if (!skillById.has(skillId)) {
        throw new RangeError(
          `creature ${creature.id} references unknown skill: ${skillId}`
        );
      }
    }
  }

  for (const roster of rosters) {
    if (!actorById.has(roster.slotId)) {
      throw new RangeError(
        `roster slotId references unknown actor: ${roster.slotId}`
      );
    }

    const memberIds = new Set(
      roster.members.map((member) => member.id)
    );

    if (
      roster.activeMemberId !== null &&
      !memberIds.has(roster.activeMemberId)
    ) {
      throw new RangeError(
        `roster ${roster.slotId} activeMemberId must reference a roster member`
      );
    }

    for (const member of roster.members) {
      if (!creatureById.has(member.creatureId)) {
        throw new RangeError(
          `roster ${roster.slotId} member ${member.id} references unknown creature: ${member.creatureId}`
        );
      }
    }
  }

  return Object.freeze({
    schema: CAPTURE_COMBAT_EXPORT_SCHEMA,
    battle,
    teams,
    actors: Object.freeze(actors),
    creatures: Object.freeze(creatures),
    skills: Object.freeze(skills),
    rosters: Object.freeze(rosters),
    presentation:
      input.presentation == null
        ? Object.freeze({})
        : jsonCompatible(
            objectValue(input.presentation, "presentation"),
            "presentation"
          ),
    metadata:
      input.metadata == null
        ? Object.freeze({})
        : jsonCompatible(
            objectValue(input.metadata, "metadata"),
            "metadata"
          )
  });
}
