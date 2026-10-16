/**
 * Display-only progress for the EXISTING Combat Session rechargeable action.
 * This helper owns no timer, gameplay charge or cooldown state.
 */
export function captureReactionRechargeClockV1(availability) {
  const charges = Number(availability?.charges);
  const rechargeMs = Number(availability?.rechargeMs);
  const nextRechargeMs = Number(availability?.nextRechargeMs);
  if (!Number.isInteger(charges) || charges < 0 ||
      !Number.isFinite(rechargeMs) || rechargeMs < 0 ||
      !Number.isFinite(nextRechargeMs) || nextRechargeMs < 0) {
    throw new RangeError("Invalid native rechargeable-action availability");
  }
  const active = rechargeMs > 0 && nextRechargeMs > 0;
  return Object.freeze({
    active,
    exhausted: charges === 0,
    progress: active
      ? Math.max(0, Math.min(1, 1 - nextRechargeMs / rechargeMs))
      : 1
  });
}
