const IMMEDIATE_TARGET_EVENT_TYPES = new Set([
  "status-applied",
  "status-cleansed",
  "status-dispelled",
  "heal",
  "energy-restored",
  "energy-drained",
  "charge-interrupt"
]);

export function resolutionHasImmediateTargetEffectV1(
  resolution
) {
  const events = Array.isArray(
    resolution?.events
  )
    ? resolution.events
    : [];

  for (const event of events) {
    if (event?.type === "hit") {
      const hasExplicitDamageMetrics =
        Object.prototype.hasOwnProperty.call(
          event,
          "baseDamage"
        ) ||
        Object.prototype.hasOwnProperty.call(
          event,
          "damage"
        ) ||
        Object.prototype.hasOwnProperty.call(
          event,
          "appliedDamage"
        ) ||
        Object.prototype.hasOwnProperty.call(
          event,
          "absorbedByShield"
        );

      if (!hasExplicitDamageMetrics) {
        return true;
      }

      if (
        Number(event.baseDamage) > 0 ||
        Number(event.damage) > 0 ||
        Number(event.appliedDamage) > 0 ||
        Number(event.absorbedByShield) > 0 ||
        event.tacticalEffect === true
      ) {
        return true;
      }
      continue;
    }

    if (
      event?.type === "heal" ||
      event?.type === "energy-restored" ||
      event?.type === "energy-drained"
    ) {
      if (
        Number(event.applied) > 0 ||
        Number(event.requested) > 0
      ) {
        return true;
      }
      continue;
    }

    if (
      event?.type === "status-cleansed" ||
      event?.type === "status-dispelled"
    ) {
      if (
        Array.isArray(
          event.removedStatusIds
        ) &&
        event.removedStatusIds.length > 0
      ) {
        return true;
      }
      continue;
    }

    if (
      IMMEDIATE_TARGET_EVENT_TYPES.has(
        event?.type
      )
    ) {
      return true;
    }
  }

  return false;
}

export function planSkillPreparationFx({
  action,
  actorSlot = "player"
}) {
  if (!action?.skill) {
    return Object.freeze([]);
  }

  return Object.freeze([
    Object.freeze({
      type: "cast",
      skillId: action.skill.id,
      actorSlot,
      durationMs: Math.max(
        0,
        Number(action.preparationMs) || 0
      )
    })
  ]);
}

export function planSkillReleaseFx({
  action,
  actorSlot = "player",
  targetSlot = "opponent"
}) {
  if (!action?.skill || action.skill.form !== "projectile") {
    return Object.freeze([]);
  }

  return Object.freeze([
    Object.freeze({
      type: "projectile",
      skillId: action.skill.id,
      element: action.skill.element ?? null,
      fromSlot: actorSlot,
      targetSlot,
      delayMs: 0,
      durationMs: Math.max(0, Number(action.travelMs) || 0)
    })
  ]);
}

export function planSkillFx({
  resolution,
  actorSlot = "player",
  targetSlot = "opponent"
}) {
  if (!resolution?.ok || !Array.isArray(resolution.events)) {
    return Object.freeze([]);
  }

  const release = resolution.events.find((item) => item.type === "skill-release");
  const arrive = resolution.events.find((item) => item.type === "skill-arrive");

  if (!release || !arrive || release.form !== "projectile") {
    return Object.freeze([]);
  }

  const delayMs = Math.max(0, Number(release.atMs) || 0);
  const durationMs = Math.max(0, (Number(arrive.atMs) || 0) - delayMs);

  return Object.freeze([
    Object.freeze({
      type: "projectile",
      ...(release.skillId ? { skillId: release.skillId } : {}),
      element: release.element ?? null,
      fromSlot: actorSlot,
      targetSlot,
      delayMs,
      durationMs
    })
  ]);
}


export function planSkillOutcomeFx({
  resolution,
  actorSlot = "player",
  targetSlot = "opponent"
}) {
  if (!resolution?.ok) {
    return Object.freeze([]);
  }

  if (resolution.outcome === "evaded") {
    return Object.freeze([
      Object.freeze({
        type: "miss",
        targetSlot,
        durationMs: 650
      })
    ]);
  }

  if (resolution.outcome === "clashed" && resolution.skillId) {
    const clashEvent = resolution.events?.find(
      (item) => item.type === "projectile-clash"
    );
    const otherActorId =
      clashEvent?.otherActorId ?? resolution.clash?.otherActorId ?? null;
    const ownsClashFx =
      clashEvent &&
      otherActorId !== null &&
      String(resolution.actorId) < String(otherActorId);

    if (!ownsClashFx) {
      return Object.freeze([]);
    }

    return Object.freeze([
      Object.freeze({
        type: "clash-impact",
        skillId: resolution.skillId,
        fromSlot: actorSlot,
        targetSlot,
        progress: Math.min(
          1,
          Math.max(0, Number(clashEvent.progress) || 0)
        ),
        durationMs: 520
      })
    ]);
  }

  if (
    ["hit", "blocked", "reflected", "immune"].includes(resolution.outcome) &&
    resolution.skillId &&
    (
      resolution.outcome !== "hit" ||
      resolutionHasImmediateTargetEffectV1(
        resolution
      )
    )
  ) {
    return Object.freeze([
      Object.freeze({
        type: "impact",
        skillId: resolution.skillId,
        targetSlot,
        durationMs: 420
      })
    ]);
  }

  return Object.freeze([]);
}
