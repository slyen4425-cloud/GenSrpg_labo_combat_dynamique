export const BURROW_VISUAL_PROFILE_V1 = Object.freeze({
  diveRatio: 0.22,
  emergeRatio: 0.24,
  diveY: 82,
  emergeStartOffsetY: 78,
  diveScaleX: 0.98,
  diveScaleY: 0.94,
  impactScaleX: 1.04,
  impactScaleY: 0.96,
  returnMs: 220
});

function positiveDuration(value) {
  const durationMs = Math.round(Number(value));
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError(
      "burrow visual duration must be greater than 0"
    );
  }
  return durationMs;
}

export function burrowVisualDurationsV1(
  durationMs,
  profile = BURROW_VISUAL_PROFILE_V1
) {
  const totalMs = positiveDuration(durationMs);

  if (totalMs === 1) {
    return Object.freeze({
      diveMs: 0,
      hiddenMs: 0,
      emergeMs: 1
    });
  }

  if (totalMs === 2) {
    return Object.freeze({
      diveMs: 1,
      hiddenMs: 0,
      emergeMs: 1
    });
  }

  const rawDiveMs = Math.round(
    totalMs * Number(profile.diveRatio)
  );
  const diveMs = Math.max(
    1,
    Math.min(totalMs - 2, rawDiveMs)
  );

  const rawEmergeMs = Math.round(
    totalMs * Number(profile.emergeRatio)
  );
  const emergeMs = Math.max(
    1,
    Math.min(
      totalMs - diveMs - 1,
      rawEmergeMs
    )
  );

  return Object.freeze({
    diveMs,
    hiddenMs:
      totalMs - diveMs - emergeMs,
    emergeMs
  });
}
