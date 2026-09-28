import {
  normalizeSkillPresentationBindingV1
} from "../../contracts/skill-presentation-binding-v1.js";

function requiredFunction(value, field) {
  if (typeof value !== "function") {
    throw new TypeError(`${field} must be a function`);
  }
  return value;
}

function normalizePresentationMap(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(
      "skillPresentations must be an object"
    );
  }

  return Object.freeze(
    Object.fromEntries(
      Object.entries(input).map(([skillId, raw]) => {
        if (raw == null) {
          return [skillId, null];
        }

        const binding =
          normalizeSkillPresentationBindingV1(raw);

        if (binding.subjectId !== skillId) {
          throw new RangeError(
            `skill presentation subject mismatch: ${skillId}`
          );
        }

        return [skillId, binding];
      })
    )
  );
}

function resolvedVisual(assetForId, slot) {
  if (!slot) {
    return null;
  }

  const asset = assetForId(slot.assetId);
  if (!asset || typeof asset !== "object") {
    throw new RangeError(
      `unknown presentation asset: ${slot.assetId}`
    );
  }

  return Object.freeze({
    ...asset,
    assetId: slot.assetId,
    displayScale: slot.displayScale ?? asset.displayScale ?? 1,
    playbackMode:
      slot.playbackMode ?? asset.playbackMode ?? "once",
    rotationDeg: slot.rotationDeg ?? 0,
    opacity: slot.opacity ?? 1,
    offsetX: slot.offsetX ?? 0,
    offsetY: slot.offsetY ?? 0
  });
}

function resolvedIcon(assetForId, slot) {
  if (!slot) {
    return null;
  }

  const asset = assetForId(slot.assetId);
  if (!asset || typeof asset !== "object") {
    throw new RangeError(
      `unknown presentation asset: ${slot.assetId}`
    );
  }

  return Object.freeze({
    ...asset,
    assetId: slot.assetId
  });
}

function resolvedAudio(audioAssetForId, slot) {
  if (!slot) {
    return null;
  }

  const asset = audioAssetForId(slot.assetId);
  if (!asset || typeof asset !== "object") {
    return null;
  }

  return Object.freeze({
    ...asset,
    assetId: slot.assetId,
    volume: slot.volume ?? asset.volume ?? 1,
    loop: slot.loop === true
  });
}

export function createCaptureSkillPresentationAssetsV1({
  skillPresentations,
  assetForId,
  audioAssetForId = () => null
}) {
  const bindings =
    normalizePresentationMap(skillPresentations);
  const resolveAsset = requiredFunction(
    assetForId,
    "assetForId"
  );
  const resolveAudio = requiredFunction(
    audioAssetForId,
    "audioAssetForId"
  );

  function presentationForSkill(skillId) {
    const binding = bindings[skillId] ?? null;
    if (!binding) {
      return null;
    }

    const visual = binding.visual;
    const audio = binding.audio;

    return Object.freeze({
      icon: resolvedIcon(resolveAsset, visual.icon),
      cast: resolvedVisual(resolveAsset, visual.cast),
      castAnchor: visual.cast?.anchor ?? null,
      castLayer: visual.cast?.layer ?? "front",
      travel: resolvedVisual(resolveAsset, visual.travel),
      travelSourceAnchor: visual.travel?.anchor ?? null,
      travelLayer: visual.travel?.layer ?? "front",
      impact: resolvedVisual(resolveAsset, visual.impact),
      castSound: resolvedAudio(resolveAudio, audio.cast),
      releaseSound: resolvedAudio(resolveAudio, audio.release),
      travelSound: resolvedAudio(resolveAudio, audio.travel),
      impactSound: resolvedAudio(resolveAudio, audio.impact)
    });
  }

  return Object.freeze({
    presentationForSkill,
    audioAsset(assetId) {
      return resolveAudio(assetId);
    }
  });
}
