import {
  normalizeSkillPresentationBindingV1
} from "./skill-presentation-binding-v1.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V2 = 2;

const LAYERS = new Set(["front", "behind"]);
const VIEWS = Object.freeze(["player", "opponent"]);

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function layerValue(value, field) {
  const layer = String(value ?? "front").trim();
  if (!LAYERS.has(layer)) {
    throw new RangeError(`Unsupported ${field}: ${layer}`);
  }
  return layer;
}

function normalizeLayerByView(raw, field) {
  if (raw == null) {
    return Object.freeze({
      player: "front",
      opponent: "front"
    });
  }

  const value = objectValue(raw, field);
  for (const key of Object.keys(value)) {
    if (!VIEWS.includes(key)) {
      throw new TypeError(
        `${field} contains unknown field: ${key}`
      );
    }
  }

  return Object.freeze({
    player: layerValue(
      value.player,
      `${field}.player`
    ),
    opponent: layerValue(
      value.opponent,
      `${field}.opponent`
    )
  });
}

function v2SlotToV1(raw, field) {
  const value = objectValue(raw, field);

  if ("layer" in value) {
    throw new TypeError(
      `${field}.layer is V1-only; use layerByView in V2`
    );
  }

  const {
    layerByView: _layerByView,
    ...rest
  } = value;

  return {
    ...rest,
    layer: "front"
  };
}

function toV1Proxy(input) {
  const value = objectValue(
    input,
    "SkillPresentationBindingV2"
  );

  if (
    value.version !==
    SKILL_PRESENTATION_BINDING_VERSION_V2
  ) {
    throw new RangeError(
      `version must be ${SKILL_PRESENTATION_BINDING_VERSION_V2}`
    );
  }

  const visual = {};
  for (
    const [slot, config] of Object.entries(
      value.visual ?? {}
    )
  ) {
    visual[slot] =
      slot === "icon"
        ? config
        : v2SlotToV1(
            config,
            `visual.${slot}`
          );
  }

  return {
    ...value,
    version: 1,
    visual
  };
}

export function normalizeSkillPresentationBindingV2(
  input
) {
  const base =
    normalizeSkillPresentationBindingV1(
      toV1Proxy(input)
    );

  const rawVisual = input.visual ?? {};
  const visual = {};

  for (
    const [slot, config] of Object.entries(
      base.visual
    )
  ) {
    if (slot === "icon") {
      visual[slot] = config;
      continue;
    }

    const {
      layer: _legacyLayer,
      ...stableConfig
    } = config;

    visual[slot] = Object.freeze({
      ...stableConfig,
      layerByView: normalizeLayerByView(
        rawVisual[slot]?.layerByView,
        `visual.${slot}.layerByView`
      )
    });
  }

  return Object.freeze({
    id: base.id,
    version:
      SKILL_PRESENTATION_BINDING_VERSION_V2,
    subjectType: base.subjectType,
    subjectId: base.subjectId,
    visual: Object.freeze(visual),
    audio: base.audio
  });
}
