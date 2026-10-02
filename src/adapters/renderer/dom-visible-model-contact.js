const OPAQUE_ALPHA_THRESHOLD = 0;
const maskCache = new Map();

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pointFromRect(rect) {
  if (!rect) {
    return null;
  }
  const left = finiteNumber(rect.left);
  const top = finiteNumber(rect.top);
  const width = finiteNumber(rect.width);
  const height = finiteNumber(rect.height);
  if (
    left === null ||
    top === null ||
    width === null ||
    height === null
  ) {
    return null;
  }
  return Object.freeze({
    x: left + width / 2,
    y: top + height / 2
  });
}

function validPoint(point) {
  return Boolean(
    point &&
      Number.isFinite(Number(point.x)) &&
      Number.isFinite(Number(point.y))
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
      mask.opaque.length === mask.width * mask.height
  );
}

export function opaqueMaskFromRgba({
  width,
  height,
  data
}) {
  const normalizedWidth = Number(width);
  const normalizedHeight = Number(height);

  if (
    !Number.isInteger(normalizedWidth) ||
    normalizedWidth <= 0 ||
    !Number.isInteger(normalizedHeight) ||
    normalizedHeight <= 0
  ) {
    throw new RangeError(
      "opaque mask width/height must be positive integers"
    );
  }

  if (
    !data ||
    typeof data.length !== "number" ||
    data.length !== normalizedWidth * normalizedHeight * 4
  ) {
    throw new RangeError(
      "RGBA data length must match width * height * 4"
    );
  }

  const opaque = new Uint8Array(
    normalizedWidth * normalizedHeight
  );

  for (let index = 0; index < opaque.length; index += 1) {
    opaque[index] =
      Number(data[index * 4 + 3]) >
      OPAQUE_ALPHA_THRESHOLD
        ? 1
        : 0;
  }

  return Object.freeze({
    width: normalizedWidth,
    height: normalizedHeight,
    opaque
  });
}

export function screenPointToModelUnit(frame, point) {
  if (
    !frame ||
    !validPoint(frame.origin) ||
    !validPoint(frame.axisX) ||
    !validPoint(frame.axisY) ||
    !validPoint(point)
  ) {
    return null;
  }

  const originX = Number(frame.origin.x);
  const originY = Number(frame.origin.y);
  const xAxisX = Number(frame.axisX.x) - originX;
  const xAxisY = Number(frame.axisX.y) - originY;
  const yAxisX = Number(frame.axisY.x) - originX;
  const yAxisY = Number(frame.axisY.y) - originY;
  const determinant =
    xAxisX * yAxisY - xAxisY * yAxisX;

  if (Math.abs(determinant) < 1e-9) {
    return null;
  }

  const pointX = Number(point.x) - originX;
  const pointY = Number(point.y) - originY;

  return Object.freeze({
    u:
      (pointX * yAxisY - pointY * yAxisX) /
      determinant,
    v:
      (xAxisX * pointY - xAxisY * pointX) /
      determinant
  });
}

function clipUnitSegment(start, end) {
  let minimum = 0;
  let maximum = 1;
  const dx = end.u - start.u;
  const dy = end.v - start.v;

  const clip = (p, q) => {
    if (Math.abs(p) < 1e-12) {
      return q >= 0;
    }
    const ratio = q / p;
    if (p < 0) {
      if (ratio > maximum) {
        return false;
      }
      minimum = Math.max(minimum, ratio);
    } else {
      if (ratio < minimum) {
        return false;
      }
      maximum = Math.min(maximum, ratio);
    }
    return minimum <= maximum;
  };

  if (
    !clip(-dx, start.u) ||
    !clip(dx, 1 - start.u) ||
    !clip(-dy, start.v) ||
    !clip(dy, 1 - start.v)
  ) {
    return null;
  }

  return Object.freeze({
    start: Object.freeze({
      u: start.u + dx * minimum,
      v: start.v + dy * minimum
    }),
    end: Object.freeze({
      u: start.u + dx * maximum,
      v: start.v + dy * maximum
    })
  });
}

