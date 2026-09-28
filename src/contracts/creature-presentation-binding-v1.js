export const CREATURE_PRESENTATION_BINDING_VERSION = 1;

const TOP_LEVEL_FIELDS = new Set([
  "id",
  "version",
  "subjectType",
  "subjectId",
  "profileId",
  "displayScale",
  "projectileSocketId",
  "visual",
  "sockets",
  "audio"
]);

const VISUAL_FIELDS = new Set([
  "front",
  "back",
  "icon"
]);

const VISUAL_SLOT_FIELDS = new Set([
  "assetId"
]);

const SOCKET_FIELDS = new Set([
  "id",
  "label",
  "front",
  "back"
]);

const POINT_FIELDS = new Set([
  "x",
  "y"
]);

const AUDIO_FIELDS = new Set([
  "attack",
  "hit",
  "ko"
]);

const AUDIO_SLOT_FIELDS = new Set([
  "assetId",
  "volume"
]);

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function assertKnownFields(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(`${field} contains unknown field: ${key}`);
    }
  }
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

function unitNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  if (value < 0 || value > 1) {
    throw new RangeError(`${field} must be between 0 and 1`);
  }
  return value;
}

function displayScaleNumber(value) {
  const scale = value == null ? 1 : Number(value);
  if (!Number.isFinite(scale) || scale < 0.25 || scale > 4) {
    throw new RangeError(
      "displayScale must be between 0.25 and 4"
    );
  }
  return scale;
}

function normalizeVisualSlot(raw, field, { required = false } = {}) {
  if (raw == null) {
    if (required) {
      throw new TypeError(`${field} is required`);
    }
    return null;
  }

  const value = objectValue(raw, field);
  assertKnownFields(
    value,
    VISUAL_SLOT_FIELDS,
    field
  );

  return Object.freeze({
    assetId: stableAssetId(
      value.assetId,
      `${field}.assetId`
    )
  });
}

function normalizeVisual(raw) {
  const value = objectValue(raw, "visual");
  assertKnownFields(value, VISUAL_FIELDS, "visual");

  return Object.freeze({
    front: normalizeVisualSlot(
      value.front,
      "visual.front",
      { required: true }
    ),
    back: normalizeVisualSlot(
      value.back,
      "visual.back"
    ),
    icon: normalizeVisualSlot(
      value.icon,
      "visual.icon"
    )
  });
}

function normalizePoint(raw, field) {
  const value = objectValue(raw, field);
  assertKnownFields(value, POINT_FIELDS, field);

  return Object.freeze({
    x: unitNumber(value.x, `${field}.x`),
    y: unitNumber(value.y, `${field}.y`)
  });
}

function normalizeSocket(raw, index) {
  const field = `sockets[${index}]`;
  const value = objectValue(raw, field);
  assertKnownFields(value, SOCKET_FIELDS, field);

  const id = requiredString(value.id, `${field}.id`);

  return Object.freeze({
    id,
    label:
      optionalString(value.label, `${field}.label`) ?? id,
    front: normalizePoint(
      value.front,
      `${field}.front`
    ),
    back:
      value.back == null
        ? null
        : normalizePoint(
            value.back,
            `${field}.back`
          )
  });
}

function normalizeSockets(raw) {
  const value = raw ?? [];
  if (!Array.isArray(value)) {
    throw new TypeError("sockets must be an array");
  }

  const sockets = value.map(normalizeSocket);
  const ids = sockets.map((socket) => socket.id);

  if (new Set(ids).size !== ids.length) {
    throw new RangeError(
      "socket ids must not contain duplicate values"
    );
  }

  return Object.freeze(sockets);
}

function normalizeAudioSlot(raw, field) {
  const value = objectValue(raw, field);
  assertKnownFields(
    value,
    AUDIO_SLOT_FIELDS,
    field
  );

  return Object.freeze({
    assetId: stableAssetId(
      value.assetId,
      `${field}.assetId`
    ),
    volume:
      value.volume == null
        ? 1
        : unitNumber(
            value.volume,
            `${field}.volume`
          )
  });
}

function normalizeAudio(raw) {
  if (raw == null) {
    return Object.freeze({});
  }

  const value = objectValue(raw, "audio");
  assertKnownFields(value, AUDIO_FIELDS, "audio");

  const output = {};
  for (const role of AUDIO_FIELDS) {
    if (value[role] != null) {
      output[role] = normalizeAudioSlot(
        value[role],
        `audio.${role}`
      );
    }
  }

  return Object.freeze(output);
}

export function normalizeCreaturePresentationBindingV1(input) {
  const value = objectValue(
    input,
    "CreaturePresentationBindingV1"
  );

  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CreaturePresentationBindingV1"
  );

  if (value.version !== CREATURE_PRESENTATION_BINDING_VERSION) {
    throw new RangeError(
      `version must be ${CREATURE_PRESENTATION_BINDING_VERSION}`
    );
  }

  if (value.subjectType !== "creature") {
    throw new RangeError(
      "subjectType must be creature"
    );
  }

  const sockets = normalizeSockets(value.sockets);
  const projectileSocketId = optionalString(
    value.projectileSocketId,
    "projectileSocketId"
  );

  if (
    projectileSocketId !== null &&
    !sockets.some((socket) => socket.id === projectileSocketId)
  ) {
    throw new RangeError(
      "projectileSocketId must reference an existing socket"
    );
  }

  return Object.freeze({
    id: requiredString(value.id, "id"),
    version: CREATURE_PRESENTATION_BINDING_VERSION,
    subjectType: "creature",
    subjectId: requiredString(
      value.subjectId,
      "subjectId"
    ),
    profileId: requiredString(
      value.profileId,
      "profileId"
    ),
    displayScale: displayScaleNumber(value.displayScale),
    projectileSocketId,
    visual: normalizeVisual(value.visual),
    sockets,
    audio: normalizeAudio(value.audio)
  });
}
