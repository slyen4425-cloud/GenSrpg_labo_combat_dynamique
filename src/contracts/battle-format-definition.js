function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function requiredStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty array`);
  }
  const normalized = value.map((item, index) =>
    requiredString(item, `${field}[${index}]`)
  );
  if (new Set(normalized).size !== normalized.length) {
    throw new RangeError(`${field} must not contain duplicates`);
  }
  return Object.freeze(normalized);
}

export function normalizeBattleFormatDefinition(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("BattleFormatDefinition must be an object");
  }

  const id = requiredString(input.id, "id");
  const localActorId = requiredString(
    input.localActorId,
    "localActorId"
  );

  if (!input.teams || typeof input.teams !== "object" || Array.isArray(input.teams)) {
    throw new TypeError("teams must be an object");
  }

  const teams = {};
  const teamByActor = new Map();

  for (const [teamId, actorIdsRaw] of Object.entries(input.teams)) {
    const actorIds = requiredStringArray(
      actorIdsRaw,
      `teams.${teamId}`
    );
    teams[teamId] = actorIds;
    for (const actorId of actorIds) {
      if (teamByActor.has(actorId)) {
        throw new RangeError(
          `actor ${actorId} cannot belong to more than one team`
        );
      }
      teamByActor.set(actorId, teamId);
    }
  }

  if (!Array.isArray(input.actors) || input.actors.length < 2) {
    throw new TypeError("actors must contain at least two actors");
  }

  const seen = new Set();
  const actors = input.actors.map((raw, index) => {
    const actorId = requiredString(
      raw?.actorId,
      `actors[${index}].actorId`
    );
    if (seen.has(actorId)) {
      throw new RangeError(`duplicate actorId: ${actorId}`);
    }
    seen.add(actorId);

    const teamId = requiredString(
      raw?.teamId,
      `actors[${index}].teamId`
    );
    if (!teams[teamId]?.includes(actorId)) {
      throw new RangeError(
        `actor ${actorId} must be listed in teams.${teamId}`
      );
    }

    return Object.freeze({
      actorId,
      teamId,
      creatureId: requiredString(
        raw.creatureId,
        `actors[${index}].creatureId`
      ),
      displayName: requiredString(
        raw.displayName,
        `actors[${index}].displayName`
      ),
      fighterConfigId: requiredString(
        raw.fighterConfigId,
        `actors[${index}].fighterConfigId`
      ),
      controllerId: requiredString(
        raw.controllerId,
        `actors[${index}].controllerId`
      )
    });
  });

  for (const actorId of teamByActor.keys()) {
    if (!seen.has(actorId)) {
      throw new RangeError(
        `team actor ${actorId} is missing from actors`
      );
    }
  }

  if (!seen.has(localActorId)) {
    throw new RangeError("localActorId must reference a declared actor");
  }

  return Object.freeze({
    id,
    localActorId,
    teams: Object.freeze(teams),
    actors: Object.freeze(actors),
    teamOf(actorId) {
      return teamByActor.get(actorId) ?? null;
    },
    actor(actorId) {
      return actors.find((item) => item.actorId === actorId) ?? null;
    }
  });
}
