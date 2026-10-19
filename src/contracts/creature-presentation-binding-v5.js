import { normalizeCreaturePresentationBindingV4 } from "./creature-presentation-binding-v4.js";
export const CREATURE_PRESENTATION_BINDING_V5_VERSION = 5;

// Reuse the tested V4 motion-appearance validator for both slots.
// Ranged attack poses change the creature image only, never a skill's effects.
export function normalizeCreaturePresentationBindingV5(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 5) {
    throw new TypeError("CreaturePresentationBinding V5 expected");
  }
  const visual = input.visual;
  if (!visual || typeof visual !== "object" || Array.isArray(visual)) {
    throw new TypeError("visual must be an object");
  }
  for (const key of Object.keys(visual)) {
    if (!["front","back","icon","dodge","movement","rangedAttack"].includes(key)) {
      throw new TypeError("visual contains unknown field: " + key);
    }
  }
  const baseVisual = {
    front: visual.front,
    back: visual.back,
    icon: visual.icon,
    ...(visual.dodge == null ? {} : { dodge: visual.dodge }),
    ...(visual.movement == null ? {} : { movement: visual.movement })
  };
  const base = normalizeCreaturePresentationBindingV4({
    ...input, version: 4, visual: baseVisual
  });
  if (visual.rangedAttack == null) {
    return Object.freeze({ ...base, version: 5 });
  }
  // Movement and ranged attacks share exactly the same media parameters;
  // validate the optional second pose without duplicating their rules.
  const parsedAttack = normalizeCreaturePresentationBindingV4({
    ...input,
    version: 4,
    visual: { ...baseVisual, movement: visual.rangedAttack }
  }).visual.movement;
  return Object.freeze({
    ...base,
    version: 5,
    visual: Object.freeze({ ...base.visual, rangedAttack: parsedAttack })
  });
}
