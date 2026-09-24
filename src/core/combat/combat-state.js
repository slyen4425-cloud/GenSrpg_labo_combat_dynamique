import { assertCombatDistance } from "./distance.js";
import {
  advanceEnergyTicks,
  normalizeChargeTimeEffect
} from "./combat-timing.js";

const FIGHTER_SIDES = new Set(["player", "opponent"]);
const FIGHTER_PRESENCE = new Set(["active", "reserve", "recalled"]);

function finiteNonNegative(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${field} must be a non-negative finite number`);
  }
  return number;
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(`${field} must be a finite number`);
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

  const side = String(input.side ?? "").trim();
  if (!FIGHTER_SIDES.has(side)) {
    throw new RangeError(`${id}.side must be player or opponent`);
  }

  const presence = String(input.presence ?? "active").trim();
  if (!FIGHTER_PRESENCE.has(presence)) {
    throw new RangeError(`${id}.presence is unsupported`);
  }

  const maxHp = finiteNonNegative(input.maxHp ?? 100, `${id}.maxHp`);
  const hp = finiteNonNegative(
    input.initialHp ?? input.hp ?? maxHp,
    `${id}.initialHp`
  );
  if (hp > maxHp) {
    throw new RangeError(`${id}.initialHp cannot exceed maxHp`);
  }

  const maxEnergy = finiteNonNegative(input.maxEnergy, `${id}.maxEnergy`);
  const energy = finiteNonNegative(
    input.initialEnergy ?? input.energy ?? 0,
    `${id}.initialEnergy`
  );
  if (energy > maxEnergy) {
    throw new RangeError(`${id}.initialEnergy cannot exceed maxEnergy`);
  }

  const effects = (input.chargeTimeEffects ?? []).map((effect) =>
    normalizeChargeTimeEffect(effect, effect.appliedAtMs ?? 0)
  );

  return Object.freeze({
    id,
    side,
    presence,
    maxHp,
    hp,
    maxEnergy,
    energy,
    energyChargeAmount: finiteNonNegative(
      input.energyChargeAmount ?? 1,
      `${id}.energyChargeAmount`
    ),
    energyChargeIntervalMs: finiteNonNegative(
      input.energyChargeIntervalMs ?? 2000,
      `${id}.energyChargeIntervalMs`
    ),
    energyChargeProgressMs: finiteNonNegative(
      input.energyChargeProgressMs ?? 0,
      `${id}.energyChargeProgressMs`
    ),
    movementEnergyPerStep: finiteNonNegative(
      input.movementEnergyPerStep ?? 0,
      `${id}.movementEnergyPerStep`
    ),
    chargeTimeModifierPct: finiteNumber(
      input.chargeTimeModifierPct ?? 0,
      `${id}.chargeTimeModifierPct`
    ),
    chargeTimeEffects: Object.freeze(effects)
  });
}

export function createCombatState({
  distance = "medium",
  fighters,
  elapsedMs = 0
}) {
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
    elapsedMs: finiteNonNegative(elapsedMs, "elapsedMs"),
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

export function withFighterHp(state, fighterId, hp) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }

  const nextHp = Math.max(0, Math.min(fighter.maxHp, Number(hp)));
  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        hp: nextHp
      })
    })
  });
}

export function withFighterPresence(state, fighterId, presence) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }
  if (!FIGHTER_PRESENCE.has(presence)) {
    throw new RangeError(`Unsupported fighter presence: ${presence}`);
  }

  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        presence
      })
    })
  });
}

export function withDistance(state, distance) {
  assertCombatDistance(distance);
  return Object.freeze({ ...state, distance });
}

export function addChargeTimeEffect(state, fighterId, effect) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }

  const normalized = normalizeChargeTimeEffect(effect, state.elapsedMs);

  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        chargeTimeEffects: Object.freeze([
          ...fighter.chargeTimeEffects.filter((item) => item.id !== normalized.id),
          normalized
        ])
      })
    })
  });
}

export function advanceCombatTime(state, deltaMs) {
  const delta = finiteNonNegative(deltaMs, "deltaMs");
  if (delta === 0) {
    return state;
  }

  const elapsedMs = state.elapsedMs + delta;
  const fighters = {};

  for (const fighter of Object.values(state.fighters)) {
    const charged = advanceEnergyTicks({
      energy: fighter.energy,
      maxEnergy: fighter.maxEnergy,
      progressMs: fighter.energyChargeProgressMs,
      amount: fighter.energyChargeAmount,
      intervalMs: fighter.energyChargeIntervalMs,
      deltaMs: delta
    });

    fighters[fighter.id] = Object.freeze({
      ...fighter,
      energy: charged.energy,
      energyChargeProgressMs: charged.progressMs,
      chargeTimeEffects: Object.freeze(
        fighter.chargeTimeEffects.filter((effect) => effect.expiresAtMs > elapsedMs)
      )
    });
  }

  return Object.freeze({
    ...state,
    elapsedMs,
    fighters: Object.freeze(fighters)
  });
}
