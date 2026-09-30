function defaultAnimate(element, keyframes, options) {
  if (typeof element.animate !== "function") {
    throw new TypeError(
      "camera FX element does not support Web Animations API"
    );
  }
  return element.animate(keyframes, options);
}

function positive(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(
      `${field} must be a finite number greater than 0`
    );
  }
  return number;
}

export function createDomCameraFxRenderer({
  element,
  animate = defaultAnimate
}) {
  if (!element || typeof element !== "object") {
    throw new TypeError("element is required");
  }
  if (!element.style || typeof element.style !== "object") {
    throw new TypeError("element.style is required");
  }
  if (typeof animate !== "function") {
    throw new TypeError("animate must be a function");
  }

  let active = null;
  let disposed = false;

  function restore() {
    element.style.transform = "";
  }

  function cancel() {
    active?.cancel?.();
    active = null;
    restore();
  }

  function play(plan) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        finished: Promise.resolve({
          status: "disposed"
        })
      });
    }
    if (!plan || plan.type !== "camera-shake") {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({
          status: "ignored"
        })
      });
    }

    const amplitudePx = positive(
      plan.amplitudePx,
      "camera-shake.amplitudePx"
    );
    const durationMs = positive(
      plan.durationMs,
      "camera-shake.durationMs"
    );

    cancel();

    const keyframes = Object.freeze([
      Object.freeze({
        transform: "translate3d(0px, 0px, 0)"
      }),
      Object.freeze({
        transform:
          `translate3d(${amplitudePx}px, ${-amplitudePx * 0.45}px, 0)`
      }),
      Object.freeze({
        transform:
          `translate3d(${-amplitudePx * 0.75}px, ${amplitudePx * 0.3}px, 0)`
      }),
      Object.freeze({
        transform:
          `translate3d(${amplitudePx * 0.35}px, 0px, 0)`
      }),
      Object.freeze({
        transform: "translate3d(0px, 0px, 0)"
      })
    ]);

    const animation = animate(
      element,
      keyframes,
      {
        duration: durationMs,
        iterations: 1,
        easing: "ease-out",
        fill: "none"
      }
    );

    active = animation;
    const sourceFinished =
      animation?.finished &&
      typeof animation.finished.then === "function"
        ? animation.finished
        : Promise.resolve();

    const finished = Promise.resolve(
      sourceFinished
    )
      .then(() => {
        if (active === animation) {
          active = null;
          restore();
        }
        return {
          status: "finished",
          plan
        };
      })
      .catch((error) => {
        if (active === animation) {
          active = null;
          restore();
        }
        if (error?.name === "AbortError") {
          return {
            status: "cancelled",
            plan
          };
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
