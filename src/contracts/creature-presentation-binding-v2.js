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
    visual: base.visual,
    sockets: base.sockets,
    audio: base.audio
  });
}

export function upgradeCreaturePresentationBindingV1ToV2(
  input,
  { displayScale = 1 } = {}
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
    visual: base.visual,
    sockets: base.sockets,
    audio: base.audio
  });
}
