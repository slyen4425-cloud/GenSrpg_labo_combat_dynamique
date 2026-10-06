import {
  normalizeSkillPresentationBindingV8
} from "./skill-presentation-binding-v8.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V9 = 9;

const OFFSET_MODES = new Set([
  "same",
  "mirror_x",
  "custom"
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

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(
      field + " must be finite"
    );
  }
  return number;
}

function normalizeOffsetMeta(raw, field) {
  const value = objectValue(raw, field);
  const mode =
    value.offsetMode == null
      ? "same"
      : String(value.offsetMode).trim();

  if (!OFFSET_MODES.has(mode)) {
    throw new RangeError(
      "Unsupported " +
        field +
        ".offsetMode: " +
        mode
    );
  }

  if (mode === "custom") {
    if (value.opponentOffsetX == null) {
      throw new TypeError(
        field +
          ".opponentOffsetX is required for custom offsetMode"
      );
    }
    if (value.opponentOffsetY == null) {
      throw new TypeError(
        field +
          ".opponentOffsetY is required for custom offsetMode"
      );
    }
    return Object.freeze({
      offsetMode: mode,
      opponentOffsetX: finiteNumber(
        value.opponentOffsetX,
        field + ".opponentOffsetX"
      ),
      opponentOffsetY: finiteNumber(
        value.opponentOffsetY,
        field + ".opponentOffsetY"
      )
    });
  }

  if (
    value.opponentOffsetX != null ||
    value.opponentOffsetY != null
  ) {
    throw new TypeError(
      field +
        " opponent offsets require offsetMode custom"
    );
  }

  return Object.freeze({
    offsetMode: mode
  });
}

function stripOffsetMeta(raw, field) {
  const value = objectValue(raw, field);
  const {
    offsetMode: _offsetMode,
    opponentOffsetX: _opponentOffsetX,
    opponentOffsetY: _opponentOffsetY,
    ...base
  } = value;
  return base;
}

function statusVisualsProxy(raw) {
  if (raw == null) {
    return raw;
  }
  const value = objectValue(
    raw,
    "statusVisuals"
  );
  return Object.fromEntries(
    Object.entries(value).map(
      ([statusId, presentation]) => {
        if (
          presentation?.sprite == null
        ) {
          return [statusId, presentation];
        }
        return [
          statusId,
          {
            ...presentation,
            sprite: stripOffsetMeta(
              presentation.sprite,
              "statusVisuals." +
                statusId +
                ".sprite"
            )
          }
        ];
      }
    )
  );
}

function toV8Proxy(input) {
  const value = objectValue(
    input,
    "SkillPresentationBindingV9"
  );

  if (
    value.version !==
    SKILL_PRESENTATION_BINDING_VERSION_V9
  ) {
    throw new RangeError(
      "version must be " +
        SKILL_PRESENTATION_BINDING_VERSION_V9
    );
  }

  const visual = {};
  for (
    const [slot, config] of
    Object.entries(value.visual ?? {})
  ) {
    visual[slot] =
      slot === "icon"
        ? config
        : stripOffsetMeta(
            config,
            "visual." + slot
          );
  }

  return {
    ...value,
    version: 8,
    visual,
    statusVisuals:
      statusVisualsProxy(
        value.statusVisuals
      )
  };
}

export function normalizeSkillPresentationBindingV9(
  input
) {
  const base =
    normalizeSkillPresentationBindingV8(
      toV8Proxy(input)
    );

  const rawVisual =
    input.visual ?? {};
  const visual = {};

  for (
    const [slot, config] of
    Object.entries(base.visual)
  ) {
    if (slot === "icon") {
      visual[slot] = config;
      continue;
    }

    visual[slot] = Object.freeze({
      ...config,
      ...normalizeOffsetMeta(
        rawVisual[slot],
        "visual." + slot
      )
    });
  }

  const statusVisuals = {};
  for (
    const [statusId, presentation] of
    Object.entries(
      base.statusVisuals ?? {}
    )
  ) {
    const rawSprite =
      input.statusVisuals?.[
        statusId
      ]?.sprite ?? null;

    statusVisuals[statusId] =
      presentation.sprite == null
        ? presentation
        : Object.freeze({
            ...presentation,
            sprite: Object.freeze({
              ...presentation.sprite,
              ...normalizeOffsetMeta(
                rawSprite,
                "statusVisuals." +
                  statusId +
                  ".sprite"
              )
            })
          });
  }

  return Object.freeze({
    ...base,
    version:
      SKILL_PRESENTATION_BINDING_VERSION_V9,
    visual:
      Object.freeze(visual),
    statusVisuals:
      Object.freeze(statusVisuals)
  });
}
