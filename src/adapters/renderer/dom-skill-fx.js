function defaultAnimate(element, keyframes, options) {
  if (typeof element.animate !== "function") {
    throw new TypeError("skill FX element does not support Web Animations API");
  }
  return element.animate(keyframes, options);
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

function applySpriteStrip(node, visual, durationMs) {
  if (!visual?.url) {
    return false;
  }

  const frameCount = Math.max(
    1,
    Math.floor(Number(visual.frameCount) || 1)
  );
  const duration = Math.max(1, Number(durationMs) || 1);

  node.className += " skill-fx--sprite";
  node.dataset.assetId = visual.assetId ?? "";
  node.style.backgroundImage = `url("${visual.url}")`;
  node.style.backgroundRepeat = "no-repeat";
  node.style.backgroundSize = `${frameCount * 100}% 100%`;
  node.style.backgroundPosition = "0% 0%";
  node.style.animationName = "skill-fx-strip";
  node.style.animationDuration = `${duration}ms`;
  node.style.animationTimingFunction =
    `steps(${Math.max(1, frameCount - 1)}, end)`;
  node.style.animationIterationCount = "1";
  node.style.animationFillMode = "forwards";
  return true;
}

export function createDomSkillFxRenderer({
  arena,
  anchors,
  targetAnchors = anchors,
  missLabel = "RATÉ",
  presentationForSkill = () => null,
  animate = defaultAnimate
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

  let disposed = false;
  const active = new Set();

  function anchor(collection, slot, label) {
    const element = collection[slot];
    if (!element || typeof element.getBoundingClientRect !== "function") {
      throw new RangeError(`Unknown FX ${label} anchor: ${slot}`);
    }
    return element;
  }

  function cleanup(record) {
    if (!record || !active.has(record)) {
      return;
    }
    active.delete(record);
    record.node.remove?.();
  }

  function play({
    type,
    skillId = null,
    element = null,
    actorSlot = null,
    fromSlot,
    targetSlot,
    durationMs
  }) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        finished: Promise.resolve({ status: "disposed" })
      });
    }
    if (!["cast", "projectile", "impact", "miss"].includes(type)) {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({ status: "ignored" })
      });
    }

    const arenaRect = arena.getBoundingClientRect();
    const presentation = skillId
      ? presentationForSkill(skillId)
      : null;

    if (type === "cast") {
      const visual = presentation?.cast ?? null;
      if (!visual?.url) {
        return Object.freeze({
          status: "ignored",
          finished: Promise.resolve({ status: "ignored" })
        });
      }

      const sourceSlot = actorSlot ?? fromSlot;
      const from = centerRelativeTo(
        anchor(anchors, sourceSlot, "source").getBoundingClientRect(),
        arenaRect
      );
      const node = arena.ownerDocument.createElement("span");
      const displayScale = Math.min(
        4,
        Math.max(0.25, Number(visual.displayScale) || 1)
      );

      node.className = "skill-fx skill-fx--cast";
      node.dataset.skillFx = "cast";
      node.dataset.skillId = skillId ?? "";
      node.style.left = `${from.x}px`;
      node.style.top = `${from.y}px`;
      applySpriteStrip(node, visual, durationMs);
      arena.append(node);

      const record = { node, animation: null };
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

    if (type === "impact") {
      const visual = presentation?.impact ?? null;
      if (!visual?.url) {
        return Object.freeze({
          status: "ignored",
          finished: Promise.resolve({ status: "ignored" })
        });
      }

      const to = centerRelativeTo(
        anchor(targetAnchors, targetSlot, "target").getBoundingClientRect(),
        arenaRect
      );
      const node = arena.ownerDocument.createElement("span");
      node.className = "skill-fx skill-fx--impact";
      node.dataset.skillFx = "impact";
      node.dataset.skillId = skillId ?? "";
      node.style.left = `${to.x}px`;
      node.style.top = `${to.y}px`;
      applySpriteStrip(node, visual, durationMs);
      arena.append(node);

      const record = { node, animation: null };
      active.add(record);

      const animation = animate(
        node,
        [
          {
            transform: "translate(-50%, -50%) scale(0.6)",
            opacity: 0.15
          },
          {
            transform: "translate(-50%, -50%) scale(1.08)",
            opacity: 1,
            offset: 0.5
          },
          {
            transform: "translate(-50%, -50%) scale(1.28)",
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

    const from = centerRelativeTo(
      anchor(anchors, fromSlot, "source").getBoundingClientRect(),
      arenaRect
    );
    const to = centerRelativeTo(
      anchor(targetAnchors, targetSlot, "target").getBoundingClientRect(),
      arenaRect
    );

    const node = arena.ownerDocument.createElement("span");
    node.className = "skill-fx skill-fx--projectile";
    node.dataset.skillFx = "projectile";
    if (skillId) {
      node.dataset.skillId = skillId;
    }
    if (element) {
      node.dataset.element = element;
    }
    node.style.left = `${from.x}px`;
    node.style.top = `${from.y}px`;

    const travelVisual = presentation?.travel ?? null;
    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    const travelDisplayScale = Math.min(
      4,
      Math.max(0.25, Number(travelVisual?.displayScale) || 1)
    );
    let spriteBound = false;

    if (travelVisual?.url) {
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
      applySpriteStrip(spriteNode, travelVisual, durationMs);
      spriteNode.style.left = percent(0.5 - coreAnchorX);
      spriteNode.style.top = percent(0.5 - coreAnchorY);
      spriteNode.style.transformOrigin =
        `${percent(coreAnchorX)} ${percent(coreAnchorY)}`;
      spriteNode.style.transform = `rotate(${rotationRad}rad)`;
      node.append(spriteNode);
      spriteBound = true;
    }

    arena.append(node);

    const record = { node, animation: null };
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
    cancelAll,
    dispose,
    get activeCount() {
      return active.size;
    }
  });
}
