import {
  animationPlanToDomTimeline,
  composeDomFilter,
  composeDomShadowTransform,
  composeDomTransform
} from "./dom-keyframes.js";

function defaultAnimate(element, keyframes, options) {
  if (typeof element.animate !== "function") {
    throw new TypeError("DOM actor element does not support Web Animations API");
  }
  return element.animate(keyframes, options);
}

function defaultReadComputedStyle(element, pseudoElement = null) {
  if (typeof globalThis.getComputedStyle !== "function") {
    throw new TypeError("getComputedStyle is required to interrupt an active motion");
  }
  return globalThis.getComputedStyle(element, pseudoElement);
}

export function createDomActorRenderer({
  element,
  shadowElement = null,
  actor,
  animate = defaultAnimate,
  readComputedStyle = defaultReadComputedStyle
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
  if (typeof readComputedStyle !== "function") {
    throw new TypeError("readComputedStyle must be a function");
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
    element.style.transformOrigin =
      `${actor.transformOrigin.x} ${actor.transformOrigin.y}`;
    element.style.opacity = "1";
    element.style.filter = "none";
    shadowElement?.style?.setProperty?.("--creature-shadow-transform", composeDomShadowTransform(actor));
    shadowElement?.style?.setProperty?.("--creature-shadow-fade", "1");
  }

  function applyFinalPlanState(plan) {
    const finalSegment = plan.segments.at(-1);
    element.style.transform = composeDomTransform(
      actor,
      finalSegment?.transform
    );
    element.style.transformOrigin =
      `${actor.transformOrigin.x} ${actor.transformOrigin.y}`;
    element.style.opacity = String(finalSegment?.opacity ?? 1);
    element.style.filter = composeDomFilter(finalSegment?.filter);
    shadowElement?.style?.setProperty?.("--creature-shadow-transform", composeDomShadowTransform(actor, finalSegment?.ground));
    shadowElement?.style?.setProperty?.("--creature-shadow-fade", String(finalSegment?.opacity ?? 1));
  }

  function cancel({ restore = true } = {}) {
    sequence += 1;
    for (const animation of active?.animations ?? []) {
      animation.cancel?.();
    }
    active = null;
    if (restore) {
      restoreBaseState();
    }
  }


  function currentStyleSnapshot(target, pseudoElement = null, fallbackTransform) {
    const computed = readComputedStyle(target, pseudoElement);
    const transform =
      computed?.transform && computed.transform !== "none"
        ? computed.transform
        : fallbackTransform;
    const opacity =
      computed?.opacity && computed.opacity !== ""
        ? String(computed.opacity)
        : "1";
    const filter =
      computed?.filter && computed.filter !== ""
        ? String(computed.filter)
        : "none";

    return Object.freeze({ transform, opacity, filter });
  }

  function returnActiveToBaseFromCurrent({
    durationMs = 180,
    easing = "ease-out"
  } = {}) {
    assertActiveRenderer();

    const duration = Number(durationMs);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new RangeError("return durationMs must be a positive finite number");
    }

    if (!active) {
      restoreBaseState();
      return Object.freeze({
        status: "idle",
        finished: Promise.resolve({ status: "finished" })
      });
    }

    const bodyStart = currentStyleSnapshot(
      element,
      null,
      composeDomTransform(actor)
    );
    const shadowStart = shadowElement
      ? currentStyleSnapshot(
          shadowElement,
          "::before",
          composeDomShadowTransform(actor)
        )
      : null;

    // Freeze the visually observed pose as the start of the one renderer-owned
    // return. The previous WAAPI owner is cancelled without restoring base first,
    // otherwise a contact interruption would visibly teleport the actor home.
    cancel({ restore: false });

    const token = ++sequence;
    const animation = animate(
      element,
      [
        {
          transform: bodyStart.transform,
          transformOrigin:
            `${actor.transformOrigin.x} ${actor.transformOrigin.y}`,
          opacity: bodyStart.opacity,
          filter: bodyStart.filter
        },
        {
          transform: composeDomTransform(actor),
          transformOrigin:
            `${actor.transformOrigin.x} ${actor.transformOrigin.y}`,
          opacity: "1",
          filter: "none"
        }
      ],
      {
        duration,
        iterations: 1,
        fill: "none",
        easing
      }
    );

    if (!animation || typeof animation !== "object") {
      restoreBaseState();
      throw new TypeError("animate must return an animation-like object");
    }

    const animations = [animation];
    let shadowAnimation = null;
    if (shadowElement) {
      try {
        shadowAnimation = animate(
          shadowElement,
          [
            {
              transform: shadowStart.transform,
              opacity: shadowStart.opacity
            },
            {
              transform: composeDomShadowTransform(actor),
              opacity: "1"
            }
          ],
          {
            duration,
            iterations: 1,
            fill: "none",
            easing,
            pseudoElement: "::before"
          }
        );
        if (!shadowAnimation || typeof shadowAnimation !== "object") {
          throw new TypeError(
            "animate must return an animation-like object for the shadow"
          );
        }
        animations.push(shadowAnimation);
      } catch (error) {
        Promise.resolve(animation.finished).catch(() => {});
        animation.cancel?.();
        restoreBaseState();
        throw error;
      }
    }

    const plan = Object.freeze({
      actorId: actor.id,
      eventType: "contact-return",
      restoreBaseState: true,
      segments: Object.freeze([])
    });
    active = {
      token,
      animation,
      animations,
      plan,
      timeline: null
    };

    if (shadowAnimation) {
      Promise.all([animation.ready, shadowAnimation.ready])
        .then(() => {
          if (
            !disposed &&
            active?.token === token &&
            animation.startTime != null
          ) {
            shadowAnimation.startTime = animation.startTime;
          }
        })
        .catch(() => {});
    }

    const finished = settleAnimation({
      animations,
      plan,
      token
    });

    return Object.freeze({
      status: "returning",
      animation,
      ...(shadowAnimation ? { shadowAnimation } : {}),
      finished
    });
  }

  function settleAnimation({ animations, plan, token }) {
    const sourceFinished = Promise.all(animations.map(animation =>
      animation.finished && typeof animation.finished.then === "function"
        ? animation.finished
        : Promise.resolve()
    ));

    return Promise.resolve(sourceFinished)
      .then(() => {
        if (!disposed && active?.token === token) {
          active = null;
          if (plan.restoreBaseState) {
            restoreBaseState();
          } else {
            applyFinalPlanState(plan);
          }
        }
        return { status: "finished", plan };
      })
      .catch((error) => {
        if (!disposed && active?.token === token) {
          for (const animation of animations) animation.cancel?.();
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

    const animations = [animation];
    let shadowAnimation = null;
    if (shadowElement) {
      try {
        shadowAnimation = animate(shadowElement, timeline.shadowKeyframes, {
          ...timeline.options,
          pseudoElement: "::before"
        });
        if (!shadowAnimation || typeof shadowAnimation !== "object") {
          throw new TypeError("animate must return an animation-like object for the shadow");
        }
        animations.push(shadowAnimation);
      } catch (error) {
        Promise.resolve(animation.finished).catch(() => {});
        animation.cancel?.();
        restoreBaseState();
        throw error;
      }
    }

    const record = {
      token,
      animation,
      animations,
      plan,
      timeline
    };
    active = record;

    if (shadowAnimation) {
      Promise.all([animation.ready, shadowAnimation.ready]).then(() => {
        if (!disposed && active?.token === token && animation.startTime != null) {
          shadowAnimation.startTime = animation.startTime;
        }
      }).catch(() => {});
    }

    // Always observe Animation.finished, including infinite/looping animations.
    // Web Animations rejects this promise with AbortError when cancel() is called.
    // Consuming that rejection here keeps cancellation owned by the renderer and
    // prevents unhandled promise rejections in clients that do not await the handle.
    const finished = settleAnimation({ animations, plan, token });

    return Object.freeze({
      animation,
      ...(shadowAnimation ? { shadowAnimation } : {}),
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

  element.style.willChange = "transform, opacity, filter";
  restoreBaseState();

  return Object.freeze({
    play,
    returnActiveToBaseFromCurrent,
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
