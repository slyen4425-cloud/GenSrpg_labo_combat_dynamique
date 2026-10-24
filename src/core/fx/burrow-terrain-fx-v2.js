import {
  burrowVisualDurationsV1
} from "../profiles/burrow-visual-profile-v1.js";

// FX Core owns only visual timing and geometry. Combat Runtime still owns
// underground presence, targetability, hit and the attack clock.
export const BURROW_TERRAIN_FX_PRESET_V2 = Object.freeze({
  holeWidthPx: 86,
  holeHeightPx: 31,
  trailWidthPx: 30,
  debrisCount: 9,
  debrisRadiusPx: 40,
  startHoleFadeMs: 130,
  exitHoleFadeMs: 150
});

function point(value, label) {
  if (!value || typeof value !== "object" ||
      !Number.isFinite(value.x) || !Number.isFinite(value.y)) {
    throw new TypeError(label + " must be a finite {x,y} point");
  }
  return Object.freeze({x: value.x, y: value.y});
}

// Pure, deterministic plan shared between DOM effects and tests.
// In particular, no timer here can ever decide the gameplay hit.
export function planBurrowTerrainFxV2({
  from, to, travelMs,
  preset = BURROW_TERRAIN_FX_PRESET_V2
}) {
  const start = point(from, "from");
  const end = point(to, "to");
  const phases = burrowVisualDurationsV1(travelMs);
  const dx = end.x - start.x, dy = end.y - start.y;
  const distance = Math.hypot(dx,dy);
  const emergeAtMs = phases.diveMs + phases.hiddenMs;
  const trailAtMs = phases.diveMs;
  const trailMs = Math.max(1, emergeAtMs - trailAtMs);
  const totalMs = phases.diveMs + phases.hiddenMs + phases.emergeMs;
  const spread = Math.min(1.4,Math.max(0.6,distance / 230));
  const debris = Object.freeze(Array.from({length:preset.debrisCount},(_,i)=>{
    const angle = (i / preset.debrisCount)*Math.PI*2 + 0.35;
    const radius = preset.debrisRadiusPx * (0.62 + (i%3)*0.19)*spread;
    return Object.freeze({
      x: Math.cos(angle)*radius,
      y: Math.sin(angle)*radius * 0.55 - 12,
      sizePx: 4 + (i%3)*2
    });
  }));
  return Object.freeze({
    from: start, to: end,
    phases,
    totalMs,
    holeWidthPx: preset.holeWidthPx,
    holeHeightPx: preset.holeHeightPx,
    trailWidthPx: preset.trailWidthPx,
    trailLengthPx: distance,
    trailAngleDeg: Math.atan2(dy,dx)*180/Math.PI,
    trailAtMs,
    trailMs,
    emergeAtMs,
    emergeMs: Math.max(1,phases.emergeMs),
    debris
  });
}
