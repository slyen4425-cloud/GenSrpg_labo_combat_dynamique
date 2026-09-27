import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeSkillDefinition
} from "../../../contracts/skill-definition.js";

function requiredId(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function findSkill(captureExport, skillId) {
  const id = requiredId(skillId, "skillId");
  const skill = captureExport.skills.find(
    (item) => item.id === id
  );

  if (!skill) {
    throw new RangeError(
      `Unknown Capture combat skill: ${id}`
    );
  }

  return skill;
}

function findCreature(captureExport, creatureId) {
  const id = requiredId(creatureId, "creatureId");
  const creature = captureExport.creatures.find(
    (item) => item.id === id
  );

  if (!creature) {
    throw new RangeError(
      `Unknown Capture combat creature: ${id}`
    );
  }

  return creature;
}

function toSkillDefinition(skill) {
  return normalizeSkillDefinition(skill.definition);
}

export function adaptCaptureCombatSkill(input, skillId) {
  const captureExport = normalizeCaptureCombatExportV1(input);
  return toSkillDefinition(findSkill(captureExport, skillId));
}

export function adaptCaptureCombatCreatureSkills(
  input,
  creatureId
) {
  const captureExport = normalizeCaptureCombatExportV1(input);
  const creature = findCreature(captureExport, creatureId);

  return Object.freeze(
    creature.skillIds.map((skillId) =>
      toSkillDefinition(findSkill(captureExport, skillId))
    )
  );
}
