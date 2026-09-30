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

    const durationMs = positiveFinite(
      plan.durationMs,
      "camera-shake.durationMs"
    );
    const amplitudePx = positiveFinite(
      plan.amplitudePx,
      "camera-shake.amplitudePx"
    );

    cancel();

    const animation = animate(
      element,
      [
        { transform: "translate3d(0, 0, 0)", offset: 0 },
        {
          transform: `translate3d(${amplitudePx}px, ${amplitudePx * 0.35}px, 0)`,
          offset: 0.2
        },
        {
          transform: `translate3d(${-amplitudePx * 0.75}px, ${-amplitudePx * 0.22}px, 0)`,
          offset: 0.48
        },
        {
          transform: `translate3d(${amplitudePx * 0.38}px, ${amplitudePx * 0.12}px, 0)`,
          offset: 0.72
        },
        { transform: "translate3d(0, 0, 0)", offset: 1 }
      ],
      {
        duration: durationMs,
        easing: "ease-out",
        fill: "none"
      }
    );

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
