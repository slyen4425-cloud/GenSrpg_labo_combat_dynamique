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
      opaqueHeightRatio: 0
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

  return Object.freeze({
    widthPct,
    heightPct,
    opaqueWidthRatio,
    opaqueHeightRatio
  });
}
