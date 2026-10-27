import {
  normalizeSkillPresentationBindingV9
} from "./skill-presentation-binding-v9.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V10 = 10;

function validateNumber(value, field, low, high) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < low || value > high) {
    throw new RangeError(field + " must be between " + low + " and " + high);
  }
  return value;
}

/**
 * V10 adds a visual trajectory strategy to travel only. Historical V1–V9
 * stay strict; only the FX renderer may interpret this geometry.
 */
export function normalizeSkillPresentationBindingV10(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 10) {
    throw new TypeError("SkillPresentationBindingV10 requires version 10");
  }
  const rawTravel = input.visual?.travel ?? null;
  const {
    trajectoryMode: rawMode,
    fallHeightPx: rawHeight,
    fallOffsetXPx: rawOffset,
    ...legacyTravel
  } = rawTravel ?? {};

  if (rawMode !== undefined && !["linear", "skyfall"].includes(rawMode)) {
    throw new RangeError("Unsupported visual.travel.trajectoryMode: " + rawMode);
  }
  const mode = rawMode ?? "linear";
  if (mode !== "skyfall" && (rawHeight != null || rawOffset != null)) {
    throw new RangeError("fall geometry requires visual.travel.trajectoryMode skyfall");
  }
  if (!rawTravel && (rawMode !== undefined || rawHeight !== undefined || rawOffset !== undefined)) {
    throw new RangeError("skyfall requires visual.travel");
  }
  const height = mode === "skyfall"
    ? validateNumber(rawHeight ?? 400, "visual.travel.fallHeightPx", 1, 1400)
    : null;
  const offset = mode === "skyfall"
    ? validateNumber(rawOffset ?? 0, "visual.travel.fallOffsetXPx", -700, 700)
    : null;
  const proxy = {
    ...input,
    version: 9,
    visual: {
      ...(input.visual ?? {}),
      ...(rawTravel == null ? {} : { travel: legacyTravel })
    }
  };
  const base = normalizeSkillPresentationBindingV9(proxy);
  return Object.freeze({
    ...base,
    version: SKILL_PRESENTATION_BINDING_VERSION_V10,
    visual: Object.freeze({
      ...base.visual,
      ...(rawTravel == null ? {} : {
        travel: Object.freeze({
          ...base.visual.travel,
          trajectoryMode: mode,
          ...(mode === "skyfall" ? { fallHeightPx: height, fallOffsetXPx: offset } : {})
        })
      })
    })
  });
}
