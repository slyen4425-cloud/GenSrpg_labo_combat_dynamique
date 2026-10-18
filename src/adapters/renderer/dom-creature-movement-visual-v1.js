// One temporary appearance per active creature slot; locomotion and contact
// remain owned by Animation Core and Visible Model Collision respectively.
import { applySpriteVisual } from "./dom-skill-fx.js";

export function createDomCreatureMovementVisualV1({ motion, image, collisionModel }) {
  if (!motion || !image || !collisionModel) throw new TypeError("motion/image/collisionModel required");
  let active = null;
  let sourceUrl = null;
  let prepared = null;
  let disposed = false;
  const originalOpacity = image.style.opacity;
  const originalTransform = image.style.transform;
  const originalTransition = image.style.transition;

  function cancel() {
    if (!active) return;
    const record = active;
    active = null;
    record.spin?.cancel?.();
    record.frame?.frameAnimation?.cancel?.();
    record.node?.remove?.();
    image.style.opacity = originalOpacity;
    image.style.transform = originalTransform;
    image.style.transition = originalTransition;
    collisionModel.setPresentationScale(1);
    if (record.swapped && sourceUrl && image.src !== sourceUrl) {
      collisionModel.clear();
      image.src = sourceUrl;
      const restore = () => { if (!active) collisionModel.refreshFromImage(); };
      image.addEventListener("load", restore, { once: true });
      if (image.complete && image.naturalWidth > 0) restore();
    }
  }

  function prepare(visual, normalUrl) {
    cancel();
    sourceUrl = normalUrl;
    prepared = null;
    if (!visual?.url) return;
    const source = image.ownerDocument.createElement("img");
    source.crossOrigin = "anonymous";
    const ready = new Promise(resolve => {
      source.onload = () => {
        try {
          const count = Math.max(1, Math.floor(Number(visual.frameCount) || 1));
          let maskSource = visual.url;
          if (count > 1) {
            const canvas = image.ownerDocument.createElement("canvas");
            canvas.width = Math.floor(source.naturalWidth / count);
            canvas.height = source.naturalHeight;
            if (canvas.width < 1 || canvas.height < 1) throw new Error("empty sprite frame");
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("canvas unavailable");
            ctx.drawImage(source, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
            maskSource = canvas.toDataURL("image/png");
          }
          resolve({ maskSource, count });
        } catch {
          resolve(null); // Fail closed: never show a shape with a wrong collision mask.
        }
      };
      source.onerror = () => resolve(null);
    });
    prepared = { url: visual.url, ready };
    source.src = visual.url;
    if (source.complete && source.naturalWidth > 0) source.onload?.();
  }

  function play(visual, durationMs, direction = 1) {
    if (disposed || !visual?.url || !sourceUrl) return null;
    if (!prepared || prepared.url !== visual.url) prepare(visual, sourceUrl);
    const record = { node: null, spin: null, frame: null, swapped: false };
    active = record;
    const duration = Math.max(1, Number(durationMs) || 1);
    Promise.resolve(prepared?.ready).then(frame => {
      if (disposed || active !== record || !frame) return;
      const transition = Number(visual.transitionMs) || 0;
      image.style.transition = transition ? "opacity " + transition + "ms ease" : "";
      collisionModel.setPresentationScale(Number(visual.displayScale) || 1);
      // The real image used by VisibleModelCollision changes with the appearance,
      // rather than leaving the original body as an invisible hit box.
      record.swapped = true;
      collisionModel.clear();
      const onLoad = () => {
        if (active === record) {
          if (!collisionModel.refreshFromImage()) cancel();
        }
      };
      image.addEventListener("load", onLoad, { once: true });
      image.src = frame.maskSource;
      if (image.complete && image.naturalWidth > 0) onLoad();

      if (frame.count === 1) {
        image.style.transform = "scale(" + visual.displayScale + ")";
        if (visual.mode === "roll" && visual.rotationTurns > 0) {
          record.spin = image.animate([
            { transform: "scale(" + visual.displayScale + ") rotate(0deg)" },
            { transform: "scale(" + visual.displayScale + ") rotate(" + (360 * visual.rotationTurns * direction) + "deg)" }
          ], { duration, easing: "linear", iterations: 1, fill: "forwards" });
          Promise.resolve(record.spin.finished).catch(() => {});
        }
        return;
      }

      const shell = image.ownerDocument.createElement("span");
      shell.dataset.creatureMovementVisual = "true";
      Object.assign(shell.style, {
        position: "absolute", inset: "0", display: "block",
        width: "100%", height: "100%", pointerEvents: "none",
        zIndex: "1", transformOrigin: "center"
      });
      const sprite = image.ownerDocument.createElement("span");
      sprite.className = "skill-fx";
      Object.assign(sprite.style, {
        position: "absolute", inset: "0", display: "block", width: "100%", height: "100%",
        backgroundSize: "100% 100%"
      });
      shell.append(sprite);
      motion.append(shell);
      record.node = shell;
      image.style.opacity = "0";
      const playback = applySpriteVisual(sprite, {
        ...visual, playbackMode: "loop"
      }, duration);
      record.frame = playback;
      shell.style.transform = "scale(" + visual.displayScale + ")";
      if (visual.mode === "roll" && visual.rotationTurns > 0) {
        record.spin = shell.animate([
          { transform: "scale(" + visual.displayScale + ") rotate(0deg)" },
          { transform: "scale(" + visual.displayScale + ") rotate(" + (360 * visual.rotationTurns * direction) + "deg)" }
        ], { duration, easing: "linear", iterations: 1, fill: "forwards" });
        Promise.resolve(record.spin.finished).catch(() => {});
      }
    }).catch(() => { if (active === record) cancel(); });
    return Object.freeze({
      cancel() { if (active === record) cancel(); }
    });
  }

  return Object.freeze({
    prepare, play, cancel,
    dispose() { cancel(); prepared = null; disposed = true; }
  });
}
