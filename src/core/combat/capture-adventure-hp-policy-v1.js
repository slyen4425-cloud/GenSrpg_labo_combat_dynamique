// The ONE Combat-owned maximum HP policy for a game encounter. Combat HUD
// reads the resulting fighter.maxHp, while GenSRPG sheets import the same
// pure function. Authored creatures and persisted current HP are never edited.
export function projectCaptureEncounterMaxHpV1(amount, multiplier = 1) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0)
    throw new RangeError('Capture maximum HP must be a finite non-negative number');
  if (typeof multiplier !== 'number' || !Number.isFinite(multiplier) ||
      multiplier <= 0 || multiplier > 1)
    throw new RangeError('Adventure HP multiplier must be in (0, 1]');
  return amount === 0 ? 0 : Math.max(1, Math.ceil(amount * multiplier));
}
