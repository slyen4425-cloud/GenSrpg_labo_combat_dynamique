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
    case "aura":
      return presentation?.persistentZoneSound ?? null;
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
  const persistentZoneAudio = new Map();
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
      loop: Boolean(audio.loop),
      stop,
      finished
    });
  }

  function syncPersistentZones(zones = []) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        activeCount: 0
      });
    }
    if (!Array.isArray(zones)) {
      throw new TypeError(
        "zones must be an array"
      );
    }

    const desired = new Map();
    for (const zone of zones) {
      const zoneId =
        typeof zone?.id === "string"
          ? zone.id.trim()
          : "";
      const skillId =
        typeof zone?.skillId === "string"
          ? zone.skillId.trim()
          : "";
      if (!zoneId || !skillId) {
        continue;
      }
      desired.set(zoneId, zone);
    }

    for (
      const [zoneId, handle] of
      persistentZoneAudio.entries()
    ) {
      if (desired.has(zoneId)) {
        continue;
      }
      persistentZoneAudio.delete(zoneId);
      handle.stop?.();
    }

    for (
      const [zoneId, zone] of
      desired.entries()
    ) {
      if (
        persistentZoneAudio.has(zoneId)
      ) {
        continue;
      }

      const handle = play({
        type: "aura",
        skillId: zone.skillId,
        actorSlot:
          zone.sourceActorId ?? null,
        targetSlot:
          zone.targetId ?? null
      });

      if (handle?.status !== "running") {
        continue;
      }

      persistentZoneAudio.set(
        zoneId,
        handle
      );
      Promise.resolve(handle.finished)
        .finally(() => {
          if (
            persistentZoneAudio.get(zoneId) ===
            handle
          ) {
            persistentZoneAudio.delete(
              zoneId
            );
          }
        })
        .catch(() => {});
    }

    return Object.freeze({
      status: "synced",
      activeCount:
        persistentZoneAudio.size
    });
  }

  function stopAll() {
    persistentZoneAudio.clear();
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
    syncPersistentZones,
    stopAll,
    dispose,
    get activeCount() {
      return active.size;
    },
    get activePersistentZoneCount() {
      return persistentZoneAudio.size;
    }
  });
}
