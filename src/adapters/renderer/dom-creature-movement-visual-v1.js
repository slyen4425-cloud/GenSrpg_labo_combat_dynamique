// One temporary appearance per active creature slot; locomotion and contact
// remain owned by Animation Core and Visible Model Collision respectively.
import { applySpriteVisual,fxAuthorPixelsV1 } from "./dom-skill-fx.js";
import {composeCreatureMovementPoseV1} from "./dom-keyframes.js";

export function createDomCreatureMovementVisualV1({ motion, image, collisionModel }) {
  if (!motion || !image || !collisionModel) throw new TypeError("motion/image/collisionModel required");
  let active = null;
  let sourceUrl = null;
  const preparedByUrl = new Map();
  // The existing appearance owner decodes GIFs only when an authored speed
  // differs from native. Browsers cannot speed up an <img> GIF with CSS.
  // Reuse the native frame-player from dom-skill-fx, not a second idle engine.
  const decodedGifByUrl = new Map();
  function gifFrames(visual) {
    if(!visual?.animatedGif || Number(visual.frameSpeedMultiplier??1)===1)
      return Promise.resolve(null);
    const url=String(visual.url);
    if(decodedGifByUrl.has(url)) return decodedGifByUrl.get(url);
    const promise=(async()=>{
      const win=image.ownerDocument.defaultView;
      if(!win?.ImageDecoder || !win?.fetch ||
        !(await win.ImageDecoder.isTypeSupported?.("image/gif"))) return null;
      let decoder=null;
      try {
        const response=await win.fetch(url);
        if(!response.ok) return null;
        decoder=new win.ImageDecoder({data:await response.arrayBuffer(),type:"image/gif"});
        await decoder.tracks.ready;
        const count=decoder.tracks.selectedTrack?.frameCount ?? 0;
        if(!Number.isInteger(count) || count<2 || count>72) return null;
        const canvas=image.ownerDocument.createElement("canvas");
        const ctx=canvas.getContext("2d");
        if(!ctx) return null;
        const frames=[],durations=[];
        for(let i=0;i<count;i++){
          const decoded=await decoder.decode({frameIndex:i,completeFramesOnly:true});
          const frame=decoded.image;
          try {
            canvas.width=frame.displayWidth;
            canvas.height=frame.displayHeight;
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(frame,0,0);
            frames.push(canvas.toDataURL("image/png"));
            if(Number.isFinite(frame.duration)&&frame.duration>0)
              durations.push(frame.duration/1000); // WebCodecs uses microseconds.
          } finally { frame.close(); }
        }
        return Object.freeze({frames:Object.freeze(frames),
          frameMs:durations.length ? durations.reduce((a,b)=>a+b,0)/durations.length : 83});
      } catch { return null; } // Keep original native GIF if WebCodecs is unavailable.
      finally { decoder?.close?.(); }
    })();
    decodedGifByUrl.set(url,promise);
    return promise;
  }
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

  function preparedKey(visual) {
    return String(visual.url) + "::frames=" + Math.max(1, Math.floor(Number(visual.frameCount) || 1));
  }

  function prepare(visual, normalUrl, ...additionalVisuals) {
    cancel();
    sourceUrl = normalUrl;
    preparedByUrl.clear();
    for (const item of [visual, ...additionalVisuals]) {
      preload(item);
    }
  }

  function preload(visual) {
    if (!visual?.url || preparedByUrl.has(preparedKey(visual))) return;
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
    preparedByUrl.set(preparedKey(visual), { ready });
    source.src = visual.url;
    if (source.complete && source.naturalWidth > 0) source.onload?.();
  }

  function play(visual, durationMs, direction = 1) {
    if (disposed || !visual?.url || !sourceUrl) return null;
    if (active) cancel();
    if (!preparedByUrl.has(preparedKey(visual))) preload(visual);
    const record = { node: null, spin: null, frame: null, swapped: false, tintMaskUrl: null };
    active = record;
    const duration = Math.max(1, Number(durationMs) || 1);
    Promise.resolve(preparedByUrl.get(preparedKey(visual))?.ready).then(async frame => {
      if (disposed || active !== record || !frame) return;
      const decodedGif=await gifFrames(visual);
      if (disposed || active !== record) return;
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

      // Both a single PNG and a sprite-strip use the SAME animated shell.
      // Status tint is rendered inside it so the color follows its rotation.
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
      record.tintMaskUrl = frame.maskSource;
      image.style.opacity = "0";
      const playback = applySpriteVisual(sprite, {
        ...visual,
        ...(decodedGif ? {frames:decodedGif.frames,frameMs:decodedGif.frameMs}:{}),
        frameCount:decodedGif?.frames.length ?? frame.count,
        playbackMode:visual.playbackMode ?? (frame.count>1 ? "loop" : "once")
      },duration);
      if(visual.animatedGif && visual.frameSpeedMultiplier!==1 && !decodedGif)
        shell.dataset.idleSpeedFallback="native";
      record.frame = playback;
      // Keep the fighter's actual motion transform, collision owner and
      // gameplay coordinates untouched. Only the presentation shell is nudged,
      // to compensate for off-centre artwork in individual attack strips.
      // All author offsets share the same arena unit as the body and skill FX.
      const arena=motion.closest?.("[data-combat-arena]") ?? null;
      const poseScale=composeCreatureMovementPoseV1({
        arena,visual,authorPixels:fxAuthorPixelsV1
      });
      shell.style.transform = poseScale;
      if (visual.mode === "roll" && visual.rotationTurns > 0) {
        record.spin = shell.animate([
          { transform: poseScale + " rotate(0deg)" },
          { transform: poseScale + " rotate(" + (360 * visual.rotationTurns * direction) + "deg)" }
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
    tintTarget() {
      return active?.node
        ? Object.freeze({ host: active.node, maskUrl: active.tintMaskUrl })
        : Object.freeze({ host: motion, maskUrl: null });
    },
    dispose() { cancel(); preparedByUrl.clear(); decodedGifByUrl.clear(); disposed = true; }
  });
}
