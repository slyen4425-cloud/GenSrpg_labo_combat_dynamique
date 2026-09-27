import {
  normalizeCaptureExportV1
} from "../../../contracts/capture-export-v1.js";

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

function findMember(captureExport, memberId) {
  const id = String(memberId ?? "").trim();

  for (const team of captureExport.teams) {
    const member = team.members.find((item) => item.id === id);
    if (member) {
      return member;
    }
  }

  throw new RangeError(
    `Unknown Capture roster member: ${id || String(memberId)}`
  );
}

export function adaptCaptureCreature(input, creatureId) {
  const captureExport = normalizeCaptureExportV1(input);
  const creature = findCreature(captureExport, creatureId);

  const fighterConfig = Object.freeze({
    id: creature.id,
    maxHp: creature.combat.maxHp,
    initialHp: creature.combat.initialHp,
    maxEnergy: creature.combat.maxEnergy,
    initialEnergy: creature.combat.initialEnergy,
    energyChargeAmount: creature.combat.energyChargeAmount,
    energyChargeIntervalMs: creature.combat.energyChargeIntervalMs,
    movementEnergyPerStep: creature.combat.movementEnergyPerStep,
    chargeTimeModifierPct: creature.combat.chargeTimeModifierPct
  });

  const sourceMetadata = Object.freeze({
    stats: creature.stats,
    progression: creature.progression,
    skillIds: creature.skillIds
  });

  return Object.freeze({
    fighterConfig,
    sourceMetadata
  });
}

export function adaptCaptureRosterMember(input, memberId) {
  const captureExport = normalizeCaptureExportV1(input);
  const member = findMember(captureExport, memberId);
  const creature = findCreature(
    captureExport,
    member.creatureId
  );

  return Object.freeze({
    id: member.id,
    creatureId: creature.id,
    displayName: creature.displayName,
    fighterConfigId: creature.id
  });
}
