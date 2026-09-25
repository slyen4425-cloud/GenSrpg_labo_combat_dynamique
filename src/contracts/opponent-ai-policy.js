import { COMBAT_DISTANCES } from "./skill-definition.js";

const MATCH_FIELDS = Object.freeze([
  "form",
  "element",
  "approachMode"
]);

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function reactionRule(raw, index) {
  const when = raw?.when;
  if (!when || typeof when !== "object" || Array.isArray(when)) {
    throw new TypeError(
      `reactionRules[${index}].when must be an object`
    );
  }

  const normalizedWhen = {};
  for (const field of MATCH_FIELDS) {
    if (when[field] !== undefined) {
      normalizedWhen[field] = requiredString(
        when[field],
        `reactionRules[${index}].when.${field}`
      );
    }
  }

  if (Object.keys(normalizedWhen).length === 0) {
    throw new TypeError(
      `reactionRules[${index}].when must define a supported matcher`
    );
  }

  return Object.freeze({
    skillId: requiredString(
      raw.skillId,
      `reactionRules[${index}].skillId`
    ),
    when: Object.freeze(normalizedWhen)
  });
}

function turnStep(raw, index) {
  const preferredDistance = requiredString(
    raw?.preferredDistance,
    `turnPlan[${index}].preferredDistance`
  );
  if (!COMBAT_DISTANCES.includes(preferredDistance)) {
    throw new RangeError(
      `Unsupported preferred distance: ${preferredDistance}`
    );
  }

  return Object.freeze({
    skillId: requiredString(
      raw.skillId,
      `turnPlan[${index}].skillId`
    ),
    preferredDistance
  });
}

export function normalizeOpponentAiPolicy(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("opponent AI policy must be an object");
  }

  const reactionRules = (input.reactionRules ?? []).map(reactionRule);
  const turnPlan = (input.turnPlan ?? []).map(turnStep);

  if (turnPlan.length === 0) {
    throw new TypeError("turnPlan must contain at least one step");
  }

  return Object.freeze({
    id: requiredString(input.id, "id"),
    actorId: requiredString(input.actorId, "actorId"),
    targetId: requiredString(input.targetId, "targetId"),
    reactionRules: Object.freeze(reactionRules),
    turnPlan: Object.freeze(turnPlan)
  });
}
