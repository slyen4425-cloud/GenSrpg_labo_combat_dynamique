function requiredString(value, field) {
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

export const COMBAT_TARGET_REF_SCOPES_V1 =
  Object.freeze([
    "active",
    "reserve"
  ]);

export function normalizeCombatTargetRefV1(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError(
      "CombatTargetRefV1 must be an object"
    );
  }

  const scope = requiredString(
    input.scope,
    "CombatTargetRefV1.scope"
  );

  if (scope === "active") {
    for (const key of Object.keys(input)) {
      if (!["scope", "actorId"].includes(key)) {
        throw new TypeError(
          "CombatTargetRefV1 active target contains unknown field: " +
            key
        );
      }
    }
    return Object.freeze({
      scope,
      actorId: requiredString(
        input.actorId,
        "CombatTargetRefV1.actorId"
      )
    });
  }

  if (scope === "reserve") {
    for (const key of Object.keys(input)) {
      if (
        !["scope", "teamId", "memberId"].includes(
          key
        )
      ) {
        throw new TypeError(
          "CombatTargetRefV1 reserve target contains unknown field: " +
            key
        );
      }
    }
    return Object.freeze({
      scope,
      teamId: requiredString(
        input.teamId,
        "CombatTargetRefV1.teamId"
      ),
      memberId: requiredString(
        input.memberId,
        "CombatTargetRefV1.memberId"
      )
    });
  }

  throw new RangeError(
    "Unsupported CombatTargetRefV1.scope: " +
      scope
  );
}
