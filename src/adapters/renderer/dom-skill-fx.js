import {sweptSegmentRectContactV1,nearestBarrierSegmentContactV1} from "../../core/combat/combat-barrier-spatial-v1.js";
import { sweptPointHitsOpaqueMask, sweptPointHitsSpriteEllipseV1, visibleModelOpaqueAimPoint, sweptExpandingWaveHitsOpaqueMaskV1, sweptExpandingWaveMeetsProjectileV1 } from "./dom-visible-model-contact.js";

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

export function impactVisualDelayForCameraShakeV1(shake) {
  if (!shake || !["during","after"].includes(shake.impactVisualTiming)) return 0;
  const total = Array.isArray(shake.sequence) && shake.sequence.length > 0
    ? shake.sequence.reduce((ms,pulse) => ms + Number(pulse.pauseMs) + Number(pulse.durationMs),0)
    : Number(shake.durationMs);
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.round(shake.impactVisualTiming === "during" ? total / 2 : total);
}

// Visual seam allowance: the animated body extends under the endcap sprites.
// The authoritative beam anchors, direction and hit distance remain unchanged.
const BEAM_CAP_BASE_SIZE_PX = 96;
const BEAM_CAP_OVERLAP_RATIO = 0.35;

// The medium reach of a *growing* zone must read as a genuine second
// level, before long becomes the full battlefield. Static medium zones keep
// their historical scale. These bounds are sampled by native occupancy too.
const PERSISTENT_ZONE_RADIUS_SCALE = Object.freeze({
  short: 1,
  medium: 1.45,
  long: 1.9
});

