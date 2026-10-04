import { isStatusEffectRuntimeInstanceActiveV1 } from "./status-effect-instance-v1.js";

function nonNegative(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${field} must be a non-negative finite number`);
  }
  return number;
}

function finite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return number;
}

export function normalizeSkillSpeedMultiplier(value = 1) {
  const multiplier = finite(value, "skillSpeedMultiplier");
  if (multiplier <= 0) {
    throw new RangeError(
      "skillSpeedMultiplier must be greater than 0"
    );
  }
  return multiplier;
}

export function effectiveSkillTimingMs({
  baseMs,
  speedMultiplier = 1
}) {
  const base = nonNegative(baseMs, "baseMs");
  const multiplier = normalizeSkillSpeedMultiplier(
    speedMultiplier
  );
  return Math.round(base / multiplier);
}

export function effectiveApproachTimingMs({ baseMs, approachMode, statusEffects = [], atMs = 0, speedMultiplier = 1 }) {
  const base = nonNegative(baseMs, "baseMs");
  let modifierPct = 0;
  if (["ground", "aerial"].includes(approachMode)) {
    for (const instance of statusEffects) {
      if (instance.definition.kind === "approach_time_modifier" && isStatusEffectRuntimeInstanceActiveV1(instance, atMs)) {
        modifierPct += instance.definition.modifierPct * instance.stacks;
      }
    }
  }
  return effectiveSkillTimingMs({ baseMs: base * Math.max(0, 1 + modifierPct / 100), speedMultiplier });
}

export function normalizeChargeTimeEffect(input, appliedAtMs = 0) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("charge time effect must be an object");
  }

  const id = String(input.id ?? "").trim();
  if (!id) {
    throw new TypeError("charge time effect id must be a non-empty string");
  }

  const modifierPct = finite(input.modifierPct, "modifierPct");
  const durationMs = nonNegative(input.durationMs, "durationMs");
  const start = nonNegative(appliedAtMs, "appliedAtMs");

  return Object.freeze({
    id,
    modifierPct,
    appliedAtMs: start,
    expiresAtMs: start + durationMs
  });
}

export function activeChargeTimeModifierPct({
  permanentPct = 0,
  effects = [],
  atMs = 0
}) {
  const permanent = finite(permanentPct, "permanentPct");
  const now = nonNegative(atMs, "atMs");

  let total = permanent;
  for (const effect of effects) {
    if (effect.expiresAtMs > now) {
      total += finite(effect.modifierPct, "effect.modifierPct");
    }
  }
  return total;
}

export function effectivePreparationMs({
  baseMs,
  permanentPct = 0,
  effects = [],
  atMs = 0
}) {
  const base = nonNegative(baseMs, "baseMs");
  const modifierPct = activeChargeTimeModifierPct({
    permanentPct,
    effects,
    atMs
  });

  const multiplier = Math.max(0, 1 + modifierPct / 100);
  return Math.round(base * multiplier);
}

export function advanceEnergyTicks({
  energy,
  maxEnergy,
  progressMs = 0,
  amount,
  intervalMs,
  deltaMs
}) {
  const current = nonNegative(energy, "energy");
  const max = nonNegative(maxEnergy, "maxEnergy");
  const progress = nonNegative(progressMs, "progressMs");
  const gain = nonNegative(amount, "amount");
  const interval = nonNegative(intervalMs, "intervalMs");
  const delta = nonNegative(deltaMs, "deltaMs");

  if (interval <= 0) {
    throw new RangeError("intervalMs must be greater than 0");
  }
  if (current >= max || gain === 0 || delta === 0) {
    return Object.freeze({
      energy: Math.min(current, max),
      progressMs: current >= max ? 0 : progress,
      ticks: 0
    });
  }

  const accumulated = progress + delta;
  const ticks = Math.floor(accumulated / interval);
  const gained = ticks * gain;
  const nextEnergy = Math.min(max, current + gained);

  return Object.freeze({
    energy: nextEnergy,
    progressMs: nextEnergy >= max ? 0 : accumulated % interval,
    ticks
  });
}
