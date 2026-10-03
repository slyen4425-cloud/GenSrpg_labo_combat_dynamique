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

function atlasSequence(visual) {
  const atlas = visual?.atlas;
  if (
    !atlas ||
    typeof atlas.url !== "string" ||
    atlas.url.trim() === "" ||
    !Number.isFinite(Number(atlas.width)) ||
    Number(atlas.width) <= 0 ||
    !Number.isFinite(Number(atlas.height)) ||
    Number(atlas.height) <= 0 ||
    !Array.isArray(atlas.frames) ||
    atlas.frames.length === 0
  ) {
    return null;
  }

  const frames = atlas.frames.map((frame) => {
    const normalized = Object.freeze({
      x: Number(frame?.x),
      y: Number(frame?.y),
      width: Number(frame?.width),
      height: Number(frame?.height)
    });

    if (
      !Number.isFinite(normalized.x) ||
      !Number.isFinite(normalized.y) ||
      !Number.isFinite(normalized.width) ||
      normalized.width <= 0 ||
      !Number.isFinite(normalized.height) ||
      normalized.height <= 0
    ) {
      throw new TypeError("atlas frame geometry must be finite and positive");
    }

    return normalized;
  });

  const first = frames[0];
  if (
    frames.some(
      (frame) =>
        frame.width !== first.width ||
        frame.height !== first.height
    )
  ) {
    throw new RangeError(
      "atlas sequence frames must share one crop size"
    );
  }

  return Object.freeze({
    url: atlas.url,
    width: Number(atlas.width),
    height: Number(atlas.height),
    frames: Object.freeze(frames)
  });
}

function hasSpriteVisual(visual) {
  return Boolean(
    visual?.url ||
    (Array.isArray(visual?.frames) && visual.frames.length > 0) ||
    atlasSequence(visual)
  );
}

function visualPlaybackMs(visual, fallbackMs = 1) {
  const atlas = atlasSequence(visual);
  if (atlas) {
    const frameMs = Math.max(1, Number(visual.frameMs) || 1);
    return frameMs * atlas.frames.length;
  }
  if (Array.isArray(visual?.frames) && visual.frames.length > 0) {
    const frameMs = Math.max(1, Number(visual.frameMs) || 1);
    return frameMs * visual.frames.length;
  }
  return Math.max(1, Number(fallbackMs) || 1);
}

function atlasFrameCss(atlas, frame) {
  const sizeX = (atlas.width / frame.width) * 100;
  const sizeY = (atlas.height / frame.height) * 100;
  const positionX =
    atlas.width === frame.width
      ? 0
      : (frame.x / (atlas.width - frame.width)) * 100;
  const positionY =
    atlas.height === frame.height
      ? 0
      : (frame.y / (atlas.height - frame.height)) * 100;

  return Object.freeze({
    backgroundSize: `${sizeX}% ${sizeY}%`,
    backgroundPosition: `${positionX}% ${positionY}%`
  });
}

function applySpriteVisual(node, visual, durationMs, animate) {
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

  const atlas = atlasSequence(visual);
  if (atlas) {
    const playbackMode =
      ["once", "loop", "stretch"].includes(visual.playbackMode)
        ? visual.playbackMode
        : "once";
    const nativePlaybackMs =
      Math.max(1, Number(visual.frameMs) || 1) *
      atlas.frames.length;
    const playbackMs =
      playbackMode === "stretch"
        ? Math.max(1, Number(durationMs) || nativePlaybackMs)
        : nativePlaybackMs;
    const firstFrame =
      atlasFrameCss(atlas, atlas.frames[0]);

    node.style.backgroundImage =
      `url("${atlas.url}")`;
    node.style.backgroundSize =
      firstFrame.backgroundSize;
    node.style.backgroundPosition =
      firstFrame.backgroundPosition;

    let frameAnimation = null;
    if (atlas.frames.length > 1) {
      frameAnimation = animate(
        node,
        atlas.frames.map((frame, index) => ({
          backgroundPosition:
            atlasFrameCss(atlas, frame).backgroundPosition,
          offset:
            index / (atlas.frames.length - 1)
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

      Promise.resolve(
        frameAnimation?.finished
      ).catch(() => {});
    }

    return Object.freeze({
      bound: true,
      frameAnimation,
      playbackMs
    });
  }

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
      playbackMs
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
    `steps(${Math.max(1, frameCount - 1)}, end)`;
  node.style.animationIterationCount =
    playbackMode === "loop" ? "infinite" : "1";
  node.style.animationFillMode = "forwards";

  return Object.freeze({
    bound: true,
    frameAnimation: null,
    playbackMs: duration
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
  targetCollisionModelFor = null
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

  function playImpactVisual({
    visual,
    skillId,
    point,
    durationMs,
    type = "impact"
  }) {
    if (!hasSpriteVisual(visual)) {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({ status: "ignored" })
      });
    }

    const node = arena.ownerDocument.createElement("span");
    const displayScale = Math.min(
      4,
      Math.max(0.25, Number(visual.displayScale) || 1)
    );

    node.className =
      type === "clash-impact"
        ? "skill-fx skill-fx--impact skill-fx--clash-impact"
        : `skill-fx skill-fx--${type}`;
    node.dataset.skillFx = type;
    node.dataset.skillId = skillId ?? "";
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y}px`;

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
          opacity: 0.15
        },
        {
          transform:
            `translate(-50%, -50%) scale(${peakScale * displayScale})`,
          opacity: 1,
          offset: 0.5
        },
        {
          transform:
            `translate(-50%, -50%) scale(${endScale * displayScale})`,
          opacity: 0
        }
      ],
      {
        duration: Math.max(1, Number(durationMs) || 420),
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
          targetAnchors,
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
          1000,
          animate
        );
        arena.append(node);

        record = {
          node,
          animation: null,
          frameAnimation:
            spriteVisual.frameAnimation,
          type: "persistent-zone",
          zoneId
        };
        persistentZones.set(zoneId, record);
        active.add(record);
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
        4,
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

      const to = centerRelativeTo(
        anchor(
          anchors,
          targetSlot,
          "live damage target"
        ).getBoundingClientRect(),
        arenaRect
      );

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
            opacity: 0
          },
          {
            transform:
              "translate(-50%, -50%) translate3d(0, -0.25rem, 0) scale(1.12)",
            opacity: 1,
            offset: 0.2
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
        type: "impact"
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
      4,
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
    cancelProjectileFor,
    cancelAll,
    dispose,
    get activeCount() {
      return active.size;
    }
  });
}
