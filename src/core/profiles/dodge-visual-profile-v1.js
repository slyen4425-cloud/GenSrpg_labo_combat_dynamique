export const DODGE_VISUAL_PROFILE_V1 = Object.freeze({
  transitionRatio: 0.16,
  maxTransitionMs: 80,
  vanishScaleX: 0.94,
  vanishScaleY: 1.04,
  vanishBrightness: 1.25
});

export function dodgeVisualDurationsV1(
  durationMs,
  profile = DODGE_VISUAL_PROFILE_V1
) {
  const total = Number(durationMs);
  if (!Number.isFinite(total) || total <= 0) {
    throw new RangeError(
      "dodge durationMs must be a finite number greater than 0"
    );
  }

  if (total < 3) {
    return Object.freeze({
      vanishMs: total,
      hiddenMs: 0,
      returnMs: 0
    });
  }

  const transitionMs = Math.min(
    Number(profile.maxTransitionMs),
    Math.max(
      1,
      Math.round(
        total *
          Number(profile.transitionRatio)
      )
    ),
    Math.floor((total - 1) / 2)
  );

  return Object.freeze({
    vanishMs: transitionMs,
    hiddenMs:
      total - transitionMs * 2,
    returnMs: transitionMs
  });
}
