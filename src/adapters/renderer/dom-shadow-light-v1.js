// Shared, pure 2.5D light projection for the single ground-shadow owner.
// Alpha samples always come from the existing collision mask, never another
// image loader, animator, or second shadow DOM element.
const MODES = new Set(["silhouette", "soft", "contact"]);
const clamp = (v,lo,hi)=>Math.min(hi,Math.max(lo,v));

export function normalizeArenaShadowLightV1(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("arena light settings must be an object");
  }
  const mode = input.mode ?? "silhouette";
  if (!MODES.has(mode)) throw new RangeError("unsupported ground-shadow mode: " + mode);
  const number = (key, defaultValue, minimum, maximum) => {
    const value = input[key] === undefined ? defaultValue : Number(input[key]);
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      throw new RangeError("arena light " + key + " must be in [" + minimum + "," + maximum + "]");
    }
    return value;
  };
  return Object.freeze({
    mode,
    azimuthDeg: number("azimuthDeg", 50, 0, 360),
    elevationDeg: number("elevationDeg", 48, 15, 85),
    softness: number("softness", 0.5, 0, 1),
    intensity: number("intensity", 0.6, 0, 1),
    flightHeightPx: number("flightHeightPx", 38, 0, 120)
  });
}

export function projectArenaShadowLightV1(light, { flying = false } = {}) {
  const settings = normalizeArenaShadowLightV1(light);
  const azimuth = settings.azimuthDeg * Math.PI / 180;
  const elevation = settings.elevationDeg * Math.PI / 180;
  const altitude = flying ? settings.flightHeightPx : 0;
  // Stylized directional projection onto a fixed 2.5D ground plane.
  // The nonzero grounded term models a sprite's volume above its feet.
  const distance = clamp((13 + altitude * 0.7) / Math.tan(elevation), 0, 92);
  return Object.freeze({
    castXPct: Math.round(Math.sin(azimuth) * distance * 100) / 100,
    castYPct: Math.round(Math.cos(azimuth) * distance * 0.42 * 100) / 100,
    skewDeg: Math.round(Math.sin(azimuth) * 17 * 100) / 100,
    flatten: Math.round((0.2 + altitude / 600) * 1000) / 1000,
    blurPx: Math.round((2 + settings.softness * 5 + altitude * 0.075) * 100) / 100,
    opacity: Math.round(clamp(settings.intensity * (1 - settings.softness * 0.2) * (flying ? 0.72 : 1), 0, 1) * 1000) / 1000
  });
}

// SVG is a small alpha stencil, not a new authored visual or a second
// collision source. 64x64 bounds limit GPU, DOM and mobile memory costs.
// Runs are taken from the sole accepted image alpha mask, cached by slot.
export function shadowSilhouetteUrlFromOpaqueMaskV1(mask, { resolution = 64 } = {}) {
  if (!mask || !Number.isInteger(mask.width) || mask.width < 1 ||
      !Number.isInteger(mask.height) || mask.height < 1 ||
      !(mask.opaque instanceof Uint8Array) ||
      mask.opaque.length !== mask.width * mask.height) {
    throw new TypeError("accepted collision alpha mask required");
  }
  if (!Number.isInteger(resolution) || resolution < 8 || resolution > 96) {
    throw new RangeError("shadow silhouette resolution must be 8..96");
  }
  const columns = Math.min(resolution, mask.width);
  const rows = Math.min(resolution, mask.height);
  const counts = new Uint32Array(columns * rows);
  let total = 0;
  for (let y = 0; y < mask.height; y += 1) {
    const row = Math.min(rows - 1, Math.floor(y * rows / mask.height));
    for (let x = 0; x < mask.width; x += 1) {
      if (mask.opaque[y * mask.width + x] !== 1) continue;
      counts[row * columns + Math.min(columns - 1, Math.floor(x * columns / mask.width))]++;
      total++;
    }
  }
  if (total === 0) return null;
  const path = [];
  for (let y = 0; y < rows; y++) {
    let start = -1;
    for (let x = 0; x <= columns; x++) {
      const filled = x < columns && counts[y * columns + x] > 0;
      if (filled && start < 0) start = x;
      if (!filled && start >= 0) {
        const length = x - start;
        path.push("M" + start + " " + y + "h" + length + "v1h-" + length + "z");
        start = -1;
      }
    }
  }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    columns + " " + rows + '" preserveAspectRatio="none"><path fill="white" d="' +
    path.join("") + '"/></svg>';
  return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
}
