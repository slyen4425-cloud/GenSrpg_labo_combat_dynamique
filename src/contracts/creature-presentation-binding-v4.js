import { normalizeCreaturePresentationBindingV3 } from "./creature-presentation-binding-v3.js";
export const CREATURE_PRESENTATION_BINDING_V4_VERSION = 4;
function range(value, field, min, max, integer = false) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new RangeError(field + " is invalid");
  }
  return n;
}
export function normalizeCreaturePresentationBindingV4(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 4) {
    throw new TypeError("CreaturePresentationBinding V4 expected");
  }
  if (!input.visual || typeof input.visual !== "object" || Array.isArray(input.visual)) {
    throw new TypeError("visual expected");
  }
  for (const key of Object.keys(input.visual)) {
    if (!["front", "back", "icon", "dodge", "movement"].includes(key)) {
      throw new TypeError("unknown visual key: " + key);
    }
  }
  const base = normalizeCreaturePresentationBindingV3({
    ...input, version: 3,
    visual: {
      front: input.visual.front, back: input.visual.back, icon: input.visual.icon,
      ...(input.visual.dodge == null ? {} : { dodge: input.visual.dodge })
    }
  });
  const raw = input.visual.movement;
  if (raw == null) return Object.freeze({ ...base, version: 4 });
  if (typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("movement must be an object");
  for (const key of Object.keys(raw)) if (!["assetId", "mode", "displayScale", "rotationTurns", "frameCount", "transitionMs"].includes(key)) throw new TypeError("unknown movement property: " + key);
  const assetId = String(raw.assetId ?? "").trim();
  if (!/^[A-Za-z0-9._-]+(?::[A-Za-z0-9._-]+)+$/.test(assetId)) throw new TypeError("movement.assetId must be stable");
  const mode = raw.mode ?? "roll";
  if (!["roll", "sprite", "static"].includes(mode)) throw new RangeError("unknown movement mode");
  const movement = Object.freeze({
    assetId, mode,
    displayScale: range(raw.displayScale ?? 1, "movement.displayScale", 0.1, 8),
    rotationTurns: range(raw.rotationTurns ?? 3, "movement.rotationTurns", 0, 20),
    frameCount: range(raw.frameCount ?? 1, "movement.frameCount", 1, 120, true),
    transitionMs: range(raw.transitionMs ?? 80, "movement.transitionMs", 0, 350)
  });
  return Object.freeze({
    ...base, version: 4,
    visual: Object.freeze({ ...base.visual, movement })
  });
}
