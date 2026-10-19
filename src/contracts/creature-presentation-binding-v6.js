import { normalizeCreaturePresentationBindingV5 } from "./creature-presentation-binding-v5.js";
import { normalizeCreaturePresentationBindingV4 } from "./creature-presentation-binding-v4.js";

export const CREATURE_PRESENTATION_BINDING_V6_VERSION = 6;

// V5 rangedAttack is the historical single sprite. V6 optionally supplies a
// second pose for the player/back view. All timing and shape rules stay in V4.
export function normalizeCreaturePresentationBindingV6(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 6) {
    throw new TypeError("CreaturePresentationBinding V6 expected");
  }
  if (!input.visual || typeof input.visual !== "object" || Array.isArray(input.visual)) {
    throw new TypeError("visual must be an object");
  }
  for (const key of Object.keys(input.visual)) {
    if (!["front", "back", "icon", "dodge", "movement", "rangedAttack", "rangedAttackBack"].includes(key)) {
      throw new TypeError("unknown visual key: " + key);
    }
  }
  const { rangedAttackBack, ...v5Visual } = input.visual;
  const base = normalizeCreaturePresentationBindingV5({
    ...input,
    version: 5,
    visual: v5Visual
  });
  if (rangedAttackBack == null) {
    return Object.freeze({ ...base, version: 6 });
  }
  // Use the canonical V4 sprite validator. No new animation or asset rules.
  const back = normalizeCreaturePresentationBindingV4({
    ...input,
    version: 4,
    visual: {
      front: v5Visual.front,
      back: v5Visual.back,
      icon: v5Visual.icon,
      ...(v5Visual.dodge == null ? {} : { dodge: v5Visual.dodge }),
      movement: rangedAttackBack
    }
  }).visual.movement;
  return Object.freeze({
    ...base,
    version: 6,
    visual: Object.freeze({ ...base.visual, rangedAttackBack: back })
  });
}
