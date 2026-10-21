import { normalizeSkillEffectV1 } from "./skill-effect-v1.js";

// An opt-in Combat Rules contract, not an animation/effect engine.
// The same immediate tactical effect executor applies each pulse.
export function normalizeContactHoldV1(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("contactHold must be an object");
  }
  const allowed = new Set(["tickIntervalMs", "maxDurationMs", "effects"]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError("contactHold unknown field: " + key);
  }
  const tickIntervalMs = Number(value.tickIntervalMs);
  const maxDurationMs = Number(value.maxDurationMs ?? 0);
  if (!Number.isInteger(tickIntervalMs) || tickIntervalMs < 100 || tickIntervalMs > 60000) {
    throw new RangeError("contactHold.tickIntervalMs must be 100..60000");
  }
  if (!Number.isInteger(maxDurationMs) || maxDurationMs < 0 || maxDurationMs > 120000) {
    throw new RangeError("contactHold.maxDurationMs must be 0..120000");
  }
  if (!Array.isArray(value.effects) || value.effects.length < 1 || value.effects.length > 12) {
    throw new RangeError("contactHold.effects requires 1..12 native tactical effects");
  }
  const effects = value.effects.map(normalizeSkillEffectV1);
  if (effects.some(effect => ["persistent_zone", "scheduled_effect"].includes(effect.kind))) {
    throw new RangeError("contactHold.effects cannot own a second zone or delayed scheduler");
  }
  return Object.freeze({
    tickIntervalMs,
    maxDurationMs,
    effects: Object.freeze(effects)
  });
}
