import { sweptPointHitsOpaqueMask } from "./dom-visible-model-contact.js";

function defaultAnimate(element, keyframes, options) {
  if (typeof element.animate !== "function") {
    throw new TypeError("skill FX element does not support Web Animations API");
  }
  return element.animate(keyframes, options);
}

function defaultRequestFrame(callback) {
  return typeof globalThis.requestAnimationFrame === "function"
    ? globalThis.requestAnimationFrame(callback)
    : null;
}

function defaultCancelFrame(frameId) {
  if (
    frameId !== null &&
    typeof globalThis.cancelAnimationFrame === "function"
  ) {
    globalThis.cancelAnimationFrame(frameId);
  }
}

function rectCenter(rect) {
  return Object.freeze({
    x: Number(rect.left) + Number(rect.width) / 2,
    y: Number(rect.top) + Number(rect.height) / 2
  });
}

function centerRelativeTo(rect, arenaRect) {
  return Object.freeze({
    x: rect.left - arenaRect.left + rect.width / 2,
    y: rect.top - arenaRect.top + rect.height / 2
  });
}

function clampUnit(value, fallback = 0.5) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, numeric));
}

function percent(value) {
  const rounded = Math.round(Number(value) * 10000) / 100;
  return `${rounded}%`;
}

const PERSISTENT_ZONE_RADIUS_SCALE = Object.freeze({
  short: 1,
  medium: 1.45,
  long: 1.9
});

function persistentZoneRadiusScale(radius) {
  const scale = PERSISTENT_ZONE_RADIUS_SCALE[radius];
  if (scale == null) {
    throw new RangeError(
      "Unsupported persistent zone radius: " + radius
    );
  }
  return scale;
}

function hasSpriteVisual(visual) {
  return Boolean(
    visual?.url ||
    (Array.isArray(visual?.frames) && visual.frames.length > 0)
  );
}

function visualPlaybackMs(visual, fallbackMs = 1) {
  if (Array.isArray(visual?.frames) && visual.frames.length > 0) {
    const frameMs = Math.max(1, Number(visual.frameMs) || 1);
    return frameMs * visual.frames.length;
  }
  return Math.max(1, Number(fallbackMs) || 1);
}

// Uses the existing Runtime owner's expiry. Refresh extends one playback; it does not create another clock.
export function spriteOwnerDurationMs(owner, startedAtMs = owner?.appliedAtMs, fallbackMs = 1000) {
  const duration = owner?.expiresAtMs == null || startedAtMs == null
    ? 0 : Number(owner.expiresAtMs) - Number(startedAtMs);
  return Number.isFinite(duration) && duration > 0
    ? duration : Math.max(1, Number(owner?.definition?.durationMs ?? owner?.durationMs) || Number(fallbackMs) || 1);
}

export function applySpriteVisual(node, visual, durationMs, animate = defaultAnimate) {
  if (!hasSpriteVisual(visual)) {
    return Object.freeze({
      bound: false,
      frameAnimation: null,
      playbackMs: 0
    });
  }

  node.className += " skill-fx--sprite";
  node.dataset.assetId = visual.assetId ?? "";
  node.style.backgroundRepeat = "no-repeat";

  if (Array.isArray(visual.frames) && visual.frames.length > 0) {
    const frames = visual.frames.filter(Boolean);
    const playbackMode =
      ["once", "loop", "stretch"].includes(visual.playbackMode)
        ? visual.playbackMode
        : "once";
    const nativePlaybackMs = visualPlaybackMs(visual, durationMs);
    const playbackMs =
      playbackMode === "stretch"
        ? Math.max(1, Number(durationMs) || nativePlaybackMs)
        : nativePlaybackMs;

    node.style.backgroundImage = `url("${frames[0]}")`;
    node.style.backgroundSize = "100% 100%";
    node.style.backgroundPosition = "center";

    if (
      frames.length > 1 &&
      playbackMode === "loop" &&
      node.ownerDocument?.createElement
    ) {
      node.style.backgroundImage = "none";
      const frameAnimations = [];
      const frameCount = frames.length;

      frames.forEach((url, index) => {
        const frame =
          node.ownerDocument.createElement("img");
        frame.className =
          "skill-fx__loop-frame";
        frame.src = url;
        frame.alt = "";
        frame.style.opacity = "0";
        node.append(frame);

        const start = index / frameCount;
        const end = (index + 1) / frameCount;
        const epsilon = Math.min(
          0.001,
          1 / (frameCount * 100)
        );
        const keyframes =
          index === 0
            ? [
                { opacity: 1, offset: 0 },
                {
                  opacity: 1,
                  offset: Math.max(0, end - epsilon)
                },
                { opacity: 0, offset: end },
                { opacity: 0, offset: 1 }
              ]
            : index === frameCount - 1
              ? [
                  { opacity: 0, offset: 0 },
                  {
                    opacity: 0,
                    offset: Math.max(0, start - epsilon)
                  },
                  { opacity: 1, offset: start },
                  { opacity: 1, offset: 1 }
                ]
              : [
                  { opacity: 0, offset: 0 },
                  {
                    opacity: 0,
                    offset: Math.max(0, start - epsilon)
                  },
                  { opacity: 1, offset: start },
                  {
                    opacity: 1,
                    offset: Math.max(start, end - epsilon)
                  },
                  { opacity: 0, offset: end },
                  { opacity: 0, offset: 1 }
                ];

        const animation = animate(
          frame,
          keyframes,
          {
            duration: playbackMs,
            easing: "linear",
            fill: "both",
            iterations: Infinity
          }
        );
        frameAnimations.push(animation);
        Promise.resolve(
          animation?.finished
        ).catch(() => {});
      });

      return Object.freeze({
        bound: true,
        frameAnimation: Object.freeze({
          cancel() {
            for (const animation of frameAnimations) {
              animation?.cancel?.();
            }
          }
        }),
        playbackMs
      });
    }

    let frameAnimation = null;
    if (frames.length > 1) {
      frameAnimation = animate(
        node,
        frames.map((url, index) => ({
          backgroundImage: `url("${url}")`,
          offset: index / (frames.length - 1)
        })),
        {
          duration: playbackMs,
          easing: "steps(1, end)",
          fill: "forwards",
          iterations:
            playbackMode === "loop"
              ? Infinity
              : 1
        }
      );

      Promise.resolve(frameAnimation?.finished).catch(() => {});
    }

    return Object.freeze({
      bound: true,
      frameAnimation,
      playbackMs,
      setDuration(duration) { frameAnimation?.effect?.updateTiming?.({ duration: Math.max(1, Number(duration) || 1) }); }
    });
  }

  const frameCount = Math.max(
    1,
    Math.floor(Number(visual.frameCount) || 1)
  );
  const playbackMode =
    ["once", "loop", "stretch"].includes(
      visual.playbackMode
    )
      ? visual.playbackMode
      : "once";
  const nativePlaybackMs =
    Number.isFinite(Number(visual.frameMs)) &&
    Number(visual.frameMs) > 0
      ? Math.max(
          1,
          Number(visual.frameMs) * frameCount
        )
      : Math.max(
          1,
          Number(durationMs) || 1
        );
  const duration =
    playbackMode === "stretch"
      ? Math.max(
          1,
          Number(durationMs) || nativePlaybackMs
        )
      : nativePlaybackMs;

  node.style.backgroundImage = `url("${visual.url}")`;
  node.style.backgroundSize = `${frameCount * 100}% 100%`;
  node.style.backgroundPosition = "0% 0%";
  node.style.animationName = "skill-fx-strip";
  node.style.animationDuration = `${duration}ms`;
  node.style.animationTimingFunction =
    frameCount > 1 && playbackMode === "loop"
      ? `steps(${frameCount}, jump-none)`
      : `steps(${Math.max(1, frameCount - 1)}, end)`;
  node.style.animationIterationCount =
    playbackMode === "loop" ? "infinite" : "1";
  node.style.animationFillMode = "forwards";

  return Object.freeze({
    bound: true,
    frameAnimation: null,
    playbackMs: duration,
    setDuration(duration) { node.style.animationDuration = `${Math.max(1, Number(duration) || 1)}ms`; }
  });
}