function persistentZoneRadiusScale(radius, {radiusGrowthSteps = 0} = {}) {
  const scale = radius === "medium" && Number(radiusGrowthSteps) > 0
    ? 1.65 : PERSISTENT_ZONE_RADIUS_SCALE[radius];
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

export function applySpriteVisual(node, visual, durationMs, animate = defaultAnimate, delayMs = 0) {
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
      ["once", "loop", "stretch", "hold-last"].includes(visual.playbackMode)
        ? visual.playbackMode
        : "once";
    const nativePlaybackMs = visualPlaybackMs(visual, durationMs);
    const frameSpeed = playbackMode === "loop"
      ? Math.max(0.25, Math.min(4, Number(visual.frameSpeedMultiplier) || 1))
      : 1;
    const playbackMs =
      playbackMode === "stretch"
        ? Math.max(1, Number(durationMs) || nativePlaybackMs)
        : nativePlaybackMs / frameSpeed;

    node.style.backgroundImage = `url("${frames[0]}")`;
    node.style.backgroundSize = "100% 100%";
    node.style.backgroundPosition = "center";

    if (
      frames.length > 1 &&
      ["loop", "hold-last"].includes(playbackMode) &&
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
            delay: delayMs,
            easing: "linear",
            fill: "both",
            iterations: playbackMode === "loop" ? Infinity : 1
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
          delay: delayMs,
          easing: "steps(1, end)",
          fill: delayMs > 0 ? "both" : "forwards",
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
    ["once", "loop", "stretch", "hold-last"].includes(
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
      : nativePlaybackMs / (playbackMode === "loop"
          ? Math.max(0.25, Math.min(4, Number(visual.frameSpeedMultiplier) || 1))
          : 1);

  node.style.backgroundImage = `url("${visual.url}")`;
  node.style.backgroundSize = `${frameCount * 100}% 100%`;
  node.style.backgroundPosition = "0% 0%";
  node.style.animationName = "skill-fx-strip";
  node.style.animationDuration = `${duration}ms`;
  if (delayMs > 0) node.style.animationDelay = `${delayMs}ms`;
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

/**
 * Stable aim point for a straight projectile: transfer only the offset of
 * the VISIBLE opaque creature body relative to its MOVING model anchor into
 * the RESTING combat slot. Vertical translations (flight/burrowing/approach)
 * cancel out; the aim is sampled once at release, never tracked in flight.
 * Actual hit detection remains owned by the live opaque-mask collision model.
 */
export function restingProjectileAimRectV1({slotRect,motionRect,visibleRect,restingOffset=null,opaquePoint=null}) {
  const center = rect => ({
    x: Number(rect.left) + Number(rect.width) / 2,
    y: Number(rect.top) + Number(rect.height) / 2
  });
  const valid = rect => rect &&
    [rect.left,rect.top,rect.width,rect.height].every(v=>Number.isFinite(Number(v))) &&
    Number(rect.width)>0 && Number(rect.height)>0;
  const validOpaque = opaquePoint &&
    Number.isFinite(Number(opaquePoint.x)) &&
    Number.isFinite(Number(opaquePoint.y));
  if (!valid(slotRect) || !valid(motionRect) ||
      (!valid(visibleRect) && !validOpaque)) return slotRect;
  const slot = center(slotRect);
  const motion = center(motionRect);
  const body = validOpaque
    ? {x:Number(opaquePoint.x),y:Number(opaquePoint.y)}
    : center(visibleRect);
  const authoredX = Number(restingOffset?.x ?? 0);
  const authoredY = Number(restingOffset?.y ?? 0);
  return Object.freeze({
    left: slot.x + (Number.isFinite(authoredX) ? authoredX : 0) + body.x - motion.x,
    top: slot.y + (Number.isFinite(authoredY) ? authoredY : 0) + body.y - motion.y,
    width: 0,
    height: 0
  });
}

export function createDomSkillFxRenderer({
  arena,
  anchors,
  targetAnchors = anchors,
  targetAnchorFor = null,
  sourceAnchorFor = null,
  restingOffsetFor = null,
  missLabel = "RATÉ",
  presentationForSkill = () => null,
  animate = defaultAnimate,
  requestFrame = defaultRequestFrame,
  cancelFrame = defaultCancelFrame,
  onProjectileContact = null,
  onProjectileClashContact = null,
  targetCollisionModelFor = null,
  barrierCollisionRectsFor = null,
  waveTargetsFor = null,
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
  if (targetAnchorFor !== null && typeof targetAnchorFor !== "function") {
    throw new TypeError("targetAnchorFor must be a function when supplied");
  }
  if (sourceAnchorFor !== null && typeof sourceAnchorFor !== "function") {
    throw new TypeError("sourceAnchorFor must be a function when supplied");
  }
  if (restingOffsetFor !== null && typeof restingOffsetFor !== "function") {
    throw new TypeError("restingOffsetFor must be a function when supplied");
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
  if (onProjectileClashContact !== null &&
      typeof onProjectileClashContact !== "function") {
    throw new TypeError("onProjectileClashContact must be a function");
  }
  if (barrierCollisionRectsFor !== null && typeof barrierCollisionRectsFor !== "function") {
    throw new TypeError("barrierCollisionRectsFor must be a function");
  }
  if (waveTargetsFor !== null && typeof waveTargetsFor !== "function") {
    throw new TypeError("waveTargetsFor must be a function when supplied");
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

  function projectileTargetRect(slot) {
    if (targetAnchorFor) {
      const rect = targetAnchorFor(slot);
      if (
        rect &&
        Number.isFinite(Number(rect.left)) &&
        Number.isFinite(Number(rect.top)) &&
        Number.isFinite(Number(rect.width)) &&
        Number.isFinite(Number(rect.height))
      ) {
        return rect;
      }
    }

    return anchor(
      targetAnchors,
      slot,
      "target"
    ).getBoundingClientRect();
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
    record.alphaAnimation?.cancel?.();
    record.tacticalMarker?.remove?.();
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

    // The opaque fighter mask may still be loading while an authored wall
    // already exists. It must never disable the independent, visible barrier
    // sensor: both remain observations of the SAME projectile FX frame.
    const collisionModel =
      targetCollisionModelFor?.(record.targetSlot) ?? null;

    record.previousProjectilePoint = rectCenter(
      record.node.getBoundingClientRect()
    );
    record.previousTargetFrame =
      collisionModel?.snapshot?.() ?? null;

    // The native status renderer already owns and mounts this live sprite.
    // Observe its actual scaled/offset screen bounds on the same FX frame.
    const mirrorSurface = () => record.mirrorSurfaceEligible !== false
      ? anchors[record.targetSlot]?.querySelector?.(
          '[data-status-fx="sprite"][data-status-kind="projectile_mirror"]'
        ) ?? null
      : null;
    record.previousMirrorRect = mirrorSurface()?.getBoundingClientRect?.() ?? null;

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
        collisionModel?.snapshot?.() ?? null;

      const mirrorRect = mirrorSurface()?.getBoundingClientRect?.() ?? null;
      const spriteContactPoint = mirrorRect
        ? sweptPointHitsSpriteEllipseV1({
            previousPoint: record.previousProjectilePoint,
            point: projectilePoint,
            previousRect: record.previousMirrorRect ?? mirrorRect,
            rect: mirrorRect
          })
        : null;
      const barrierContacts=(barrierCollisionRectsFor?.({
        sourceActorId:record.fromSlot,targetActorId:record.targetSlot
      })??[]).map(entry=>({entityId:entry.entityId,
        point:sweptSegmentRectContactV1({from:record.previousProjectilePoint,to:projectilePoint,rect:entry.rect})
      })).filter(entry=>entry.point!==null);
      barrierContacts.sort((a,b)=>
        Math.hypot(a.point.x-record.previousProjectilePoint.x,a.point.y-record.previousProjectilePoint.y)-
        Math.hypot(b.point.x-record.previousProjectilePoint.x,b.point.y-record.previousProjectilePoint.y));
      if(barrierContacts.length){
        record.contactReported=true;
        onProjectileContact(Object.freeze({actorId:record.fromSlot,targetId:record.targetSlot,
          skillId:record.skillId??null,contactPoint:barrierContacts[0].point,
          combatEntityId:barrierContacts[0].entityId}));
        return;
      }
      const contacted =
        spriteContactPoint !== null ||
        (targetFrame !== null &&
        sweptPointHitsOpaqueMask({
          mask: targetFrame.mask,
          previousPoint:
            record.previousProjectilePoint,
          point: projectilePoint,
          previousFrame:
            record.previousTargetFrame ??
            targetFrame,
          frame: targetFrame
        }));

      record.previousProjectilePoint =
        projectilePoint;
      record.previousTargetFrame =
        targetFrame;
      record.previousMirrorRect = mirrorRect;

      if (contacted) {
        record.contactReported = true;
        onProjectileContact(
          Object.freeze({
            actorId: record.fromSlot,
            targetId: record.targetSlot,
            skillId: record.skillId ?? null,
            // Coordinates describe only the hit location for follow-up visual FX.
            contactPoint: spriteContactPoint ?? Object.freeze({ x: projectilePoint.x, y: projectilePoint.y }),
            ...(mirrorRect !== null
              ? {mirrorSpritePresent: true, mirrorSpriteContact: spriteContactPoint !== null}
              : {})
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
    burst,
    delayMs = 0
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
          delay: delayMs,
          easing: "ease-out",
          fill: delayMs > 0 ? "both" : "forwards"
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
    smoke,
    delayMs = 0
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
        ", rgba(235, 235, 235, 0.46) 0%, " +
        color +
        " 32%, " +
        color +
        " 52%, transparent 82%)";
      puff.style.filter =
        "blur(" +
        (
          2.2 +
          (index % 3) * 0.65
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
            opacity: 0,
            offset: 0.18
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
            offset: 0.44
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
          delay: delayMs,
          easing: "ease-out",
          fill: delayMs > 0 ? "both" : "forwards"
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
    feedback,
    delayMs = 0
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
          delay: delayMs,
          easing: "ease-out",
          fill: delayMs > 0 ? "both" : "forwards"
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
          null,
        delayMs
      });
    if (burstHandle) {
      handles.push(burstHandle);
    }

    const smokeHandle =
      playAftermathSmoke({
        point,
        smoke:
          feedback?.aftermathSmoke ??
          null,
        delayMs
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
              Number(shake.durationMs),
            ...(Array.isArray(shake.sequence) && shake.sequence.length > 0
              ? { sequence: shake.sequence }
              : {})
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
    feedback = null,
    feedbackOffset = null
  }) {
    const feedbackPoint =
      Object.freeze({
        x:
          point.x +
          (Number(feedbackOffset?.x) || 0),
        y:
          point.y +
          (Number(feedbackOffset?.y) || 0)
      });
    const visualDelayMs = type === "impact" && playCameraFx !== null
      ? impactVisualDelayForCameraShakeV1(feedback?.cameraShake)
      : 0;
    const feedbackHandle =
      type === "impact" ||
      type === "clash-impact"
        ? playImpactFeedback({
            point: feedbackPoint,
            feedback,
            delayMs: visualDelayMs
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
      animate,
      visualDelayMs
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
          opacity: visualDelayMs > 0 ? 0 : animatedSprite ? opacity : 0.15 * opacity
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
        delay: visualDelayMs,
        easing: "ease-out",
        fill: visualDelayMs > 0 ? "both" : "forwards"
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

      const liveSource = centerRelativeTo(
        anchor(
          anchors,
          sourceActorId,
          "persistent zone source"
        ).getBoundingClientRect(),
        arenaRect
      );
      // This renderer alone owns the visual anchor. fixed-source pins an
      // authored field at first activation; source follows the living caster.
      // A recalled caster also leaves its last field position fixed.
      // Gameplay occupancy continues through the existing native zone sample.
      const fixedAtGround =
        visual.attachment === "fixed-source" ||
        zone.detachedFromSource === true;
      const source = fixedAtGround && record?.zoneCenter
        ? record.zoneCenter
        : liveSource;
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
        persistentZoneRadiusScale(zone.radius, zone);
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

        // A presentation-only radius beneath the zone art. The original FX
        // node still supplies the SAME bounds to native occupancy sampling.
        const tacticalMarker = arena.ownerDocument.createElement("span");
        tacticalMarker.dataset.tacticalRadius = "persistent-zone";
        tacticalMarker.dataset.zoneId = zoneId;

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
        arena.append(tacticalMarker);

        record = {
          node,
          tacticalMarker,
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

      if (!fixedAtGround || !record.zoneCenter) record.zoneCenter = source;
      const offsetX =
        Number(visual.offsetX) || 0;
      const offsetY =
        Number(visual.offsetY) || 0;

      // Native "long" is *the entire battlefield*, not the 1.9x ellipse.
      // The same persistent-zone sprite must reflect that authoritative
      // reach: otherwise foes take damage outside the visible fire.
      // This is visual projection only. For short/medium, the very same
      // original sprite bounds remain the single native occupancy sample.
      if (zone.radius === "long") {
        record.node.style.left = "50%";
        record.node.style.top = "50%";
        record.node.style.width = "100%";
        record.node.style.height = "100%";
        record.node.style.aspectRatio = "auto";
        record.node.style.transform = "translate(-50%, -50%)";
      } else {
        // Reset all full-field properties for radius changes without
        // re-creating the authored frame animation or its runtime owner.
        record.node.style.width = "";
        record.node.style.height = "";
        record.node.style.aspectRatio = "";
        record.node.style.left = `${source.x + offsetX}px`;
        record.node.style.top = `${source.y + offsetY}px`;
        record.node.style.transform =
          `translate(-50%, -50%) scale(${effectiveScaleX}, ${effectiveScaleY})`;
      }
      record.node.style.opacity =
        String(visual.opacity ?? 1);
      record.node.dataset.zoneRadius =
        String(zone.radius);

      // short/medium: this line shares the *exact transform and CSS size*
      // of the sprite node whose rendered bounds are read by Combat Rules.
      // long: the native contract includes every battlefield actor, so only
      // an arena-wide edge is honest (a smaller circle would mislead).
      const marker = record.tacticalMarker;
      // The CombatState zone already owns its canonical element. This is
      // presentation metadata only; no parallel hit, range or asset lookup.
      marker.dataset.element = String(zone.skillElement ?? "");
      marker.className = "skill-fx skill-fx--tactical-zone" +
        (presentation?.persistentZoneLayer === "behind" ? " skill-fx--layer-behind" : "") +
        (zone.radius === "long" ? " skill-fx--tactical-full-arena" : "");
      if (zone.radius === "long") {
        marker.style.left = "2px";
        marker.style.top = "2px";
        marker.style.width = "calc(100% - 4px)";
        marker.style.height = "calc(100% - 4px)";
        marker.style.transform = "none";
      } else {
        marker.style.left = record.node.style.left;
        marker.style.top = record.node.style.top;
        marker.style.width = "";
        marker.style.height = "";
        marker.style.transform = record.node.style.transform;
      }
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
    fromPoint = null,
    phase = null,
    progress = null,
    amount = null,
    expandingWave = null,
    projectilePower = 0,
    sizeMultiplier = 1,
    durationMs,
    delayMs = 0
  }) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        finished: Promise.resolve({ status: "disposed" })
      });
    }
    if (
      !["cast", "projectile", "beam", "impact", "clash-impact", "miss", "damage", "heal", "phase"].includes(type)
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
      // The independent CSS scale composes with the authored cast keyframe
      // transform. The ongoing sprite animation is never restarted per tap.
      node.style.scale = String(Number.isFinite(sizeMultiplier) && sizeMultiplier > 0 ? sizeMultiplier : 1);
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

      const configuredOpacity = clampUnit(visual.opacity, 1);
      const spriteAnimation = animate(
        node,
        [
          {
            transform: `translate(-50%, -50%) scale(${0.7 * displayScale})`,
            opacity: 0.35 * configuredOpacity
          },
          {
            transform: `translate(-50%, -50%) scale(${1.08 * displayScale})`,
            opacity: configuredOpacity,
            offset: 0.72
          },
          {
            transform: `translate(-50%, -50%) scale(${displayScale})`,
            opacity: configuredOpacity
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
        finished,
        setDuration(nextDurationMs) {
          if (!active.has(record) || !Number.isFinite(nextDurationMs) || nextDurationMs < 0) return false;
          // One WAAPI timeline, extended in place when the last charge tap
          // holds the release. No new sprite and no second playback owner.
          spriteAnimation?.effect?.updateTiming?.({duration:Math.max(1,nextDurationMs)});
          return true;
        },
        setSizeMultiplier(next) {
          if (!active.has(record) || !Number.isFinite(next) || next <= 0) return false;
          node.style.scale = String(next);
          return true;
        }
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

    if (type === "damage" || type === "heal") {
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

      const feedbackRect = anchor(
          anchors,
          targetSlot,
          "live health target"
        ).getBoundingClientRect();
      const center = centerRelativeTo(feedbackRect, arenaRect);
      // Keep floating feedback readable even when the model is large or moving
      // outside the arena. This affects presentation only, never damage math.
      const insetX = Math.min(32, arenaRect.width / 2);
      const insetTop = Math.min(48, arenaRect.height / 2);
      const insetBottom = Math.min(24, arenaRect.height / 2);
      const to = {
        x: Math.max(insetX, Math.min(arenaRect.width - insetX, center.x)),
        y: Math.max(insetTop, Math.min(arenaRect.height - insetBottom, center.y - feedbackRect.height / 4))
      };

      const node =
        arena.ownerDocument.createElement("span");
      node.className =
        "skill-fx skill-fx--" + (type === "heal" ? "heal-number" : "damage-number");
      node.dataset.skillFx = type;
      if (type === "heal") {
        node.dataset.healAmount = String(numericAmount);
      } else {
        node.dataset.damageAmount = String(numericAmount);
      }

      const label =
        Number.isInteger(numericAmount)
          ? String(numericAmount)
          : numericAmount
              .toFixed(1)
              .replace(/\.0$/, "");

      node.textContent = (type === "heal" ? "+" : "-") + label;
      node.style.left = `${to.x}px`;
      node.style.top = `${to.y}px`;
      // The Runtime has already applied HP. Hide only this visual cue until
      // the impact sprite is shown; never create a second gameplay timer.
      if (Number(delayMs) > 0) node.style.opacity = "0";
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
          fill: "forwards",
          ...(Number(delayMs) > 0 ? { delay: Number(delayMs) } : {})
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
        type: "clash-impact",
        feedback: presentation?.feedback ?? null,
        feedbackOffset:
          presentation?.impactFeedbackOffset ??
          null
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
        feedback: presentation?.feedback ?? null,
        feedbackOffset:
          presentation?.impactFeedbackOffset ??
          null
      });
    }


    if (type === "projectile" && expandingWave !== null) {
      // The animated shell and its expanding annular hit sensor are the
      // *same object*. The Combat Runtime remains the only damage owner.
      // Percentages refer to arena width, so the reach adapts in landscape.
      const wave = expandingWave;
      // Only the 2v2 UI supplies more than one visible enemy candidate.
      // Runtime rechecks ownership, team and eligibility for each contact.
      const candidateSlots = waveTargetsFor?.(fromSlot, targetSlot) ?? [];
      const waveTargetSlots = [...new Set([
        targetSlot,
        ...(Array.isArray(candidateSlots) ? candidateSlots : [])
      ])];
      const multiTargetWave = waveTargetSlots.length > 1;
      const endRadiusPx = arenaRect.width * wave.endRadiusPct / 100;
      const startRadiusPx = arenaRect.width * wave.startRadiusPct / 100;
      const thicknessEndPx = arenaRect.width * wave.thicknessPct / 100;
      const travelVisual = presentation?.travel ?? null;
      const position = centerRelativeTo(
        sourceRect(fromSlot, presentation?.travelSourceAnchor ?? null),
        arenaRect
      );
      const node = arena.ownerDocument.createElement("span");
      node.className = "skill-fx skill-fx--projectile skill-fx--expanding-wave";
      if (presentation?.travelLayer === "behind") {
        node.className += " skill-fx--layer-behind";
      }
      node.dataset.skillFx = "projectile";
      node.dataset.waveMode = "expanding_wave";
      if (skillId) node.dataset.skillId = skillId;
      if (element) node.dataset.element = element;
      node.style.left = position.x + "px";
      node.style.top = position.y + "px";
      node.style.width = (endRadiusPx * 2) + "px";
      node.style.height = (endRadiusPx * 2) + "px";
      node.style.boxSizing = "border-box";
      node.style.borderRadius = "50%";
      node.style.pointerEvents = "none";

      // The visible tactical edge is the outer border of this SAME shell,
      // not a separate radius/hitbox. The faint inner edge mirrors the
      // collision band's real thickness. Both expand with the shell.
      node.className += " skill-fx--sprite-shell";
      const tacticalRadius = arena.ownerDocument.createElement("span");
      tacticalRadius.className = "skill-fx__tactical-radius";
      const innerRadius = arena.ownerDocument.createElement("span");
      innerRadius.className = "skill-fx__tactical-wave-inner";
      innerRadius.style.inset = (100 * thicknessEndPx / (2 * endRadiusPx)) + "%";
      tacticalRadius.append(innerRadius);
      node.append(tacticalRadius);

      let frameAnimation = null;
      let opacityNode;
      if (hasSpriteVisual(travelVisual)) {
        node.dataset.assetId = travelVisual.assetId ?? "";
        const spriteNode = arena.ownerDocument.createElement("span");
        spriteNode.className = "skill-fx__sprite";
        const playback = applySpriteVisual(
          spriteNode, travelVisual, durationMs, animate
        );
        frameAnimation = playback.frameAnimation;
        opacityNode = spriteNode;
        node.append(spriteNode);
      } else {
        // Only decoration uses this fallback. It cannot become a hitbox.
        const fallback = arena.ownerDocument.createElement("span");
        fallback.className = "skill-fx__tactical-fallback";
        fallback.style.boxSizing = "border-box";
        fallback.style.border = Math.max(2, thicknessEndPx) +
          "px solid rgba(255,111,15,0.75)";
        fallback.style.background =
          "radial-gradient(circle, transparent 55%, rgba(255,78,0,0.2) 75%, transparent 100%)";
        opacityNode = fallback;
        node.append(fallback);
      }
      applyPresentationGlow(node, presentation?.feedback?.glow);
      arena.append(node);
      const record = {
        node, animation: null, frameAnimation, type: "projectile",
        skillId, fromSlot, targetSlot,
        contactFrameId: null, contactReported: false,
        multiTargetWave, waveTargetsHit: new Set(),
        previousTargetFrames: new Map(),
        previousRadiusPx: startRadiusPx,
        previousTargetFrame: null,
        expandingWave: wave,
        projectilePower: Math.max(0,Number(projectilePower)||0),
        observedProjectiles: new Map(),
        clashedProjectiles: new Set()
      };
      active.add(record);
      const duration = Math.max(1, Number(durationMs) || 1);
      const waveOpacity = clampUnit(travelVisual?.opacity, 1);
      const animation = animate(
        node,
        [
          { transform: "translate(-50%, -50%) scale(" + (startRadiusPx / endRadiusPx) + ")" },
          { transform: "translate(-50%, -50%) scale(1)" }
        ],
        { duration, easing: "linear", fill: "forwards" }
      );
      record.animation = animation;
      // Alpha animates only the artwork. At 0% opacity the same native
      // shell and its tactical boundary remain readable to the player.
      record.alphaAnimation = animate(
        opacityNode,
        [{opacity:0.4 * waveOpacity},{opacity:waveOpacity}],
        {duration,easing:"linear",fill:"forwards"}
      );
      Promise.resolve(record.alphaAnimation?.finished).catch(() => {});

      const collisionModel = onProjectileContact && targetCollisionModelFor
        ? targetCollisionModelFor(targetSlot) : null;
      if (collisionModel && typeof collisionModel.snapshot === "function") {
        record.previousTargetFrame = collisionModel.snapshot();
      }
      const waveCollisionModels = new Map(
        multiTargetWave && onProjectileContact && targetCollisionModelFor
          ? waveTargetSlots.map(slot => [slot, targetCollisionModelFor(slot)])
            .filter(([,model]) => typeof model?.snapshot === "function")
          : []
      );
      for (const [slot, model] of waveCollisionModels) {
        record.previousTargetFrames.set(slot, model.snapshot());
      }
      if ((collisionModel && typeof collisionModel.snapshot === "function") ||
          waveCollisionModels.size > 0 || onProjectileClashContact) {
        const center = Object.freeze({
          x: arenaRect.left + position.x,
          y: arenaRect.top + position.y
        });
        const observe = () => {
          record.contactFrameId = null;
          if (disposed || !active.has(record) ||
              (record.contactReported && !record.multiTargetWave)) return;
          const rect = node.getBoundingClientRect();
          const radiusPx = Math.max(
            record.previousRadiusPx,
            Math.min(Number(rect.width), Number(rect.height)) / 2
          );
          const thicknessPx = thicknessEndPx * radiusPx / endRadiusPx;

          // This is the same wave shell used for monster contact, but a
          // projectile's point follows its OWN live visual trajectory.
          // Only a real crossed ring may request a native power comparison.
          if (onProjectileClashContact && record.projectilePower > 0) {
            for (const other of [...active]) {
              if (!active.has(record)) break;
              if (other === record || other.type !== "projectile" ||
                  other.expandingWave || other.visualOnly ||
                  !other.projectilePower ||
                  other.fromSlot !== targetSlot ||
                  other.targetSlot !== fromSlot ||
                  !other.node?.getBoundingClientRect ||
                  record.clashedProjectiles.has(other)) continue;
              const point = rectCenter(other.node.getBoundingClientRect());
              const previousPoint = record.observedProjectiles.get(other) ?? point;
              record.observedProjectiles.set(other,point);
              if (!sweptExpandingWaveMeetsProjectileV1({
                center,
                previousRadiusPx: record.previousRadiusPx,
                radiusPx,
                thicknessPx,
                previousPoint,
                point
              })) continue;
              const collision = onProjectileClashContact(Object.freeze({
                waveActorId: fromSlot,
                waveSkillId: skillId,
                projectileActorId: other.fromSlot,
                projectileSkillId: other.skillId,
                contactPoint: point
              }));
              if (collision?.ok) record.clashedProjectiles.add(other);
            }
          }
          if (!active.has(record)) return;
          if (record.multiTargetWave) {
            // One shell, one RAF, one real swept edge per visible enemy.
            // No second animation or full-model hitbox approximation.
            for (const [slot, model] of waveCollisionModels) {
              if (!active.has(record)) break;
              if (record.waveTargetsHit.has(slot)) continue;
              const frame = model.snapshot();
              const hit = frame && sweptExpandingWaveHitsOpaqueMaskV1({
                center,
                previousRadiusPx: record.previousRadiusPx,
                radiusPx,
                thicknessPx,
                previousFrame: record.previousTargetFrames.get(slot) ?? null,
                frame
              });
              record.previousTargetFrames.set(slot, frame);
              if (!hit) continue;
              const result = onProjectileContact(Object.freeze({
                actorId: fromSlot, targetId: slot, skillId,
                contactPoint: center, waveMultiTarget: true
              }));
              if (result?.ok === true) {
                record.waveTargetsHit.add(slot);
                record.contactReported = true;
              }
            }
            record.previousRadiusPx = radiusPx;
            if (active.has(record)) record.contactFrameId = requestFrame(observe);
            return;
          }
          const targetFrame = collisionModel?.snapshot?.() ?? null;
          const hit = targetFrame && onProjectileContact &&
            sweptExpandingWaveHitsOpaqueMaskV1({
              center,
              previousRadiusPx: record.previousRadiusPx,
              radiusPx,
              thicknessPx,
              previousFrame: record.previousTargetFrame,
              frame: targetFrame
            });
          record.previousRadiusPx = radiusPx;
          record.previousTargetFrame = targetFrame;
          if (hit) {
            record.contactReported = true;
            onProjectileContact(Object.freeze({
              actorId: fromSlot, targetId: targetSlot, skillId,
              contactPoint: center
            }));
            return;
          }
          record.contactFrameId = requestFrame(observe);
        };
        record.contactFrameId = requestFrame(observe);
      }

      const finished = Promise.resolve(animation.finished)
        .then(() => {
          if (record.multiTargetWave) cleanup(record);
          return { status: "arrived" };
        })
        .catch(error => {
          cleanup(record);
          if (error?.name === "AbortError") return { status: "cancelled" };
          throw error;
        });
      return Object.freeze({ status: "running", animation, finished });
    }

    if (type === "beam") {
      const travelVisual = presentation?.travel ?? null;
      if (!hasSpriteVisual(travelVisual)) {
        return Object.freeze({
          status: "ignored",
          finished: Promise.resolve({ status: "ignored" })
        });
      }

      // The existing renderer owns all three linked beam pieces, and the
      // Runtime owns their common duration. No independent FX clocks.
      const startVisual = presentation?.beamStart ?? null;
      const targetVisual = presentation?.impact ?? null;
      const travelSourceAnchor =
        presentation?.travelSourceAnchor ?? null;
      const headingRad = Number.isFinite(Number(travelVisual.headingRad))
        ? Number(travelVisual.headingRad)
        : 0;
      const displayScale = Math.min(
        8, Math.max(0.25, Number(travelVisual.displayScale) || 1)
      );
      const displayScaleY = Math.min(
        8, Math.max(0.25, Number(travelVisual.displayScaleY) || 1)
      );
      const thicknessPx = BEAM_CAP_BASE_SIZE_PX * displayScale * displayScaleY;

      const node = arena.ownerDocument.createElement("span");
      node.className = "skill-fx skill-fx--beam skill-fx--sprite-shell";
      if (presentation?.travelLayer === "behind") {
        node.className += " skill-fx--layer-behind";
      }
      node.dataset.skillFx = "beam";
      node.dataset.assetId = travelVisual.assetId ?? "";
      if (skillId) node.dataset.skillId = skillId;
      if (element) node.dataset.element = element;
      if (travelSourceAnchor) node.dataset.fxAnchor = travelSourceAnchor;
      node.style.height = `${thicknessPx}px`;
      node.style.transformOrigin = "0 50%";
      node.style.pointerEvents = "none";

      const frameAnimations = [];
      const body = arena.ownerDocument.createElement("span");
      body.className = "skill-fx__sprite skill-fx__beam-body";
      body.dataset.beamPart = "body";
      body.style.position = "absolute";
      body.style.left = "0";
      body.style.top = "0";
      body.style.width = "100%";
      body.style.height = "100%";
      body.style.transform = "none";
      const bodyPlayback = applySpriteVisual(
        body, travelVisual, durationMs, animate
      );
      if (bodyPlayback.frameAnimation) {
        frameAnimations.push(bodyPlayback.frameAnimation);
      }
      node.append(body);

      // Endcaps share the beam's coordinates and single lifecycle. The
      // impact animation at the authoritative hit is still independent.
      function appendEndcap(visual, part, point, layer) {
        if (!hasSpriteVisual(visual)) return;
        const cap = arena.ownerDocument.createElement("span");
        cap.className = "skill-fx__sprite skill-fx__beam-" + part;
        if (layer === "behind") cap.className += " skill-fx--layer-behind";
        cap.dataset.beamPart = part;
        cap.style.position = "absolute";
        cap.style.left = point;
        cap.style.top = "50%";
        const scale = Math.min(
          8, Math.max(0.25, Number(visual.displayScale) || 1)
        );
        const size = BEAM_CAP_BASE_SIZE_PX * scale;
        cap.style.width = `${size}px`;
        cap.style.height = `${size * Math.min(8, Math.max(0.25, Number(visual.displayScaleY) || 1))}px`;
        cap.style.transform = "translate(-50%, -50%)";
        cap.style.pointerEvents = "none";
        cap.style.opacity = String(visual.opacity ?? 1);
        const playback = applySpriteVisual(
          cap,
          { ...visual, playbackMode: "loop" },
          durationMs,
          animate
        );
        if (playback.frameAnimation) {
          frameAnimations.push(playback.frameAnimation);
        }
        node.append(cap);
      }
      appendEndcap(
        startVisual, "start", "0", presentation?.beamStartLayer
      );
      appendEndcap(
        targetVisual, "target", "100%", presentation?.impactLayer
      );

      let beamSegment = null;
      function positionBeam() {
        const currentArena = arena.getBoundingClientRect();
        const from = centerRelativeTo(
          sourceRect(fromSlot, travelSourceAnchor),
          currentArena
        );
        const to = centerRelativeTo(
          projectileTargetRect(targetSlot),
          currentArena
        );
        // The three linked pieces use the same authored attachment coordinates.
        // The cast is the visible charge at the mouth; prefer its V9 view
        // offsets. An older beam without cast may use start/travel offsets.
        // The contact sprite's V9 offset also defines the beam end point.
        const sourceVisual = presentation?.cast ?? startVisual ?? travelVisual;
        const startX = from.x + (Number(sourceVisual?.offsetX) || 0);
        const startY = from.y + (Number(sourceVisual?.offsetY) || 0);
        const targetOffset = presentation?.impactFeedbackOffset ?? targetVisual;
        const endX = to.x + (Number(targetOffset?.x ?? targetOffset?.offsetX) || 0);
        const endY = to.y + (Number(targetOffset?.y ?? targetOffset?.offsetY) || 0);
        const distancePx = Math.max(
          1, Math.hypot(endX - startX, endY - startY)
        );
        // Keep the center of both endcaps on the authoritative anchors;
        // tuck the body underneath their alpha edges in the SAME rotated FX.
        // Cap the inset for close targets so neither end can pass the other.
        const capOverlap = (visual) => hasSpriteVisual(visual)
          ? BEAM_CAP_BASE_SIZE_PX *
            Math.min(8, Math.max(0.25, Number(visual.displayScale) || 1)) *
            BEAM_CAP_OVERLAP_RATIO
          : 0;
        const fromOverlap = Math.min(distancePx / 3, capOverlap(startVisual));
        const toOverlap = Math.min(distancePx / 3, capOverlap(targetVisual));
        // No caps (legacy beams): preserve the original 100%-wide body.
        body.style.left = fromOverlap > 0 ? `${-fromOverlap}px` : "0";
        body.style.width = fromOverlap > 0 || toOverlap > 0
          ? `${distancePx + fromOverlap + toOverlap}px`
          : "100%";
        const rotationRad = Math.atan2(
          endY - startY, endX - startX
        ) - headingRad;
        node.style.left = `${startX}px`;
        node.style.top = `${startY}px`;
        node.style.width = `${distancePx}px`;
        node.style.transform =
          `translateY(-50%) rotate(${rotationRad}rad)`;
        // Source and target are the actual rendered beam anchors, including
        // authored offsets. This is observation only, never HP resolution.
        beamSegment = Object.freeze({from:Object.freeze({
          x:startX+currentArena.left,y:startY+currentArena.top
        }),to:Object.freeze({x:endX+currentArena.left,y:endY+currentArena.top})});
      }
      positionBeam();
      applyPresentationGlow(node, presentation?.feedback?.glow);
      arena.append(node);

      const record = {
        node,
        animation: null,
        frameAnimation: {
          cancel() {
            for (const frameAnimation of frameAnimations) {
              frameAnimation.cancel?.();
            }
          }
        },
        type: "beam",
        skillId,
        fromSlot,
        targetSlot,
        barrierSegment: beamSegment,
        contactFrameId: null,
        contactReported: false
      };
      active.add(record);

      function followAnchors() {
        record.contactFrameId = null;
        if (disposed || !active.has(record)) return;
        positionBeam();
        record.barrierSegment = beamSegment;
        record.contactFrameId = requestFrame(followAnchors);
      }
      record.contactFrameId = requestFrame(followAnchors);

      const animation = animate(
        node,
        [
          { opacity: 0.35 },
          { opacity: 1, offset: 0.12 },
          { opacity: 1, offset: 0.88 },
          { opacity: 0.25 }
        ],
        {
          duration: Math.max(1, Number(durationMs) || 1),
          easing: "linear",
          fill: "forwards"
        }
      );
      record.animation = animation;

      const finished = Promise.resolve(animation.finished)
        .then(() => {
          cleanup(record);
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

    const travelVisual = presentation?.travel ?? null;
    const skyfall = travelVisual?.trajectoryMode === "skyfall";
    const travelSourceAnchor =
      presentation?.travelSourceAnchor ?? null;
    // Direct fire keeps the actor's AUTHORED rest placement and a point
    // on its existing physical alpha mask. Only transient translations
    // disappear from the projected resting lane. Skyfall remains live.
    const opaquePoint = !skyfall && targetCollisionModelFor
      ? visibleModelOpaqueAimPoint(
          targetCollisionModelFor(targetSlot)?.snapshot?.() ?? null
        )
      : null;
    const to = centerRelativeTo(
      skyfall
        ? projectileTargetRect(targetSlot)
        : restingProjectileAimRectV1({
            slotRect: anchor(
              targetAnchors, targetSlot, "resting projectile lane"
            ).getBoundingClientRect(),
            motionRect: anchor(
              anchors, targetSlot, "moving target model"
            ).getBoundingClientRect(),
            visibleRect: targetAnchorFor
              ? targetAnchorFor(targetSlot)
              : null,
            opaquePoint,
            restingOffset: restingOffsetFor
              ? restingOffsetFor(targetSlot)
              : null
          }),
      arenaRect
    );
    // Skyfall is authored on visual.travel: the source actor never becomes
    // the origin. The same Runtime travel duration and contact sensor apply.
    const from = skyfall
      ? {
          x: to.x + travelVisual.fallOffsetXPx,
          y: to.y - travelVisual.fallHeightPx
        }
      : fromPoint && Number.isFinite(fromPoint.x) && Number.isFinite(fromPoint.y)
        ? { x: fromPoint.x - arenaRect.left, y: fromPoint.y - arenaRect.top }
        : centerRelativeTo(
            sourceRect(fromSlot, travelSourceAnchor),
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

    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    const travelDisplayScale = Math.min(
      8,
      Math.max(0.25, (Number(travelVisual?.displayScale) || 1) * (Number.isFinite(sizeMultiplier) && sizeMultiplier > 0 ? sizeMultiplier : 1))
    );
    // The only depth authority is this projectile visual. Its shell remains
    // centered on the exact same trajectory/contact core; the scaling is
    // opt-in, and historical projectiles keep identical transform keyframes.
    const perspectiveAmount = !skyfall
      ? Math.min(0.5, Math.max(0, Number(travelVisual?.perspectiveAmount) || 0))
      : 0;
    const authoredFarRatio = Number(travelVisual?.farScaleRatio);
    const farRatio = !skyfall && Number.isFinite(authoredFarRatio)
      ? Math.min(1, Math.max(0.15, authoredFarRatio))
      : 1 - perspectiveAmount;
    const inbound = travelVisual?.perspectiveView === "opponent" ||
      (typeof fromSlot === "string" && /^opponent(?:-|$)/.test(fromSlot));
    const startDepth = inbound ? farRatio : 1;
    const endDepth = inbound ? 1 : farRatio;
    const midwayDepth = (startDepth + endDepth) / 2;
    let spriteBound = false;
    let projectileFrameAnimation = null;

    if (hasSpriteVisual(travelVisual)) {
      const spriteNode = arena.ownerDocument.createElement("span");
      const coreAnchorX = clampUnit(travelVisual.coreAnchor?.x, 0.5);
      const coreAnchorY = clampUnit(travelVisual.coreAnchor?.y, 0.5);
      // The media catalog alone declares the sprite's native direction.
      // Most authored atlases point right, but older atlases (e.g. the
      // original fireball) point left. Never infer sprite direction from the
      // creature camp or from an asset/skill ID. Mirror only if the actual
      // flight direction disagrees with the native heading. Mirror returns
      // take the same path using their real contactPoint and deltaX.
      // Neutral/skyfall assets keep their original upright presentation.
      const headingRad = travelVisual.headingRad;
      const hasDirectionalHeading = typeof headingRad === "number" &&
        Number.isFinite(headingRad);
      const nativeLeftward = hasDirectionalHeading && Math.cos(headingRad) < 0;
      const mirrorHorizontally = !skyfall && hasDirectionalHeading &&
        (deltaX < 0) !== nativeLeftward;
      const travelAngle = Math.atan2(deltaY, deltaX);
      // Preserve the existing rotations of all right-facing sprites; only
      // native-left artworks require an inverted mirror decision and an
      // angular wrap to avoid a nearly full-turn rotation for upper lanes.
      let rotationRad = skyfall || !hasDirectionalHeading
        ? 0
        : nativeLeftward
          ? travelAngle - (mirrorHorizontally ? Math.PI - headingRad : headingRad)
          : mirrorHorizontally
            ? (travelAngle > 0 ? travelAngle - Math.PI : travelAngle + Math.PI)
              + headingRad
            : travelAngle - headingRad;
      if (nativeLeftward && rotationRad > Math.PI) rotationRad -= 2 * Math.PI;
      if (nativeLeftward && rotationRad < -Math.PI) rotationRad += 2 * Math.PI;

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
      spriteNode.style.transform = mirrorHorizontally
        ? `rotate(${rotationRad}rad) scaleX(-1)`
        : `rotate(${rotationRad}rad)`;
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
      contactReported: false,
      projectilePower: Math.max(0,Number(projectilePower)||0),
      mirrorSurfaceEligible: !skyfall
    };
    active.add(record);

    const keyframes = spriteBound
      ? [
          {
            transform: `translate(-50%, -50%) translate3d(0, 0, 0) scale(${0.94 * travelDisplayScale * startDepth})`,
            opacity: 0.95
          },
          {
            transform: `translate(-50%, -50%) translate3d(${deltaX * 0.5}px, ${deltaY * 0.5}px, 0) scale(${1.04 * travelDisplayScale * midwayDepth})`,
            opacity: 1,
            offset: 0.5
          },
          {
            transform: `translate(-50%, -50%) translate3d(${deltaX}px, ${deltaY}px, 0) scale(${0.98 * travelDisplayScale * endDepth})`,
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

    // One and the same projectile animation also owns optical occlusion:
    // leave the caster behind, then clear the enemy in FRONT before impact.
    // No second RAF/timeout, no change to core trajectory or collision.
    const startLayer = presentation?.travelLayer === "behind" ? "behind" : "front";
    const endLayer = !skyfall && ["front", "behind"].includes(presentation?.travelArrivalLayer)
      ? presentation.travelArrivalLayer : startLayer;
    const actualKeyframes = spriteBound && startLayer !== endLayer
      ? [0, 0.37, 0.38, 0.5, 1].map((ratio) => {
          const pulse = ratio <= 0.5
            ? 0.94 + 0.1 * (ratio / 0.5)
            : 1.04 - 0.06 * ((ratio - 0.5) / 0.5);
          const depth = startDepth + (endDepth - startDepth) * ratio;
          return {
            offset: ratio,
            transform: `translate(-50%, -50%) translate3d(${deltaX * ratio}px, ${deltaY * ratio}px, 0) scale(${Number((pulse * travelDisplayScale * depth).toFixed(6))})`,
            opacity: ratio === 0 ? 0.95 : 1,
            zIndex: ratio < 0.38 ? (startLayer === "behind" ? "2" : "7")
              : (endLayer === "behind" ? "2" : "7")
          };
        })
      : keyframes;
    const animation = animate(
      node,
      actualKeyframes,
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

  // Synchronous visual query on the authoritative Runtime impact tick.
  // No second RAF, hit logic or entity HP authority. An active beam supplies
  // its exact rendered endpoints; contact uses the moving fighter and target.
  function barrierContactFor({sourceActorId,targetActorId,kind,skillId=null}){
    if(disposed||!["beam","contact"].includes(kind)||barrierCollisionRectsFor===null)return null;
    const barriers=barrierCollisionRectsFor({sourceActorId,targetActorId,kind})??[];
    if(!Array.isArray(barriers)||barriers.length===0)return null;
    const activeBeam=kind==="beam"?[...active].find(record=>
      record.type==="beam"&&record.fromSlot===sourceActorId&&
      record.targetSlot===targetActorId&&
      (skillId===null||String(record.skillId)===String(skillId))) : null;
    const observed=activeBeam?.barrierSegment??null;
    const source=observed?.from??rectCenter(sourceRect(sourceActorId));
    const target=observed?.to??rectCenter(projectileTargetRect(targetActorId));
    return nearestBarrierSegmentContactV1({from:source,to:target,barriers});
  }

  function sampleZoneSpatialContext(zones) {
    if (disposed || !zones.length) return null;
    // Reproject moving sources before sampling on the Runtime's existing tick.
    syncPersistentZones(zones);
    const rect = value => {
      const r =
        typeof value?.getBoundingClientRect === "function"
          ? value.getBoundingClientRect()
          : value;
      return r && Number(r.width) > 0 && Number(r.height) > 0
        ? {
            left: Number(r.left),
            top: Number(r.top),
            width: Number(r.width),
            height: Number(r.height)
          }
        : null;
    };
    return {
      zones: zones.flatMap(zone => {
        const bounds = rect(persistentZones.get(zone.id)?.node);
        return bounds ? [{ zoneId: zone.id, sourceActorId: zone.sourceActorId, radius: zone.radius, bounds }] : [];
      }),
      actors: Object.entries(anchors).flatMap(([actorId, element]) => {
        const visible =
          targetAnchorFor?.(actorId) ?? null;
        const bounds =
          rect(visible) ??
          rect(element);
        return bounds ? [{ actorId, bounds }] : [];
      })
    };
  }

  function cancelProjectileFor(fromSlot, {
    preserveContactedWave = false,
    skillId = null
  } = {}) {
    let cancelled = 0;

    for (const record of [...active]) {
      if (
        !["projectile", "beam"].includes(record.type) ||
        record.fromSlot !== fromSlot
      ) {
        continue;
      }

      // The FIRST real collision already settled damage in Combat Runtime.
      // An expanding wave may finish its visible growth without reporting
      // additional contacts or clashes; it is presentation-only from now on.
      if (
        preserveContactedWave &&
        record.expandingWave != null &&
        record.contactReported === true &&
        record.skillId === skillId &&
        record.visualOnly !== true &&
        record.animation?.finished
      ) {
        record.visualOnly = true;
        if (record.contactFrameId != null) {
          cancelFrame(record.contactFrameId);
          record.contactFrameId = null;
        }
        record.observedProjectiles?.clear?.();
        Promise.resolve(record.animation.finished).then(
          () => cleanup(record),
          () => cleanup(record)
        );
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
    burrowTerrainForSkill(skillId,sourceView,targetView) {
      return presentationForSkill(skillId,{sourceView,targetView,fxType:"burrow"})?.burrowTerrain ?? null;
    },
    syncPersistentZones,
    sampleZoneSpatialContext,
    barrierContactFor,
    cancelProjectileFor,
    cancelAll,
    dispose,
    get activeCount() {
      return active.size;
    }
  });
}
