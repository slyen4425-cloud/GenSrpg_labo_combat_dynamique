import { normalizeCreaturePresentationBindingV9 } from "./creature-presentation-binding-v9.js";

export const CREATURE_PRESENTATION_BINDING_V10_VERSION = 10;

// A shadow offset belongs to the creature's presentation, never the light,
// collision mask, locomotion profile, or renderer's persistent state.
// Percentages are measured in the resting image frame. Omitted => automatic.
export function normalizeCreaturePresentationBindingV10(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 10) {
    throw new TypeError("CreaturePresentationBinding V10 expected");
  }
  const { shadowOffset, ...prior } = input;
  const base = normalizeCreaturePresentationBindingV9({ ...prior, version: 9 });
  if (shadowOffset == null) return Object.freeze({ ...base, version: 10 });

  if (typeof shadowOffset !== "object" || Array.isArray(shadowOffset)) {
    throw new TypeError("shadowOffset must be an object");
  }
  for (const key of Object.keys(shadowOffset)) {
    if (key !== "x" && key !== "y") throw new TypeError("unknown shadowOffset field: " + key);
  }
  const axis = (key) => {
    const value = shadowOffset[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < -40 || value > 40) {
      throw new RangeError("shadowOffset." + key + " must be between -40 and 40 percent");
    }
    return value;
  };
  return Object.freeze({
    ...base,
    version: 10,
    shadowOffset: Object.freeze({ x: axis("x"), y: axis("y") })
  });
}
