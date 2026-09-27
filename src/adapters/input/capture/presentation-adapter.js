import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizePresentationBindingV1
} from "../../../contracts/presentation-binding-v1.js";

function rawBindings(captureExport) {
  const value = captureExport.presentation.bindings;
  if (value == null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new TypeError(
      "presentation.bindings must be an array"
    );
  }
  return value;
}

function normalizeBindings(captureExport) {
  const skillIds = new Set(
    captureExport.skills.map((skill) => skill.id)
  );
  const creatureIds = new Set(
    captureExport.creatures.map((creature) => creature.id)
  );
  const seen = new Set();

  const bindings = rawBindings(captureExport).map((raw) => {
    const binding = normalizePresentationBindingV1(raw);
    const key = `${binding.subjectType}:${binding.subjectId}`;

    if (seen.has(key)) {
      throw new RangeError(
        `duplicate presentation binding: ${key}`
      );
    }
    seen.add(key);

    if (
      binding.subjectType === "skill" &&
      !skillIds.has(binding.subjectId)
    ) {
      throw new RangeError(
        `unknown Capture skill presentation subject: ${binding.subjectId}`
      );
    }

    if (
      binding.subjectType === "creature" &&
      !creatureIds.has(binding.subjectId)
    ) {
      throw new RangeError(
        `unknown Capture creature presentation subject: ${binding.subjectId}`
      );
    }

    return binding;
  });

  return Object.freeze(bindings);
}

function assertKnownSkill(captureExport, skillId) {
  const id = String(skillId ?? "").trim();
  if (
    !id ||
    !captureExport.skills.some((skill) => skill.id === id)
  ) {
    throw new RangeError(
      `Unknown Capture combat skill: ${id || String(skillId)}`
    );
  }
  return id;
}

function assertKnownCreature(captureExport, creatureId) {
  const id = String(creatureId ?? "").trim();
  if (
    !id ||
    !captureExport.creatures.some(
      (creature) => creature.id === id
    )
  ) {
    throw new RangeError(
      `Unknown Capture combat creature: ${id || String(creatureId)}`
    );
  }
  return id;
}

export function adaptCapturePresentationBindings(input) {
  const captureExport = normalizeCaptureCombatExportV1(input);
  return normalizeBindings(captureExport);
}

export function adaptCaptureSkillPresentationBinding(
  input,
  skillId
) {
  const captureExport = normalizeCaptureCombatExportV1(input);
  const id = assertKnownSkill(captureExport, skillId);
  return (
    normalizeBindings(captureExport).find(
      (binding) =>
        binding.subjectType === "skill" &&
        binding.subjectId === id
    ) ?? null
  );
}

export function adaptCaptureCreaturePresentationBinding(
  input,
  creatureId
) {
  const captureExport = normalizeCaptureCombatExportV1(input);
  const id = assertKnownCreature(captureExport, creatureId);
  return (
    normalizeBindings(captureExport).find(
      (binding) =>
        binding.subjectType === "creature" &&
        binding.subjectId === id
    ) ?? null
  );
}
