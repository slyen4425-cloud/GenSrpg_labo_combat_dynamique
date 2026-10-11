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

function normalizeCameraShakeSequence(raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 8) {
    throw new RangeError("feedback.cameraShake.sequence requires 1 to 8 pulses");
  }
  let totalMs = 0;
  const pulses = raw.map((pulse, index) => {
    const field = "feedback.cameraShake.sequence[" + index + "]";
    const value = objectValue(pulse, field);
    assertKnownFields(value, new Set(["pauseMs", "amplitudePx", "durationMs"]), field);
    const pauseMs = finiteNumber(value.pauseMs, field + ".pauseMs");
    const amplitudePx = positiveNumber(value.amplitudePx, field + ".amplitudePx");
    const durationMs = positiveNumber(value.durationMs, field + ".durationMs");
    if (pauseMs < 0 || pauseMs > 2500 ||
        amplitudePx > 24 || durationMs < 30 || durationMs > 2000) {
      throw new RangeError(field + " exceeds the camera shake sequence limits");
    }
    totalMs += pauseMs + durationMs;
    return Object.freeze({ pauseMs, amplitudePx, durationMs });
  });
  if (totalMs > 10000) {
    throw new RangeError("feedback.cameraShake.sequence total duration exceeds 10000 ms");
  }
  return Object.freeze(pulses);
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
      "durationMs",
      "sequence",
      "impactVisualTiming"
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
    ),
    ...(value.sequence == null
      ? {}
      : { sequence: normalizeCameraShakeSequence(value.sequence) }),
    ...(value.impactVisualTiming == null || value.impactVisualTiming === "immediate"
      ? {}
      : ["during", "after"].includes(value.impactVisualTiming)
        ? { impactVisualTiming: value.impactVisualTiming }
        : (() => { throw new RangeError("feedback.cameraShake.impactVisualTiming must be immediate, during or after"); })())
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
