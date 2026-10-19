import { normalizeCreaturePresentationBindingV5 } from "./creature-presentation-binding-v5.js";

export const CREATURE_PRESENTATION_BINDING_V6_VERSION = 6;

// V5's rangedAttack is the FRONT/opponent pose; V6 adds an optional
// independent BACK/player pose. V1-V5 remain unchanged.
export function normalizeCreaturePresentationBindingV6(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 6) {
    throw new TypeError("CreaturePresentationBinding V6 expected");
  }
  const visual = input.visual;
  if (!visual || typeof visual !== "object" || Array.isArray(visual)) {
    throw new TypeError("visual must be an object");
  }
  for (const key of Object.keys(visual)) {
    if (!["front", "back", "icon", "dodge", "movement", "rangedAttack", "rangedAttackBack"].includes(key)) {
      throw new TypeError("visual contains unknown field: " + key);
    }
  }
  const { rangedAttackBack, ...v5Visual } = visual;
  const base = normalizeCreaturePresentationBindingV5({
    ...input, version: 5, visual: v5Visual
  });
  if (rangedAttackBack == null) {
    return Object.freeze({ ...base, version: 6 });
  }
  // Validate both poses through the same canonical V5/V4 media contract.
  // Unlike V5, a V6 profile with only a back pose does not assign it to front.
  const parsedBack = normalizeCreaturePresentationBindingV5({
    ...input,
    version: 5,
    visual: { ...v5Visual, rangedAttack: rangedAttackBack }
  }).visual.rangedAttack;
  return Object.freeze({
    ...base,
    version: 6,
    visual: Object.freeze({ ...base.visual, rangedAttackBack: parsedBack })
  });
}
