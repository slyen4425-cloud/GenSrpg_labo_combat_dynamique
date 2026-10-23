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
  // An offensive skill without explicit reach is a surface attack.
  // Airborne and underground are Combat Rules presence states, not DOM effects.
  // Authored anti-air abilities opt in through hitPresenceStates; support
  // skills retain their previous target semantics.
  const waveUndergroundRestriction =
    !configured &&
    skill?.projectileTargeting === "expanding_wave" &&
    presence === "underground";
  const implicitUndergroundRestriction =
    !configured &&
    presence === "underground" &&
    skill?.category === "offensive";
  // Every ordinary offensive action misses an airborne defender while
  // its aerial travel is active, including a simultaneous aerial charge.
  // Only an explicitly authored airborne reach may hit during that window.
  const implicitAirborneRestriction =
    !configured &&
    presence === "airborne" &&
    skill?.category === "offensive";

  return Object.freeze({
    configured,
    implicitUndergroundRestriction,
    presence,
    transientPresence,
    reachable: configured
      ? skill.hitPresenceStates.includes(presence)
      : !(
          implicitUndergroundRestriction ||
          waveUndergroundRestriction ||
          implicitAirborneRestriction
        )
  });
}
