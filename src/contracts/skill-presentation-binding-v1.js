export const SKILL_PRESENTATION_BINDING_VERSION = 1;

export const PRESENTATION_ATTACHMENTS = Object.freeze([
  "source",
  "target",
  "source-fixed",
  "target-fixed",
  "travel",
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

export const PRESENTATION_TRIGGERS = Object.freeze([
  "preparation-start",
  "release",
  "travel-start",
  "impact",
  "vanish",
  "reappear",
  "return",
  "end"
]);

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

const GAMEPLAY_FIELDS = new Set([
  "damage",
  "heal",
  "energyCost",
  "cooldownMs",
  "allowedDistances",
  "category",
  "form",
  "element",
  "reaction",
  "effect",
  "projectileClash"
]);

const ATTACHMENT_SET = new Set(PRESENTATION_ATTACHMENTS);
const LAYER_SET = new Set(PRESENTATION_LAYERS);
const PLAYBACK_SET = new Set(PRESENTATION_PLAYBACK_MODES);
const TRIGGER_SET = new Set(PRESENTATION_TRIGGERS);

function objectOrEmpty(value, field) {
  if (value == null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
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
  if (value == null) {
    return null;
  }
  return requiredString(value, field);
}

function finite(value, field, fallback) {
  const raw = value == null ? fallback : value;
  const number = Number(raw);
  if (!Number.isFinite(number)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return number;
}

function bounded(value, field, min, max, fallback) {
  const number = finite(value, field, fallback);
  if (number < min || number > max) {
    throw new RangeError(
      `${field} must be between ${min} and ${max}`
    );
  }
  return number;
}

function enumOrNull(value, field, allowed) {
  if (value == null) {
    return null;
  }
  const normalized = requiredString(value, field);
  if (!allowed.has(normalized)) {
    throw new RangeError(`Unsupported ${field}: ${normalized}`);
  }
  return normalized;
}

function assertAssetId(value, field) {
  const assetId = requiredString(value, field);
  const pattern =
    /^[a-z0-9][a-z0-9._-]*(?::[a-z0-9][a-z0-9._-]*)+$/i;

  if (!pattern.test(assetId)) {
    throw new TypeError(
      `${field} assetId must be a stable namespaced id`
    );
  }
  return assetId;
}

function assertAllowedKeys(input, allowed, field) {
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      if (GAMEPLAY_FIELDS.has(key)) {
        throw new TypeError(
          `${field} contains gameplay field: ${key}`
        );
      }
      throw new TypeError(
        `${field} contains unsupported field: ${key}`
      );
    }
  }
}

function normalizeVisualSlot(value, field) {
  if (value == null) {
    return null;
  }
  const input = objectOrEmpty(value, field);
  assertAllowedKeys(
    input,
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
    assetId: assertAssetId(input.assetId, `${field}.assetId`),
    displayScale: bounded(
      input.displayScale,
      `${field}.displayScale`,
      0.25,
      4,
      1
    ),
    attachment: enumOrNull(
      input.attachment,
      `${field}.attachment`,
      ATTACHMENT_SET
    ),
    anchor: optionalString(input.anchor, `${field}.anchor`),
    offsetX: finite(input.offsetX, `${field}.offsetX`, 0),
    offsetY: finite(input.offsetY, `${field}.offsetY`, 0),
    layer:
      enumOrNull(
        input.layer ?? "front",
        `${field}.layer`,
        LAYER_SET
      ),
    trigger: enumOrNull(
      input.trigger,
      `${field}.trigger`,
      TRIGGER_SET
    ),
    playbackMode:
      enumOrNull(
        input.playbackMode ?? "once",
        `${field}.playbackMode`,
        PLAYBACK_SET
      ),
    rotationDeg: finite(
      input.rotationDeg,
      `${field}.rotationDeg`,
      0
    ),
    opacity: bounded(
      input.opacity,
      `${field}.opacity`,
      0,
      1,
      1
    )
  });
}

function normalizeAudioSlot(value, field) {
  if (value == null) {
    return null;
  }
  const input = objectOrEmpty(value, field);
  assertAllowedKeys(
    input,
    new Set(["assetId", "volume", "loop", "trigger"]),
    field
  );

  if (input.loop != null && typeof input.loop !== "boolean") {
    throw new TypeError(`${field}.loop must be a boolean`);
  }

  return Object.freeze({
    assetId: assertAssetId(input.assetId, `${field}.assetId`),
    volume: bounded(
      input.volume,
      `${field}.volume`,
      0,
      1,
      1
    ),
    loop: input.loop === true,
    trigger: enumOrNull(
      input.trigger,
      `${field}.trigger`,
      TRIGGER_SET
    )
  });
}

function normalizePhaseMap(value, field, normalizeSlot) {
  const input = objectOrEmpty(value, field);
  const result = {};

  for (const [rawLabel, slot] of Object.entries(input)) {
    const label = requiredString(rawLabel, `${field} label`);
    result[label] = normalizeSlot(slot, `${field}.${label}`);
  }

  return Object.freeze(result);
}

function normalizeVisual(value) {
  const input = objectOrEmpty(value, "visual");
  assertAllowedKeys(
    input,
    new Set([...VISUAL_SLOTS, "phases"]),
    "visual"
  );

  const result = {};
  for (const slot of VISUAL_SLOTS) {
    result[slot] = normalizeVisualSlot(
      input[slot],
      `visual.${slot}`
    );
  }
  result.phases = normalizePhaseMap(
    input.phases,
    "visual.phases",
    normalizeVisualSlot
  );

  return Object.freeze(result);
}

function normalizeAudio(value) {
  const input = objectOrEmpty(value, "audio");
  assertAllowedKeys(
    input,
    new Set([...AUDIO_SLOTS, "phases"]),
    "audio"
  );

  const result = {};
  for (const slot of AUDIO_SLOTS) {
    result[slot] = normalizeAudioSlot(
      input[slot],
      `audio.${slot}`
    );
  }
  result.phases = normalizePhaseMap(
    input.phases,
    "audio.phases",
    normalizeAudioSlot
  );

  return Object.freeze(result);
}

export function normalizeSkillPresentationBindingV1(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(
      "SkillPresentationBindingV1 must be an object"
    );
  }

  for (const key of Object.keys(input)) {
    if (GAMEPLAY_FIELDS.has(key)) {
      throw new TypeError(
        `SkillPresentationBindingV1 contains gameplay field: ${key}`
      );
    }
  }

  assertAllowedKeys(
    input,
    new Set(["version", "skillId", "visual", "audio"]),
    "SkillPresentationBindingV1"
  );

  const version = Number(input.version);
  if (version !== SKILL_PRESENTATION_BINDING_VERSION) {
    throw new RangeError(
      `Unsupported SkillPresentationBinding version: ${String(input.version)}`
    );
  }

  return Object.freeze({
    version: SKILL_PRESENTATION_BINDING_VERSION,
    skillId: requiredString(input.skillId, "skillId"),
    visual: normalizeVisual(input.visual),
    audio: normalizeAudio(input.audio)
  });
}
