import {
  normalizeSkillPresentationBindingV2
} from "./skill-presentation-binding-v2.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V3 = 3;

const STATUS_VISUAL_MODES = new Set([
  "none",
  "tint",
  "sprite",
  "both"
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

function unitNumber(value, field, fallback) {
  if (value == null) {
    return fallback;
  }
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number < 0 ||
    number > 1
  ) {
    throw new RangeError(
      field + " must be between 0 and 1"
    );
  }
  return number;
}

function positiveNumber(value, field, fallback) {
  if (value == null) {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(
      field + " must be greater than 0"
    );
  }
  return number;
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

function colorValue(value, field) {
  const color = String(
    value ?? "#ffffff"
  ).trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new TypeError(
      field + " must be a #RRGGBB color"
    );
  }
  return color.toLowerCase();
}

function normalizeSprite(raw, field) {
  if (raw == null) {
    return null;
  }

  const value = objectValue(raw, field);
  for (const key of Object.keys(value)) {
    if (
      ![
        "assetId",
        "displayScale",
        "opacity",
        "playbackMode",
        "offsetX",
        "offsetY",
        "layerByView"
      ].includes(key)
    ) {
      throw new TypeError(
        field + " contains unknown field: " + key
      );
    }
  }

  const controls = {};
  if (value.playbackMode != null) {
    if (!["once", "loop", "stretch", "hold-last"].includes(value.playbackMode)) {
      throw new RangeError(field + ".playbackMode must be once, loop, stretch or hold-last");
    }
    controls.playbackMode = value.playbackMode;
  }
  for (const key of ["offsetX", "offsetY"]) {
    if (value[key] != null) {
      const number = Number(value[key]);
      if (!Number.isFinite(number)) throw new RangeError(field + "." + key + " must be finite");
      controls[key] = number;
    }
  }
  if (value.layerByView != null) {
    const layers = objectValue(value.layerByView, field + ".layerByView");
    for (const key of Object.keys(layers)) {
      if (!["player", "opponent"].includes(key)) throw new TypeError(field + ".layerByView contains unknown field: " + key);
    }
    const byView = { player: layers.player ?? "front", opponent: layers.opponent ?? "front" };
    for (const layer of Object.values(byView)) {
      if (!["front", "behind"].includes(layer)) throw new RangeError(field + ".layerByView must be front or behind");
    }
    controls.layerByView = Object.freeze(byView);
  }

  return Object.freeze({
    ...controls,
    assetId: stableAssetId(
      value.assetId,
      field + ".assetId"
    ),
    displayScale: positiveNumber(
      value.displayScale,
      field + ".displayScale",
      1
    ),
    opacity: unitNumber(
      value.opacity,
      field + ".opacity",
      1
    )
  });
}

function normalizeStatusVisual(
  raw,
  field
) {
  const value = objectValue(raw, field);
  for (const key of Object.keys(value)) {
    if (
      ![
        "mode",
        "tintColor",
        "tintOpacity",
        "sprite"
      ].includes(key)
    ) {
      throw new TypeError(
        field + " contains unknown field: " + key
      );
    }
  }

  const mode = requiredString(
    value.mode ?? "none",
    field + ".mode"
  );
  if (!STATUS_VISUAL_MODES.has(mode)) {
    throw new RangeError(
      "Unsupported " + field + ".mode: " + mode
    );
  }

  const sprite = normalizeSprite(
    value.sprite,
    field + ".sprite"
  );

  if (
    ["sprite", "both"].includes(mode) &&
    sprite === null
  ) {
    throw new TypeError(
      field + ".sprite is required for mode " + mode
    );
  }

  return Object.freeze({
    mode,
    tintColor: colorValue(
      value.tintColor,
      field + ".tintColor"
    ),
    tintOpacity: unitNumber(
      value.tintOpacity,
      field + ".tintOpacity",
      0.35
    ),
    sprite
  });
}

function normalizeStatusVisualMap(raw) {
  if (raw == null) {
    return Object.freeze({});
  }

  const value = objectValue(
    raw,
    "SkillPresentationBindingV3.statusVisuals"
  );
  const result = {};

  for (
    const [statusId, presentation] of
    Object.entries(value)
  ) {
    const id = requiredString(
      statusId,
      "statusVisuals key"
    );
    result[id] = normalizeStatusVisual(
      presentation,
      "statusVisuals." + id
    );
  }

  return Object.freeze(result);
}

export function normalizeSkillPresentationBindingV3(
  input
) {
  const value = objectValue(
    input,
    "SkillPresentationBindingV3"
  );

  for (const key of Object.keys(value)) {
    if (
      ![
        "id",
        "version",
        "subjectType",
        "subjectId",
        "visual",
        "audio",
        "statusVisuals"
      ].includes(key)
    ) {
      throw new TypeError(
        "SkillPresentationBindingV3 contains unknown field: " +
          key
      );
    }
  }

  if (
    value.version !==
    SKILL_PRESENTATION_BINDING_VERSION_V3
  ) {
    throw new RangeError(
      "version must be " +
        SKILL_PRESENTATION_BINDING_VERSION_V3
    );
  }

  const {
    statusVisuals,
    ...stable
  } = value;

  const base =
    normalizeSkillPresentationBindingV2({
      ...stable,
      version: 2
    });

  return Object.freeze({
    ...base,
    version:
      SKILL_PRESENTATION_BINDING_VERSION_V3,
    statusVisuals:
      normalizeStatusVisualMap(
        statusVisuals
      )
  });
}
