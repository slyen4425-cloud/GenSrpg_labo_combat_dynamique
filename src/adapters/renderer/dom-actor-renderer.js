import { animationPlanToDomTimeline, composeDomTransform } from "./dom-keyframes.js";

function defaultAnimate(element, keyframes, options) {
  if (typeof element.animate !== "function") {
    throw new TypeError("DOM actor element does not support Web Animations API");
  }
  return element.animate(keyframes, options);
}

export function createDomActorRenderer({
  element,
  actor,
  animate = defaultAnimate
}) {
  if (!element || typeof element !== "object") {
    throw new TypeError("element is required");
  }
  if (!element.style || typeof element.style !== "object") {
    throw new TypeError("element.style is required");
  }
  if (!actor || typeof actor !== "object") {
    throw new TypeError("actor is required");
  }
  if (typeof animate !== "function") {
    throw new TypeError("animate must be a function");
  }

  let disposed = false;
  let active = null;
  let sequence = 0;

  function assertActiveRenderer() {
    if (disposed) {
      throw new Error("DOM actor renderer has been disposed");
    }
  }

  function restoreBaseState() {
    element.style.transform = composeDomTransform(actor);
    element.style.opacity = "1";
  }

  function cancel({ restore = true } = {}) {
    sequence += 1;
    if (active?.animation && typeof active.animation.cancel === "function") {
      active.animation.cancel();
    }
    active = null;
    if (restore) {
      restoreBaseState();
    }
  }

  function settleAnimation({ animation, plan, token }) {
    const sourceFinished = animation.finished && typeof animation.finished.then === "function"
      ? animation.finished
      : Promise.resolve();

    return Promise.resolve(sourceFinished)
      .then(() => {
        if (!disposed && active?.token === token) {
          active = null;
          restoreBaseState();
        }
        return { status: "finished", plan };
      })
      .catch((error) => {
        if (!disposed && active?.token === token) {
          active = null;
          restoreBaseState();
        }

        if (error?.name === "AbortError") {
          return { status: "cancelled", plan };
        }
        throw error;
      });
  }

  function play(plan) {
    assertActiveRenderer();

    if (!plan || plan.actorId !== actor.id) {
      throw new Error("AnimationPlan does not belong to this renderer actor");
    }

    cancel({ restore: true });

    const timeline = animationPlanToDomTimeline(plan, actor);
    const token = ++sequence;
    const animation = animate(element, timeline.keyframes, timeline.options);

    if (!animation || typeof animation !== "object") {
      throw new TypeError("animate must return an animation-like object");
    }

    const record = {
      token,
      animation,
      plan,
      timeline
    };
    active = record;

    // Always observe Animation.finished, including infinite/looping animations.
    // Web Animations rejects this promise with AbortError when cancel() is called.
    // Consuming that rejection here keeps cancellation owned by the renderer and
    // prevents unhandled promise rejections in clients that do not await the handle.
    const finished = settleAnimation({ animation, plan, token });

    return Object.freeze({
      animation,
      timeline,
      finished
    });
  }

  function dispose() {
    if (disposed) {
      return;
    }
    cancel({ restore: true });
    element.style.willChange = "";
    disposed = true;
  }

  element.style.willChange = "transform, opacity";
  restoreBaseState();

  return Object.freeze({
    play,
    cancel,
    dispose,
    restoreBaseState,
    get isDisposed() {
      return disposed;
    },
    get hasActiveAnimation() {
      return active !== null;
    }
  });
}
