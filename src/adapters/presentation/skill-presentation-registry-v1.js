import {
  normalizeSkillPresentationBindingV1
} from "../../contracts/skill-presentation-binding-v1.js";

const VISUAL_SLOTS = Object.freeze([
  "icon",
  "cast",
  "travel",
  "impact",
  "hit",
  "miss",
  "ko"
]);

const AUDIO_SLOTS = Object.freeze([
  "cast",
  "release",
  "travel",
  "impact",
  "hit",
  "miss"
]);

function resolveSlot(slot, resolveAsset) {
  if (slot == null) {
    return null;
  }

  const asset = resolveAsset(slot.assetId) ?? null;
  return Object.freeze({
    ...slot,
    asset
  });
}

function resolvePhaseMap(phases, resolveAsset) {
  const result = {};
  for (const [label, slot] of Object.entries(phases)) {
    result[label] = resolveSlot(slot, resolveAsset);
  }
  return Object.freeze(result);
}

function resolveVisual(binding, resolveAsset) {
  const result = {};
  for (const slot of VISUAL_SLOTS) {
    result[slot] = resolveSlot(
      binding.visual[slot],
      resolveAsset
    );
  }
  result.phases = resolvePhaseMap(
    binding.visual.phases,
    resolveAsset
  );
  return Object.freeze(result);
}

function resolveAudio(binding, resolveAsset) {
  const result = {};
  for (const slot of AUDIO_SLOTS) {
    result[slot] = resolveSlot(
      binding.audio[slot],
      resolveAsset
    );
  }
  result.phases = resolvePhaseMap(
    binding.audio.phases,
    resolveAsset
  );
  return Object.freeze(result);
}

export function createSkillPresentationRegistryV1({
  bindings = [],
  resolveAsset
} = {}) {
  if (!Array.isArray(bindings)) {
    throw new TypeError("bindings must be an array");
  }
  if (typeof resolveAsset !== "function") {
    throw new TypeError("resolveAsset must be a function");
  }

  const bySkillId = new Map();

  for (const rawBinding of bindings) {
    const binding =
      normalizeSkillPresentationBindingV1(rawBinding);

    if (bySkillId.has(binding.skillId)) {
      throw new RangeError(
        `duplicate skill presentation binding: ${binding.skillId}`
      );
    }
    bySkillId.set(binding.skillId, binding);
  }

  function bindingForSkill(skillId) {
    return bySkillId.get(String(skillId ?? "").trim()) ?? null;
  }

  function resolvedForSkill(skillId) {
    const binding = bindingForSkill(skillId);
    if (!binding) {
      return null;
    }

    return Object.freeze({
      skillId: binding.skillId,
      visual: resolveVisual(binding, resolveAsset),
      audio: resolveAudio(binding, resolveAsset)
    });
  }

  return Object.freeze({
    bindingForSkill,
    resolvedForSkill
  });
}
