function defaultAnimate(element, keyframes, options) {
  if (typeof element.animate !== "function") {
    throw new TypeError("camera FX element does not support Web Animations API");
  }
  return element.animate(keyframes, options);
}

function positiveFinite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${field} must be greater than 0`);
  }
  return number;
}

// One animation owns the entire camera timeline. No per-pulse timers,
// nested animations, or concurrent camera owners are introduced.
export function cameraShakeTimelineV1(plan) {
  if (!Array.isArray(plan?.sequence) || plan.sequence.length === 0) {
    return Object.freeze({
      durationMs: positiveFinite(plan?.durationMs, "camera-shake.durationMs"),
      keyframes: [
        { transform: "translate3d(0, 0, 0)", offset: 0 },
        { transform: `translate3d(${plan.amplitudePx}px, ${plan.amplitudePx * 0.35}px, 0)`, offset: 0.2 },
        { transform: `translate3d(${-plan.amplitudePx * 0.75}px, ${-plan.amplitudePx * 0.22}px, 0)`, offset: 0.48 },
        { transform: `translate3d(${plan.amplitudePx * 0.38}px, ${plan.amplitudePx * 0.12}px, 0)`, offset: 0.72 },
        { transform: "translate3d(0, 0, 0)", offset: 1 }
      ]
    });
  }
  const steps = plan.sequence;
  if (steps.length > 8) {
    throw new RangeError("camera-shake.sequence exceeds 8 pulses");
  }
  let durationMs = 0;
  for (const step of steps) {
    const duration = positiveFinite(step.durationMs, "camera-shake.sequence.durationMs");
    const amplitude = positiveFinite(step.amplitudePx, "camera-shake.sequence.amplitudePx");
    const pause = Number(step.pauseMs);
    if (!Number.isFinite(pause) || pause < 0 || pause > 2500 ||
        amplitude > 24 || duration < 30 || duration > 2000) {
      throw new RangeError("camera-shake.sequence pulse is out of bounds");
    }
    durationMs += pause + duration;
  }
  if (durationMs > 10000) {
    throw new RangeError("camera-shake.sequence total duration exceeds 10000 ms");
  }
  const zero = "translate3d(0, 0, 0)";
  const keyframes = [{transform: zero, offset: 0}];
  let cursor = 0;
  for (const {pauseMs, amplitudePx, durationMs: pulseMs} of steps) {
    cursor += pauseMs;
    keyframes.push({transform: zero, offset: cursor / durationMs});
    keyframes.push({transform: `translate3d(${amplitudePx}px, ${amplitudePx * 0.35}px, 0)`, offset: (cursor + 0.2 * pulseMs) / durationMs});
    keyframes.push({transform: `translate3d(${-amplitudePx * 0.75}px, ${-amplitudePx * 0.22}px, 0)`, offset: (cursor + 0.48 * pulseMs) / durationMs});
    keyframes.push({transform: `translate3d(${amplitudePx * 0.38}px, ${amplitudePx * 0.12}px, 0)`, offset: (cursor + 0.72 * pulseMs) / durationMs});
    cursor += pulseMs;
    keyframes.push({transform: zero, offset: cursor / durationMs});
  }
  return Object.freeze({durationMs, keyframes: Object.freeze(keyframes)});
}

export function createDomCameraFxRenderer({
  element,
  animate = defaultAnimate
}) {
  if (!element || typeof element !== "object") {
    throw new TypeError("camera FX element is required");
  }
  if (typeof animate !== "function") {
    throw new TypeError("animate must be a function");
  }

  let disposed = false;
  let active = null;

  function cancel() {
    if (active?.animation?.cancel) {
      active.animation.cancel();
    }
    active = null;
  }

  function play(plan) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        finished: Promise.resolve({ status: "disposed" })
      });
    }
    if (!plan || plan.type !== "camera-shake") {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({ status: "ignored" })
      });
    }

    // Validate the legacy fields too. Sequence timing itself is owned by
    // cameraShakeTimelineV1, not an additional scheduler.
    positiveFinite(plan.durationMs, "camera-shake.durationMs");
    positiveFinite(plan.amplitudePx, "camera-shake.amplitudePx");
    const timeline = cameraShakeTimelineV1(plan);
    cancel();
    const animation = animate(element, timeline.keyframes, {
      duration: timeline.durationMs,
      easing: Array.isArray(plan.sequence) && plan.sequence.length > 0 ? "linear" : "ease-out",
      fill: "none"
    });

    const record = { animation };
    active = record;
    const sourceFinished =
      animation?.finished && typeof animation.finished.then === "function"
        ? animation.finished
        : Promise.resolve();

    const finished = Promise.resolve(sourceFinished)
      .then(() => {
        if (active === record) {
          active = null;
        }
        return { status: "finished" };
      })
      .catch((error) => {
        if (active === record) {
          active = null;
        }
        if (error?.name === "AbortError") {
          return { status: "cancelled" };
        }
        throw error;
      });

    return Object.freeze({
      status: "running",
      animation,
      finished
    });
  }

  function dispose() {
    if (disposed) {
      return;
    }
    cancel();
    disposed = true;
  }

  return Object.freeze({
    play,
    cancel,
    dispose
  });
}
