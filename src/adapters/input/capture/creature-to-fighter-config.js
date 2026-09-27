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

function explicitNumber(source, field, { nonNegative = false } = {}) {
  if (!Object.hasOwn(source, field)) {
    throw new TypeError(`combat.${field} must be explicitly exported`);
  }

  const number = Number(source[field]);
  if (!Number.isFinite(number)) {
    throw new RangeError(`combat.${field} must be a finite number`);
  }
  if (nonNegative && number < 0) {
    throw new RangeError(
      `combat.${field} must be a non-negative finite number`
    );
  }
  return number;
}

export function captureCreatureToFighterConfig(creature) {
  objectValue(creature, "creature");
  const combat = objectValue(creature.combat, "creature.combat");

  const id = requiredString(creature.id, "creature.id");
  const maxHp = explicitNumber(combat, "maxHp", { nonNegative: true });
  const initialHp = explicitNumber(
    combat,
    "initialHp",
    { nonNegative: true }
  );
  const maxEnergy = explicitNumber(
    combat,
    "maxEnergy",
    { nonNegative: true }
  );
  const initialEnergy = explicitNumber(
    combat,
    "initialEnergy",
    { nonNegative: true }
  );
  const energyChargeAmount = explicitNumber(
    combat,
    "energyChargeAmount",
    { nonNegative: true }
  );
  const energyChargeIntervalMs = explicitNumber(
    combat,
    "energyChargeIntervalMs",
    { nonNegative: true }
  );
  const movementEnergyPerStep = explicitNumber(
    combat,
    "movementEnergyPerStep",
    { nonNegative: true }
  );
  const chargeTimeModifierPct = explicitNumber(
    combat,
    "chargeTimeModifierPct"
  );

  if (initialHp > maxHp) {
    throw new RangeError("combat.initialHp cannot exceed combat.maxHp");
  }
  if (initialEnergy > maxEnergy) {
    throw new RangeError(
      "combat.initialEnergy cannot exceed combat.maxEnergy"
    );
  }

  return Object.freeze({
    id,
    maxHp,
    initialHp,
    maxEnergy,
    initialEnergy,
    energyChargeAmount,
    energyChargeIntervalMs,
    movementEnergyPerStep,
    chargeTimeModifierPct
  });
}
