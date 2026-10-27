import {
  normalizeSkillPresentationBindingV5
} from "./skill-presentation-binding-v5.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V6 = 6;

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

function positiveNumber(value, field) {
  const number = finiteNumber(
    value,
    field
  );
  if (number <= 0) {
    throw new RangeError(
      field + " must be greater than 0"
    );
  }
  return number;
}

function boundedInteger(
  value,
  field,
  maximum
) {
  const number = Number(value);
  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > maximum
  ) {
    throw new RangeError(
      field +
        " must be an integer between 1 and " +
        maximum
    );
  }
  return number;
}

function unitNumber(value, field) {
  const number = finiteNumber(
    value,
    field
  );
  if (
    number < 0 ||
    number > 1
  ) {
    throw new RangeError(
      field + " must be between 0 and 1"
    );
  }
  return number;
}

function colorValue(value, field) {
  const color = String(
    value ?? ""
  ).trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new TypeError(
      field + " must be a #RRGGBB color"
    );
  }
  return color.toLowerCase();
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

function normalizeAftermathSmoke(raw) {
  if (raw == null) {
    return null;
  }

  const value = objectValue(
    raw,
    "feedback.aftermathSmoke"
  );

  assertKnownFields(
    value,
    new Set([
      "color",
      "count",
      "spreadPx",
      "sizePx",
      "risePx",
      "durationMs",
      "opacity"
    ]),
    "feedback.aftermathSmoke"
  );

  return Object.freeze({
    color: colorValue(
      value.color,
      "feedback.aftermathSmoke.color"
    ),
    count: boundedInteger(
      value.count,
      "feedback.aftermathSmoke.count",
      8
    ),
    spreadPx: positiveNumber(
      value.spreadPx,
      "feedback.aftermathSmoke.spreadPx"
    ),
    sizePx: positiveNumber(
      value.sizePx,
      "feedback.aftermathSmoke.sizePx"
    ),
    risePx: positiveNumber(
      value.risePx,
      "feedback.aftermathSmoke.risePx"
    ),
    durationMs: positiveNumber(
      value.durationMs,
      "feedback.aftermathSmoke.durationMs"
    ),
    opacity: unitNumber(
      value.opacity,
      "feedback.aftermathSmoke.opacity"
    )
  });
}

export function normalizeSkillPresentationBindingV6(
  input
) {
  const value = objectValue(
    input,
    "SkillPresentationBindingV6"
  );

  assertKnownFields(
    value,
    new Set([
      "id",
      "version",
      "subjectType",
      "subjectId",
      "visual",
      "audio",
      "statusVisuals",
      "feedback"
    ]),
    "SkillPresentationBindingV6"
  );

  if (
    value.version !==
    SKILL_PRESENTATION_BINDING_VERSION_V6
  ) {
    throw new RangeError(
      "version must be " +
        SKILL_PRESENTATION_BINDING_VERSION_V6
    );
  }

  const feedback =
    value.feedback == null
      ? {}
      : objectValue(
          value.feedback,
          "SkillPresentationBindingV6.feedback"
        );

  assertKnownFields(
    feedback,
    new Set([
      "glow",
      "impactFlash",
      "cameraShake",
      "projectileTrail",
      "impactBurst",
      "aftermathSmoke"
    ]),
    "SkillPresentationBindingV6.feedback"
  );

  const base =
    normalizeSkillPresentationBindingV5({
      ...value,
      version: 5,
      feedback: {
        ...(feedback.glow == null
          ? {}
          : { glow: feedback.glow }),
        ...(feedback.impactFlash == null
          ? {}
          : {
              impactFlash:
                feedback.impactFlash
            }),
        ...(feedback.cameraShake == null
          ? {}
          : {
              cameraShake:
                feedback.cameraShake
            }),
        ...(feedback.projectileTrail == null
          ? {}
          : {
              projectileTrail:
                feedback.projectileTrail
            }),
        ...(feedback.impactBurst == null
          ? {}
          : {
              impactBurst:
                feedback.impactBurst
            })
      }
    });

  return Object.freeze({
    ...base,
    version:
      SKILL_PRESENTATION_BINDING_VERSION_V6,
    feedback: Object.freeze({
      ...base.feedback,
      aftermathSmoke:
        normalizeAftermathSmoke(
          feedback.aftermathSmoke
        )
    })
  });
}
