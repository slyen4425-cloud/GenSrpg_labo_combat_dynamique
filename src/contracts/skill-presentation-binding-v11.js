import { normalizeSkillPresentationBindingV10 } from "./skill-presentation-binding-v10.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V11 = 11;

function bounded(value, label, low, high) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < low || value > high) {
    throw new RangeError(label + " must be between " + low + " and " + high);
  }
  return value;
}

/**
 * The travel-only presentation fields do not change projectile duration,
 * collision, CombatRuntime resolution, or any V1-V10 binding.
 */
export function normalizeSkillPresentationBindingV11(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 11) {
    throw new TypeError("SkillPresentationBindingV11 requires version 11");
  }
  const rawTravel = input.visual?.travel ?? null;
  if (!rawTravel) {
    throw new TypeError("visual.travel is required for V11 animation/depth");
  }
  const {
    frameSpeedMultiplier: rawRate,
    perspectiveAmount: rawPerspective,
    ...legacyTravel
  } = rawTravel;
  const frameSpeedMultiplier = bounded(rawRate ?? 1, "visual.travel.frameSpeedMultiplier", 0.25, 4);
  const perspectiveAmount = bounded(rawPerspective ?? 0, "visual.travel.perspectiveAmount", 0, 0.5);
  if (perspectiveAmount > 0 && rawTravel.trajectoryMode === "skyfall") {
    throw new RangeError("visual.travel.perspectiveAmount is only for linear projectiles, not skyfall");
  }
  const base = normalizeSkillPresentationBindingV10({
    ...input,
    version: 10,
    visual: {
      ...input.visual,
      travel: legacyTravel
    }
  });
  return Object.freeze({
    ...base,
    version: SKILL_PRESENTATION_BINDING_VERSION_V11,
    visual: Object.freeze({
      ...base.visual,
      travel: Object.freeze({
        ...base.visual.travel,
        frameSpeedMultiplier,
        perspectiveAmount
      })
    })
  });
}
