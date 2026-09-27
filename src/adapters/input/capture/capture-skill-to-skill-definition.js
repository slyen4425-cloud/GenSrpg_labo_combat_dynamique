import {
  normalizeSkillDefinition
} from "../../../contracts/skill-definition.js";

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function adaptCaptureSkillToSkillDefinition(skill) {
  objectValue(skill, "skill");

  const id = requiredString(skill.id, "skill.id");
  const definition = objectValue(
    skill.definition,
    "skill.definition"
  );
  const definitionId = requiredString(
    definition.id,
    "skill.definition.id"
  );

  if (definitionId !== id) {
    throw new RangeError(
      "skill.definition.id must match skill.id"
    );
  }

  return normalizeSkillDefinition(definition);
}
