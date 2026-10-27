function requiredAudio(audio) {
  if (!audio || typeof audio.play !== "function") {
    throw new TypeError(
      "audio must provide play()"
    );
  }
  return audio;
}

function zoneKey(zone) {
  return String(zone?.id ?? "").trim();
}

export function createPersistentZoneAudioSyncV1({
  audio
}) {
  const player = requiredAudio(audio);
  const active = new Map();
  let disposed = false;

  function stopRecord(zoneId) {
    const record = active.get(zoneId);
    if (!record) {
      return false;
    }
    active.delete(zoneId);
    record.handle?.stop?.();
    return true;
  }

  function sync(zones = []) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        activeCount: 0
      });
    }
    if (!Array.isArray(zones)) {
      throw new TypeError(
        "persistent zones must be an array"
      );
    }

    const expected = new Set();

    for (const zone of zones) {
      const id = zoneKey(zone);
      const skillId =
        String(zone?.skillId ?? "").trim();
      const sourceActorId =
        String(
          zone?.sourceActorId ?? ""
        ).trim();

      if (
        !id ||
        !skillId ||
        !sourceActorId
      ) {
        throw new TypeError(
          "persistent zone audio requires id, skillId and sourceActorId"
        );
      }

      expected.add(id);
      if (active.has(id)) {
        continue;
      }

      const handle = player.play({
        type: "aura",
        skillId,
        actorSlot: sourceActorId,
        targetSlot:
          zone?.targetId ?? null
      });

      if (handle?.status === "running") {
        active.set(
          id,
          Object.freeze({
            handle,
            skillId
          })
        );
      }
    }

    for (const id of [...active.keys()]) {
      if (!expected.has(id)) {
        stopRecord(id);
      }
    }

    return Object.freeze({
      status: "synced",
      activeCount: active.size
    });
  }

  function dispose() {
    if (disposed) {
      return;
    }
    for (const id of [...active.keys()]) {
      stopRecord(id);
    }
    disposed = true;
  }

  return Object.freeze({
    sync,
    dispose,
    get activeCount() {
      return active.size;
    }
  });
}
