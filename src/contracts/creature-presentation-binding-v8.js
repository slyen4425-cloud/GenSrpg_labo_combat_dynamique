import { normalizeCreaturePresentationBindingV7 } from "./creature-presentation-binding-v7.js";
export const CREATURE_PRESENTATION_BINDING_V8_VERSION = 8;
function scales(raw, name) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError(name+" expected");
  for (const key of Object.keys(raw)) if (!["player","opponent"].includes(key)) throw new TypeError(name+" unknown view "+key);
  const pair={};
  for (const view of ["player","opponent"]) {
    const v=raw[view];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0.1 || v > 8) throw new RangeError(name+"."+view+" invalid");
    pair[view]=v;
  }
  return Object.freeze(pair);
}
function playback(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("movementPlayback expected");
  for (const key of Object.keys(raw)) if (!["frameMs","mode"].includes(key)) throw new TypeError("unknown playback field "+key);
  if (typeof raw.frameMs !== "number" || !Number.isInteger(raw.frameMs) || raw.frameMs < 0 || raw.frameMs > 500) throw new RangeError("invalid frameMs");
  if (!["loop","once","hold-last"].includes(raw.mode)) throw new RangeError("invalid playback mode");
  return Object.freeze({frameMs:raw.frameMs,mode:raw.mode});
}
// Only presentation metadata; V1-V7 untouched.
export function normalizeCreaturePresentationBindingV8(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 8) throw new TypeError("CreaturePresentationBinding V8 expected");
  const v=input.visual;
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new TypeError("visual expected");
  for(const k of Object.keys(v)) if (!["front","back","icon","dodge","movement","rangedAttack","rangedAttackBack","rangedAttackPlacement","movementScaleByView","rangedAttackScaleByView","movementPlayback"].includes(k)) throw new TypeError("unknown V8 visual field: "+k);
  const {movementScaleByView,rangedAttackScaleByView,movementPlayback,...prior}=v;
  const base=normalizeCreaturePresentationBindingV7({...input,version:7,visual:prior});
  if ((movementScaleByView!=null||movementPlayback!=null)&&!base.visual.movement) throw new TypeError("movement settings require movement sprite");
  if (rangedAttackScaleByView!=null&&!base.visual.rangedAttack&&!base.visual.rangedAttackBack) throw new TypeError("attack scale requires sprite");
  return Object.freeze({...base,version:8,visual:Object.freeze({...base.visual,
    ...(movementScaleByView==null?{}:{movementScaleByView:scales(movementScaleByView,"movementScaleByView")}),
    ...(rangedAttackScaleByView==null?{}:{rangedAttackScaleByView:scales(rangedAttackScaleByView,"rangedAttackScaleByView")}),
    ...(movementPlayback==null?{}:{movementPlayback:playback(movementPlayback)})
  })});
}
