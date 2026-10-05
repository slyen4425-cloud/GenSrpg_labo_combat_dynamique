import {
  normalizeSkillPresentationBindingV3
} from "./skill-presentation-binding-v3.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V4 = 4;

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

function colorValue(value, field) {
  const color = String(value ?? "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new TypeError(
      field + " must be a #RRGGBB color"
    );
  }
  return color.toLowerCase();
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

function unitNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number < 0 || number > 1) {
    throw new RangeError(
      field + " must be between 0 and 1"
    );
  }
  return number;
}

function assertKnownFields(value, allowed, field) {
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

function normalizeGlow(raw) {
  if (raw == null) {
    return null;
  }
  const value = objectValue(
    raw,
    "feedback.glow"
  );
  assertKnownFields(
    value,
    new Set([
      "color",
      "strength",
      "radiusPx"
    ]),
    "feedback.glow"
  );

  return Object.freeze({
    color: colorValue(
      value.color,
      "feedback.glow.color"
    ),
    strength: unitNumber(
      value.strength,
      "feedback.glow.strength"
    ),
    radiusPx: positiveNumber(
      value.radiusPx,
      "feedback.glow.radiusPx"
    )
  });
}

function normalizeImpactFlash(raw) {
  if (raw == null) {
    return null;
  }
  const value = objectValue(
    raw,
    "feedback.impactFlash"
  );
  assertKnownFields(
    value,
    new Set([
      "color",
      "opacity",
      "durationMs",
      "scale"
    ]),
    "feedback.impactFlash"
  );

  return Object.freeze({
    color: colorValue(
      value.color,
      "feedback.impactFlash.color"
    ),
    opacity: unitNumber(
      value.opacity,
      "feedback.impactFlash.opacity"
    ),
    durationMs: positiveNumber(
      value.durationMs,
      "feedback.impactFlash.durationMs"
    ),
    scale: positiveNumber(
      value.scale,
      "feedback.impactFlash.scale"
    )
  });
}

function normalizeCameraShake(raw) {
  if (raw == null) {
    return null;
  }
  const value = objectValue(
    raw,
    "feedback.cameraShake"
  );
  assertKnownFields(
    value,
    new Set([
      "amplitudePx",
      "durationMs"
    ]),
    "feedback.cameraShake"
  );

  return Object.freeze({
    amplitudePx: positiveNumber(
      value.amplitudePx,
      "feedback.cameraShake.amplitudePx"
    ),
    durationMs: positiveNumber(
      value.durationMs,
      "feedback.cameraShake.durationMs"
    )
  });
}

function normalizeFeedback(raw) {
  if (raw == null) {
    return Object.freeze({
      glow: null,
      impactFlash: null,
      cameraShake: null
    });
  }

  const value = objectValue(
    raw,
    "SkillPresentationBindingV4.feedback"
  );
  assertKnownFields(
    value,
    new Set([
      "glow",
      "impactFlash",
      "cameraShake"
    ]),
    "SkillPresentationBindingV4.feedback"
  );

  return Object.freeze({
    glow: normalizeGlow(value.glow),
    impactFlash:
      normalizeImpactFlash(
        value.impactFlash
      ),
    cameraShake:
      normalizeCameraShake(
        value.cameraShake
      )
  });
}

export function normalizeSkillPresentationBindingV4(
  input
) {
  const value = objectValue(
    input,
    "SkillPresentationBindingV4"
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
    "SkillPresentationBindingV4"
  );

  if (
    value.version !==
    SKILL_PRESENTATION_BINDING_VERSION_V4
  ) {
    throw new RangeError(
      "version must be " +
        SKILL_PRESENTATION_BINDING_VERSION_V4
    );
  }

  const {
    feedback,
    ...stable
  } = value;

  const base =
    normalizeSkillPresentationBindingV3({
      ...stable,
      version: 3
    });

  return Object.freeze({
    ...base,
    version:
      SKILL_PRESENTATION_BINDING_VERSION_V4,
    feedback:
      normalizeFeedback(feedback)
  });
}
