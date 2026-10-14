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

export function effectiveApproachTimingMs({
  baseMs,
  approachMode,
  permanentPct = 0,
  statusEffects = [],
  atMs = 0,
  speedMultiplier = 1
}) {
  const base = nonNegative(baseMs, "baseMs");
  let modifierPct = 0;

  if (
    ["ground", "aerial", "burrow"].includes(
      approachMode
    )
  ) {
    modifierPct += finite(
      permanentPct,
      "permanentPct"
    );

    for (const instance of statusEffects) {
      if (
        instance.definition.kind ===
          "approach_time_modifier" &&
        isStatusEffectRuntimeInstanceActiveV1(
          instance,
          atMs
        )
      ) {
        modifierPct +=
          instance.definition.modifierPct *
          instance.stacks;
      }
    }
  }

  return effectiveSkillTimingMs({
    baseMs:
      base *
      Math.max(
        0,
        1 + modifierPct / 100
      ),
    speedMultiplier
  });
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
  deltaMs,
  atMs = 0,
  energyStatusEffects = []
}) {
  const current = nonNegative(energy, "energy");
  const max = nonNegative(maxEnergy, "maxEnergy");
  const progress = nonNegative(progressMs, "progressMs");
  const gain = nonNegative(amount, "amount");
  const interval = nonNegative(intervalMs, "intervalMs");
  const delta = nonNegative(deltaMs, "deltaMs");
  const start = nonNegative(atMs, "atMs");
  if (!Array.isArray(energyStatusEffects)) {
    throw new TypeError("energyStatusEffects must be an array");
  }

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
  // One clock and one permanent base rate. The status only changes the
  // quantity gained at each already-scheduled native tick; it never
  // restarts progress or changes the creature's base energy rules.
  let nextEnergy = current;
  if (energyStatusEffects.length === 0) {
    nextEnergy = Math.min(max, current + ticks * gain);
  } else {
    for (let index = 0; index < ticks && nextEnergy < max; index += 1) {
      const tickAtMs = start + interval - progress + index * interval;
      let modifierPct = 0;
      for (const instance of energyStatusEffects) {
        if (
          instance?.definition?.kind === "energy_regen_modifier" &&
          isStatusEffectRuntimeInstanceActiveV1(instance, tickAtMs)
        ) {
          modifierPct += instance.definition.modifierPct * instance.stacks;
        }
      }
      nextEnergy = Math.min(
        max,
        nextEnergy + gain * Math.max(0, 1 + modifierPct / 100)
      );
    }
  }

  return Object.freeze({
    energy: nextEnergy,
    progressMs: nextEnergy >= max ? 0 : accumulated % interval,
    ticks
  });
}


/**
 * Advance the existing absolute ready-at deadlines without creating a second
 * cooldown clock. Temporary statuses only change how much cooldown work
 * passes while they are active. Split at each activation/expiration boundary:
 * large animation frames and many small frames yield the same result.
 */
export function advanceSkillCooldownDeadlinesV1({
  cooldowns,
  atMs,
  deltaMs,
  statusEffects = []
}) {
  const start = nonNegative(atMs, "atMs");
  const delta = nonNegative(deltaMs, "deltaMs");
  if (!cooldowns || typeof cooldowns !== "object" || Array.isArray(cooldowns)) {
    throw new TypeError("cooldowns must be an object");
  }
  if (!Array.isArray(statusEffects)) {
    throw new TypeError("statusEffects must be an array");
  }
  const end = start + delta;
  const modifiers = statusEffects.filter(
    instance => instance?.definition?.kind === "skill_cooldown_rate_modifier"
  );
  const boundaries = new Set([start, end]);
  for (const instance of modifiers) {
    for (const boundary of [instance.appliedAtMs, instance.expiresAtMs]) {
      if (boundary !== null && Number.isFinite(boundary) && boundary > start && boundary < end) {
        boundaries.add(boundary);
      }
    }
  }
  const times = [...boundaries].sort((a, b) => a - b);
  const result = {};
  for (const [skillId, readyAtMs] of Object.entries(cooldowns)) {
    let remaining = nonNegative(readyAtMs, "readyAtMs") - start;
    if (remaining <= 0) continue;
    for (let index = 0; index + 1 < times.length && remaining > 0; index++) {
      const from = times[index];
      const until = times[index + 1];
      const middle = from + (until - from) / 2;
      let bonusPct = 0;
      for (const instance of modifiers) {
        if (instance.appliedAtMs <= middle &&
            isStatusEffectRuntimeInstanceActiveV1(instance, middle)) {
          bonusPct += instance.definition.modifierPct * instance.stacks;
        }
      }
      remaining -= (until - from) * Math.max(0, 1 + bonusPct / 100);
    }
    if (remaining > 0) {
      result[skillId] = end + remaining;
    }
  }
  return Object.freeze(result);
}
