import {
  normalizeSkillPresentationBindingV4
} from "./skill-presentation-binding-v4.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V5 = 5;

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

function normalizeProjectileTrail(raw) {
  if (raw == null) {
    return null;
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
      "opacity"
    ]),
    "feedback.projectileTrail"
  );

  return Object.freeze({
    color: colorValue(
      value.color,
      "feedback.projectileTrail.color"
    ),
    count: boundedInteger(
      value.count,
      "feedback.projectileTrail.count",
      10
    ),
    lengthPx: positiveNumber(
      value.lengthPx,
      "feedback.projectileTrail.lengthPx"
    ),
    sizePx: positiveNumber(
      value.sizePx,
      "feedback.projectileTrail.sizePx"
    ),
    opacity: unitNumber(
      value.opacity,
      "feedback.projectileTrail.opacity"
    )
  });
}

function normalizeImpactBurst(raw) {
  if (raw == null) {
    return null;
  }
  const value = objectValue(
    raw,
    "feedback.impactBurst"
  );
  assertKnownFields(
    value,
    new Set([
      "color",
      "count",
      "spreadPx",
      "sizePx",
      "durationMs",
      "opacity"
    ]),
    "feedback.impactBurst"
  );

  return Object.freeze({
    color: colorValue(
      value.color,
      "feedback.impactBurst.color"
    ),
    count: boundedInteger(
      value.count,
      "feedback.impactBurst.count",
      18
    ),
    spreadPx: positiveNumber(
      value.spreadPx,
      "feedback.impactBurst.spreadPx"
    ),
    sizePx: positiveNumber(
      value.sizePx,
      "feedback.impactBurst.sizePx"
    ),
    durationMs: positiveNumber(
      value.durationMs,
      "feedback.impactBurst.durationMs"
    ),
    opacity: unitNumber(
      value.opacity,
      "feedback.impactBurst.opacity"
    )
  });
}

export function normalizeSkillPresentationBindingV5(
  input
) {
  const value = objectValue(
    input,
    "SkillPresentationBindingV5"
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
    "SkillPresentationBindingV5"
  );

  if (
    value.version !==
    SKILL_PRESENTATION_BINDING_VERSION_V5
  ) {
    throw new RangeError(
      "version must be " +
        SKILL_PRESENTATION_BINDING_VERSION_V5
    );
  }

  const feedback =
    value.feedback == null
      ? {}
      : objectValue(
          value.feedback,
          "SkillPresentationBindingV5.feedback"
        );

  assertKnownFields(
    feedback,
    new Set([
      "glow",
      "impactFlash",
      "cameraShake",
      "projectileTrail",
      "impactBurst"
    ]),
    "SkillPresentationBindingV5.feedback"
  );

  const base =
    normalizeSkillPresentationBindingV4({
      ...value,
      version: 4,
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
            })
      }
    });

  return Object.freeze({
    ...base,
    version:
      SKILL_PRESENTATION_BINDING_VERSION_V5,
    feedback: Object.freeze({
      ...base.feedback,
      projectileTrail:
        normalizeProjectileTrail(
          feedback.projectileTrail
        ),
      impactBurst:
        normalizeImpactBurst(
          feedback.impactBurst
        )
    })
  });
}
