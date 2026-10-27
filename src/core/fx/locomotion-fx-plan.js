function positiveFinite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${field} must be greater than 0`);
  }
  return number;
}

export function planLocomotionCueFx({
  profile,
  cue
}) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new TypeError("profile must be an object");
  }
  if (!cue || typeof cue !== "object" || Array.isArray(cue)) {
    throw new TypeError("cue must be an object");
  }
  if (cue.type !== "footfall") {
    return Object.freeze([]);
  }

  const cfg =
    profile.locomotion?.footfallFx?.cameraShake ?? null;
  if (!cfg) {
    return Object.freeze([]);
  }

  const intensity = positiveFinite(
    cue.intensity ?? 1,
    "cue.intensity"
  );
  const durationMs = positiveFinite(
    cfg.durationMs,
    "cameraShake.durationMs"
  );
  const amplitudePx = positiveFinite(
    cfg.amplitudePx,
    "cameraShake.amplitudePx"
  ) * intensity;

  return Object.freeze([
    Object.freeze({
      type: "camera-shake",
      durationMs,
      amplitudePx
    })
  ]);
}
