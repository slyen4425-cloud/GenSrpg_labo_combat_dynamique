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
    }
  }

  if (total === 0) {
    return Object.freeze({
      widthPct: 58,
      heightPct: 10,
      opaqueWidthRatio: 0,
      opaqueHeightRatio: 0,
      contactYRatio: null,
      centerXRatio: 0.5
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

  return Object.freeze({
    widthPct,
    heightPct,
    opaqueWidthRatio,
    opaqueHeightRatio,
    contactYRatio: (yBounds.end + 0.5) / mask.height,
    centerXRatio
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
  const opacity = Number(profileShadow.opacity);
  return Object.freeze({
    widthPct: geometry.widthPct,
    heightPct: geometry.heightPct,
    bottomPct,
    centerXPct: geometry.centerXRatio * 100,
    // One alpha-owned foot pivot for the full projected silhouette.
    contactYPct: geometry.contactYRatio === null ? null : geometry.contactYRatio * 100,
    opacity: Number.isFinite(opacity) ? clamp(opacity, 0, 1) : 0.42,
    opaqueWidthRatio: geometry.opaqueWidthRatio
  });
}
