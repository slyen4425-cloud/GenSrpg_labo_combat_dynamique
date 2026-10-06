export function isPersistentZoneOnlySkillFxV1(skill) {
  const effects = Array.isArray(skill?.effects)
    ? skill.effects
    : [];

  if (
    effects.length === 0 ||
    effects.some(
      (effect) =>
        effect?.kind !== "persistent_zone"
    )
  ) {
    return false;
  }

  const immediate =
    skill?.effect ?? {};

  return !(
    Number(immediate.damage) > 0 ||
    Number(immediate.heal) > 0 ||
    immediate.interruptsPreparation === true ||
    Number(immediate.stunMs) > 0
  );
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
  skill = null,
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
    isPersistentZoneOnlySkillFxV1(skill)
  ) {
    return Object.freeze([]);
  }

  if (
    ["hit", "blocked", "reflected", "immune"].includes(resolution.outcome) &&
    resolution.skillId
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
