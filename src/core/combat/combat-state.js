import { assertCombatDistance } from "./distance.js";

function finiteNonNegative(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${field} must be a non-negative finite number`);
  }
  return number;
}

function normalizeFighter(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("fighter must be an object");
  }

  const id = String(input.id ?? "").trim();
  if (!id) {
    throw new TypeError("fighter.id must be a non-empty string");
  }

  const maxEnergy = finiteNonNegative(input.maxEnergy, `${id}.maxEnergy`);
  const energy = finiteNonNegative(input.energy ?? maxEnergy, `${id}.energy`);
  if (energy > maxEnergy) {
    throw new RangeError(`${id}.energy cannot exceed maxEnergy`);
  }

  return Object.freeze({
    id,
    maxEnergy,
    energy,
    energyRegenPerSecond: finiteNonNegative(
      input.energyRegenPerSecond ?? 0,
      `${id}.energyRegenPerSecond`
    ),
    movementEnergyPerStep: finiteNonNegative(
      input.movementEnergyPerStep ?? 0,
      `${id}.movementEnergyPerStep`
    )
  });
}

export function createCombatState({ distance = "medium", fighters }) {
  assertCombatDistance(distance);
  if (!Array.isArray(fighters) || fighters.length < 2) {
    throw new TypeError("fighters must contain at least two fighters");
  }

  const entries = fighters.map((fighter) => {
    const normalized = normalizeFighter(fighter);
    return [normalized.id, normalized];
  });

  return Object.freeze({
    distance,
    fighters: Object.freeze(Object.fromEntries(entries))
  });
}

export function withFighterEnergy(state, fighterId, energy) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }

  const nextEnergy = Math.max(0, Math.min(fighter.maxEnergy, Number(energy)));
  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        energy: nextEnergy
      })
    })
  });
}

export function withDistance(state, distance) {
  assertCombatDistance(distance);
  return Object.freeze({ ...state, distance });
}

export function regenerateEnergy(state, seconds) {
  const elapsed = Number(seconds);
  if (!Number.isFinite(elapsed) || elapsed < 0) {
    throw new RangeError("seconds must be a non-negative finite number");
  }

  let next = state;
  for (const fighter of Object.values(state.fighters)) {
    next = withFighterEnergy(
      next,
      fighter.id,
      fighter.energy + fighter.energyRegenPerSecond * elapsed
    );
  }
  return next;
}
