import {
  normalizeStatEffectRulesByIdV1
} from "../../../contracts/stat-effect-rules-v1.js";

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

function normalizeStatValuesById(input, field) {
  if (input == null) {
    return Object.freeze({});
  }
  objectValue(input, field);

  const output = {};
  for (const [statIdRaw, value] of Object.entries(input)) {
    const statId = requiredString(
      statIdRaw,
      field + " key"
    );
    output[statId] = nonNegativeNumber(
      value,
      field + "." + statId
    );
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
    "chargeTimeReductionPct",
    "damageReductionPct"
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
      ),
    damageReductionPct:
      nonNegativeNumber(
        value.damageReductionPct ?? 0,
        "combat.statEffects.damageReductionPct"
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
    output.damageReductionPct =
      statEffects.damageReductionPct;
  }

  if (hasOwn(combat, "statValuesById")) {
    output.statValuesById =
      normalizeStatValuesById(
        combat.statValuesById,
        "combat.statValuesById"
      );
  }

  if (
    hasOwn(combat, "statEffectRulesById")
  ) {
    output.statEffectRulesById =
      normalizeStatEffectRulesByIdV1(
        combat.statEffectRulesById,
        "combat.statEffectRulesById"
      );
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
