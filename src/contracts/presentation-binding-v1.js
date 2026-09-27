export const PRESENTATION_BINDING_SCHEMA =
  "presentation-binding-v1";

export const PRESENTATION_SUBJECT_TYPES = Object.freeze([
  "skill",
  "creature"
]);

export const PRESENTATION_ATTACHMENTS = Object.freeze([
  "source",
  "target",
  "fixed",
  "path",
  "arena"
]);

export const PRESENTATION_LAYERS = Object.freeze([
  "front",
  "behind"
]);

export const PRESENTATION_PLAYBACK_MODES = Object.freeze([
  "once",
  "loop",
  "stretch"
]);

const SUBJECT_TYPE_SET = new Set(PRESENTATION_SUBJECT_TYPES);
const ATTACHMENT_SET = new Set(PRESENTATION_ATTACHMENTS);
const LAYER_SET = new Set(PRESENTATION_LAYERS);
const PLAYBACK_MODE_SET = new Set(PRESENTATION_PLAYBACK_MODES);

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

function finiteNumber(value, field, fallback) {
  const candidate = value == null ? fallback : value;
  const number = Number(candidate);
  if (!Number.isFinite(number)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return number;
}

function boundedNumber(value, field, fallback, min, max) {
  const number = finiteNumber(value, field, fallback);
  if (number < min || number > max) {
    throw new RangeError(
      `${field} must be between ${min} and ${max}`
    );
  }
  return number;
}

function positiveNumber(value, field, fallback) {
  const number = finiteNumber(value, field, fallback);
  if (number <= 0) {
    throw new RangeError(`${field} must be greater than 0`);
  }
  return number;
}

function optionalEnum(value, field, allowed) {
  if (value == null) {
    return null;
  }
  const normalized = requiredString(value, field);
  if (!allowed.has(normalized)) {
    throw new RangeError(`Unsupported ${field}: ${normalized}`);
  }
  return normalized;
}

function enumWithDefault(value, field, allowed, fallback) {
  const normalized = requiredString(value ?? fallback, field);
  if (!allowed.has(normalized)) {
    throw new RangeError(`Unsupported ${field}: ${normalized}`);
  }
  return normalized;
}

function booleanWithDefault(value, field, fallback) {
  const candidate = value == null ? fallback : value;
  if (typeof candidate !== "boolean") {
    throw new TypeError(`${field} must be a boolean`);
  }
  return candidate;
}

function assertOnlyKeys(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        `${field} contains unsupported field: ${key}`
      );
    }
  }
}

function logicalAssetId(value, field) {
  const id = requiredString(value, field);
  if (
    id.includes("://") ||
    id.includes("/") ||
    id.includes("\\") ||
    id.startsWith(".")
  ) {
    throw new TypeError(
      `${field} must be a logical assetId, not a physical path or URL`
    );
  }
  return id;
}

function normalizeLayerByView(value, field) {
  if (value == null) {
    return Object.freeze({});
  }

  const raw = objectValue(value, field);
  const output = {};

  for (const [viewRaw, layerRaw] of Object.entries(raw)) {
    const view = requiredString(viewRaw, `${field} view`);
    const layer = requiredString(layerRaw, `${field}.${view}`);
    if (!LAYER_SET.has(layer)) {
      throw new RangeError(
        `Unsupported ${field} layer for ${view}: ${layer}`
      );
    }
    output[view] = layer;
  }

  return Object.freeze(output);
}

const VISUAL_SLOT_KEYS = new Set([
  "assetId",
  "displayScale",
  "attachment",
  "anchor",
  "offsetX",
  "offsetY",
  "layer",
  "layerByView",
  "trigger",
  "playbackMode",
  "rotationDeg",
  "opacity"
]);

const AUDIO_SLOT_KEYS = new Set([
  "assetId",
  "volume",
  "loop",
  "trigger"
]);

function normalizeVisualSlot(raw, field) {
  objectValue(raw, field);
  assertOnlyKeys(raw, VISUAL_SLOT_KEYS, field);

  return Object.freeze({
    assetId: logicalAssetId(raw.assetId, `${field}.assetId`),
    displayScale: positiveNumber(
      raw.displayScale,
      `${field}.displayScale`,
      1
    ),
    attachment: optionalEnum(
      raw.attachment,
      `${field}.attachment`,
      ATTACHMENT_SET
    ),
    anchor: optionalString(raw.anchor, `${field}.anchor`),
    offsetX: finiteNumber(raw.offsetX, `${field}.offsetX`, 0),
    offsetY: finiteNumber(raw.offsetY, `${field}.offsetY`, 0),
    layer: optionalEnum(
      raw.layer,
      `${field}.layer`,
      LAYER_SET
    ),
    layerByView: normalizeLayerByView(
      raw.layerByView,
      `${field}.layerByView`
    ),
    trigger: optionalString(raw.trigger, `${field}.trigger`),
    playbackMode: enumWithDefault(
      raw.playbackMode,
      `${field}.playbackMode`,
      PLAYBACK_MODE_SET,
      "once"
    ),
    rotationDeg: finiteNumber(
      raw.rotationDeg,
      `${field}.rotationDeg`,
      0
    ),
    opacity: boundedNumber(
      raw.opacity,
      `${field}.opacity`,
      1,
      0,
      1
    )
  });
}

function normalizeAudioSlot(raw, field) {
  objectValue(raw, field);
  assertOnlyKeys(raw, AUDIO_SLOT_KEYS, field);

  return Object.freeze({
    assetId: logicalAssetId(raw.assetId, `${field}.assetId`),
    volume: boundedNumber(
      raw.volume,
      `${field}.volume`,
      1,
      0,
      1
    ),
    loop: booleanWithDefault(raw.loop, `${field}.loop`, false),
    trigger: optionalString(raw.trigger, `${field}.trigger`)
  });
}

function normalizeSlotMap(raw, field, normalizeSlot) {
  if (raw == null) {
    return Object.freeze({});
  }

  objectValue(raw, field);
  const output = {};

  for (const [slotRaw, config] of Object.entries(raw)) {
    const slot = requiredString(slotRaw, `${field} slot`);
    output[slot] = normalizeSlot(config, `${field}.${slot}`);
  }

  return Object.freeze(output);
}

export function normalizePresentationBindingV1(input) {
  objectValue(input, "PresentationBindingV1");
  assertOnlyKeys(
    input,
    new Set(["schema", "subjectType", "subjectId", "visual", "audio"]),
    "PresentationBindingV1"
  );

  if (input.schema !== PRESENTATION_BINDING_SCHEMA) {
    throw new RangeError(
      `schema must be ${PRESENTATION_BINDING_SCHEMA}`
    );
  }

  const subjectType = requiredString(
    input.subjectType,
    "subjectType"
  );
  if (!SUBJECT_TYPE_SET.has(subjectType)) {
    throw new RangeError(
      `Unsupported subjectType: ${subjectType}`
    );
  }

  const visual = normalizeSlotMap(
    input.visual,
    "visual",
    normalizeVisualSlot
  );
  const audio = normalizeSlotMap(
    input.audio,
    "audio",
    normalizeAudioSlot
  );

  if (
    Object.keys(visual).length === 0 &&
    Object.keys(audio).length === 0
  ) {
    throw new TypeError(
      "PresentationBindingV1 must contain at least one presentation slot"
    );
  }

  return Object.freeze({
    schema: PRESENTATION_BINDING_SCHEMA,
    subjectType,
    subjectId: requiredString(input.subjectId, "subjectId"),
    visual,
    audio
  });
}
