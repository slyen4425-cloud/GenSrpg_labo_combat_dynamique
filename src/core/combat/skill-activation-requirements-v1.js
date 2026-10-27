function fighterOf(state, fighterId) {
  const fighter = state?.fighters?.[fighterId];
  if (!fighter) {
    throw new RangeError(
      "Unknown fighter: " + fighterId
    );
  }
  return fighter;
}

function teamDefeatCount(
  state,
  battleFormat,
  actorId,
  relation
) {
  if (
    !battleFormat ||
    typeof battleFormat.teamOf !== "function" ||
    !Array.isArray(battleFormat.actors)
  ) {
    throw new TypeError(
      "normalized BattleFormatDefinition is required for team defeat activation requirements"
    );
  }

  const actorTeam = battleFormat.teamOf(actorId);
  if (actorTeam === null) {
    throw new RangeError(
      "actorId is missing from BattleFormatDefinition: " +
        actorId
    );
  }

  return battleFormat.actors
    .map((entry) => entry.actorId)
    .filter((candidateId) => {
      if (candidateId === actorId) {
        return false;
      }
      const candidateTeam =
        battleFormat.teamOf(candidateId);
      const matches =
        relation === "ally"
          ? candidateTeam === actorTeam
          : candidateTeam !== actorTeam;
      return (
        matches &&
        Number(
          state?.fighters?.[candidateId]?.hp
        ) <= 0
      );
    }).length;
}

function currentRequirementValue(
  state,
  fighter,
  type,
  {
    actorId,
    battleFormat
  }
) {
  switch (type) {
    case "combat_elapsed_ms":
      return Number(state.elapsedMs) || 0;
    case "damage_dealt":
      return Number(
        fighter.damageDealtTotal ?? 0
      ) || 0;
    case "damage_taken":
      return Number(
        fighter.damageTakenTotal ?? 0
      ) || 0;
    case "hp_at_or_below_pct":
      return fighter.maxHp <= 0
        ? 0
        : (fighter.hp / fighter.maxHp) * 100;
    case "allies_defeated":
      return teamDefeatCount(
        state,
        battleFormat,
        actorId,
        "ally"
      );
    case "enemies_defeated":
      return teamDefeatCount(
        state,
        battleFormat,
        actorId,
        "enemy"
      );
    case "kills_by_self":
      return Number(
        fighter.knockoutsTotal ?? 0
      ) || 0;
    default:
      throw new RangeError(
        "Unsupported activation requirement condition type: " +
          type
      );
  }
}

function conditionSatisfied(
  type,
  current,
  threshold
) {
  return type === "hp_at_or_below_pct"
    ? current <= threshold
    : current >= threshold;
}

export function evaluateSkillActivationRequirementsV1({
  state,
  actorId,
  skill,
  battleFormat = null
}) {
  const fighter = fighterOf(state, actorId);
  const requirements =
    skill?.activationRequirements ?? {
      mode: "all",
      conditions: []
    };

  const conditions = requirements.conditions.map(
    (condition) => {
      const current = currentRequirementValue(
        state,
        fighter,
        condition.type,
        {
          actorId,
          battleFormat
        }
      );
      return Object.freeze({
        type: condition.type,
        threshold: condition.threshold,
        current,
        satisfied: conditionSatisfied(
          condition.type,
          current,
          condition.threshold
        )
      });
    }
  );

  const satisfied =
    conditions.length === 0 ||
    (
      requirements.mode === "any"
        ? conditions.some(
            (condition) => condition.satisfied
          )
        : conditions.every(
            (condition) => condition.satisfied
          )
    );

  return Object.freeze({
    mode: requirements.mode,
    satisfied,
    conditions: Object.freeze(conditions)
  });
}
