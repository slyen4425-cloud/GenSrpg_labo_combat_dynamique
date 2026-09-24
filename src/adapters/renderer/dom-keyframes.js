function finite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${field} must be a finite number`);
  }
  return number;
}

function formatNumber(value) {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

export function composeDomTransform(actor, transient = {}) {
  if (!actor || typeof actor !== "object") {
    throw new TypeError("actor is required");
  }

  const baseX = finite(actor.position?.x ?? 0, "actor.position.x");
  const baseY = finite(actor.position?.y ?? 0, "actor.position.y");
  const baseScale = finite(actor.scale ?? 1, "actor.scale");

  const translateX = finite(transient.translateX ?? 0, "transform.translateX");
  const translateY = finite(transient.translateY ?? 0, "transform.translateY");
  const scaleX = finite(transient.scaleX ?? 1, "transform.scaleX");
  const scaleY = finite(transient.scaleY ?? 1, "transform.scaleY");
  const rotateDeg = finite(transient.rotateDeg ?? 0, "transform.rotateDeg");

  return [
    `translate3d(${formatNumber(baseX + translateX)}px, ${formatNumber(baseY + translateY)}px, 0)`,
    `rotate(${formatNumber(rotateDeg)}deg)`,
    `scale(${formatNumber(baseScale * scaleX)}, ${formatNumber(baseScale * scaleY)})`
  ].join(" ");
}

export function animationPlanToDomTimeline(plan, actor) {
  if (!plan || typeof plan !== "object") {
    throw new TypeError("plan is required");
  }
  if (!actor || typeof actor !== "object") {
    throw new TypeError("actor is required");
  }
  if (plan.actorId !== actor.id) {
    throw new Error(`AnimationPlan actorId ${plan.actorId} does not match actor ${actor.id}`);
  }
  if (!Array.isArray(plan.segments) || plan.segments.length === 0) {
    throw new TypeError("plan.segments must be a non-empty array");
  }

  const totalDurationMs = plan.segments.reduce((sum, segment, index) => {
    const duration = finite(segment.durationMs, `segments[${index}].durationMs`);
    if (duration < 0) {
      throw new RangeError("segment duration cannot be negative");
    }
    return sum + duration;
  }, 0);

  if (totalDurationMs <= 0) {
    throw new RangeError("AnimationPlan total duration must be greater than 0");
  }

  const keyframes = [{
    offset: 0,
    transform: composeDomTransform(actor),
    opacity: 1,
    easing: plan.segments[0].easing ?? "linear"
  }];

  let elapsed = 0;
  for (let index = 0; index < plan.segments.length; index += 1) {
    const segment = plan.segments[index];
    elapsed += segment.durationMs;

    keyframes.push({
      offset: elapsed / totalDurationMs,
      transform: composeDomTransform(actor, segment.transform),
      opacity: segment.opacity ?? 1,
      easing: plan.segments[index + 1]?.easing ?? "linear"
    });
  }

  return Object.freeze({
    keyframes: Object.freeze(keyframes.map((frame) => Object.freeze(frame))),
    options: Object.freeze({
      duration: totalDurationMs,
      iterations: plan.loop ? Infinity : 1,
      fill: "none",
      easing: "linear"
    }),
    totalDurationMs
  });
}
