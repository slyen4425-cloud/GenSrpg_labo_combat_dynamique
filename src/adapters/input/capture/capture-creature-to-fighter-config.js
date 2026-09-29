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

function nonNegativeNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `${field} must be a non-negative finite number`
    );
  }
  return value;
}

function finiteNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return value;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function normalizePercentByChannel(input, field) {
  if (input == null) {
    return Object.freeze({});
  }
  objectValue(input, field);

  const output = {};
  for (const [channelRaw, value] of Object.entries(input)) {
    const channel = requiredString(
      channelRaw,
      field + " key"
    );
    output[channel] = nonNegativeNumber(
      value,
      field + "." + channel
    );
  }
  return Object.freeze(output);
}

function normalizeStatEffectRulesById(
  input
) {
  if (input == null) {
    return null;
  }

  const value = objectValue(
    input,
    "combat.statEffectRulesById"
  );
  const output = {};

  for (
    const [statIdRaw, ruleRaw] of
    Object.entries(value)
  ) {
    const statId = requiredString(
      statIdRaw,
      "combat.statEffectRulesById key"
    );
    const rule = objectValue(
      ruleRaw,
      "combat.statEffectRulesById." + statId
    );
    const allowed = new Set([
      "damageChannel",
      "resistanceChannel",
      "damagePctPerPoint",
      "resistancePctPerPoint",
      "chargeTimeReductionPctPerPoint"
    ]);

    for (const key of Object.keys(rule)) {
      if (!allowed.has(key)) {
        throw new TypeError(
          "combat.statEffectRulesById." +
            statId +
            " contains unknown field: " +
            key
        );
      }
    }

    output[statId] = Object.freeze({
      damageChannel:
        rule.damageChannel == null
          ? null
          : requiredString(
              rule.damageChannel,
              "damageChannel"
            ),
      resistanceChannel:
        rule.resistanceChannel == null
          ? null
          : requiredString(
              rule.resistanceChannel,
              "resistanceChannel"
            ),
      damagePctPerPoint:
        nonNegativeNumber(
          rule.damagePctPerPoint ?? 0,
          "damagePctPerPoint"
        ),
      resistancePctPerPoint:
        nonNegativeNumber(
          rule.resistancePctPerPoint ?? 0,
          "resistancePctPerPoint"
        ),
      chargeTimeReductionPctPerPoint:
        nonNegativeNumber(
          rule.chargeTimeReductionPctPerPoint ?? 0,
          "chargeTimeReductionPctPerPoint"
        )
    });
  }

  return Object.freeze(output);
}

function normalizeStatEffects(input) {
  if (input == null) {
    return null;
  }
  const value = objectValue(
    input,
    "combat.statEffects"
  );

  const allowed = new Set([
    "damagePctByChannel",
    "resistancePctByChannel",
    "chargeTimeReductionPct"
  ]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        "combat.statEffects contains unknown field: " +
          key
      );
    }
  }

  return Object.freeze({
    damagePctByChannel:
      normalizePercentByChannel(
        value.damagePctByChannel,
        "combat.statEffects.damagePctByChannel"
      ),
    resistancePctByChannel:
      normalizePercentByChannel(
        value.resistancePctByChannel,
        "combat.statEffects.resistancePctByChannel"
      ),
    chargeTimeReductionPct:
      nonNegativeNumber(
        value.chargeTimeReductionPct ?? 0,
        "combat.statEffects.chargeTimeReductionPct"
      )
  });
}

function copyOptionalNonNegative(source, target, field) {
  if (!hasOwn(source, field)) {
    return;
  }
  target[field] = nonNegativeNumber(source[field], field);
}

export function adaptCaptureCreatureToFighterConfig(
  creature,
  { fighterId = null } = {}
) {
  objectValue(creature, "creature");
  const creatureId = requiredString(creature.id, "creature.id");
  const combat = objectValue(creature.combat, "creature.combat");

  const maxHp = nonNegativeNumber(combat.maxHp, "combat.maxHp");
  const maxEnergy = nonNegativeNumber(
    combat.maxEnergy,
    "combat.maxEnergy"
  );

  const output = {
    id:
      fighterId == null
        ? creatureId
        : requiredString(fighterId, "fighterId"),
    maxHp,
    maxEnergy
  };

  copyOptionalNonNegative(combat, output, "initialHp");
  copyOptionalNonNegative(combat, output, "initialEnergy");
  copyOptionalNonNegative(combat, output, "energyChargeAmount");
  copyOptionalNonNegative(
    combat,
    output,
    "energyChargeIntervalMs"
  );
  copyOptionalNonNegative(
    combat,
    output,
    "movementEnergyPerStep"
  );

  const statEffects =
    normalizeStatEffects(combat.statEffects);

  const baseChargeModifierPct =
    hasOwn(combat, "chargeTimeModifierPct")
      ? finiteNumber(
          combat.chargeTimeModifierPct,
          "combat.chargeTimeModifierPct"
        )
      : 0;

  if (
    hasOwn(combat, "chargeTimeModifierPct") ||
    statEffects !== null
  ) {
    output.chargeTimeModifierPct =
      baseChargeModifierPct -
      (statEffects?.chargeTimeReductionPct ?? 0);
  }

  if (statEffects !== null) {
    output.damagePctByChannel =
      statEffects.damagePctByChannel;
    output.resistancePctByChannel =
      statEffects.resistancePctByChannel;
  }

  const statEffectRulesById =
    normalizeStatEffectRulesById(
      combat.statEffectRulesById
    );
  if (statEffectRulesById !== null) {
    output.statEffectRulesById =
      statEffectRulesById;
  }

  if (
    hasOwn(output, "initialHp") &&
    output.initialHp > output.maxHp
  ) {
    throw new RangeError(
      "combat.initialHp cannot exceed combat.maxHp"
    );
  }

  if (
    hasOwn(output, "initialEnergy") &&
    output.initialEnergy > output.maxEnergy
  ) {
    throw new RangeError(
      "combat.initialEnergy cannot exceed combat.maxEnergy"
    );
  }

  return Object.freeze(output);
}
