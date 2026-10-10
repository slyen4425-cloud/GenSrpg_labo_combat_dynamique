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
  // A legacy offensive skill without an explicit reach list is a
  // surface attack. Burrow is a gameplay presence, not visual opacity.
  // Keep legacy airborne/evasion semantics and support skills unchanged.
  const implicitUndergroundRestriction =
    !configured &&
    presence === "underground" &&
    skill?.category === "offensive";

  return Object.freeze({
    configured,
    implicitUndergroundRestriction,
    presence,
    transientPresence,
    reachable: configured
      ? skill.hitPresenceStates.includes(presence)
      : !implicitUndergroundRestriction
  });
}
