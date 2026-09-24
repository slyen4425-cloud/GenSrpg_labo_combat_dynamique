function finite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${field} must be finite`);
  }
  return number;
}

export function createAnimationPlan({ actorId, eventType, loop = false, segments }) {
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
      opacity
    });
  });

  return Object.freeze({
    actorId: actorId.trim(),
    eventType: eventType.trim(),
    loop: Boolean(loop),
    restoreBaseState: !loop,
    segments: Object.freeze(normalizedSegments)
  });
}
