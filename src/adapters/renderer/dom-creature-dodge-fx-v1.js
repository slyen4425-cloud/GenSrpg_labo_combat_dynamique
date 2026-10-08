import {
  applySpriteVisual
} from "./dom-skill-fx.js";
import {
  CREATURE_DODGE_VISUAL_DEFAULT_DURATION_MS_V3
} from "../../contracts/creature-presentation-binding-v3.js";

const DODGE_APPEARANCE_FX_PRESET_V1 =
  Object.freeze({
    zIndex: 15,
    enterScale: 0.72,
    activeScale: 1,
    holdScale: 1.06,
    exitScale: 1.12,
    enterOffset: 0.18,
    holdOffset: 0.72,
    enterOpacity: 0,
    activeOpacity: 1,
    holdOpacity: 0.92,
    exitOpacity: 0
  });

function defaultAnimate(
  element,
  keyframes,
  options
) {
  if (typeof element.animate !== "function") {
    throw new TypeError(
      "Dodge FX element does not support Web Animations API"
    );
  }
  return element.animate(
    keyframes,
    options
  );
}

function finitePositive(value, field) {
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    throw new RangeError(
      field + " must be greater than 0"
    );
  }
  return number;
}

function finite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(
      field + " must be finite"
    );
  }
  return number;
}

export function playDomCreatureDodgeFxV1({
  arena,
  anchor,
  visual,
  durationMs,
  animate = defaultAnimate
}) {
  if (
    !arena ||
    typeof arena.append !== "function" ||
    !arena.ownerDocument
  ) {
    throw new TypeError(
      "arena must be a DOM-like element"
    );
  }
  if (
    !anchor ||
    typeof anchor.getBoundingClientRect !==
      "function"
  ) {
    throw new TypeError(
      "anchor must expose getBoundingClientRect()"
    );
  }
  if (
    !visual ||
    typeof visual !== "object"
  ) {
    return Object.freeze({
      status: "ignored",
      finished: Promise.resolve({
        status: "ignored"
      }),
      cancel() {}
    });
  }

  const url =
    typeof visual.url === "string"
      ? visual.url.trim()
      : "";
  if (url === "") {
    return Object.freeze({
      status: "ignored",
      finished: Promise.resolve({
        status: "ignored"
      }),
      cancel() {}
    });
  }

  // This timing is purely presentation-owned, not the combat invulnerability window.
  const duration =
    finitePositive(
      visual.durationMs ?? CREATURE_DODGE_VISUAL_DEFAULT_DURATION_MS_V3,
      "visual.durationMs"
    );
  const displayScale =
    finitePositive(
      visual.displayScale ?? 1,
      "visual.displayScale"
    );
  const offsetX =
    finite(
      visual.offsetX ?? 0,
      "visual.offsetX"
    );
  const offsetY =
    finite(
      visual.offsetY ?? 0,
      "visual.offsetY"
    );

  const arenaRect =
    arena.getBoundingClientRect();
  const actorRect =
    anchor.getBoundingClientRect();
  const centerX =
    actorRect.left -
    arenaRect.left +
    actorRect.width / 2;
  const centerY =
    actorRect.top -
    arenaRect.top +
    actorRect.height / 2;
  const baseSize =
    Math.max(
      1,
      actorRect.width,
      actorRect.height
    );

  const node =
    arena.ownerDocument.createElement(
      "span"
    );
  node.className =
    "skill-fx skill-fx--creature-dodge";
  node.dataset.skillFx =
    "creature-dodge";
  node.dataset.assetId =
    visual.assetId ?? "";
  node.style.left =
    centerX + offsetX + "px";
  node.style.top =
    centerY + offsetY + "px";
  node.style.width =
    baseSize * displayScale + "px";
  node.style.height =
    baseSize * displayScale + "px";
  node.style.aspectRatio = "1";
  node.style.zIndex =
    String(
      DODGE_APPEARANCE_FX_PRESET_V1
        .zIndex
    );
  node.style.pointerEvents = "none";

  const sprite =
    applySpriteVisual(
      node,
      {
        ...visual,
        playbackMode: "stretch"
      },
      duration,
      animate
    );

  if (!sprite.bound) {
    return Object.freeze({
      status: "ignored",
      finished: Promise.resolve({
        status: "ignored"
      }),
      cancel() {}
    });
  }

  arena.append(node);

  const animation =
    animate(
      node,
      [
        {
          opacity:
            DODGE_APPEARANCE_FX_PRESET_V1
              .enterOpacity,
          transform:
            "translate(-50%, -50%) scale(" +
            DODGE_APPEARANCE_FX_PRESET_V1
              .enterScale +
            ")"
        },
        {
          opacity:
            DODGE_APPEARANCE_FX_PRESET_V1
              .activeOpacity,
          transform:
            "translate(-50%, -50%) scale(" +
            DODGE_APPEARANCE_FX_PRESET_V1
              .activeScale +
            ")",
          offset:
            DODGE_APPEARANCE_FX_PRESET_V1
              .enterOffset
        },
        {
          opacity:
            DODGE_APPEARANCE_FX_PRESET_V1
              .holdOpacity,
          transform:
            "translate(-50%, -50%) scale(" +
            DODGE_APPEARANCE_FX_PRESET_V1
              .holdScale +
            ")",
          offset:
            DODGE_APPEARANCE_FX_PRESET_V1
              .holdOffset
        },
        {
          opacity:
            DODGE_APPEARANCE_FX_PRESET_V1
              .exitOpacity,
          transform:
            "translate(-50%, -50%) scale(" +
            DODGE_APPEARANCE_FX_PRESET_V1
              .exitScale +
            ")"
        }
      ],
      {
        duration,
        easing: "ease-out",
        fill: "forwards"
      }
    );

  let cancelled = false;

  function cleanup() {
    sprite.frameAnimation?.cancel?.();
    node.remove?.();
  }

  const finished =
    Promise.resolve(
      animation.finished
    )
      .then(() => {
        cleanup();
        return {
          status: "finished"
        };
      })
      .catch((error) => {
        cleanup();
        if (
          cancelled ||
          error?.name === "AbortError"
        ) {
          return {
            status: "cancelled"
          };
        }
        throw error;
      });

  return Object.freeze({
    status: "running",
    animation,
    finished,
    cancel() {
      if (cancelled) {
        return;
      }
      cancelled = true;
      animation.cancel?.();
      sprite.frameAnimation?.cancel?.();
      node.remove?.();
    }
  });
}
