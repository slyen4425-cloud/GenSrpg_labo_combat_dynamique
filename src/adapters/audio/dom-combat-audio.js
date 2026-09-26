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
  resolveSource = () => null,
  createAudio = defaultCreateAudio
} = {}) {
  if (typeof presentationForSkill !== "function") {
    throw new TypeError("presentationForSkill must be a function");
  }
  if (typeof resolveSource !== "function") {
    throw new TypeError("resolveSource must be a function");
  }
  if (typeof createAudio !== "function") {
    throw new TypeError("createAudio must be a function");
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
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        finished: Promise.resolve({ status: "disposed" })
      });
    }

    if (!skillId) {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({ status: "ignored" })
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

    const url = resolveSource(sound.assetId);
    if (!url) {
      return Object.freeze({
        status: "missing_source",
        assetId: sound.assetId,
        finished: Promise.resolve({
          status: "missing_source",
          assetId: sound.assetId
        })
      });
    }

    const audio = createAudio(url);
    audio.volume = clampVolume(sound.volume, 1);
    audio.loop = Boolean(sound.loop);

    let settled = false;
    let resolveFinished;
    const finished = new Promise((resolve) => {
      resolveFinished = resolve;
    });

    const record = {
      audio,
      assetId: sound.assetId,
      stop: null
    };

    function settle(status) {
      if (settled) {
        return;
      }
      settled = true;
      active.delete(record);
      if (audio.onended === onEnded) {
        audio.onended = null;
      }
      if (audio.onerror === onError) {
        audio.onerror = null;
      }
      resolveFinished(Object.freeze({
        status,
        assetId: sound.assetId
      }));
    }

    function onEnded() {
      settle("finished");
    }

    function onError() {
      settle("error");
    }

    function stop() {
      if (settled) {
        return false;
      }
      try {
        audio.pause?.();
      } catch {}
      try {
        audio.currentTime = 0;
      } catch {}
      settle("stopped");
      return true;
    }

    record.stop = stop;
    audio.onended = onEnded;
    audio.onerror = onError;
    active.add(record);

    try {
      const started = audio.play?.();
      Promise.resolve(started).catch(() => {
        settle("blocked");
      });
    } catch {
      settle("blocked");
    }

    return Object.freeze({
      status: "running",
      assetId: sound.assetId,
      audio,
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
