import {
  normalizeCaptureStatRegistryV1
} from "../../contracts/capture-stat-registry-v1.js";
import {
  normalizeCaptureCreatureStatValuesV1
} from "../../contracts/capture-creature-stat-values-v1.js";

function nonNegativeFiniteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(
      field + " must be a non-negative finite number"
    );
  }
  return number;
}

function projectDefinition(definition, pointsInput) {
  const points = nonNegativeFiniteNumber(
    pointsInput,
    "points"
  );

  return Object.freeze({
    damagePct:
      points * definition.damagePctPerPoint,
    resistancePct:
      points * definition.resistancePctPerPoint,
    chargeTimeReductionPct:
      points *
      definition.chargeTimeReductionPctPerPoint,
    damageReductionPct:
      points *
      (
        definition.damageReductionPctPerPoint ??
        0
      ),
    maxHp:
      points *
      (
        definition.maxHpPerPoint ??
        0
      )
  });
}

function addChannelValue(target, channel, amount) {
  if (channel === null || amount === 0) {
    return;
  }
  target[channel] = (target[channel] ?? 0) + amount;
}

export function projectCaptureStatDefinitionEffectsV1({
  definition: definitionInput,
  points
}) {
  const registry =
    normalizeCaptureStatRegistryV1({
      schema: "capture-stat-registry-v1",
      stats: [definitionInput]
    });

  return projectDefinition(
    registry.stats[0],
    points
  );
}

export function projectCaptureStatEffectsV1({
  registry: registryInput,
  statValues: statValuesInput
}) {
  const registry =
    normalizeCaptureStatRegistryV1(registryInput);
  const statValues =
    normalizeCaptureCreatureStatValuesV1(
      statValuesInput,
      registry
    );

  const damagePctByChannel = {};
  const resistancePctByChannel = {};
  let chargeTimeReductionPct = 0;
  let damageReductionPct = 0;
  let maxHp = 0;

  for (const definition of registry.stats) {
    const points =
      statValues.values[definition.id] ?? 0;
    const projected =
      projectDefinition(definition, points);

    addChannelValue(
      damagePctByChannel,
      definition.damageChannel,
      projected.damagePct
    );
    addChannelValue(
      resistancePctByChannel,
      definition.resistanceChannel,
      projected.resistancePct
    );

    chargeTimeReductionPct +=
      projected.chargeTimeReductionPct;
    damageReductionPct +=
      projected.damageReductionPct;
    maxHp += projected.maxHp;
  }

  return Object.freeze({
    creatureId: statValues.creatureId,
    damagePctByChannel:
      Object.freeze(damagePctByChannel),
    resistancePctByChannel:
      Object.freeze(resistancePctByChannel),
    chargeTimeReductionPct,
    damageReductionPct,
    maxHp
  });
}
