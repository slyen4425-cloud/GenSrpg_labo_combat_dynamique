import { COMBAT_DISTANCES } from "../../contracts/skill-definition.js";

const DISTANCE_INDEX = new Map(COMBAT_DISTANCES.map((value, index) => [value, index]));

export function assertCombatDistance(value) {
  if (!DISTANCE_INDEX.has(value)) {
    throw new RangeError(`Unsupported combat distance: ${value}`);
  }
  return value;
}

export function distanceSteps(from, to) {
  assertCombatDistance(from);
  assertCombatDistance(to);
  return Math.abs(DISTANCE_INDEX.get(to) - DISTANCE_INDEX.get(from));
}

export function movementEnergyCost({ from, to, energyPerStep }) {
  const unit = Number(energyPerStep);
  if (!Number.isFinite(unit) || unit < 0) {
    throw new RangeError("energyPerStep must be a non-negative finite number");
  }
  return distanceSteps(from, to) * unit;
}

export function isSkillInRange(skill, distance) {
  assertCombatDistance(distance);
  return skill.allowedDistances.includes(distance);
}
