import {normalizeSkillPresentationBinding} from "./skill-presentation-binding.js";

// Additive, visual-only wrapper. Never change the semantics of older bindings.
// A V15 binding carries the exact former version in recolorBaseVersion.
export const SKILL_PRESENTATION_BINDING_VERSION_V15 = 15;
export const RECOLOR_SPRITE_SLOTS_V15 = Object.freeze(["cast","travel","impact","aura"]);

export function normalizeSpriteRecolorV15(raw, field = "recolor") {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new TypeError(field + " must be an object");
  for (const key of Object.keys(raw))
    if (!["hueRotateDeg","saturationPct"].includes(key))
      throw new TypeError(field + " unknown field " + key);
  const hueRotateDeg = raw.hueRotateDeg ?? 0;
  const saturationPct = raw.saturationPct ?? 100;
  if (typeof hueRotateDeg !== "number" || !Number.isFinite(hueRotateDeg) || hueRotateDeg < 0 || hueRotateDeg > 360)
    throw new RangeError(field + ".hueRotateDeg must be 0..360");
  if (typeof saturationPct !== "number" || !Number.isFinite(saturationPct) || saturationPct < 0 || saturationPct > 200)
    throw new RangeError(field + ".saturationPct must be 0..200");
  return Object.freeze({hueRotateDeg,saturationPct});
}

export function normalizeSkillPresentationBindingV15(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 15)
    throw new TypeError("SkillPresentationBindingV15 requires version 15");
  const originalVersion = input.recolorBaseVersion;
  if (!Number.isInteger(originalVersion) || originalVersion < 2 || originalVersion > 14)
    throw new RangeError("V15 recolorBaseVersion must be 2..14");
  const visual = input.visual ?? {};
  for (const slot of Object.keys(visual))
    if (visual[slot]?.recolor != null && !RECOLOR_SPRITE_SLOTS_V15.includes(slot))
      throw new TypeError("Sprite recolor unavailable for visual." + slot);

  const stripped = {};
  for (const [slot, settings] of Object.entries(visual)) {
    if (settings?.recolor == null) stripped[slot] = settings;
    else {
      const {recolor:_recolor,...original} = settings;
      stripped[slot] = original;
    }
  }
  const {recolorBaseVersion:_baseVersion,...originalInput} = input;
  const base = normalizeSkillPresentationBinding({
    ...originalInput,version:originalVersion,visual:stripped
  });
  const normalizedVisual = {...base.visual};
  for (const slot of RECOLOR_SPRITE_SLOTS_V15) {
    if (visual[slot]?.recolor == null) continue;
    if (!base.visual[slot]) throw new TypeError("Missing visual." + slot + " for recolor");
    normalizedVisual[slot] = Object.freeze({
      ...base.visual[slot],
      recolor:normalizeSpriteRecolorV15(visual[slot].recolor,"visual."+slot+".recolor")
    });
  }
  return Object.freeze({
    ...base,version:15,recolorBaseVersion:originalVersion,
    visual:Object.freeze(normalizedVisual)
  });
}
