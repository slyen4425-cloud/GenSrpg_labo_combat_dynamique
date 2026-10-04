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

export function composeDomFilter(filter = {}) {
  const brightness = finite(filter.brightness ?? 1, "filter.brightness");
  const saturate = finite(filter.saturate ?? 1, "filter.saturate");
  const sepia = finite(filter.sepia ?? 0, "filter.sepia");
  const hueRotateDeg = finite(filter.hueRotateDeg ?? 0, "filter.hueRotateDeg");

  if (
    brightness === 1 &&
    saturate === 1 &&
    sepia === 0 &&
    hueRotateDeg === 0
  ) {
    return "none";
  }

  return [
    `brightness(${formatNumber(brightness)})`,
    `saturate(${formatNumber(saturate)})`,
    `sepia(${formatNumber(sepia)})`,
    `hue-rotate(${formatNumber(hueRotateDeg)}deg)`
  ].join(" ");
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

export function composeDomShadowTransform(actor, ground = {}) {
  const x = finite(actor.position?.x ?? 0, "actor.position.x") +
    finite(ground.translateX ?? 0, "ground.translateX");
  const y = finite(actor.position?.y ?? 0, "actor.position.y") +
    finite(ground.translateY ?? 0, "ground.translateY");
  const scale = finite(actor.scale ?? 1, "actor.scale") *
    finite(ground.scale ?? 1, "ground.scale");
  return `translate3d(${formatNumber(x)}px, ${formatNumber(y)}px, 0) translateX(-50%) scale(${formatNumber(scale)})`;
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

  const planOrigin = plan.transformOrigin
    ? `${plan.transformOrigin.x} ${plan.transformOrigin.y}`
    : null;

  const keyframes = [{
    offset: 0,
    transform: composeDomTransform(actor),
    ...(planOrigin ? { transformOrigin: planOrigin } : {}),
    opacity: 1,
    filter: "none",
    easing: plan.segments[0].easing ?? "linear"
  }];

  let elapsed = 0;
  const shadowKeyframes = [{
    offset: 0,
    transform: composeDomShadowTransform(actor),
    opacity: 1,
    easing: plan.segments[0].easing ?? "linear"
  }];
  for (let index = 0; index < plan.segments.length; index += 1) {
    const segment = plan.segments[index];
    elapsed += segment.durationMs;
    shadowKeyframes.push({
      offset: elapsed / totalDurationMs,
      transform: composeDomShadowTransform(actor, segment.ground),
      opacity: segment.opacity ?? 1,
      easing: plan.segments[index + 1]?.easing ?? "linear"
    });

    keyframes.push({
      offset: elapsed / totalDurationMs,
      transform: composeDomTransform(actor, segment.transform),
      ...(planOrigin ? { transformOrigin: planOrigin } : {}),
      opacity: segment.opacity ?? 1,
      filter: composeDomFilter(segment.filter),
      easing: plan.segments[index + 1]?.easing ?? "linear"
    });
  }

  return Object.freeze({
    keyframes: Object.freeze(keyframes.map((frame) => Object.freeze(frame))),
    shadowKeyframes: Object.freeze(shadowKeyframes.map((frame) => Object.freeze(frame))),
    options: Object.freeze({
      duration: totalDurationMs,
      iterations: plan.loop ? Infinity : 1,
      fill: "none",
      easing: "linear"
    }),
    totalDurationMs
  });
}
