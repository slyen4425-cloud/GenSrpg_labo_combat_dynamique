import {
  normalizeCaptureStatRegistryV1
} from "../../contracts/capture-stat-registry-v1.js";
import {
  normalizeCaptureCreatureStatValuesV1
} from "../../contracts/capture-creature-stat-values-v1.js";

function addChannelValue(target, channel, amount) {
  if (channel === null || amount === 0) {
    return;
  }
  target[channel] = (target[channel] ?? 0) + amount;
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

  for (const definition of registry.stats) {
    const points =
      statValues.values[definition.id] ?? 0;

    addChannelValue(
      damagePctByChannel,
      definition.damageChannel,
      points * definition.damagePctPerPoint
    );
    addChannelValue(
      resistancePctByChannel,
      definition.resistanceChannel,
      points * definition.resistancePctPerPoint
    );

    chargeTimeReductionPct +=
      points *
      definition.chargeTimeReductionPctPerPoint;
  }

  return Object.freeze({
    creatureId: statValues.creatureId,
    damagePctByChannel:
      Object.freeze(damagePctByChannel),
    resistancePctByChannel:
      Object.freeze(resistancePctByChannel),
    chargeTimeReductionPct
  });
}
