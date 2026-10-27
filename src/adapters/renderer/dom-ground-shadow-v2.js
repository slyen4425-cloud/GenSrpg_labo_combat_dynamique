function clamp(value, minimum, maximum) {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}

function validMask(mask) {
  return Boolean(
    mask &&
      Number.isInteger(mask.width) &&
      mask.width > 0 &&
      Number.isInteger(mask.height) &&
      mask.height > 0 &&
      mask.opaque instanceof Uint8Array &&
      mask.opaque.length ===
        mask.width * mask.height
  );
}

function robustAxisBounds({
  counts,
  total,
  trimRatio
}) {
  const trim = total * trimRatio;

  let accumulated = 0;
  let start = 0;
  for (
    let index = 0;
    index < counts.length;
    index += 1
  ) {
    accumulated += counts[index];
    if (accumulated > trim) {
      start = index;
      break;
    }
  }

  accumulated = 0;
  let end = counts.length - 1;
  for (
    let index = counts.length - 1;
    index >= 0;
    index -= 1
  ) {
    accumulated += counts[index];
    if (accumulated > trim) {
      end = index;
      break;
    }
  }

  return Object.freeze({
    start,
    end
  });
}


/**
 * Approximate ground supports from the lower silhouette envelope, not from
 * the mass of the abdomen. Single alpha mask, O(width) extra work after the
 * existing scan; contacts are visual estimates, not anatomical landmarks.
 */
function lowerEnvelopeSupportsV3(bottomByColumn, width, height, xBounds, yBounds, fallbackX, fallbackY) {
  const toleranceY = Math.max(2, Math.ceil(height * 0.025));
  const supported = new Uint8Array(width);
  const groundHistogram = new Uint32Array(height);
  let groundCandidateCount = 0;
  const bottom = (x) => x < xBounds.start || x > xBounds.end ? -1 : bottomByColumn[x];
  const lowerRegionStart = yBounds.start + (yBounds.end - yBounds.start) * 0.45;

  for (let x = xBounds.start; x <= xBounds.end; x += 1) {
    const y = bottomByColumn[x];
    if (y < lowerRegionStart) continue;
    // Isolated outline / one-pixel alpha artefacts are not supports.
    if (Math.abs(y - bottom(x - 1)) > toleranceY &&
        Math.abs(y - bottom(x + 1)) > toleranceY) continue;
    supported[x] = 1;
    groundHistogram[y] += 1;
    groundCandidateCount += 1;
  }

  if (!groundCandidateCount) return { xRatio: fallbackX, yRatio: fallbackY };
  // Linear-time percentile histogram rather than sorting columns on mobile.
  // The 95th percentile resists very low claws/noise from a few columns.
  const cutoff = Math.floor((groundCandidateCount - 1) * 0.95);
  let seen = 0;
  let floorY = 0;
  for (let y = 0; y < height; y += 1) {
    seen += groundHistogram[y];
    if (seen > cutoff) { floorY = y; break; }
  }
  const floorBand = Math.max(2, Math.ceil(height * 0.045));
  const minWidth = Math.min(12, Math.max(2, Math.ceil(
    (xBounds.end - xBounds.start + 1) * 0.025
  )));
  const groups = [];
  let start = -1;
  let count = 0;
  let xSum = 0;
  let ySum = 0;
  const flush = () => {
    if (count >= minWidth) groups.push({ count, x: xSum / count, y: ySum / count });
    start = -1; count = 0; xSum = 0; ySum = 0;
  };

  for (let x = xBounds.start; x <= xBounds.end + 1; x += 1) {
    const y = x <= xBounds.end ? bottomByColumn[x] : -1;
    const selected = x <= xBounds.end && supported[x] === 1 &&
      Math.abs(y - floorY) <= floorBand;
    if (!selected) {
      if (start >= 0) flush();
      continue;
    }
    if (start < 0) start = x;
    count += 1;
    xSum += x + 0.5;
    ySum += y + 0.5;
  }
  if (!groups.length) return { xRatio: fallbackX, yRatio: fallbackY };

  // Each visible paw/foot participates; the broadest shell cannot silently
  // outweigh all the small feet as in a pixel-mass average.
  let weightSum = 0;
  let supportX = 0;
  let supportY = 0;
  for (const group of groups) {
    const weight = Math.sqrt(group.count);
    weightSum += weight;
    supportX += group.x * weight;
    supportY += group.y * weight;
  }
  return {
    xRatio: clamp(supportX / weightSum / width, 0, 1),
    yRatio: clamp(supportY / weightSum / height, 0, 1)
  };
}

