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
      element: release.element ?? null,
      fromSlot: actorSlot,
      targetSlot,
      delayMs,
      durationMs
    })
  ]);
}
