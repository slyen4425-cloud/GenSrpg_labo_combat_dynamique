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

function normalizeNaturalResistanceByChannel(
  input,
  field = "creature.resistances"
) {
  if (input == null) {
    return Object.freeze({});
  }
  if (!Array.isArray(input)) {
    throw new TypeError(field + " must be an array");
  }

  const output = {};
  for (let index = 0; index < input.length; index += 1) {
    const entry = objectValue(
      input[index],
      `${field}[${index}]`
    );
    const kind = requiredString(
      entry.kind,
      `${field}[${index}].kind`
    );

    if (!kind.startsWith("element:")) {
      continue;
    }

    const channel = requiredString(
      kind.slice("element:".length),
      `${field}[${index}].kind channel`
    );
    output[channel] =
      (output[channel] ?? 0) +
      finiteNumber(
        entry.value,
        `${field}[${index}].value`
      );
  }

  return Object.freeze(output);
}

function mergePercentByChannel(...sources) {
  const output = {};
  for (const source of sources) {
    for (const [channel, value] of Object.entries(source ?? {})) {
      output[channel] =
        (output[channel] ?? 0) + Number(value);
    }
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

  if (hasOwn(combat, "approachTimeModifierPct")) {
    output.approachTimeModifierPct =
      finiteNumber(
        combat.approachTimeModifierPct,
        "combat.approachTimeModifierPct"
      );
  }

  const statEffects =
    normalizeStatEffects(combat.statEffects);
  const naturalResistancePctByChannel =
    normalizeNaturalResistanceByChannel(
      creature.resistances
    );

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
    output.damageReductionPct =
      statEffects.damageReductionPct;
  }

  if (
    Object.keys(naturalResistancePctByChannel).length > 0 ||
    statEffects !== null
  ) {
    output.resistancePctByChannel =
      mergePercentByChannel(
        naturalResistancePctByChannel,
        statEffects?.resistancePctByChannel
      );
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
