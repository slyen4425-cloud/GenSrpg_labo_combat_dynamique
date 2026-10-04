function finite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${field} must be finite`);
  }
  return number;
}

function visualFilter(filter = {}, field = "filter") {
  if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
    throw new TypeError(`${field} must be an object`);
  }

  const brightness = finite(filter.brightness ?? 1, `${field}.brightness`);
  const saturate = finite(filter.saturate ?? 1, `${field}.saturate`);
  const sepia = finite(filter.sepia ?? 0, `${field}.sepia`);
  const hueRotateDeg = finite(
    filter.hueRotateDeg ?? 0,
    `${field}.hueRotateDeg`
  );

  if (brightness < 0 || saturate < 0 || sepia < 0 || sepia > 1) {
    throw new RangeError(`${field} contains an invalid visual filter value`);
  }

  return Object.freeze({
    brightness,
    saturate,
    sepia,
    hueRotateDeg
  });
}

function optionalTransformOrigin(value) {
  if (value == null) {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("transformOrigin must be an object");
  }
  const x = String(value.x ?? "").trim();
  const y = String(value.y ?? "").trim();
  if (!x || !y) {
    throw new TypeError("transformOrigin.x/y must be non-empty strings");
  }
  return Object.freeze({ x, y });
}

function normalizeCues(cues = []) {
  if (!Array.isArray(cues)) {
    throw new TypeError("cues must be an array");
  }
  return Object.freeze(cues.map((cue, index) => {
    if (!cue || typeof cue !== "object" || Array.isArray(cue)) {
      throw new TypeError(`cues[${index}] must be an object`);
    }
    const type = String(cue.type ?? "").trim();
    if (!type) {
      throw new TypeError(`cues[${index}].type must be a non-empty string`);
    }
    const atMs = finite(cue.atMs, `cues[${index}].atMs`);
    const intensity = finite(cue.intensity ?? 1, `cues[${index}].intensity`);
    if (atMs < 0 || intensity <= 0) {
      throw new RangeError("cue timing must be non-negative and intensity positive");
    }
    return Object.freeze({ type, atMs, intensity });
  }));
}

export function createAnimationPlan({
  actorId,
  eventType,
  loop = false,
  restoreBaseState = !loop,
  transformOrigin = null,
  cues = [],
  segments
}) {
  if (typeof actorId !== "string" || actorId.trim() === "") {
    throw new TypeError("actorId must be a non-empty string");
  }
  if (typeof eventType !== "string" || eventType.trim() === "") {
    throw new TypeError("eventType must be a non-empty string");
  }
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new TypeError("segments must be a non-empty array");
  }

  const normalizedSegments = segments.map((segment, index) => {
    if (!segment || typeof segment !== "object" || Array.isArray(segment)) {
      throw new TypeError(`segments[${index}] must be an object`);
    }

    const durationMs = finite(segment.durationMs, `segments[${index}].durationMs`);
    if (durationMs < 0) {
      throw new RangeError("segment duration cannot be negative");
    }

    const transform = segment.transform ?? {};
    const ground = segment.ground ?? {};
    const groundScale = finite(ground.scale ?? 1, `segments[${index}].ground.scale`);
    if (groundScale <= 0) {
      throw new RangeError("ground.scale must be positive");
    }
    const opacity = segment.opacity == null
      ? 1
      : finite(segment.opacity, `segments[${index}].opacity`);

    return Object.freeze({
      label: typeof segment.label === "string" ? segment.label : `segment-${index + 1}`,
      durationMs,
      easing: segment.easing ?? "ease-in-out",
      transform: Object.freeze({
        translateX: finite(transform.translateX ?? 0, "translateX"),
        translateY: finite(transform.translateY ?? 0, "translateY"),
        scaleX: finite(transform.scaleX ?? 1, "scaleX"),
        scaleY: finite(transform.scaleY ?? 1, "scaleY"),
        rotateDeg: finite(transform.rotateDeg ?? 0, "rotateDeg")
      }),
      opacity,
      ground: Object.freeze({
        translateX: finite(ground.translateX ?? transform.translateX ?? 0, "ground.translateX"),
        translateY: finite(ground.translateY ?? 0, "ground.translateY"),
        scale: groundScale
      }),
      filter: visualFilter(
        segment.filter ?? {},
        `segments[${index}].filter`
      )
    });
  });

  const normalizedOrigin = optionalTransformOrigin(transformOrigin);
  const normalizedCues = normalizeCues(cues);

  return Object.freeze({
    actorId: actorId.trim(),
    eventType: eventType.trim(),
    loop: Boolean(loop),
    restoreBaseState: Boolean(restoreBaseState),
    ...(normalizedOrigin ? { transformOrigin: normalizedOrigin } : {}),
    ...(normalizedCues.length ? { cues: normalizedCues } : {}),
    segments: Object.freeze(normalizedSegments)
  });
}
