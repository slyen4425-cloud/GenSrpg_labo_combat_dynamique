import { normalizeCreaturePresentationBindingV6 } from "./creature-presentation-binding-v6.js";

export const CREATURE_PRESENTATION_BINDING_V7_VERSION = 7;
export const RANGED_POSE_MAX_OFFSET_PX_V7 = 400;

function placementPoint(value, field) {
  if (value == null) return Object.freeze({ x: 0, y: 0 });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(field + " must be an object");
  }
  for (const key of Object.keys(value)) {
    if (!["x", "y"].includes(key)) throw new TypeError(field + " unknown coordinate: " + key);
  }
  const p = {};
  for (const key of ["x", "y"]) {
    const n = value[key] ?? 0;
    if (typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > RANGED_POSE_MAX_OFFSET_PX_V7) {
      throw new RangeError(field + "." + key + " must be a finite pixel offset within ±400");
    }
    p[key] = n;
  }
  return Object.freeze(p);
}

// Purely decorative per-view sprite alignment. Never modifies the fighter's
// canonical position, the collision projection or the skill's FX anchors.
export function normalizeCreaturePresentationBindingV7(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 7) {
    throw new TypeError("CreaturePresentationBinding V7 expected");
  }
  const rawVisual = input.visual;
  if (!rawVisual || typeof rawVisual !== "object" || Array.isArray(rawVisual)) {
    throw new TypeError("visual must be an object");
  }
  for (const key of Object.keys(rawVisual)) {
    if (!["front", "back", "icon", "dodge", "movement", "rangedAttack", "rangedAttackBack", "rangedAttackPlacement"].includes(key)) {
      throw new TypeError("unknown visual key: " + key);
    }
  }
  const { rangedAttackPlacement, ...v6Visual } = rawVisual;
  const base = normalizeCreaturePresentationBindingV6({
    ...input, version: 6, visual: v6Visual
  });
  if (rangedAttackPlacement == null) return Object.freeze({ ...base, version: 7 });
  if (typeof rangedAttackPlacement !== "object" || Array.isArray(rangedAttackPlacement)) {
    throw new TypeError("rangedAttackPlacement must be an object");
  }
  for (const key of Object.keys(rangedAttackPlacement)) {
    if (!["front", "back"].includes(key)) throw new TypeError("unknown rangedAttackPlacement view: " + key);
  }
  return Object.freeze({
    ...base,
    version: 7,
    visual: Object.freeze({
      ...base.visual,
      rangedAttackPlacement: Object.freeze({
        front: placementPoint(rangedAttackPlacement.front, "rangedAttackPlacement.front"),
        back: placementPoint(rangedAttackPlacement.back, "rangedAttackPlacement.back")
      })
    })
  });
}
