import {
  normalizeCreaturePresentationBindingV1
} from "./creature-presentation-binding-v1.js";

export const CREATURE_PRESENTATION_BINDING_V2_VERSION = 2;

const TOP_LEVEL_FIELDS = new Set([
  "id",
  "version",
  "subjectType",
  "subjectId",
  "profileId",
  "displayScale",
  "position",
  "transformOrigin",
  "visual",
  "sockets",
  "audio"
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
      throw new TypeError(
        `${field} contains unknown field: ${key}`
      );
    }
  }
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(
      `${field} must be a finite number`
    );
  }
  return number;
}

function normalizePosition(value) {
  if (value == null) {
    return Object.freeze({
      x: 0,
      y: 0
    });
  }

  const position = objectValue(
    value,
    "position"
  );
  assertKnownFields(
    position,
    new Set(["x", "y"]),
    "position"
  );

  return Object.freeze({
    x: finiteNumber(
      position.x ?? 0,
      "position.x"
    ),
    y: finiteNumber(
      position.y ?? 0,
      "position.y"
    )
  });
}

function normalizeTransformOrigin(value) {
  if (value == null) {
    return Object.freeze({
      x: "50%",
      y: "50%"
    });
  }

  const origin = objectValue(
    value,
    "transformOrigin"
  );
  assertKnownFields(
    origin,
    new Set(["x", "y"]),
    "transformOrigin"
  );

  const text = (entry, field) => {
    if (
      typeof entry !== "string" ||
      entry.trim() === ""
    ) {
      throw new TypeError(
        field + " must be a non-empty string"
      );
    }
    return entry.trim();
  };

  return Object.freeze({
    x: text(
      origin.x ?? "50%",
      "transformOrigin.x"
    ),
    y: text(
      origin.y ?? "50%",
      "transformOrigin.y"
    )
  });
}

function positiveFiniteNumber(value, field) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new RangeError(
      `${field} must be a finite number greater than 0`
    );
  }
  return value;
}

function toV1Input(value) {
  return {
    id: value.id,
    version: 1,
    subjectType: value.subjectType,
    subjectId: value.subjectId,
    profileId: value.profileId,
    visual: value.visual,
    sockets: value.sockets,
    audio: value.audio
  };
}

export function normalizeCreaturePresentationBindingV2(input) {
  const value = objectValue(
    input,
    "CreaturePresentationBindingV2"
  );

  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CreaturePresentationBindingV2"
  );

  if (
    value.version !==
    CREATURE_PRESENTATION_BINDING_V2_VERSION
  ) {
    throw new RangeError(
      `version must be ${CREATURE_PRESENTATION_BINDING_V2_VERSION}`
    );
  }

  const base =
    normalizeCreaturePresentationBindingV1(
      toV1Input(value)
    );

  return Object.freeze({
    id: base.id,
    version:
      CREATURE_PRESENTATION_BINDING_V2_VERSION,
    subjectType: base.subjectType,
    subjectId: base.subjectId,
    profileId: base.profileId,
    displayScale: positiveFiniteNumber(
      value.displayScale,
      "displayScale"
    ),
    position: normalizePosition(
      value.position
    ),
    transformOrigin:
      normalizeTransformOrigin(
        value.transformOrigin
      ),
    visual: base.visual,
    sockets: base.sockets,
    audio: base.audio
  });
}

export function upgradeCreaturePresentationBindingV1ToV2(
  input,
  {
    displayScale = 1,
    position = { x: 0, y: 0 },
    transformOrigin = {
      x: "50%",
      y: "50%"
    }
  } = {}
) {
  const base =
    normalizeCreaturePresentationBindingV1(
      input
    );

  return normalizeCreaturePresentationBindingV2({
    id: base.id,
    version:
      CREATURE_PRESENTATION_BINDING_V2_VERSION,
    subjectType: base.subjectType,
    subjectId: base.subjectId,
    profileId: base.profileId,
    displayScale,
    position,
    transformOrigin,
    visual: base.visual,
    sockets: base.sockets,
    audio: base.audio
  });
}
