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

  if (hasOwn(combat, "chargeTimeModifierPct")) {
    output.chargeTimeModifierPct = finiteNumber(
      combat.chargeTimeModifierPct,
      "combat.chargeTimeModifierPct"
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
