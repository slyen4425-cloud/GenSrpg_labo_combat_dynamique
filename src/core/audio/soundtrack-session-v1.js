import {normalizeSoundtrackProjectV1, normalizeSoundtrackCatalogV1} from "../../contracts/soundtrack-project-v1.js";

// One owner for the two *continuous* channels. Existing one-shot skill/creature
// SFX retain their own owner; this module must never intercept them.
export function createSoundtrackSessionV1({catalog, project, output, clock, random = Math.random}) {
  const assets = normalizeSoundtrackCatalogV1(catalog);
  const manifest = normalizeSoundtrackProjectV1(project, assets);
  if (typeof output?.play !== "function") throw new TypeError("output.play required");
  if (typeof clock?.setTimeout !== "function" || typeof clock?.clearTimeout !== "function") {
    throw new TypeError("inject a clock with setTimeout/clearTimeout");
  }
  if (typeof random !== "function") throw new TypeError("random required");
  const channels = ["music","ambience"];
  const slots = {music:null, ambience:null};
  const timers = new Set();
  let disposed = false;
  let sceneId = null;
  let generation = 0;

  function schedule(fn, ms) {
    const timer = clock.setTimeout(() => {
      timers.delete(timer);
      if (!disposed) fn();
    }, ms);
    timers.add(timer);
  }
  function cancelTimers() {
    for (const timer of timers) clock.clearTimeout(timer);
    timers.clear();
  }
  function halt(slot) {
    if (!slot) return;
    slot.active = false;
    try { slot.voice.stop(); } catch { /* stop is best-effort during disposal */ }
  }
  function chooseIndex(playlist, previous) {
    const count = playlist.tracks.length;
    if (!count) return -1;
    if (playlist.order === "sequence") return previous < 0 ? 0 : (previous + 1) % count;
    if (count === 1) return 0;
    const v = random();
    if (!Number.isFinite(v) || v < 0 || v >= 1) throw new RangeError("random must return [0, 1)");
    // Exclude the previous track when there is more than one candidate.
    const pick = Math.floor(v * (count - 1));
    return previous < 0 ? Math.floor(v * count) : (pick >= previous ? pick + 1 : pick);
  }
  function start(ch, playlist, previous, targetVolume, currentGeneration) {
    const index = chooseIndex(playlist, previous);
    if (index < 0) return null;
    const assetId = playlist.tracks[index];
    const voice = output.play(assetId, {channel:ch, volume:targetVolume});
    if (typeof voice?.setVolume !== "function" || typeof voice.stop !== "function" ||
        typeof voice.onEnded !== "function") throw new TypeError("invalid soundtrack output handle");
    const slot = {voice,playlist,index,assetId,active:true,generation:currentGeneration};
    voice.onEnded(() => {
      if (disposed || !slot.active || slots[ch] !== slot || slot.generation !== generation) return;
      const isLast = playlist.order === "sequence" && index === playlist.tracks.length - 1;
      if (isLast && !playlist.repeat) { slot.active = false; slots[ch] = null; return; }
      if (!playlist.repeat && playlist.order === "shuffle" && slot.playedCount >= playlist.tracks.length) {
        slot.active = false;
        slots[ch] = null;
        return;
      }
      const next = start(ch, playlist, index, playlist.volume, generation);
      if (next) next.playedCount = (slot.playedCount ?? 1) + 1;
      slots[ch] = next;
      halt(slot);
    });
    return slot;
  }
  function fade(ch, newSlot, oldSlot, duration, target, currentGeneration) {
    if (!duration) {
      if (newSlot) newSlot.voice.setVolume(target);
      halt(oldSlot);
      return;
    }
    const steps = Math.max(1, Math.ceil(duration / 50));
    const oldVolume = oldSlot?.voice.currentVolume?.() ?? oldSlot?.playlist.volume ?? 1;
    for (let i=1; i<=steps; i++) {
      const step = i;
      schedule(() => {
        if (currentGeneration !== generation) return;
        const t = step / steps;
        if (newSlot?.active) newSlot.voice.setVolume(target * t);
        if (oldSlot?.active) oldSlot.voice.setVolume(Math.max(0, oldVolume * (1 - t)));
        if (step === steps) halt(oldSlot);
      }, duration * i / steps);
    }
  }
  function transitionTo(nextSceneId) {
    if (disposed) throw new Error("soundtrack session disposed");
    if (nextSceneId !== null && typeof nextSceneId !== "string") throw new TypeError("scene ID must be a string or null");
    if (nextSceneId !== null && !Object.prototype.hasOwnProperty.call(manifest.scenes, nextSceneId)) {
      throw new RangeError("unknown soundtrack scene: " + nextSceneId);
    }
    if (nextSceneId === sceneId) return snapshot();
    generation++;
    cancelTimers();
    const nextScene = nextSceneId === null ? null : manifest.scenes[nextSceneId];
    for (const ch of channels) {
      const oldSlot = slots[ch];
      const playlist = nextScene?.[ch] ?? null;
      const duration = playlist?.fadeMs ?? oldSlot?.playlist.fadeMs ?? 0;
      // Without tracks, fade the previous voice out; with tracks, crossfade.
      const target = playlist?.volume ?? 0;
      const nextSlot = playlist?.tracks.length
        ? start(ch,playlist,-1,duration ? 0 : target,generation)
        : null;
      slots[ch] = nextSlot;
      fade(ch,nextSlot,oldSlot,duration,target,generation);
    }
    sceneId = nextSceneId;
    return snapshot();
  }
  function snapshot() {
    return Object.freeze({
      projectId:manifest.projectId,sceneId,
      music:slots.music?.assetId ?? null,ambience:slots.ambience?.assetId ?? null
    });
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    generation++;
    cancelTimers();
    for (const ch of channels) { halt(slots[ch]); slots[ch]=null; }
    sceneId = null;
  }
  return Object.freeze({transitionTo,snapshot,dispose});
}
