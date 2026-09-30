function finitePositive(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${field} must be a finite number greater than 0`);
  }
  return number;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function planCreatureMotionCueFx({
  cue,
  profile,
  actorScale = 1
}) {
  if (cue !== "footfall") {
    return Object.freeze([]);
  }
  if (!profile || typeof profile !== "object") {
    throw new TypeError("profile is required");
  }

  const config =
    profile.motionFx?.footfall?.cameraShake ?? null;
  if (!config) {
    return Object.freeze([]);
  }

  const baseAmplitude = finitePositive(
    config.amplitudePx,
    "motionFx.footfall.cameraShake.amplitudePx"
  );
  const durationMs = finitePositive(
    config.durationMs,
    "motionFx.footfall.cameraShake.durationMs"
  );
  const scaleInfluence = Number(
    config.scaleInfluence ?? 0
  );
  const scale = finitePositive(
    actorScale,
    "actorScale"
  );

  if (
    !Number.isFinite(scaleInfluence) ||
    scaleInfluence < 0
  ) {
    throw new RangeError(
      "motionFx.footfall.cameraShake.scaleInfluence must be finite and >= 0"
    );
  }

  const amplitudePx =
    baseAmplitude *
    clamp(
      1 + (scale - 1) * scaleInfluence,
      0.75,
      2.5
    );

  return Object.freeze([
    Object.freeze({
      type: "camera-shake",
      amplitudePx,
      durationMs
    })
  ]);
}
