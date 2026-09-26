import { COMBAT_DISTANCES } from "./skill-definition.js";

const MATCH_FIELDS = Object.freeze([
  "form",
  "element",
  "approachMode"
]);

const ENERGY_DECISION_MODES = Object.freeze([
  "quick",
  "strong"
]);
const ENERGY_MODE_SET = new Set(ENERGY_DECISION_MODES);

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

function skillIdList(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty array`);
  }
  return Object.freeze(
    value.map((item, index) =>
      requiredString(item, `${field}[${index}]`)
    )
  );
}

function energyStrategy(raw) {
  if (raw == null) {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError("energyStrategy must be an object");
  }

  const decisionModes = skillIdList(
    raw.decisionModes,
    "energyStrategy.decisionModes"
  );
  for (const mode of decisionModes) {
    if (!ENERGY_MODE_SET.has(mode)) {
      throw new RangeError(
        `Unsupported energy decision mode: ${mode}`
      );
    }
  }

  return Object.freeze({
    decisionModes,
    quickSkillIds: skillIdList(
      raw.quickSkillIds,
      "energyStrategy.quickSkillIds"
    ),
    strongSkillIds: skillIdList(
      raw.strongSkillIds,
      "energyStrategy.strongSkillIds"
    )
  });
}

export function normalizeOpponentAiPolicy(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("opponent AI policy must be an object");
  }

  const reactionRules = (input.reactionRules ?? []).map(reactionRule);
  const turnPlan = (input.turnPlan ?? []).map(turnStep);
  const normalizedEnergyStrategy =
    energyStrategy(input.energyStrategy);

  if (turnPlan.length === 0 && !normalizedEnergyStrategy) {
    throw new TypeError(
      "turnPlan or energyStrategy must define opponent offense"
    );
  }

  return Object.freeze({
    id: requiredString(input.id, "id"),
    actorId: requiredString(input.actorId, "actorId"),
    targetId: requiredString(input.targetId, "targetId"),
    reactionRules: Object.freeze(reactionRules),
    turnPlan: Object.freeze(turnPlan),
    energyStrategy: normalizedEnergyStrategy
  });
}