export function createDomSkillFxRenderer({
  arena,
  anchors,
  targetAnchors = anchors,
  sourceAnchorFor = null,
  missLabel = "RATÉ",
  presentationForSkill = () => null,
  animate = defaultAnimate,
  requestFrame = defaultRequestFrame,
  cancelFrame = defaultCancelFrame,
  onProjectileContact = null,
  targetCollisionModelFor = null,
  playCameraFx = null
}) {
  if (!arena || typeof arena.append !== "function" || !arena.ownerDocument) {
    throw new TypeError("arena must be a DOM-like element");
  }
  if (!anchors || typeof anchors !== "object") {
    throw new TypeError("anchors are required");
  }
  if (!targetAnchors || typeof targetAnchors !== "object") {
    throw new TypeError("targetAnchors are required");
  }
  if (typeof presentationForSkill !== "function") {
    throw new TypeError("presentationForSkill must be a function");
  }
  if (sourceAnchorFor !== null && typeof sourceAnchorFor !== "function") {
    throw new TypeError("sourceAnchorFor must be a function when supplied");
  }
  if (typeof requestFrame !== "function" || typeof cancelFrame !== "function") {
    throw new TypeError("frame scheduler functions are required");
  }
  if (
    onProjectileContact !== null &&
    typeof onProjectileContact !== "function"
  ) {
    throw new TypeError(
      "onProjectileContact must be a function when supplied"
    );
  }
  if (
    onProjectileContact !== null &&
    typeof targetCollisionModelFor !== "function"
  ) {
    throw new TypeError(
      "targetCollisionModelFor must be a function when projectile contact is enabled"
    );
  }
  if (
    playCameraFx !== null &&
    typeof playCameraFx !== "function"
  ) {
    throw new TypeError(
      "playCameraFx must be a function when supplied"
    );
  }

  let disposed = false;
  const active = new Set();
  const persistentZones = new Map();

  function anchor(collection, slot, label) {
    const element = collection[slot];
    if (!element || typeof element.getBoundingClientRect !== "function") {
      throw new RangeError(`Unknown FX ${label} anchor: ${slot}`);
    }
    return element;
  }
  function sourceRect(slot, anchorName = null) {
    if (anchorName && sourceAnchorFor) {
      const rect = sourceAnchorFor(slot, anchorName);
      if (
        !rect ||
        !Number.isFinite(Number(rect.left)) ||
        !Number.isFinite(Number(rect.top))
      ) {
        throw new RangeError(
          `Unknown FX source anchor: ${slot}.${anchorName}`
        );
      }
      return rect;
    }

    return anchor(anchors, slot, "source").getBoundingClientRect();
  }


  function cleanup(record) {
    if (!record || !active.has(record)) {
      return;
    }
    active.delete(record);
    if (record.zoneId) {
      persistentZones.delete(record.zoneId);
    }
    if (
      record.contactFrameId !== null &&
      record.contactFrameId !== undefined
    ) {
      cancelFrame(record.contactFrameId);
      record.contactFrameId = null;
    }
    record.frameAnimation?.cancel?.();
    record.node.remove?.();
  }

  function watchProjectileContact(record) {
    if (
      onProjectileContact === null ||
      !record?.node ||
      typeof record.node.getBoundingClientRect !== "function"
    ) {
      return;
    }

    const collisionModel =
      targetCollisionModelFor(record.targetSlot);
    if (
      !collisionModel ||
      typeof collisionModel.snapshot !== "function"
    ) {
      return;
    }

    record.previousProjectilePoint = rectCenter(
      record.node.getBoundingClientRect()
    );
    record.previousTargetFrame =
      collisionModel.snapshot();

    const check = () => {
      record.contactFrameId = null;

      if (
        disposed ||
        !active.has(record) ||
        record.contactReported
      ) {
        return;
      }

      const projectilePoint = rectCenter(
        record.node.getBoundingClientRect()
      );
      const targetFrame =
        collisionModel.snapshot();

      const contacted =
        targetFrame !== null &&
        sweptPointHitsOpaqueMask({
          mask: targetFrame.mask,
          previousPoint:
            record.previousProjectilePoint,
          point: projectilePoint,
          previousFrame:
            record.previousTargetFrame ??
            targetFrame,
          frame: targetFrame
        });

      record.previousProjectilePoint =
        projectilePoint;
      record.previousTargetFrame =
        targetFrame;

      if (contacted) {
        record.contactReported = true;
        onProjectileContact(
          Object.freeze({
            actorId: record.fromSlot,
            targetId: record.targetSlot,
            skillId: record.skillId ?? null
          })
        );
        return;
      }

      record.contactFrameId =
        requestFrame(check);
    };

    record.contactFrameId =
      requestFrame(check);
  }

  function applyPresentationGlow(
    node,
    glow
  ) {
    if (!node || !glow) {
      return;
    }

    const radiusPx = Math.max(
      1,
      Number(glow.radiusPx) || 1
    );
    const strength = clampUnit(
      glow.strength,
      0
    );
    const color =
      typeof glow.color === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(glow.color)
        ? glow.color
        : "#ffffff";

    if (strength <= 0) {
      return;
    }

    const firstRadius =
      Math.max(1, radiusPx * 0.55);
    const secondRadius =
      Math.max(1, radiusPx);

    const red = parseInt(
      color.slice(1, 3),
      16
    );
    const green = parseInt(
      color.slice(3, 5),
      16
    );
    const blue = parseInt(
      color.slice(5, 7),
      16
    );
    const glowColor =
      "rgba(" +
      red +
      ", " +
      green +
      ", " +
      blue +
      ", " +
      strength.toFixed(3) +
      ")";

    node.style.filter =
      "drop-shadow(0 0 " +
      firstRadius.toFixed(1) +
      "px " +
      glowColor +
      ") drop-shadow(0 0 " +
      secondRadius.toFixed(1) +
      "px " +
      glowColor +
      ")";
    node.style.opacity =
      String(
        Math.max(
          0,
          Math.min(
            1,
            Number(node.style.opacity) || 1
          )
        )
      );
    node.dataset.fxGlowStrength =
      String(strength);
  }

  function appendProjectileTrailParticles(
    node,
    trail,
    deltaX,
    deltaY,
    fallbackColor = null
  ) {
    if (!node || !trail) {
      return 0;
    }

    const count = Math.min(
      10,
      Math.max(
        0,
        Math.floor(
          Number(trail.count) || 0
        )
      )
    );
    if (count <= 0) {
      return 0;
    }

    const lengthPx = Math.max(
      1,
      Number(trail.lengthPx) || 1
    );
    const sizePx = Math.max(
      1,
      Number(trail.sizePx) || 1
    );
    const opacity = clampUnit(
      trail.opacity,
      0.7
    );

    const validColor = (value) =>
      typeof value === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(value);

    const color = validColor(trail.color)
      ? trail.color
      : validColor(fallbackColor)
        ? fallbackColor
        : "#8aa0b0";

    const distance = Math.hypot(
      deltaX,
      deltaY
    ) || 1;
    const unitX = deltaX / distance;
    const unitY = deltaY / distance;
    const angleDeg =
      Math.atan2(
        deltaY,
        deltaX
      ) *
      180 /
      Math.PI;
    const anchorX = clampUnit(
      trail.anchorX,
      0.5
    );
    const anchorY = clampUnit(
      trail.anchorY,
      0.5
    );

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      const particle =
        arena.ownerDocument.createElement(
          "span"
        );
      const ratio =
        (index + 1) / (count + 1);
      const offset =
        lengthPx * ratio;
      const taper =
        Math.max(
          0.28,
          1 - ratio * 0.68
        );
      const width =
        Math.max(
          2,
          sizePx *
            taper *
            (2.6 + (index % 3) * 0.34)
        );
      const height =
        Math.max(
          1,
          sizePx *
            taper *
            (0.46 + (index % 2) * 0.08)
        );
      const lateral =
        ((index % 3) - 1) *
        Math.min(2.6, sizePx * 0.22);

      particle.className =
        "skill-fx__trail-particle";
      particle.dataset.skillFx =
        "projectile-trail-particle";
      particle.style.position =
        "absolute";
      particle.style.left =
        "calc(" +
        percent(anchorX) +
        " - " +
        (
          unitX * offset -
          unitY * lateral
        ).toFixed(2) +
        "px)";
      particle.style.top =
        "calc(" +
        percent(anchorY) +
        " - " +
        (
          unitY * offset +
          unitX * lateral
        ).toFixed(2) +
        "px)";
      particle.style.width =
        width.toFixed(2) + "px";
      particle.style.height =
        height.toFixed(2) + "px";
      particle.style.borderRadius =
        index % 2 === 0
          ? "70% 34% 58% 42% / 52% 62% 38% 48%"
          : "62% 38% 72% 28% / 44% 58% 42% 56%";
      particle.style.background =
        "linear-gradient(90deg, transparent 0%, " +
        color +
        " 52%, " +
        color +
        " 100%)";
      particle.style.opacity =
        String(
          Math.max(
            0.05,
            opacity *
              (1 - ratio * 0.76)
          )
        );
      particle.style.boxShadow =
        "0 0 " +
        Math.max(
          1.5,
          height * 0.85
        ).toFixed(1) +
        "px " +
        color;
      particle.style.filter =
        "blur(" +
        (
          0.25 +
          ratio * 0.55
        ).toFixed(2) +
        "px)";
      particle.style.transformOrigin =
        "100% 50%";
      particle.style.transform =
        "translate(-50%, -50%) rotate(" +
        angleDeg.toFixed(2) +
        "deg) scaleX(" +
        (
          0.9 +
          (index % 3) * 0.08
        ).toFixed(2) +
        ")";
      particle.style.pointerEvents =
        "none";
      node.append(particle);
    }

    node.dataset.fxTrailCount =
      String(count);
    node.dataset.fxTrailShape =
      "streak";
    node.dataset.fxTrailAnchorX =
      String(anchorX);
    node.dataset.fxTrailAnchorY =
      String(anchorY);
    return count;
  }

  function appendCastBurstParticles(
    node,
    burst,
    fallbackColor = null
  ) {
    if (!node || !burst) {
      return [];
    }

    const count = Math.min(
      12,
      Math.max(
        0,
        Math.floor(
          Number(burst.count) || 0
        )
      )
    );
    if (count <= 0) {
      return [];
    }

    const spreadPx = Math.max(
      1,
      Number(burst.spreadPx) || 1
    );
    const sizePx = Math.max(
      1,
      Number(burst.sizePx) || 1
    );
    const risePx = Math.max(
      1,
      Number(burst.risePx) || 1
    );
    const durationMs = Math.max(
      1,
      Number(burst.durationMs) || 1
    );
    const opacity = clampUnit(
      burst.opacity,
      0.7
    );
    const validColor = (value) =>
      typeof value === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(value);
    const color = validColor(burst.color)
      ? burst.color
      : validColor(fallbackColor)
        ? fallbackColor
        : "#8aa0b0";

    const animations = [];

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      const particle =
        arena.ownerDocument.createElement(
          "span"
        );
      const angle =
        Math.PI * 2 * index / count +
        (index % 2 === 0 ? 0.14 : -0.09);
      const distance =
        spreadPx *
        (0.5 + (index % 3) * 0.16);
      const dx =
        Math.cos(angle) * distance;
      const dy =
        Math.sin(angle) * distance -
        risePx *
        (0.45 + (index % 3) * 0.18);
      const size =
        sizePx *
        (0.74 + (index % 3) * 0.14);

      particle.className =
        "skill-fx__cast-particle";
      particle.dataset.skillFx =
        "cast-burst-particle";
      particle.style.position =
        "absolute";
      particle.style.left = "50%";
      particle.style.top = "50%";
      particle.style.width =
        size.toFixed(2) + "px";
      particle.style.height =
        Math.max(1, size * 0.62).toFixed(2) +
        "px";
      particle.style.borderRadius =
        "66% 34% 58% 42% / 46% 62% 38% 54%";
      particle.style.background =
        "radial-gradient(ellipse, " +
        color +
        " 0 42%, transparent 76%)";
      particle.style.boxShadow =
        "0 0 " +
        Math.max(2, size * 0.9).toFixed(1) +
        "px " +
        color;
      particle.style.pointerEvents =
        "none";
      node.append(particle);

      animations.push(
        animate(
          particle,
          [
            {
              transform:
                "translate(-50%, -50%) translate3d(0, 0, 0) scale(0.35)",
              opacity: 0
            },
            {
              transform:
                "translate(-50%, -50%) translate3d(" +
                (dx * 0.24).toFixed(2) +
                "px, " +
                (dy * 0.18).toFixed(2) +
                "px, 0) scale(1)",
              opacity,
              offset: 0.22
            },
            {
              transform:
                "translate(-50%, -50%) translate3d(" +
                dx.toFixed(2) +
                "px, " +
                dy.toFixed(2) +
                "px, 0) scale(0.18)",
              opacity: 0
            }
          ],
          {
            duration:
              durationMs +
              (index % 4) * 24,
            easing: "ease-out",
            fill: "forwards"
          }
        )
      );
    }

    node.dataset.fxCastBurstCount =
      String(count);
    return animations;
  }

  function playImpactBurst({
    point,
    burst
  }) {
    if (!burst) {
      return null;
    }

    const count = Math.min(
      18,
      Math.max(
        0,
        Math.floor(
          Number(burst.count) || 0
        )
      )
    );
    if (count <= 0) {
      return null;
    }

    const container =
      arena.ownerDocument.createElement(
        "span"
      );
    container.className =
      "skill-fx skill-fx--impact-burst";
    container.dataset.skillFx =
      "impact-burst";
    container.style.left =
      point.x + "px";
    container.style.top =
      point.y + "px";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.zIndex = "12";
    container.style.pointerEvents =
      "none";
    container.style.overflow =
      "visible";

    const spreadPx = Math.max(
      1,
      Number(burst.spreadPx) || 1
    );
    const sizePx = Math.max(
      1,
      Number(burst.sizePx) || 1
    );
    const durationMs = Math.max(
      1,
      Number(burst.durationMs) || 1
    );
    const opacity = clampUnit(
      burst.opacity,
      0.8
    );
    const color =
      typeof burst.color === "string"
        ? burst.color
        : "#ffffff";

    const animations = [];

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      const particle =
        arena.ownerDocument.createElement(
          "span"
        );
      particle.className =
        "skill-fx__impact-particle";
      particle.dataset.skillFx =
        "impact-burst-particle";
      particle.style.position =
        "absolute";
      particle.style.left = "0";
      particle.style.top = "0";
      particle.style.width =
        sizePx + "px";
      particle.style.height =
        sizePx + "px";
      particle.style.borderRadius =
        "50%";
      particle.style.background =
        color;
      particle.style.boxShadow =
        "0 0 " +
        Math.max(2, sizePx * 1.2) +
        "px " +
        color;
      particle.style.pointerEvents =
        "none";

      container.append(particle);

      const angle =
        (
          Math.PI * 2 * index /
          count
        ) +
        (
          index % 2 === 0
            ? 0.12
            : -0.08
        );
      const distance =
        spreadPx *
        (
          0.58 +
          0.21 * (index % 3)
        );
      const dx =
        Math.cos(angle) * distance;
      const dy =
        Math.sin(angle) * distance;

      const animation = animate(
        particle,
        [
          {
            transform:
              "translate(-50%, -50%) translate3d(0, 0, 0) scale(0.45)",
            opacity: 0
          },
          {
            transform:
              "translate(-50%, -50%) translate3d(" +
              (dx * 0.18).toFixed(2) +
              "px, " +
              (dy * 0.18).toFixed(2) +
              "px, 0) scale(1)",
            opacity,
            offset: 0.18
          },
          {
            transform:
              "translate(-50%, -50%) translate3d(" +
              dx.toFixed(2) +
              "px, " +
              dy.toFixed(2) +
              "px, 0) scale(0.18)",
            opacity: 0
          }
        ],
        {
          duration:
            durationMs +
            (index % 4) * 18,
          easing: "ease-out",
          fill: "forwards"
        }
      );
      animations.push(animation);
    }

    arena.append(container);

    const compositeAnimation = {
      cancel() {
        for (
          const animation of animations
        ) {
          animation?.cancel?.();
        }
      },
      finished: Promise.all(
        animations.map(
          (animation) =>
            animation?.finished ??
            Promise.resolve()
        )
      )
    };

    const record = {
      node: container,
      animation: compositeAnimation,
      frameAnimation: null,
      type: "impact-burst"
    };
    active.add(record);

    const finished =
      Promise.resolve(
        compositeAnimation.finished
      )
        .then(() => {
          cleanup(record);
          return {
            status: "finished"
          };
        })
        .catch((error) => {
          cleanup(record);
          if (
            error?.name ===
            "AbortError"
          ) {
            return {
              status: "cancelled"
            };
          }
          throw error;
        });

    return Object.freeze({
      status: "running",
      animation: compositeAnimation,
      finished
    });
  }

  function playAftermathSmoke({
    point,
    smoke
  }) {
    if (!smoke) {
      return null;
    }

    const count = Math.min(
      8,
      Math.max(
        0,
        Math.floor(
          Number(smoke.count) || 0
        )
      )
    );
    if (count <= 0) {
      return null;
    }

    const spreadPx = Math.max(
      1,
      Number(smoke.spreadPx) || 1
    );
    const sizePx = Math.max(
      1,
      Number(smoke.sizePx) || 1
    );
    const risePx = Math.max(
      1,
      Number(smoke.risePx) || 1
    );
    const durationMs = Math.max(
      1,
      Number(smoke.durationMs) || 1
    );
    const opacity = clampUnit(
      smoke.opacity,
      0.36
    );
    const color =
      typeof smoke.color === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(
        smoke.color
      )
        ? smoke.color
        : "#5b5653";

    const container =
      arena.ownerDocument.createElement(
        "span"
      );
    container.className =
      "skill-fx skill-fx--aftermath-smoke";
    container.dataset.skillFx =
      "aftermath-smoke";
    container.style.left =
      point.x + "px";
    container.style.top =
      point.y + "px";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.zIndex = "13";
    container.dataset.fxSmokeVisible =
      "true";
    container.style.pointerEvents =
      "none";
    container.style.overflow =
      "visible";

    const animations = [];

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      const puff =
        arena.ownerDocument.createElement(
          "span"
        );
      const sizeFactor =
        0.78 +
        (index % 3) * 0.16;
      const width =
        sizePx * sizeFactor;
      const height =
        sizePx *
        (
          0.56 +
          ((index + 1) % 3) * 0.11
        );
      const lateralRatio =
        count === 1
          ? 0
          : index / (count - 1) - 0.5;
      const dx =
        lateralRatio *
        spreadPx +
        (
          index % 2 === 0
            ? -4
            : 4
        );
      const dy =
        -risePx *
        (
          0.72 +
          (index % 3) * 0.14
        );

      puff.className =
        "skill-fx__smoke-puff";
      puff.dataset.skillFx =
        "aftermath-smoke-puff";
      puff.style.position =
        "absolute";
      puff.style.left = "0";
      puff.style.top = "0";
      puff.style.width =
        width.toFixed(2) + "px";
      puff.style.height =
        height.toFixed(2) + "px";
      puff.style.borderRadius =
        index % 2 === 0
          ? "46% 54% 61% 39% / 58% 42% 56% 44%"
          : "58% 42% 49% 51% / 44% 61% 39% 56%";
      puff.style.background =
        "radial-gradient(ellipse at " +
        (index % 2 === 0
          ? "42% 58%"
          : "58% 44%") +
        ", " +
        color +
        " 0%, " +
        color +
        " 34%, transparent 76%)";
      puff.style.filter =
        "blur(" +
        (
          3.6 +
          (index % 3) * 0.9
        ).toFixed(1) +
        "px)";
      puff.style.pointerEvents =
        "none";
      container.append(puff);

      const animation = animate(
        puff,
        [
          {
            transform:
              "translate(-50%, -50%) translate3d(0, 2px, 0) scale(0.42, 0.34)",
            opacity: 0
          },
          {
            transform:
              "translate(-50%, -50%) translate3d(" +
              (dx * 0.25).toFixed(2) +
              "px, " +
              (dy * 0.2).toFixed(2) +
              "px, 0) scale(0.95, 0.72)",
            opacity:
              opacity *
              (
                0.82 +
                (index % 2) * 0.1
              ),
            offset: 0.22
          },
          {
            transform:
              "translate(-50%, -50%) translate3d(" +
              dx.toFixed(2) +
              "px, " +
              dy.toFixed(2) +
              "px, 0) scale(" +
              (
                1.45 +
                (index % 3) * 0.12
              ).toFixed(2) +
              ", " +
              (
                1.15 +
                (index % 2) * 0.16
              ).toFixed(2) +
              ")",
            opacity: 0
          }
        ],
        {
          duration:
            durationMs +
            (index % 4) * 48,
          easing: "ease-out",
          fill: "forwards"
        }
      );
      animations.push(animation);
    }

    arena.append(container);

    const compositeAnimation = {
      cancel() {
        for (
          const animation of animations
        ) {
          animation?.cancel?.();
        }
      },
      finished: Promise.all(
        animations.map(
          (animation) =>
            animation?.finished ??
            Promise.resolve()
        )
      )
    };

    const record = {
      node: container,
      animation: compositeAnimation,
      frameAnimation: null,
      type: "aftermath-smoke"
    };
    active.add(record);

    const finished =
      Promise.resolve(
        compositeAnimation.finished
      )
        .then(() => {
          cleanup(record);
          return {
            status: "finished"
          };
        })
        .catch((error) => {
          cleanup(record);
          if (
            error?.name ===
            "AbortError"
          ) {
            return {
              status: "cancelled"
            };
          }
          throw error;
        });

    return Object.freeze({
      status: "running",
      animation: compositeAnimation,
      finished
    });
  }

  function playImpactFeedback({
    point,
    feedback
  }) {
    const handles = [];

    const flash =
      feedback?.impactFlash ?? null;
    if (flash) {
      const node =
        arena.ownerDocument.createElement("span");
      node.className =
        "skill-fx skill-fx--impact-flash";
      node.dataset.skillFx =
        "impact-flash";
      node.style.left = point.x + "px";
      node.style.top = point.y + "px";
      node.style.width =
        "clamp(4.8rem, 14vw, 9rem)";
      node.style.aspectRatio = "1";
      node.style.borderRadius = "50%";
      node.style.zIndex = "11";
      node.style.pointerEvents = "none";
      node.style.background =
        "radial-gradient(circle, " +
        flash.color +
        " 0 18%, " +
        flash.color +
        " 32%, transparent 72%)";
      node.style.filter = "blur(1.5px)";
      arena.append(node);

      const record = {
        node,
        animation: null,
        frameAnimation: null,
        type: "impact-flash"
      };
      active.add(record);

      const animation = animate(
        node,
        [
          {
            transform:
              "translate(-50%, -50%) scale(" +
              Math.max(
                0.1,
                Number(flash.scale) * 0.45
              ) +
              ")",
            opacity: 0
          },
          {
            transform:
              "translate(-50%, -50%) scale(" +
              Math.max(
                0.1,
                Number(flash.scale)
              ) +
              ")",
            opacity:
              clampUnit(
                flash.opacity,
                0.7
              ),
            offset: 0.22
          },
          {
            transform:
              "translate(-50%, -50%) scale(" +
              Math.max(
                0.1,
                Number(flash.scale) * 1.18
              ) +
              ")",
            opacity: 0
          }
        ],
        {
          duration: Math.max(
            1,
            Number(flash.durationMs) || 1
          ),
          easing: "ease-out",
          fill: "forwards"
        }
      );
      record.animation = animation;

      const finished =
        Promise.resolve(
          animation.finished
        )
          .then(() => {
            cleanup(record);
            return {
              status: "finished"
            };
          })
          .catch((error) => {
            cleanup(record);
            if (
              error?.name ===
              "AbortError"
            ) {
              return {
                status: "cancelled"
              };
            }
            throw error;
          });

      handles.push(
        Object.freeze({
          status: "running",
          animation,
          finished
        })
      );
    }

    const burstHandle =
      playImpactBurst({
        point,
        burst:
          feedback?.impactBurst ??
          null
      });
    if (burstHandle) {
      handles.push(burstHandle);
    }

    const smokeHandle =
      playAftermathSmoke({
        point,
        smoke:
          feedback?.aftermathSmoke ??
          null
      });
    if (smokeHandle) {
      handles.push(smokeHandle);
    }

    const shake =
      feedback?.cameraShake ?? null;
    if (
      shake &&
      playCameraFx !== null
    ) {
      const handle =
        playCameraFx(
          Object.freeze({
            type: "camera-shake",
            amplitudePx:
              Number(shake.amplitudePx),
            durationMs:
              Number(shake.durationMs)
          })
        );
      if (handle) {
        handles.push(handle);
      }
    }

    if (handles.length === 0) {
      return Object.freeze({
        status: "ignored",
        finished:
          Promise.resolve({
            status: "ignored"
          })
      });
    }

    return Object.freeze({
      status: "running",
      finished: Promise.all(
        handles.map(
          (handle) =>
            handle.finished ??
            Promise.resolve({
              status: handle.status
            })
        )
      ).then(() => ({
        status: "finished"
      }))
    });
  }

  function playImpactVisual({
    visual,
    skillId,
    point,
    durationMs,
    layer = "front",
    type = "impact",
    feedback = null
  }) {
    const feedbackHandle =
      type === "impact"
        ? playImpactFeedback({
            point,
            feedback
          })
        : null;

    if (!hasSpriteVisual(visual)) {
      return (
        feedbackHandle ??
        Object.freeze({
          status: "ignored",
          finished: Promise.resolve({
            status: "ignored"
          })
        })
      );
    }

    const node = arena.ownerDocument.createElement("span");
    const displayScale = Math.max(0.25, Number(visual.displayScale) || 1);
    const effectDurationMs = Math.max(1, Number(visual.durationMs) || Number(durationMs) || 420);
    const animatedSprite = Number(visual.frameCount) > 1 || visual.frames?.length > 1;
    const opacity = clampUnit(visual.opacity, 1);

    node.className =
      type === "clash-impact"
        ? "skill-fx skill-fx--impact skill-fx--clash-impact"
        : `skill-fx skill-fx--${type}`;
    if (layer === "behind") node.className += " skill-fx--layer-behind";
    node.dataset.skillFx = type;
    node.dataset.skillId = skillId ?? "";
    node.style.left = `${point.x + (Number(visual.offsetX) || 0)}px`;
    node.style.top = `${point.y + (Number(visual.offsetY) || 0)}px`;

    const spriteVisual = applySpriteVisual(
      node,
      visual,
      effectDurationMs,
      animate
    );
    applyPresentationGlow(
      node,
      feedback?.glow
    );
    arena.append(node);

    const record = {
      node,
      animation: null,
      frameAnimation: spriteVisual.frameAnimation
    };
    active.add(record);

    const isClash = type === "clash-impact";
    const startScale = isClash ? 0.72 : 0.6;
    const peakScale = isClash ? 1.2 : 1.08;
    const endScale = isClash ? 1.48 : 1.28;

    const animation = animate(
      node,
      [
        {
          transform:
            `translate(-50%, -50%) scale(${startScale * displayScale})`,
          opacity: animatedSprite ? opacity : 0.15 * opacity
        },
        {
          transform:
            `translate(-50%, -50%) scale(${peakScale * displayScale})`,
          opacity,
          offset: 0.5
        },
        {
          transform:
            `translate(-50%, -50%) scale(${endScale * displayScale})`,
          opacity: animatedSprite ? opacity : 0
        }
      ],
      {
        duration: Number(visual.durationMs) || spriteVisual.playbackMs || effectDurationMs,
        easing: "ease-out",
        fill: "forwards"
      }
    );

    record.animation = animation;

    const finished = Promise.resolve(animation.finished)
      .then(() => {
        cleanup(record);
        return { status: "finished" };
      })
      .catch((error) => {
        cleanup(record);
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

  function syncPersistentZones(zones = []) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        activeCount: 0
      });
    }
    if (!Array.isArray(zones)) {
      throw new TypeError(
        "persistent zones must be an array"
      );
    }

    const expected = new Set();
    const arenaRect = arena.getBoundingClientRect();

    for (const zone of zones) {
      const zoneId = String(zone?.id ?? "").trim();
      const skillId = String(zone?.skillId ?? "").trim();
      const sourceActorId =
        String(zone?.sourceActorId ?? "").trim();

      if (!zoneId || !skillId || !sourceActorId) {
        throw new TypeError(
          "persistent zone requires id, skillId and sourceActorId"
        );
      }

      expected.add(zoneId);

      const presentation =
        presentationForSkill(skillId, {
          sourceView: sourceActorId,
          fxType: "persistent-zone"
        });
      const visual =
        presentation?.persistentZone ?? null;
      let record =
        persistentZones.get(zoneId) ?? null;

      if (!hasSpriteVisual(visual)) {
        if (record) {
          cleanup(record);
        }
        continue;
      }

      const source = centerRelativeTo(
        anchor(
          anchors,
          sourceActorId,
          "persistent zone source"
        ).getBoundingClientRect(),
        arenaRect
      );
      const displayScale = Math.max(
        0.25,
        Number(visual.displayScale) || 1
      );
      const displayScaleX = Math.max(
        0.25,
        Number(visual.displayScaleX) || 1
      );
      const displayScaleY = Math.max(
        0.25,
        Number(visual.displayScaleY) || 1
      );
      const radiusScale =
        persistentZoneRadiusScale(zone.radius);
      const effectiveScaleX =
        displayScale *
        displayScaleX *
        radiusScale;
      const effectiveScaleY =
        displayScale *
        displayScaleY *
        radiusScale;

      if (!record) {
        const node =
          arena.ownerDocument.createElement("span");
        node.className =
          "skill-fx skill-fx--persistent-zone";
        if (
          presentation?.persistentZoneLayer ===
          "behind"
        ) {
          node.className +=
            " skill-fx--layer-behind";
        }
        node.dataset.skillFx =
          "persistent-zone";
        node.dataset.skillId = skillId;
        node.dataset.zoneId = zoneId;

        const spriteVisual = applySpriteVisual(
          node,
          visual,
          spriteOwnerDurationMs(zone),
          animate
        );
        applyPresentationGlow(
          node,
          presentation?.feedback?.glow
        );
        arena.append(node);

        record = {
          node,
          animation: null,
          frameAnimation:
            spriteVisual.frameAnimation,
          spritePlayback: spriteVisual,
          playbackStartedAtMs: zone.appliedAtMs,
          type: "persistent-zone",
          zoneId
        };
        persistentZones.set(zoneId, record);
        active.add(record);
      }

      if (visual.playbackMode === "stretch") {
        record.spritePlayback?.setDuration?.(spriteOwnerDurationMs(zone, record.playbackStartedAtMs));
      }

      const offsetX =
        Number(visual.offsetX) || 0;
      const offsetY =
        Number(visual.offsetY) || 0;

      record.node.style.left =
        `${source.x + offsetX}px`;
      record.node.style.top =
        `${source.y + offsetY}px`;
      record.node.style.transform =
        `translate(-50%, -50%) scale(${effectiveScaleX}, ${effectiveScaleY})`;
      record.node.style.opacity =
        String(visual.opacity ?? 1);
      record.node.dataset.zoneRadius =
        String(zone.radius);
    }

    for (
      const [zoneId, record] of
      [...persistentZones.entries()]
    ) {
      if (!expected.has(zoneId)) {
        cleanup(record);
      }
    }

    return Object.freeze({
      status: "synced",
      activeCount: persistentZones.size
    });
  }

  function play({
    type,
    skillId = null,
    element = null,
    actorSlot = null,
    fromSlot,
    targetSlot,
    phase = null,
    progress = null,
    amount = null,
    durationMs
  }) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        finished: Promise.resolve({ status: "disposed" })
      });
    }
    if (
      !["cast", "projectile", "impact", "clash-impact", "miss", "damage", "phase"].includes(type)
    ) {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({ status: "ignored" })
      });
    }

    const arenaRect = arena.getBoundingClientRect();
    const sourceSlot = actorSlot ?? fromSlot ?? null;
    const presentation = skillId
      ? presentationForSkill(skillId, {
          sourceView: sourceSlot,
          targetView: targetSlot,
          fxType: type,
          phase
        })
      : null;

    if (type === "cast") {
      const visual = presentation?.cast ?? null;
      if (!hasSpriteVisual(visual)) {
        return Object.freeze({
          status: "ignored",
          finished: Promise.resolve({ status: "ignored" })
        });
      }

      const castAnchor = presentation?.castAnchor ?? null;
      const from = centerRelativeTo(
        sourceRect(sourceSlot, castAnchor),
        arenaRect
      );
      const node = arena.ownerDocument.createElement("span");
      const displayScale = Math.min(
        8,
        Math.max(0.25, Number(visual.displayScale) || 1)
      );

      node.className = "skill-fx skill-fx--cast";
      if (presentation?.castLayer === "behind") {
        node.className += " skill-fx--layer-behind";
      }
      node.dataset.skillFx = "cast";
      node.dataset.skillId = skillId ?? "";
      if (castAnchor) {
        node.dataset.fxAnchor = castAnchor;
      }
      node.style.left = `${from.x + (Number(visual.offsetX) || 0)}px`;
      node.style.top = `${from.y + (Number(visual.offsetY) || 0)}px`;
      const spriteVisual = applySpriteVisual(
        node,
        visual,
        durationMs,
        animate
      );
      applyPresentationGlow(
        node,
        presentation?.feedback?.glow
      );
      const castParticleAnimations =
        appendCastBurstParticles(
          node,
          presentation?.feedback?.castBurst ??
            null,
          presentation?.feedback?.glow?.color ??
            null
        );
      arena.append(node);

      const record = {
        node,
        animation: null,
        frameAnimation: spriteVisual.frameAnimation
      };
      active.add(record);

      const spriteAnimation = animate(
        node,
        [
          {
            transform: `translate(-50%, -50%) scale(${0.7 * displayScale})`,
            opacity: 0.35
          },
          {
            transform: `translate(-50%, -50%) scale(${1.08 * displayScale})`,
            opacity: 1,
            offset: 0.72
          },
          {
            transform: `translate(-50%, -50%) scale(${displayScale})`,
            opacity: 1
          }
        ],
        {
          duration: Math.max(1, Number(durationMs) || 1),
          easing: "ease-out",
          fill: "forwards"
        }
      );

      const animation = {
        cancel() {
          spriteAnimation?.cancel?.();
          for (
            const particleAnimation of
              castParticleAnimations
          ) {
            particleAnimation?.cancel?.();
          }
        },
        finished:
          spriteAnimation?.finished ??
          Promise.resolve()
      };

      record.animation = animation;

      const finished = Promise.resolve(animation.finished)
        .then(() => {
          cleanup(record);
          return { status: "finished" };
        })
        .catch((error) => {
          cleanup(record);
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

    if (type === "phase") {
      const visual = presentation?.phaseFx?.[phase] ?? null;
      if (!hasSpriteVisual(visual) || !sourceSlot) {
        return Object.freeze({
          status: "ignored",
          finished: Promise.resolve({ status: "ignored" })
        });
      }

      const from = centerRelativeTo(
        sourceRect(sourceSlot),
        arenaRect
      );
      const node = arena.ownerDocument.createElement("span");
      const displayScale = Math.min(
        4,
        Math.max(0.25, Number(visual.displayScale) || 1)
      );

      node.className = "skill-fx skill-fx--phase";
      node.dataset.skillFx = "phase";
      node.dataset.skillId = skillId ?? "";
      node.dataset.phase = phase ?? "";
      node.style.left = `${from.x}px`;
      node.style.top = `${from.y}px`;

      const spriteVisual = applySpriteVisual(
        node,
        visual,
        durationMs,
        animate
      );
      arena.append(node);

      const record = {
        node,
        animation: null,
        frameAnimation: spriteVisual.frameAnimation
      };
      active.add(record);

      const animation = animate(
        node,
        [
          {
            transform:
              `translate(-50%, -50%) scale(${0.82 * displayScale})`,
            opacity: 0.15
          },
          {
            transform:
              `translate(-50%, -50%) scale(${1.05 * displayScale})`,
            opacity: 1,
            offset: 0.38
          },
          {
            transform:
              `translate(-50%, -50%) scale(${1.12 * displayScale})`,
            opacity: 0
          }
        ],
        {
          duration: Math.max(
            1,
            spriteVisual.playbackMs || Number(durationMs) || 1
          ),
          easing: "ease-out",
          fill: "forwards"
        }
      );

      record.animation = animation;

      const finished = Promise.resolve(animation.finished)
        .then(() => {
          cleanup(record);
          return { status: "finished" };
        })
        .catch((error) => {
          cleanup(record);
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

    if (type === "damage") {
      const numericAmount = Math.max(
        0,
        Number(amount) || 0
      );
      if (numericAmount <= 0) {
        return Object.freeze({
          status: "ignored",
          finished: Promise.resolve({
            status: "ignored"
          })
        });
      }

      const damageRect = anchor(
          anchors,
          targetSlot,
          "live damage target"
        ).getBoundingClientRect();
      const center = centerRelativeTo(damageRect, arenaRect);
      // Keep floating feedback readable even when the model is large or moving
      // outside the arena. This affects presentation only, never damage math.
      const insetX = Math.min(32, arenaRect.width / 2);
      const insetTop = Math.min(48, arenaRect.height / 2);
      const insetBottom = Math.min(24, arenaRect.height / 2);
      const to = {
        x: Math.max(insetX, Math.min(arenaRect.width - insetX, center.x)),
        y: Math.max(insetTop, Math.min(arenaRect.height - insetBottom, center.y - damageRect.height / 4))
      };

      const node =
        arena.ownerDocument.createElement("span");
      node.className =
        "skill-fx skill-fx--damage-number";
      node.dataset.skillFx = "damage";
      node.dataset.damageAmount =
        String(numericAmount);

      const label =
        Number.isInteger(numericAmount)
          ? String(numericAmount)
          : numericAmount
              .toFixed(1)
              .replace(/\.0$/, "");

      node.textContent = "-" + label;
      node.style.left = `${to.x}px`;
      node.style.top = `${to.y}px`;
      arena.append(node);

      const record = {
        node,
        animation: null
      };
      active.add(record);

      const animation = animate(
        node,
        [
          {
            transform:
              "translate(-50%, -50%) translate3d(0, 0.25rem, 0) scale(0.78)",
            opacity: 1
          },
          {
            transform:
              "translate(-50%, -50%) translate3d(0, -0.25rem, 0) scale(1.12)",
            opacity: 1,
            offset: 0.2
          },
          {
            transform:
              "translate(-50%, -50%) translate3d(0, -1rem, 0) scale(1)",
            opacity: 1,
            offset: 0.7
          },
          {
            transform:
              "translate(-50%, -50%) translate3d(0, -2rem, 0) scale(1)",
            opacity: 0
          }
        ],
        {
          duration: Math.max(
            1,
            Number(durationMs) || 700
          ),
          easing: "ease-out",
          fill: "forwards"
        }
      );
      record.animation = animation;

      const finished =
        Promise.resolve(animation.finished)
          .then(() => {
            cleanup(record);
            return {
              status: "finished"
            };
          })
          .catch((error) => {
            cleanup(record);
            if (
              error?.name ===
              "AbortError"
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
        finished
      });
    }

    if (type === "miss") {
      const to = centerRelativeTo(
        anchor(targetAnchors, targetSlot, "target").getBoundingClientRect(),
        arenaRect
      );

      const node = arena.ownerDocument.createElement("span");
      node.className = "skill-fx skill-fx--miss";
      node.dataset.skillFx = "miss";
      node.textContent = missLabel;
      node.style.left = `${to.x}px`;
      node.style.top = `${to.y}px`;
      arena.append(node);

      const record = { node, animation: null };
      active.add(record);

      const animation = animate(
        node,
        [
          {
            transform: "translate(-50%, -50%) translate3d(0, 0.35rem, 0) scale(0.82)",
            opacity: 0
          },
          {
            transform: "translate(-50%, -50%) translate3d(0, 0, 0) scale(1)",
            opacity: 1,
            offset: 0.18
          },
          {
            transform: "translate(-50%, -50%) translate3d(0, -1.2rem, 0) scale(1.04)",
            opacity: 0
          }
        ],
        {
          duration: Math.max(1, Number(durationMs) || 650),
          easing: "ease-out",
          fill: "forwards"
        }
      );

      record.animation = animation;

      const finished = Promise.resolve(animation.finished)
        .then(() => {
          cleanup(record);
          return { status: "finished" };
        })
        .catch((error) => {
          cleanup(record);
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

    if (type === "clash-impact") {
      const visual = presentation?.impact ?? null;
      const from = centerRelativeTo(
        sourceRect(
          fromSlot,
          presentation?.travelSourceAnchor ?? null
        ),
        arenaRect
      );
      const to = centerRelativeTo(
        anchor(targetAnchors, targetSlot, "target").getBoundingClientRect(),
        arenaRect
      );
      const ratio = clampUnit(progress, 0.5);
      const point = Object.freeze({
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio
      });

      return playImpactVisual({
        visual,
        skillId,
        point,
        durationMs,
        layer: presentation?.impactLayer ?? "front",
        type: "clash-impact"
      });
    }

    if (type === "impact") {
      const visual = presentation?.impact ?? null;
      const point = centerRelativeTo(
        anchor(anchors, targetSlot, "live target").getBoundingClientRect(),
        arenaRect
      );

      return playImpactVisual({
        visual,
        skillId,
        point,
        durationMs,
        layer: presentation?.impactLayer ?? "front",
        type: "impact",
        feedback: presentation?.feedback ?? null
      });
    }

    const travelSourceAnchor =
      presentation?.travelSourceAnchor ?? null;
    const from = centerRelativeTo(
      sourceRect(fromSlot, travelSourceAnchor),
      arenaRect
    );
    const to = centerRelativeTo(
      anchor(targetAnchors, targetSlot, "target").getBoundingClientRect(),
      arenaRect
    );

    const node = arena.ownerDocument.createElement("span");
    node.className = "skill-fx skill-fx--projectile";
    if (presentation?.travelLayer === "behind") {
      node.className += " skill-fx--layer-behind";
    }
    node.dataset.skillFx = "projectile";
    if (skillId) {
      node.dataset.skillId = skillId;
    }
    if (element) {
      node.dataset.element = element;
    }
    node.style.left = `${from.x}px`;
    node.style.top = `${from.y}px`;
    if (travelSourceAnchor) {
      node.dataset.fxAnchor = travelSourceAnchor;
    }

    const travelVisual = presentation?.travel ?? null;
    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    const travelDisplayScale = Math.min(
      8,
      Math.max(0.25, Number(travelVisual?.displayScale) || 1)
    );
    let spriteBound = false;
    let projectileFrameAnimation = null;

    if (hasSpriteVisual(travelVisual)) {
      const spriteNode = arena.ownerDocument.createElement("span");
      const coreAnchorX = clampUnit(travelVisual.coreAnchor?.x, 0.5);
      const coreAnchorY = clampUnit(travelVisual.coreAnchor?.y, 0.5);
      const headingRad = Number.isFinite(Number(travelVisual.headingRad))
        ? Number(travelVisual.headingRad)
        : 0;
      const travelAngle = Math.atan2(deltaY, deltaX);
      const rotationRad = travelAngle - headingRad;

      node.className += " skill-fx--sprite-shell";
      node.dataset.assetId = travelVisual.assetId ?? "";

      spriteNode.className = "skill-fx__sprite";
      const spriteVisual = applySpriteVisual(
        spriteNode,
        travelVisual,
        durationMs,
        animate
      );
      projectileFrameAnimation = spriteVisual.frameAnimation;
      spriteNode.style.left = percent(0.5 - coreAnchorX);
      spriteNode.style.top = percent(0.5 - coreAnchorY);
      spriteNode.style.transformOrigin =
        `${percent(coreAnchorX)} ${percent(coreAnchorY)}`;
      spriteNode.style.transform = `rotate(${rotationRad}rad)`;
      node.append(spriteNode);
      spriteBound = true;
    }

    applyPresentationGlow(
      node,
      presentation?.feedback?.glow
    );
    appendProjectileTrailParticles(
      node,
      presentation?.feedback?.projectileTrail ??
        null,
      deltaX,
      deltaY,
      presentation?.feedback?.glow?.color ??
        null
    );
    arena.append(node);

    const record = {
      node,
      animation: null,
      frameAnimation: projectileFrameAnimation,
      type: "projectile",
      skillId,
      fromSlot,
      targetSlot,
      contactFrameId: null,
      contactReported: false
    };
    active.add(record);

    const keyframes = spriteBound
      ? [
          {
            transform: `translate(-50%, -50%) translate3d(0, 0, 0) scale(${0.94 * travelDisplayScale})`,
            opacity: 0.95
          },
          {
            transform: `translate(-50%, -50%) translate3d(${deltaX * 0.5}px, ${deltaY * 0.5}px, 0) scale(${1.04 * travelDisplayScale})`,
            opacity: 1,
            offset: 0.5
          },
          {
            transform: `translate(-50%, -50%) translate3d(${deltaX}px, ${deltaY}px, 0) scale(${0.98 * travelDisplayScale})`,
            opacity: 1
          }
        ]
      : [
          {
            transform: "translate(-50%, -50%) translate3d(0, 0, 0) scale(0.75)",
            opacity: 0.25
          },
          {
            transform: `translate(-50%, -50%) translate3d(${deltaX}px, ${deltaY}px, 0) scale(1)`,
            opacity: 1
          }
        ];

    const animation = animate(
      node,
      keyframes,
      {
        duration: Math.max(1, Number(durationMs) || 1),
        easing: "linear",
        fill: "forwards"
      }
    );

    record.animation = animation;
    watchProjectileContact(record);

    const finished = Promise.resolve(animation.finished)
      .then(() => {
        return { status: "arrived" };
      })
      .catch((error) => {
        cleanup(record);
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

  function sampleZoneSpatialContext(zones) {
    if (disposed || !zones.length) return null;
    // Reproject moving sources before sampling on the Runtime's existing tick.
    syncPersistentZones(zones);
    const rect = element => {
      const r = element?.getBoundingClientRect?.();
      return r && Number(r.width) > 0 && Number(r.height) > 0
        ? { left: Number(r.left), top: Number(r.top), width: Number(r.width), height: Number(r.height) } : null;
    };
    return {
      zones: zones.flatMap(zone => {
        const bounds = rect(persistentZones.get(zone.id)?.node);
        return bounds ? [{ zoneId: zone.id, sourceActorId: zone.sourceActorId, radius: zone.radius, bounds }] : [];
      }),
      actors: Object.entries(anchors).flatMap(([actorId, element]) => {
        const bounds = rect(element);
        return bounds ? [{ actorId, bounds }] : [];
      })
    };
  }

  function cancelProjectileFor(fromSlot) {
    let cancelled = 0;

    for (const record of [...active]) {
      if (
        record.type !== "projectile" ||
        record.fromSlot !== fromSlot
      ) {
        continue;
      }

      record.animation?.cancel?.();
      cleanup(record);
      cancelled += 1;
    }

    return cancelled;
  }

  function cancelAll() {
    for (const record of [...active]) {
      record.animation?.cancel?.();
      cleanup(record);
    }
  }

  function dispose() {
    if (disposed) {
      return;
    }
    cancelAll();
    disposed = true;
  }

  return Object.freeze({
    play,
    syncPersistentZones,
    sampleZoneSpatialContext,
    cancelProjectileFor,
    cancelAll,
    dispose,
    get activeCount() {
      return active.size;
    }
  });
}
