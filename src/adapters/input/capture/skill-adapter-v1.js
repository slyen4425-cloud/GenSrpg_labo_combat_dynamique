import {
  normalizeCaptureExportV1
} from "../../../contracts/capture-export-v1.js";

function findSkill(captureExport, skillId) {
  const id = String(skillId ?? "").trim();
  const skill = captureExport.skills.find(
    (item) => item.id === id
  );

  if (!skill) {
    throw new RangeError(
      `Unknown Capture skill: ${id || String(skillId)}`
    );
  }

  return skill;
}

function findCreature(captureExport, creatureId) {
  const id = String(creatureId ?? "").trim();
  const creature = captureExport.creatures.find(
    (item) => item.id === id
  );

  if (!creature) {
    throw new RangeError(
      `Unknown Capture creature: ${id || String(creatureId)}`
    );
  }

  return creature;
}

export function adaptCaptureSkill(input, skillId) {
  const captureExport = normalizeCaptureExportV1(input);
  return findSkill(captureExport, skillId);
}

export function adaptCaptureCreatureSkills(input, creatureId) {
  const captureExport = normalizeCaptureExportV1(input);
  const creature = findCreature(captureExport, creatureId);

  return Object.freeze(
    creature.skillIds.map((skillId) =>
      findSkill(captureExport, skillId)
    )
  );
}
