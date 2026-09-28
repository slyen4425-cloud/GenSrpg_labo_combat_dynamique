import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeSkillPresentationBinding
} from "../../../contracts/skill-presentation-binding.js";

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function adaptCaptureSkillPresentationBinding(
  input,
  skillId
) {
  const exported = normalizeCaptureCombatExportV1(input);
  const id = requiredString(skillId, "skillId");
  const skill =
    exported.skills.find((item) => item.id === id) ?? null;

  if (!skill) {
    throw new RangeError(`Unknown exported skill: ${id}`);
  }

  if (skill.presentationId == null) {
    return null;
  }

  const rawSkills = exported.presentation.skills;
  if (
    !rawSkills ||
    typeof rawSkills !== "object" ||
    Array.isArray(rawSkills)
  ) {
    throw new TypeError(
      "presentation.skills must be an object when a skill binding is referenced"
    );
  }

  const rawBinding = rawSkills[skill.presentationId];
  if (!rawBinding) {
    throw new RangeError(
      `Missing presentation binding: ${skill.presentationId}`
    );
  }

  if (rawBinding.id !== skill.presentationId) {
    throw new RangeError(
      "binding id must match skill.presentationId"
    );
  }

  const binding = normalizeSkillPresentationBinding(
    rawBinding
  );

  if (binding.subjectId !== skill.id) {
    throw new RangeError(
      "binding subjectId must match exported skill id"
    );
  }

  return binding;
}
