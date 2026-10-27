import {
  privateAudioRuntimeAssetV1
} from "../assets/private-audio-runtime-library-v1.js";

function requiredRoot(root) {
  if (!root || typeof root.querySelectorAll !== "function") {
    throw new TypeError("root must provide querySelectorAll()");
  }
  return root;
}

function defaultCreateAudio(url) {
  if (typeof globalThis.Audio !== "function") {
    throw new Error("Audio playback is unavailable");
  }
  return new globalThis.Audio(url);
}

export function createPrivateAudioPreviewControllerV1({
  root,
  resolveAudioAsset = privateAudioRuntimeAssetV1,
  createAudio = defaultCreateAudio
}) {
  const scope = requiredRoot(root);

  if (typeof resolveAudioAsset !== "function") {
    throw new TypeError("resolveAudioAsset must be a function");
  }
  if (typeof createAudio !== "function") {
    throw new TypeError("createAudio must be a function");
  }

  const cleanups = [];
  let currentAudio = null;
  let disposed = false;

  function stopCurrent() {
    if (!currentAudio) {
      return;
    }

    try {
      currentAudio.pause?.();
      currentAudio.currentTime = 0;
    } catch {
      // Best effort cleanup only.
    }
    currentAudio = null;
  }

  function listen(target, type, handler) {
    target.addEventListener(type, handler);
    cleanups.push(() =>
      target.removeEventListener(type, handler)
    );
  }

  for (const button of scope.querySelectorAll(
    "[data-private-audio-preview]"
  )) {
    const label = button.closest?.("label");
    const select = label?.querySelector?.(
      "select[data-private-audio]"
    );

    if (!select) {
      throw new Error(
        "Private audio preview button requires a sibling selector"
      );
    }

    listen(button, "click", async () => {
      if (disposed) {
        return;
      }

      stopCurrent();

      const assetId = select.value;
      if (!assetId) {
        button.dataset.audioState = "empty";
        return;
      }

      const asset = resolveAudioAsset(assetId);
      if (!asset?.url) {
        button.dataset.audioState = "unavailable";
        return;
      }

      const audio = createAudio(asset.url);
      currentAudio = audio;
      button.dataset.audioState = "playing";

      try {
        await Promise.resolve(audio.play?.());
      } catch {
        if (currentAudio === audio) {
          currentAudio = null;
        }
        button.dataset.audioState = "error";
      }
    });
  }

  return Object.freeze({
    stop: stopCurrent,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      stopCurrent();
      for (const cleanup of cleanups.splice(0)) {
        cleanup();
      }
    }
  });
}
