export const TARGET_RELATIONS = Object.freeze([
  "enemy",
  "ally",
  "self",
  "any"
]);

export function targetRelation({
  format,
  actorId,
  targetId
}) {
  if (!format || typeof format.teamOf !== "function") {
    throw new TypeError("normalized battle format is required");
  }
  if (actorId === targetId) {
    return "self";
  }

  const actorTeam = format.teamOf(actorId);
  const targetTeam = format.teamOf(targetId);
  if (!actorTeam || !targetTeam) {
    throw new RangeError("actorId and targetId must exist in battle format");
  }

  return actorTeam === targetTeam ? "ally" : "enemy";
}

export function isSkillTargetAllowed({
  format,
  actorId,
  targetId,
  skill
}) {
  const relation = targetRelation({
    format,
    actorId,
    targetId
  });
  const allowed = skill?.targetRelations ?? ["enemy"];

  return Object.freeze({
    ok: allowed.includes("any") || allowed.includes(relation),
    relation
  });
}