function opaqueAt(mask, unitPoint) {
  if (
    !validMask(mask) ||
    !unitPoint ||
    !Number.isFinite(unitPoint.u) ||
    !Number.isFinite(unitPoint.v) ||
    unitPoint.u < 0 ||
    unitPoint.u > 1 ||
    unitPoint.v < 0 ||
    unitPoint.v > 1
  ) {
    return false;
  }

  const x = Math.min(
    mask.width - 1,
    Math.max(0, Math.floor(unitPoint.u * mask.width))
  );
  const y = Math.min(
    mask.height - 1,
    Math.max(0, Math.floor(unitPoint.v * mask.height))
  );

  return mask.opaque[y * mask.width + x] === 1;
}

const boundarySampleCache = new WeakMap();

function modelUnitToScreen(frame, unitPoint) {
  if (
    !frame ||
    !validPoint(frame.origin) ||
    !validPoint(frame.axisX) ||
    !validPoint(frame.axisY) ||
    !unitPoint ||
    !Number.isFinite(Number(unitPoint.u)) ||
    !Number.isFinite(Number(unitPoint.v))
  ) {
    return null;
  }

  const u = Number(unitPoint.u);
  const v = Number(unitPoint.v);
  const originX = Number(frame.origin.x);
  const originY = Number(frame.origin.y);

  return Object.freeze({
    x:
      originX +
      (Number(frame.axisX.x) - originX) * u +
      (Number(frame.axisY.x) - originX) * v,
    y:
      originY +
      (Number(frame.axisX.y) - originY) * u +
      (Number(frame.axisY.y) - originY) * v
  });
}

function boundarySamples(mask) {
  if (!validMask(mask)) {
    return Object.freeze([]);
  }

  const cached = boundarySampleCache.get(mask);
  if (cached) {
    return cached;
  }

  const samples = [];
  const isOpaque = (x, y) =>
    x >= 0 &&
    y >= 0 &&
    x < mask.width &&
    y < mask.height &&
    mask.opaque[y * mask.width + x] === 1;

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (!isOpaque(x, y)) {
        continue;
      }

      const boundary =
        !isOpaque(x - 1, y) ||
        !isOpaque(x + 1, y) ||
        !isOpaque(x, y - 1) ||
        !isOpaque(x, y + 1);

      if (!boundary) {
        continue;
      }

      samples.push(
        Object.freeze({
          u: (x + 0.5) / mask.width,
          v: (y + 0.5) / mask.height
        })
      );
    }
  }

  const frozen = Object.freeze(samples);
  boundarySampleCache.set(mask, frozen);
  return frozen;
}

function frameBounds(frame) {
  if (
    !frame ||
    !validPoint(frame.origin) ||
    !validPoint(frame.axisX) ||
    !validPoint(frame.axisY)
  ) {
    return null;
  }

  const opposite = {
    x:
      Number(frame.axisX.x) +
      Number(frame.axisY.x) -
      Number(frame.origin.x),
    y:
      Number(frame.axisX.y) +
      Number(frame.axisY.y) -
      Number(frame.origin.y)
  };
  const points = [
    frame.origin,
    frame.axisX,
    frame.axisY,
    opposite
  ];
  const xs = points.map((point) => Number(point.x));
  const ys = points.map((point) => Number(point.y));

  return Object.freeze({
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys)
  });
}

function boundsOverlap(left, right) {
  return Boolean(
    left &&
      right &&
      left.left <= right.right &&
      left.right >= right.left &&
      left.top <= right.bottom &&
      left.bottom >= right.top
  );
}

function modelBoundaryHitsTarget(source, target) {
  if (
    !source ||
    !target ||
    !validMask(source.mask) ||
    !validMask(target.mask)
  ) {
    return false;
  }

  for (const sample of boundarySamples(source.mask)) {
    const screen = modelUnitToScreen(source, sample);
    if (!screen) {
      continue;
    }
    const targetUnit =
      screenPointToModelUnit(target, screen);
    if (opaqueAt(target.mask, targetUnit)) {
      return true;
    }
  }

  return false;
}

