export function captureLegacyEffectPercentV1(
  value,
  kind
) {
  const number = Number(value) || 0;
  const absolute = Math.abs(number);

  let magnitude = 0;
  if (absolute > 0 && absolute < 20) {
    magnitude =
      absolute <= 2
        ? 30
        : absolute <= 5
          ? 40
          : 50;
  } else {
    magnitude = absolute;
  }

  if (kind === "debuff") {
    return -magnitude;
  }
  if (kind === "buff") {
    return magnitude;
  }

  throw new RangeError(
    "legacy percent kind must be buff or debuff"
  );
}

export function captureLegacyStatusDurationActionsV1(
  effect
) {
  const kind = String(
    effect?.kind ?? ""
  ).toLowerCase();
  const duration = Number(effect?.duration);

  if (kind === "buff" || kind === "debuff") {
    return Math.max(
      2,
      Number.isFinite(duration) && duration !== 0
        ? duration
        : 3
    );
  }

  if (kind === "dot" || kind === "hot") {
    return Math.max(
      1,
      Number.isFinite(duration) && duration !== 0
        ? duration
        : 2
    );
  }

  throw new RangeError(
    "legacy action duration only applies to persistent effects"
  );
}

export function captureLegacyPeriodicAmountV1(
  effect
) {
  const raw =
    effect?.value ??
    effect?.base ??
    1;
  return Math.max(
    1,
    Number(raw) || 1
  );
}
