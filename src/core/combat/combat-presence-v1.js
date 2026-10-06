export function combatPresenceForActionContextV1(
  targetActionContext
) {
  const action =
    targetActionContext?.action ?? null;
  const elapsedMs =
    Number(targetActionContext?.elapsedMs);

  if (
    !action ||
    action.actionType !== "skill" ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 0
  ) {
    return Object.freeze({
      presence: "surface",
      transientPresence: false
    });
  }

  const releaseAtMs =
    Number(action.releaseAtMs);
  const impactAtMs =
    Number(action.impactAtMs);

  if (
    !Number.isFinite(releaseAtMs) ||
    !Number.isFinite(impactAtMs) ||
    elapsedMs < releaseAtMs ||
    elapsedMs > impactAtMs
  ) {
    return Object.freeze({
      presence: "surface",
      transientPresence: false
    });
  }

  if (
    action.skill?.approachMode ===
    "aerial"
  ) {
    return Object.freeze({
      presence: "airborne",
      transientPresence: true
    });
  }

  if (
    action.skill?.approachMode ===
    "burrow"
  ) {
    return Object.freeze({
      presence: "underground",
      transientPresence: true
    });
  }

  return Object.freeze({
    presence: "surface",
    transientPresence: false
  });
}

export function skillPresenceReachV1({
  skill,
  targetActionContext
}) {
  const {
    presence,
    transientPresence
  } =
    combatPresenceForActionContextV1(
      targetActionContext
    );

  const configured =
    Array.isArray(
      skill?.hitPresenceStates
    );

  return Object.freeze({
    configured,
    presence,
    transientPresence,
    reachable:
      !configured ||
      skill.hitPresenceStates.includes(
        presence
      )
  });
}
