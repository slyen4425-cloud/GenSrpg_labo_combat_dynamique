// DOM output adapter; no access to project storage or GitHub credentials.
// The caller supplies an authorized asset resolver and starts playback only
// after a user interaction, consistent with mobile browser autoplay policies.
export function createDomSoundtrackOutputV1({resolveAssetUrl, AudioCtor = globalThis.Audio, onError = () => {}}) {
  if (typeof resolveAssetUrl !== "function") throw new TypeError("resolveAssetUrl expected");
  if (typeof AudioCtor !== "function") throw new TypeError("Audio constructor unavailable");
  if (typeof onError !== "function") throw new TypeError("onError expected");
  return Object.freeze({
    play(assetId, {channel, volume}) {
      if (!["music","ambience"].includes(channel)) throw new TypeError("unsupported soundtrack channel");
      const url = resolveAssetUrl(assetId);
      if (typeof url !== "string" || !/^(https?:\/\/|blob:)/i.test(url)) {
        throw new TypeError("soundtrack resolver must return an authorized media URL");
      }
      const media = new AudioCtor(url);
      media.preload = "auto";
      media.loop = false; // Playlist sequencing is owned by SoundtrackSession.
      media.volume = Math.min(1,Math.max(0,volume));
      let ended = () => {};
      let stopped = false;
      const handler = () => { if (!stopped) ended(); };
      media.addEventListener("ended",handler);
      try {
        const result = media.play();
        if (result && typeof result.catch === "function") result.catch(error => onError(error));
      } catch (error) { onError(error); }
      return Object.freeze({
        setVolume(v) { if (!stopped) media.volume = Math.min(1,Math.max(0,v)); },
        currentVolume() { return media.volume; },
        onEnded(fn) {
          if (typeof fn !== "function") throw new TypeError("onEnded expects a function");
          ended = fn;
        },
        stop() {
          if (stopped) return;
          stopped = true;
          media.removeEventListener("ended",handler);
          media.pause();
          media.removeAttribute?.("src");
          media.load?.();
        }
      });
    }
  });
}
