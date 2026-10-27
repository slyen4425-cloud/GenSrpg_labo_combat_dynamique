import { normalizeSkillPresentationBindingV11 } from "./skill-presentation-binding-v11.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V12 = 12;

/**
 * Travel-only, optional, stronger distance scale and arrival occlusion.
 * V11's frame-rate and 0..0.5 legacy perspective remain untouched.
 */
export function normalizeSkillPresentationBindingV12(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 12) {
    throw new TypeError("SkillPresentationBindingV12 requires version 12");
  }
  const raw = input.visual?.travel;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError("V12 requires visual.travel");
  }
  const { farScaleRatio, arrivalLayer, ...travelV11 } = raw;
  if (farScaleRatio != null && (typeof farScaleRatio !== "number" || !Number.isFinite(farScaleRatio) || farScaleRatio < 0.15 || farScaleRatio > 1)) {
    throw new RangeError("visual.travel.farScaleRatio must be between 0.15 and 1");
  }
  if (arrivalLayer != null && !["front","behind"].includes(arrivalLayer)) {
    throw new RangeError("visual.travel.arrivalLayer must be front or behind");
  }
  if (farScaleRatio == null && arrivalLayer == null) {
    throw new RangeError("V12 needs farScaleRatio or arrivalLayer");
  }
  if (raw.trajectoryMode === "skyfall") {
    throw new RangeError("V12 travel depth and arrival layer are for linear projectiles, not skyfall");
  }
  const base = normalizeSkillPresentationBindingV11({
    ...input,
    version: 11,
    visual: {
      ...input.visual,
      travel: travelV11
    }
  });
  return Object.freeze({
    ...base,
    version: SKILL_PRESENTATION_BINDING_VERSION_V12,
    visual: Object.freeze({
      ...base.visual,
      travel: Object.freeze({
        ...base.visual.travel,
        ...(farScaleRatio == null ? {} : {farScaleRatio}),
        ...(arrivalLayer == null ? {} : {arrivalLayer})
      })
    })
  });
}
