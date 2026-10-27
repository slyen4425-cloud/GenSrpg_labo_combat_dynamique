// Shared game rule: the roster owns the timestamp, this contract owns the policy.
export const ROSTER_VOLUNTARY_SWITCH_COOLDOWN_DEFAULT_MS = 45000;

export function normalizeRosterVoluntarySwitchCooldownMsV1(
  value = ROSTER_VOLUNTARY_SWITCH_COOLDOWN_DEFAULT_MS,
  field = "recallCooldownMs"
) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(field + " must be a non-negative finite number");
  }
  return value;
}
