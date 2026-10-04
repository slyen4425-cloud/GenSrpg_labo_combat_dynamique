// Universal mono-image fallback; a creature profile may override these sections.
export const ROSTER_TRANSITION_PROFILE_V1 = Object.freeze({
  recall: Object.freeze({ holdFraction: 0.65, pulseScale: 1.04, pulseBrightness: 1.8, endScale: 0.55, endOpacity: 0.3, endBrightness: 2.8 }),
  enter: Object.freeze({ durationMs: 420, arrivalFraction: 0.12, startScale: 0.65, startOpacity: 0.55, brightness: 2.2, overshootScale: 1.06 })
});
