import {
  isStatusEffectRuntimeInstanceActiveV1
} from "./status-effect-instance-v1.js";

function addChannel(target, channel, value) {
  if (channel == null || value === 0) {
    return;
  }
  target[channel] =
    (target[channel] ?? 0) + value;
}

function modifierPointsForInstance(
  fighter,
  instance
) {
  const definition = instance.definition;

  if (definition.modifierMode === "percent") {
    const basePoints = Number(
      fighter.statValuesById?.[
        definition.statId
      ]
    );
    if (!Number.isFinite(basePoints)) {
      throw new RangeError(
        "Missing base stat value for percent status: " +
          definition.statId
      );
    }
    return (
      basePoints *
      (definition.percent / 100) *
      instance.stacks
    );
  }

  return (
    definition.deltaPoints *
    instance.stacks
  );
}

export function projectStatusStatEffectsV1({
  fighter,
  atMs
}) {
  if (
    !fighter ||
    typeof fighter !== "object"
  ) {
    throw new TypeError(
      "fighter must be an object"
    );
  }
  const time = Number(atMs);
  if (!Number.isFinite(time) || time < 0) {
    throw new RangeError(
      "atMs must be a non-negative finite number"
    );
  }

  const damagePctByChannel = {};
  const resistancePctByChannel = {};
  let chargeTimeReductionPct = 0;
  let damageReductionPct = 0;

  for (
    const instance of
    fighter.statusEffects ?? []
  ) {
    if (
      instance.definition.kind !==
        "stat_modifier" ||
      !isStatusEffectRuntimeInstanceActiveV1(
        instance,
        time
      )
    ) {
      continue;
    }

    const statId =
      instance.definition.statId;
    const rule =
      fighter.statEffectRulesById?.[
        statId
      ];

    if (!rule) {
      throw new RangeError(
        "Unsupported status statId: " +
          statId
      );
    }

    const points =
      modifierPointsForInstance(
        fighter,
        instance
      );

    addChannel(
      damagePctByChannel,
      rule.damageChannel,
      points * rule.damagePctPerPoint
    );
    addChannel(
      resistancePctByChannel,
      rule.resistanceChannel,
      points *
        rule.resistancePctPerPoint
    );
    chargeTimeReductionPct +=
      points *
      rule.chargeTimeReductionPctPerPoint;
    damageReductionPct +=
      points *
      rule.damageReductionPctPerPoint;
  }

  return Object.freeze({
    damagePctByChannel:
      Object.freeze(damagePctByChannel),
    resistancePctByChannel:
      Object.freeze(resistancePctByChannel),
    chargeTimeReductionPct,
    damageReductionPct
  });
}
