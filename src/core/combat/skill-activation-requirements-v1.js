function fighterOf(state, fighterId) {
  const fighter = state?.fighters?.[fighterId];
  if (!fighter) {
    throw new RangeError(
      "Unknown fighter: " + fighterId
    );
  }
  return fighter;
}

function currentRequirementValue(
  state,
  fighter,
  type
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
  skill
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
        condition.type
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
