function defaultSetTimer(callback, delayMs) {
  return setTimeout(callback, delayMs);
}

function defaultClearTimer(timerId) {
  clearTimeout(timerId);
}

export function createCombatResolutionPresenter({
  visuals,
  setTimer = defaultSetTimer,
  clearTimer = defaultClearTimer
}) {
  if (!visuals || typeof visuals.playEventFor !== "function" || typeof visuals.cancelFor !== "function") {
    throw new TypeError("visuals must provide playEventFor() and cancelFor()");
  }
  if (typeof setTimer !== "function" || typeof clearTimer !== "function") {
    throw new TypeError("timer functions are required");
  }

  let disposed = false;
  const timers = new Set();

  function schedule(callback, delayMs) {
    const timerId = setTimer(() => {
      timers.delete(timerId);
      if (!disposed) {
        callback();
      }
    }, Math.max(0, delayMs));
    timers.add(timerId);
    return timerId;
  }

  function impactTime(resolution) {
    return resolution.events.find((item) => item.type === "skill-arrive")?.atMs ?? 0;
  }

  function present({
    resolution,
    actorSlot = "player",
    targetSlot = "opponent"
  }) {
    if (disposed) {
      return Object.freeze({ status: "disposed" });
    }

    if (!resolution?.ok) {
      return Object.freeze({ status: "rejected" });
    }

    visuals.playEventFor(actorSlot, "attack").catch(() => {});

    const atMs = impactTime(resolution);

    schedule(() => {
      switch (resolution.outcome) {
        case "hit":
          visuals.playEventFor(targetSlot, "hit").catch(() => {});
          break;

        case "reflected":
          visuals.cancelFor(actorSlot);
          visuals.playEventFor(actorSlot, "hit").catch(() => {});
          break;

        case "countered":
          visuals.cancelFor(actorSlot);
          visuals.playEventFor(targetSlot, "attack")
            .then(() => visuals.playEventFor(actorSlot, "hit"))
            .catch(() => {});
          break;

        case "blocked":
        case "immune":
          visuals.cancelFor(actorSlot);
          break;

        default:
          break;
      }
    }, atMs);

    return Object.freeze({
      status: "scheduled",
      outcome: resolution.outcome,
      impactAtMs: atMs
    });
  }

  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    for (const timerId of timers) {
      clearTimer(timerId);
    }
    timers.clear();
  }

  return Object.freeze({
    present,
    dispose,
    get pendingCount() {
      return timers.size;
    }
  });
}
