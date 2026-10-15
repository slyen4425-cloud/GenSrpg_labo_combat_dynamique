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
  const waveUndergroundRestriction =
    !configured &&
    skill?.projectileTargeting === "expanding_wave" &&
    presence === "underground";
  const implicitUndergroundRestriction =
    !configured &&
    presence === "underground" &&
    skill?.category === "offensive";
  // Ordinary ground-contact melee is surface-bound, even if its visual
  // approach starts while the defender is mid-flight. An authored anti-air
  // ability must opt into airborne explicitly via hitPresenceStates.
  const implicitAirborneGroundMeleeRestriction =
    !configured &&
    presence === "airborne" &&
    skill?.category === "offensive" &&
    skill?.form === "contact" &&
    skill?.approachMode === "ground";

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
          implicitAirborneGroundMeleeRestriction
        )
  });
}
