export const SKILL_PRESENTATION_BINDING_VERSION = 1;

export const SKILL_PRESENTATION_VISUAL_SLOTS = Object.freeze([
  "icon",
  "cast",
  "travel",
  "impact",
  "hit",
  "miss",
  "ko",
  "vanish",
  "reappear",
  "return",
  "aura",
  "ground"
]);

export const SKILL_PRESENTATION_AUDIO_SLOTS = Object.freeze([
  "cast",
  "release",
  "travel",
  "impact",
  "vanish",
  "reappear",
  "hit",
  "miss"
]);

const VISUAL_SLOT_SET = new Set(SKILL_PRESENTATION_VISUAL_SLOTS);
const AUDIO_SLOT_SET = new Set(SKILL_PRESENTATION_AUDIO_SLOTS);
const ATTACHMENTS = new Set([
  "source",
  "target",
  "fixed-source",
  "fixed-target",
  "trajectory",
  "arena"
]);
const LAYERS = new Set(["front", "behind"]);
const TRIGGERS = new Set([
  "preparation-start",
  "release",
  "travel-start",
  "impact",
  "vanish",
  "reappear",
  "return",
  "end"
]);
const PLAYBACK_MODES = new Set(["once", "loop", "stretch"]);

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value, field) {
  return value == null ? null : requiredString(value, field);
}

function finiteNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return value;
}

function positiveNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number <= 0) {
    throw new RangeError(`${field} must be greater than zero`);
  }
  return number;
}

function unitNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number < 0 || number > 1) {
    throw new RangeError(`${field} must be between 0 and 1`);
  }
  return number;
}

function enumValue(value, field, allowed) {
  const normalized = requiredString(value, field);
  if (!allowed.has(normalized)) {
    throw new RangeError(`Unsupported ${field}: ${normalized}`);
  }
  return normalized;
}

function assertKnownFields(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(`${field} contains unknown field: ${key}`);
    }
  }
}

function stableAssetId(value, field) {
  const assetId = requiredString(value, field);
  if (
    !/^[A-Za-z0-9._-]+(?::[A-Za-z0-9._-]+)+$/.test(assetId)
  ) {
    throw new TypeError(
      `${field} assetId must be a stable logical identifier`
    );
  }
  return assetId;
}

function normalizeIconSlot(raw, field) {
  const value = objectValue(raw, field);
  assertKnownFields(value, new Set(["assetId"]), field);
  return Object.freeze({
    assetId: stableAssetId(value.assetId, `${field}.assetId`)
  });
}

function normalizeVisualSlot(raw, field) {
  const value = objectValue(raw, field);
  assertKnownFields(
    value,
    new Set([
      "assetId",
      "displayScale",
      "attachment",
      "anchor",
      "offsetX",
      "offsetY",
      "layer",
      "trigger",
      "playbackMode",
      "rotationDeg",
      "opacity"
    ]),
    field
  );

  return Object.freeze({
    assetId: stableAssetId(value.assetId, `${field}.assetId`),
    displayScale:
      value.displayScale == null
        ? 1
        : positiveNumber(
            value.displayScale,
            `${field}.displayScale`
          ),
    attachment: enumValue(
      value.attachment,
      `${field}.attachment`,
      ATTACHMENTS
    ),
    anchor: optionalString(value.anchor, `${field}.anchor`),
    offsetX:
      value.offsetX == null
        ? 0
        : finiteNumber(value.offsetX, `${field}.offsetX`),
    offsetY:
      value.offsetY == null
        ? 0
        : finiteNumber(value.offsetY, `${field}.offsetY`),
    layer:
      value.layer == null
        ? "front"
        : enumValue(value.layer, `${field}.layer`, LAYERS),
    trigger: enumValue(
      value.trigger,
      `${field}.trigger`,
      TRIGGERS
    ),
    playbackMode:
      value.playbackMode == null
        ? "once"
        : enumValue(
            value.playbackMode,
            `${field}.playbackMode`,
            PLAYBACK_MODES
          ),
    rotationDeg:
      value.rotationDeg == null
        ? 0
        : finiteNumber(
            value.rotationDeg,
            `${field}.rotationDeg`
          ),
    opacity:
      value.opacity == null
        ? 1
        : unitNumber(value.opacity, `${field}.opacity`)
  });
}

function normalizeAudioSlot(raw, field) {
  const value = objectValue(raw, field);
  assertKnownFields(
    value,
    new Set(["assetId", "volume", "loop"]),
    field
  );

  if (value.loop != null && typeof value.loop !== "boolean") {
    throw new TypeError(`${field}.loop must be a boolean`);
  }

  return Object.freeze({
    assetId: stableAssetId(value.assetId, `${field}.assetId`),
    volume:
      value.volume == null
        ? 1
        : unitNumber(value.volume, `${field}.volume`),
    loop: value.loop === true
  });
}

function normalizeSlotMap(
  raw,
  field,
  allowedSlots,
  normalizeSlot
) {
  if (raw == null) {
    return Object.freeze({});
  }

  const value = objectValue(raw, field);
  const result = {};

  for (const [slot, config] of Object.entries(value)) {
    if (!allowedSlots.has(slot)) {
      throw new TypeError(`${field} contains unknown field: ${slot}`);
    }
    result[slot] = normalizeSlot(config, `${field}.${slot}`);
  }

  return Object.freeze(result);
}

export function normalizeSkillPresentationBindingV1(input) {
  const value = objectValue(input, "SkillPresentationBindingV1");
  assertKnownFields(
    value,
    new Set([
      "id",
      "version",
      "subjectType",
      "subjectId",
      "visual",
      "audio"
    ]),
    "SkillPresentationBindingV1"
  );

  if (value.version !== SKILL_PRESENTATION_BINDING_VERSION) {
    throw new RangeError(
      `version must be ${SKILL_PRESENTATION_BINDING_VERSION}`
    );
  }

  if (value.subjectType !== "skill") {
    throw new RangeError("subjectType must be skill");
  }

  return Object.freeze({
    id: requiredString(value.id, "id"),
    version: SKILL_PRESENTATION_BINDING_VERSION,
    subjectType: "skill",
    subjectId: requiredString(value.subjectId, "subjectId"),
    visual: normalizeSlotMap(
      value.visual,
      "visual",
      VISUAL_SLOT_SET,
      (raw, field) =>
        field === "visual.icon"
          ? normalizeIconSlot(raw, field)
          : normalizeVisualSlot(raw, field)
    ),
    audio: normalizeSlotMap(
      value.audio,
      "audio",
      AUDIO_SLOT_SET,
      normalizeAudioSlot
    )
  });
}
