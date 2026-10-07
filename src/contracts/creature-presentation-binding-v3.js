import {
  normalizeCreaturePresentationBindingV2
} from "./creature-presentation-binding-v2.js";

export const CREATURE_PRESENTATION_BINDING_V3_VERSION = 3;

const DODGE_VISUAL_FIELDS = new Set([
  "assetId",
  "displayScale",
  "offsetX",
  "offsetY"
]);

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      field + " must be an object"
    );
  }
  return value;
}

function assertKnownFields(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field + " contains unknown field: " + key
      );
    }
  }
}

function requiredString(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }
  return value.trim();
}

function stableAssetId(value, field) {
  const assetId = requiredString(value, field);
  if (
    !/^[A-Za-z0-9._-]+(?::[A-Za-z0-9._-]+)+$/.test(
      assetId
    )
  ) {
    throw new TypeError(
      field +
        " assetId must be a stable logical identifier"
    );
  }
  return assetId;
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(
      field + " must be finite"
    );
  }
  return number;
}

function positiveNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number <= 0) {
    throw new RangeError(
      field + " must be greater than 0"
    );
  }
  return number;
}

function normalizeDodgeVisual(raw) {
  if (raw == null) {
    return null;
  }

  const value = objectValue(
    raw,
    "visual.dodge"
  );
  assertKnownFields(
    value,
    DODGE_VISUAL_FIELDS,
    "visual.dodge"
  );

  return Object.freeze({
    assetId: stableAssetId(
      value.assetId,
      "visual.dodge.assetId"
    ),
    displayScale: positiveNumber(
      value.displayScale ?? 1,
      "visual.dodge.displayScale"
    ),
    offsetX: finiteNumber(
      value.offsetX ?? 0,
      "visual.dodge.offsetX"
    ),
    offsetY: finiteNumber(
      value.offsetY ?? 0,
      "visual.dodge.offsetY"
    )
  });
}

function toV2Input(value) {
  const visual = objectValue(
    value.visual,
    "visual"
  );

  return {
    ...value,
    version: 2,
    visual: {
      front: visual.front,
      back: visual.back,
      icon: visual.icon
    }
  };
}

export function normalizeCreaturePresentationBindingV3(
  input
) {
  const value = objectValue(
    input,
    "CreaturePresentationBindingV3"
  );

  if (
    value.version !==
    CREATURE_PRESENTATION_BINDING_V3_VERSION
  ) {
    throw new RangeError(
      "version must be " +
        CREATURE_PRESENTATION_BINDING_V3_VERSION
    );
  }

  const base =
    normalizeCreaturePresentationBindingV2(
      toV2Input(value)
    );
  const dodge =
    normalizeDodgeVisual(
      value.visual?.dodge
    );

  return Object.freeze({
    ...base,
    version:
      CREATURE_PRESENTATION_BINDING_V3_VERSION,
    visual: Object.freeze({
      ...base.visual,
      ...(dodge === null
        ? {}
        : { dodge })
    })
  });
}