export function visibleModelsOverlap(left, right) {
  if (
    !left ||
    !right ||
    !validMask(left.mask) ||
    !validMask(right.mask)
  ) {
    return false;
  }

  if (
    !boundsOverlap(
      frameBounds(left),
      frameBounds(right)
    )
  ) {
    return false;
  }

  return (
    modelBoundaryHitsTarget(left, right) ||
    modelBoundaryHitsTarget(right, left)
  );
}

function sweptBoundaryHitsTarget({
  sourcePrevious,
  source,
  targetPrevious,
  target
}) {
  if (
    !sourcePrevious ||
    !source ||
    !targetPrevious ||
    !target ||
    !validMask(source.mask) ||
    !validMask(target.mask)
  ) {
    return false;
  }

  for (const sample of boundarySamples(source.mask)) {
    const previousPoint =
      modelUnitToScreen(sourcePrevious, sample);
    const point =
      modelUnitToScreen(source, sample);

    if (
      sweptPointHitsOpaqueMask({
        mask: target.mask,
        previousPoint,
        point,
        previousFrame: targetPrevious,
        frame: target
      })
    ) {
      return true;
    }
  }

  return false;
}

export function sweptVisibleModelsOverlap({
  previousLeft,
  left,
  previousRight,
  right,
  continuous = true
}) {
  if (!left || !right) {
    return false;
  }

  if (visibleModelsOverlap(left, right)) {
    return true;
  }

  if (
    continuous !== true ||
    !previousLeft ||
    !previousRight
  ) {
    return false;
  }

  if (visibleModelsOverlap(previousLeft, previousRight)) {
    return true;
  }

  return (
    sweptBoundaryHitsTarget({
      sourcePrevious: previousLeft,
      source: left,
      targetPrevious: previousRight,
      target: right
    }) ||
    sweptBoundaryHitsTarget({
      sourcePrevious: previousRight,
      source: right,
      targetPrevious: previousLeft,
      target: left
    })
  );
}

export function sweptPointHitsOpaqueMask({
  mask,
  previousPoint,
  point,
  previousFrame,
  frame
}) {
  if (!validMask(mask) || !validPoint(point) || !frame) {
    return false;
  }

  const currentLocal =
    screenPointToModelUnit(frame, point);
  if (!currentLocal) {
    return false;
  }

  const previousLocal =
    previousPoint && previousFrame
      ? screenPointToModelUnit(
          previousFrame,
          previousPoint
        )
      : currentLocal;

  if (!previousLocal) {
    return opaqueAt(mask, currentLocal);
  }

  const clipped =
    clipUnitSegment(previousLocal, currentLocal);
  if (!clipped) {
    return false;
  }

  const deltaU = clipped.end.u - clipped.start.u;
  const deltaV = clipped.end.v - clipped.start.v;
  const pixelTravel = Math.max(
    Math.abs(deltaU) * mask.width,
    Math.abs(deltaV) * mask.height
  );
  const steps = Math.max(
    1,
    Math.ceil(pixelTravel * 2)
  );

  for (let step = 0; step <= steps; step += 1) {
    const progress = step / steps;
    if (
      opaqueAt(mask, {
        u: clipped.start.u + deltaU * progress,
        v: clipped.start.v + deltaV * progress
      })
    ) {
      return true;
    }
  }

  return false;
}

function marker(documentRef, role) {
  const node = documentRef.createElement("span");
  node.dataset.visibleModelAxis = role;
  node.setAttribute?.("aria-hidden", "true");
  Object.assign(node.style, {
    position: "absolute",
    width: "0px",
    height: "0px",
    pointerEvents: "none",
    opacity: "0"
  });
  return node;
}

function imageCacheKey(image) {
  return String(
    image?.currentSrc ||
    image?.src ||
    ""
  );
}

function sourceContentBox({
  sourceWidth,
  sourceHeight,
  hostWidth,
  hostHeight
}) {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    hostWidth <= 0 ||
    hostHeight <= 0
  ) {
    return null;
  }

  const scale = Math.min(
    hostWidth / sourceWidth,
    hostHeight / sourceHeight
  );
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return Object.freeze({
    left: (hostWidth - width) / 2,
    top: (hostHeight - height) / 2,
    width,
    height
  });
}

