// Authoring-only visual preset. No skill IDs, gameplay, runtime timers or FX engine.
export const CAPTURE_BEAM_VISUAL_PACKS_V1 = Object.freeze([
  Object.freeze({
    id: "pressurized-jet",
    label: "Rayon Jet pressurisé",
    cast: "pack:capture:sprite-pressurized-jet-cast-01",
    beamStart: "pack:capture:sprite-pressurized-jet-beam-start-01",
    travel: "pack:capture:sprite-pressurized-jet-beam-body-01",
    impact: "pack:capture:sprite-pressurized-jet-impact-01"
  })
]);

export function captureBeamVisualPackV1(id) {
  return CAPTURE_BEAM_VISUAL_PACKS_V1.find(
    (pack) => pack.id === id
  ) ?? null;
}

export function applyCaptureBeamVisualPackV1({
  packId,
  presentation = {}
}) {
  if (!presentation || typeof presentation !== "object" || Array.isArray(presentation)) {
    throw new TypeError("presentation must be an object");
  }
  const pack = captureBeamVisualPackV1(packId);
  if (!pack) throw new RangeError("Unknown beam visual pack: " + packId);

  // Visual selection only. Preserve sounds, skill mechanics and all other FX.
  return Object.freeze({
    ...presentation,
    castAssetId: pack.cast,
    castDisplayScale: 1.5,
    castPlaybackMode: "loop",
    castOffsetX: 0,
    castOffsetY: 0,
    castOffsetMode: "same",
    castOpponentOffsetX: 0,
    castOpponentOffsetY: 0,
    beamStartAssetId: pack.beamStart,
    beamStartDisplayScale: 1,
    travelAssetId: pack.travel,
    travelDisplayScale: 1,
    travelPlaybackMode: "loop",
    impactAssetId: pack.impact,
    impactDisplayScale: 1.7,
    impactDurationMs: 500,
    impactOffsetX: 0,
    impactOffsetY: 0
  });
}
