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
  let disposed = false;

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

    const audio = createAudio(asset.url);
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
    disposed = true;
  }

  return Object.freeze({
    play,
    stopAll,
    dispose,
    get activeCount() {
      return active.size;
    }
  });
}