export function createDomVisibleModelCollisionModel({
  motion,
  image
}) {
  if (
    !motion ||
    typeof motion.append !== "function"
  ) {
    throw new TypeError(
      "motion must be a DOM-like element"
    );
  }
  if (
    !image ||
    !image.ownerDocument ||
    typeof image.ownerDocument.createElement !== "function"
  ) {
    throw new TypeError(
      "image must provide ownerDocument"
    );
  }

  const documentRef = image.ownerDocument;
  const originMarker = marker(documentRef, "origin");
  const xMarker = marker(documentRef, "x");
  const yMarker = marker(documentRef, "y");
  motion.append(originMarker);
  motion.append(xMarker);
  motion.append(yMarker);

  let mask = null;
  let naturalWidth = 0;
  let naturalHeight = 0;
  let disposed = false;

  function clear() {
    mask = null;
    naturalWidth = 0;
    naturalHeight = 0;
  }

  function refreshFromImage() {
    if (disposed) {
      return false;
    }

    const width = Number(image.naturalWidth);
    const height = Number(image.naturalHeight);
    if (
      !Number.isInteger(width) ||
      width <= 0 ||
      !Number.isInteger(height) ||
      height <= 0
    ) {
      clear();
      return false;
    }

    const key = imageCacheKey(image);
    const cached = key ? maskCache.get(key) : null;
    if (
      cached &&
      cached.width === width &&
      cached.height === height
    ) {
      mask = cached;
      naturalWidth = width;
      naturalHeight = height;
      return true;
    }

    const canvas = documentRef.createElement("canvas");
    if (
      !canvas ||
      typeof canvas.getContext !== "function"
    ) {
      clear();
      return false;
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", {
      willReadFrequently: true
    });
    if (
      !context ||
      typeof context.drawImage !== "function" ||
      typeof context.getImageData !== "function"
    ) {
      clear();
      return false;
    }

    try {
      context.clearRect?.(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const imageData =
        context.getImageData(0, 0, width, height);
      const nextMask = opaqueMaskFromRgba({
        width,
        height,
        data: imageData.data
      });
      mask = nextMask;
      naturalWidth = width;
      naturalHeight = height;
      if (key) {
        maskCache.set(key, nextMask);
      }
      return true;
    } catch {
      clear();
      return false;
    }
  }

  function updateMarkers() {
    const hostWidth =
      Number(motion.clientWidth) ||
      Number(motion.offsetWidth) ||
      Number(motion.getBoundingClientRect?.().width) ||
      0;
    const hostHeight =
      Number(motion.clientHeight) ||
      Number(motion.offsetHeight) ||
      Number(motion.getBoundingClientRect?.().height) ||
      0;

    const box = sourceContentBox({
      sourceWidth: naturalWidth,
      sourceHeight: naturalHeight,
      hostWidth,
      hostHeight
    });
    if (!box) {
      return false;
    }

    originMarker.style.left = box.left + "px";
    originMarker.style.top = box.top + "px";
    xMarker.style.left = box.left + box.width + "px";
    xMarker.style.top = box.top + "px";
    yMarker.style.left = box.left + "px";
    yMarker.style.top = box.top + box.height + "px";
    return true;
  }

  function snapshot() {
    if (
      disposed ||
      !mask ||
      !updateMarkers()
    ) {
      return null;
    }

    const origin = pointFromRect(
      originMarker.getBoundingClientRect?.()
    );
    const axisX = pointFromRect(
      xMarker.getBoundingClientRect?.()
    );
    const axisY = pointFromRect(
      yMarker.getBoundingClientRect?.()
    );

    if (!origin || !axisX || !axisY) {
      return null;
    }

    return Object.freeze({
      mask,
      origin,
      axisX,
      axisY
    });
  }

  return Object.freeze({
    clear,
    refreshFromImage,
    snapshot,
    get ready() {
      return mask !== null;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      clear();
      originMarker.remove?.();
      xMarker.remove?.();
      yMarker.remove?.();
    }
  });
}
