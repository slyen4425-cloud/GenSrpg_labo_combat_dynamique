import { normalizeCreaturePresentationBindingV8 } from "./creature-presentation-binding-v8.js";
import { normalizeCreaturePresentationBindingV4 } from "./creature-presentation-binding-v4.js";

export const CREATURE_PRESENTATION_BINDING_V9_VERSION = 9;

// Additive per-view movement asset. V8 owns common playback and scaling,
// V4 remains the ONE validated appearance schema for either image.
export function normalizeCreaturePresentationBindingV9(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      input.version !== CREATURE_PRESENTATION_BINDING_V9_VERSION) {
    throw new TypeError("CreaturePresentationBinding V9 expected");
  }
  const v = input.visual;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    throw new TypeError("visual expected");
  }
  for (const key of Object.keys(v)) {
    if (!["front","back","icon","dodge","movement","movementBack",
      "rangedAttack","rangedAttackBack","rangedAttackPlacement",
      "movementScaleByView","rangedAttackScaleByView","movementPlayback"].includes(key)) {
      throw new TypeError("unknown V9 visual field: " + key);
    }
  }
  const { movementBack, ...prior } = v;
  // A player-only back asset is valid. Supply a temporary V8 movement for
  // validating shared playback/scales, then remove that temporary slot.
  const syntheticFront = prior.movement == null && movementBack != null;
  const base = normalizeCreaturePresentationBindingV8({
    ...input, version:8,
    visual: syntheticFront ? {...prior,movement:movementBack} : prior
  });
  let back = null;
  if (movementBack != null) {
    back = normalizeCreaturePresentationBindingV4({
      ...input, version:4, visual:{
        front:v.front, back:v.back, icon:v.icon,
        ...(v.dodge==null?{}:{dodge:v.dodge}),
        movement: movementBack
      }
    }).visual.movement;
  }
  const visual={...base.visual};
  if (syntheticFront) delete visual.movement;
  if (back) visual.movementBack=back;
  return Object.freeze({...base,version:9,visual:Object.freeze(visual)});
}
