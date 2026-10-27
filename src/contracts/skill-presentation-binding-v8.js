import {
  normalizeSkillPresentationBindingV7
} from "./skill-presentation-binding-v7.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V8 = 8;

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

function unitNumber(value, field) {
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

function assertKnownFields(
  value,
  allowed,
  field
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field +
          " contains unknown field: " +
          key
      );
    }
  }
}

function splitProjectileTrail(raw) {
  if (raw == null) {
    return {
      base: null,
      anchorX: 0.5,
      anchorY: 0.5
    };
  }

  const value = objectValue(
    raw,
    "feedback.projectileTrail"
  );
  assertKnownFields(
    value,
    new Set([
      "color",
      "count",
      "lengthPx",
      "sizePx",
      "opacity",
      "anchorX",
      "anchorY"
    ]),
    "feedback.projectileTrail"
  );

  const {
    anchorX = 0.5,
    anchorY = 0.5,
    ...base
  } = value;

  return {
    base,
    anchorX: unitNumber(
      anchorX,
      "feedback.projectileTrail.anchorX"
    ),
    anchorY: unitNumber(
      anchorY,
      "feedback.projectileTrail.anchorY"
    )
  };
}

export function normalizeSkillPresentationBindingV8(
  input
) {
  const value = objectValue(
    input,
    "SkillPresentationBindingV8"
  );

  if (
    value.version !==
    SKILL_PRESENTATION_BINDING_VERSION_V8
  ) {
    throw new RangeError(
      "version must be " +
        SKILL_PRESENTATION_BINDING_VERSION_V8
    );
  }

  const feedback =
    value.feedback == null
      ? {}
      : objectValue(
          value.feedback,
          "SkillPresentationBindingV8.feedback"
        );

  const trail =
    splitProjectileTrail(
      feedback.projectileTrail
    );

  const base =
    normalizeSkillPresentationBindingV7({
      ...value,
      version: 7,
      feedback: {
        ...feedback,
        projectileTrail: trail.base
      }
    });

  return Object.freeze({
    ...base,
    version:
      SKILL_PRESENTATION_BINDING_VERSION_V8,
    feedback: Object.freeze({
      ...base.feedback,
      projectileTrail:
        base.feedback.projectileTrail == null
          ? null
          : Object.freeze({
              ...base.feedback.projectileTrail,
              anchorX: trail.anchorX,
              anchorY: trail.anchorY
            })
    })
  });
}
