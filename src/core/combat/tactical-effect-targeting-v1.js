function requireFormat(format) {
  if (
    !format ||
    typeof format.teamOf !== "function" ||
    !Array.isArray(format.actors)
  ) {
    throw new TypeError(
      "normalized BattleFormatDefinition is required for multi-target effects"
    );
  }
  return format;
}

function isAlive(state, actorId) {
  return Number(
    state?.fighters?.[actorId]?.hp
  ) > 0;
}

export function resolveTacticalEffectTargetIdsV1({
  format = null,
  state,
  actorId,
  targetId,
  targetScope
}) {
  if (targetScope === "self") {
    return Object.freeze(
      isAlive(state, actorId)
        ? [actorId]
        : []
    );
  }

  if (targetScope === "target") {
    return Object.freeze(
      isAlive(state, targetId)
        ? [targetId]
        : []
    );
  }

  const battleFormat = requireFormat(format);
  const actorTeam = battleFormat.teamOf(actorId);
  if (actorTeam === null) {
    throw new RangeError(
      "actorId is missing from BattleFormatDefinition: " +
        actorId
    );
  }

  const ids = battleFormat.actors
    .map((actor) => actor.actorId)
    .filter((candidateId) => {
      if (!isAlive(state, candidateId)) {
        return false;
      }

      if (targetScope === "all_except_self") {
        return candidateId !== actorId;
      }

      const candidateTeam =
        battleFormat.teamOf(candidateId);

      if (targetScope === "all_enemies") {
        return candidateTeam !== actorTeam;
      }

      if (targetScope === "all_allies") {
        return candidateTeam === actorTeam;
      }

      throw new RangeError(
        "Unsupported tactical targetScope: " +
          targetScope
      );
    });

  return Object.freeze(ids);
}