export function shadowGeometryFromOpaqueMaskV2(
  mask,
  {
    trimRatio = 0.02,
    widthMultiplier = 1.12
  } = {}
) {
  if (!validMask(mask)) {
    throw new TypeError(
      "opaque mask is required for shadow geometry"
    );
  }

  const xCounts =
    new Uint32Array(mask.width);
  const yCounts =
    new Uint32Array(mask.height);
  const bottomByColumn = new Int32Array(mask.width).fill(-1);
  let total = 0;

  for (
    let y = 0;
    y < mask.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < mask.width;
      x += 1
    ) {
      if (
        mask.opaque[
          y * mask.width + x
        ] !== 1
      ) {
        continue;
      }

      total += 1;
      xCounts[x] += 1;
      yCounts[y] += 1;
      bottomByColumn[x] = y;
    }
  }

  if (total === 0) {
    return Object.freeze({
      widthPct: 58,
      heightPct: 10,
      opaqueWidthRatio: 0,
      opaqueHeightRatio: 0,
      contactYRatio: null,
      centerXRatio: 0.5,
      contactXRatio: 0.5
    });
  }

  const normalizedTrim =
    clamp(Number(trimRatio) || 0, 0, 0.2);
  const xBounds = robustAxisBounds({
    counts: xCounts,
    total,
    trimRatio: normalizedTrim
  });
  const yBounds = robustAxisBounds({
    counts: yCounts,
    total,
    trimRatio: normalizedTrim
  });

  const opaqueWidthRatio =
    (xBounds.end - xBounds.start + 1) /
    mask.width;
  const opaqueHeightRatio =
    (yBounds.end - yBounds.start + 1) /
    mask.height;

  const widthPct = clamp(
    opaqueWidthRatio *
      100 *
      clamp(
        Number(widthMultiplier) || 1.12,
        0.7,
        1.6
      ),
    46,
    92
  );
  const heightPct = clamp(
    widthPct * 0.16,
    8,
    15
  );

  // Determine the centre of the weight-bearing lower silhouette instead
  // of using the image box's fixed 50% centre. Wide, leaning creatures can
  // have their torso and feet off-axis within their transparent canvas.
  // Reuse the already-trimmed opaque bounds to exclude sparse FX/stray pixels.
  const lowerStartY = Math.floor(
    yBounds.start + (yBounds.end - yBounds.start) * 0.42
  );
  let lowerOpaqueCount = 0;
  let lowerXSum = 0;
  for (let y = lowerStartY; y <= yBounds.end; y += 1) {
    for (let x = xBounds.start; x <= xBounds.end; x += 1) {
      if (mask.opaque[y * mask.width + x] !== 1) continue;
      lowerOpaqueCount += 1;
      lowerXSum += x + 0.5;
    }
  }
  const centerXRatio = lowerOpaqueCount > 0
    ? clamp(lowerXSum / (lowerOpaqueCount * mask.width), 0, 1)
    : 0.5;

  const supports = lowerEnvelopeSupportsV3(
    bottomByColumn, mask.width, mask.height,
    xBounds, yBounds, centerXRatio,
    (yBounds.end + 0.5) / mask.height
  );

  return Object.freeze({
    widthPct,
    heightPct,
    opaqueWidthRatio,
    opaqueHeightRatio,
    // The actual foot support, not the lowest opaque tail/pixel, owns the
    // shared contact for both ellipse and projected silhouette modes.
    contactYRatio: supports.yRatio,
    centerXRatio,
    contactXRatio: supports.xRatio,
    supportYRatio: supports.yRatio
  });
}

/**
 * Single ground-shadow geometry owner for a creature slot.
 * Animation Core/Renderer own motion and transforms; this function only
 * resolves static footprint and contact from the resting model's opaque mask.
 * Profile bottom is a fallback for empty masks, never a competing override.
 */
export function groundShadowLayoutFromOpaqueMaskV2(
  mask,
  profileShadow = {}
) {
  const geometry = shadowGeometryFromOpaqueMaskV2(mask, {
    widthMultiplier: profileShadow.widthMultiplier ?? 1.12
  });
  const fallbackBottom = Number(profileShadow.bottomPct);
  const bottomPct = geometry.contactYRatio === null
    ? clamp(Number.isFinite(fallbackBottom) ? fallbackBottom : 8, 0, 60)
    : clamp((1 - geometry.contactYRatio) * 100 - geometry.heightPct / 2, 0, 60);
  // A creature-specific author adjustment shifts the existing footprint,
  // not the single alpha-derived foot pivot, image mask or collision model.
  const offsetXPct = Number(profileShadow.offsetXPct ?? 0);
  const offsetYPct = Number(profileShadow.offsetYPct ?? 0);
  if (!Number.isFinite(offsetXPct) || !Number.isFinite(offsetYPct) ||
      Math.abs(offsetXPct) > 40 || Math.abs(offsetYPct) > 40) {
    throw new RangeError("creature shadow offsets must be finite and within ±40%");
  }
  const opacity = Number(profileShadow.opacity);
  return Object.freeze({
    widthPct: geometry.widthPct,
    heightPct: geometry.heightPct,
    bottomPct: clamp(bottomPct - offsetYPct, 0, 60),
    centerXPct: clamp(geometry.centerXRatio * 100 + offsetXPct, 0, 100),
    offsetXPct,
    offsetYPct,
    contactXPct: geometry.contactXRatio * 100,
    // One alpha-owned foot pivot for the full projected silhouette.
    contactYPct: geometry.contactYRatio === null ? null : geometry.contactYRatio * 100,
    opacity: Number.isFinite(opacity) ? clamp(opacity, 0, 1) : 0.42,
    opaqueWidthRatio: geometry.opaqueWidthRatio
  });
}
