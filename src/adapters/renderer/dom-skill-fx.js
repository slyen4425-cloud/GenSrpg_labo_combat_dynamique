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

export function createDomSkillFxRenderer({
  arena,
  anchors,
  targetAnchors = anchors,
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
    element = null,
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
    if (type !== "projectile") {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({ status: "ignored" })
      });
    }

    const arenaRect = arena.getBoundingClientRect();
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
    if (element) {
      node.dataset.element = element;
    }
    node.style.left = `${from.x}px`;
    node.style.top = `${from.y}px`;
    arena.append(node);

    const record = { node, animation: null };
    active.add(record);

    const animation = animate(
      node,
      [
        {
          transform: "translate(-50%, -50%) translate3d(0, 0, 0) scale(0.75)",
          opacity: 0.25
        },
        {
          transform: `translate(-50%, -50%) translate3d(${to.x - from.x}px, ${to.y - from.y}px, 0) scale(1)`,
          opacity: 1
        }
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
