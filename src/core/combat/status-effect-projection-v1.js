function activeAt(instance, atMs) {
  return (
    instance.appliedAtMs <= atMs &&
    atMs < instance.expiresAtMs
  );
}

function addChannel(target, channel, value) {
  if (channel == null || value === 0) {
    return;
  }
  target[channel] =
    (target[channel] ?? 0) + value;
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

  for (
    const instance of
    fighter.statusEffects ?? []
  ) {
    if (
      instance.definition.kind !==
        "stat_modifier" ||
      !activeAt(instance, time)
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
      instance.definition.deltaPoints *
      instance.stacks;

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
  }

  return Object.freeze({
    damagePctByChannel:
      Object.freeze(damagePctByChannel),
    resistancePctByChannel:
      Object.freeze(resistancePctByChannel),
    chargeTimeReductionPct
  });
}
