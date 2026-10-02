function defaultCreateAudio(url) {
  if (typeof Audio !== "function") {
    throw new TypeError("Audio constructor is unavailable");
  }
  return new Audio(url);
}

function clampVolume(value, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, numeric));
}

function soundFor(presentation, type, phase) {
  switch (type) {
    case "cast":
      return presentation?.castSound ?? null;
    case "release":
      return presentation?.releaseSound ?? null;
    case "travel":
      return presentation?.travelSound ?? null;
    case "impact":
      return presentation?.impactSound ?? null;
    case "phase":
      return presentation?.phaseSound?.[phase] ?? null;
    default:
      return null;
  }
}

export function createDomCombatAudio({
  presentationForSkill = () => null,
  resolveAudioAsset = () => null,
  createAudio = defaultCreateAudio
} = {}) {
  if (typeof presentationForSkill !== "function") {
    throw new TypeError("presentationForSkill must be a function");
  }
  if (typeof resolveAudioAsset !== "function") {
    throw new TypeError("resolveAudioAsset must be a function");
  }

  const active = new Set();
  const primedByAssetId = new Map();
  let disposed = false;

  function prepareMedia(sound) {
    if (!sound?.assetId) {
      return null;
    }

    const asset =
      resolveAudioAsset(sound.assetId);
    if (!asset?.url) {
      return null;
    }

    const audio = createAudio(asset.url);
    try {
      audio.preload = "auto";
    } catch {}
    audio.volume = clampVolume(
      sound.volume ?? asset.volume,
      1
    );
    audio.loop = Boolean(
      sound.loop ?? asset.loop
    );
    try {
      audio.load?.();
    } catch {}

    return {
      audio,
      asset
    };
  }

  function primeSkill(
    skillId,
    {
      actorSlot = null,
      targetSlot = null
    } = {}
  ) {
    if (disposed || !skillId) {
      return Object.freeze({
        status: disposed
          ? "disposed"
          : "ignored",
        primedCount: 0
      });
    }

    const presentation =
      presentationForSkill(skillId, {
        audioType: "prime",
        sourceView: actorSlot,
        targetView: targetSlot
      });

    let primedCount = 0;
    for (const sound of [
      presentation?.castSound,
      presentation?.releaseSound,
      presentation?.travelSound,
      presentation?.impactSound
    ]) {
      if (
        !sound?.assetId ||
        primedByAssetId.has(sound.assetId)
      ) {
        continue;
      }

      const prepared =
        prepareMedia(sound);
      if (!prepared) {
        continue;
      }

      primedByAssetId.set(
        sound.assetId,
        prepared
      );
      primedCount += 1;
    }

    return Object.freeze({
      status:
        primedCount > 0
          ? "primed"
          : "idle",
      primedCount
    });
  }

  function play({
    type,
    skillId,
    actorSlot = null,
    targetSlot = null,
    phase = null
  }) {
    if (disposed || !skillId) {
      return Object.freeze({
        status: disposed ? "disposed" : "ignored",
        finished: Promise.resolve({
          status: disposed ? "disposed" : "ignored"
        })
      });
    }

    const presentation = presentationForSkill(skillId, {
      audioType: type,
      sourceView: actorSlot,
      targetView: targetSlot,
      phase
    });
    const sound = soundFor(presentation, type, phase);

    if (!sound?.assetId) {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({ status: "ignored" })
      });
    }

    const asset = resolveAudioAsset(sound.assetId);
    if (!asset?.url) {
      return Object.freeze({
        status: "unavailable",
        assetId: sound.assetId,
        finished: Promise.resolve({
          status: "unavailable",
          assetId: sound.assetId
        })
      });
    }

    const primed =
      primedByAssetId.get(
        sound.assetId
      ) ?? null;
    if (primed) {
      primedByAssetId.delete(
        sound.assetId
      );
    }

    const audio =
      primed?.audio ??
      createAudio(asset.url);

    try {
      audio.preload = "auto";
    } catch {}
    audio.volume = clampVolume(
      sound.volume ?? asset.volume,
      1
    );
    audio.loop = Boolean(sound.loop ?? asset.loop);

    let settled = false;
    let resolveFinished;
    const finished = new Promise((resolve) => {
      resolveFinished = resolve;
    });

    const record = { audio, stop: null };

    function settle(status) {
      if (settled) {
        return;
      }
      settled = true;
      active.delete(record);
      resolveFinished(Object.freeze({
        status,
        assetId: sound.assetId
      }));
    }

    function stop() {
      if (settled) {
        return false;
      }
      try {
        audio.pause?.();
        audio.currentTime = 0;
      } catch {}
      settle("stopped");
      return true;
    }

    record.stop = stop;
    audio.onended = () => settle("finished");
    audio.onerror = () => settle("error");
    active.add(record);

    try {
      Promise.resolve(audio.play?.()).catch(() => settle("blocked"));
    } catch {
      settle("blocked");
    }

    return Object.freeze({
      status: "running",
      assetId: sound.assetId,
      loop: Boolean(audio.loop),
      stop,
      finished
    });
  }

  function stopAll() {
    for (const record of [...active]) {
      record.stop?.();
    }
  }

  function dispose() {
    if (disposed) {
      return;
    }
    stopAll();
    for (const prepared of primedByAssetId.values()) {
      try {
        prepared.audio.pause?.();
        prepared.audio.currentTime = 0;
      } catch {}
    }
    primedByAssetId.clear();
    disposed = true;
  }

  return Object.freeze({
    play,
    primeSkill,
    stopAll,
    dispose,
    get activeCount() {
      return active.size;
    }
  });
}
