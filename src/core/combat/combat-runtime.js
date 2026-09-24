function defaultNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function defaultSetTimer(callback, delayMs) {
  return setTimeout(callback, delayMs);
}

function defaultClearTimer(timerId) {
  clearTimeout(timerId);
}

export function createCombatRuntime({
  session,
  tickMs = 50,
  now = defaultNow,
  setTimer = defaultSetTimer,
  clearTimer = defaultClearTimer,
  onState = () => {},
  onProgress = () => {},
  onRelease = () => {},
  onResolved = () => {}
}) {
  if (!session || typeof session.advanceMs !== "function") {
    throw new TypeError("session with advanceMs() is required");
  }
  if (!Number.isFinite(tickMs) || tickMs <= 0) {
    throw new RangeError("tickMs must be greater than 0");
  }

  let disposed = false;
  let running = false;
  let timerId = null;
  let lastNowMs = null;
  let active = null;
  let lastStateSignal = null;

  function stateSignal(state) {
    return JSON.stringify({
      distance: state.distance,
      fighters: Object.fromEntries(
        Object.values(state.fighters).map((fighter) => [
          fighter.id,
          {
            energy: fighter.energy,
            effects: fighter.chargeTimeEffects.map((effect) => effect.id)
          }
        ])
      )
    });
  }

  function emitStateIfChanged({ force = false } = {}) {
    const state = session.snapshot();
    const signal = stateSignal(state);
    if (force || signal !== lastStateSignal) {
      lastStateSignal = signal;
      onState(state);
    }
  }

  function clearScheduledTick() {
    if (timerId !== null) {
      clearTimer(timerId);
      timerId = null;
    }
  }

  function elapsedForActive(atNowMs) {
    if (!active) {
      return 0;
    }
    return Math.max(0, atNowMs - active.startedAtClockMs);
  }

  function resolutionAtMs(record) {
    return record.reaction?.outcome === "countered"
      ? record.reaction.readyAtMs
      : record.action.impactAtMs;
  }

  function progressSnapshot(record, elapsedMs) {
    const preparationMs = record.action.preparationMs;
    const chargeProgress =
      preparationMs <= 0 ? 1 : Math.min(1, elapsedMs / preparationMs);

    let phase = "preparation";
    if (elapsedMs >= record.action.releaseAtMs) {
      phase = elapsedMs < record.action.impactAtMs ? "travel" : "impact";
    }

    let reaction = null;
    if (record.reaction) {
      const duration = record.reaction.preparationMs;
      const reactionElapsed = Math.max(
        0,
        elapsedMs - record.reaction.startedAtMs
      );
      reaction = Object.freeze({
        skillId: record.reaction.skillId,
        progress:
          duration <= 0 ? 1 : Math.min(1, reactionElapsed / duration),
        readyAtMs: record.reaction.readyAtMs
      });
    }

    return Object.freeze({
      skillId: record.action.skill.id,
      elapsedMs,
      chargeProgress,
      phase,
      released: record.released,
      reaction
    });
  }

  function settleActive(atNowMs) {
    if (!active) {
      return;
    }

    const elapsedMs = elapsedForActive(atNowMs);

    if (!active.released && elapsedMs >= active.action.releaseAtMs) {
      const earlyCounter =
        active.reaction?.outcome === "countered" &&
        active.reaction.readyAtMs < active.action.releaseAtMs;

      active.released = true;
      if (!earlyCounter) {
        onRelease(Object.freeze({
          action: active.action,
          elapsedMs: active.action.releaseAtMs
        }));
      }
    }

    onProgress(progressSnapshot(active, elapsedMs));

    if (elapsedMs < resolutionAtMs(active)) {
      return;
    }

    const resolution = session.completeSkill({
      action: active.action,
      reaction: active.reaction
    });

    active = null;
    onResolved(resolution);
    emitStateIfChanged({ force: true });
  }

  function tick() {
    if (disposed || !running) {
      return;
    }

    const current = now();
    const delta = Math.max(0, current - lastNowMs);
    lastNowMs = current;

    if (delta > 0) {
      session.advanceMs(delta);
      emitStateIfChanged();
    }

    settleActive(current);
    if (!disposed && running) {
      timerId = setTimer(tick, tickMs);
    }
  }

  function start() {
    if (disposed) {
      throw new Error("combat runtime has been disposed");
    }
    if (running) {
      return;
    }
    running = true;
    lastNowMs = now();
    emitStateIfChanged({ force: true });
    timerId = setTimer(tick, tickMs);
  }

  function startSkill({ actorId, targetId, skill }) {
    if (disposed) {
      return Object.freeze({ ok: false, outcome: "disposed" });
    }
    if (active) {
      return Object.freeze({
        ok: false,
        outcome: "action_in_progress"
      });
    }

    const result = session.startSkill({ actorId, targetId, skill });
    if (!result.ok) {
      return result;
    }

    const current = now();
    active = {
      action: result.action,
      reaction: null,
      startedAtClockMs: current,
      released: false
    };

    emitStateIfChanged({ force: true });
    onProgress(progressSnapshot(active, 0));

    if (result.action.releaseAtMs === 0) {
      active.released = true;
      onRelease(Object.freeze({
        action: result.action,
        elapsedMs: 0
      }));
    }

    settleActive(current);
    return Object.freeze({
      ok: true,
      outcome: "started",
      action: result.action
    });
  }

  function react(reactionSkill) {
    if (!active) {
      return Object.freeze({
        ok: false,
        outcome: "no_action"
      });
    }
    if (active.reaction) {
      return Object.freeze({
        ok: false,
        outcome: "reaction_already_selected"
      });
    }

    const elapsedMs = elapsedForActive(now());
    const result = session.reactToSkill({
      action: active.action,
      reactionSkill,
      elapsedMs
    });

    if (!result.ok) {
      return result;
    }

    active.reaction = result.reaction;
    emitStateIfChanged({ force: true });
    onProgress(progressSnapshot(active, elapsedMs));
    return result;
  }

  function previewReaction(reactionSkill) {
    if (!active) {
      return Object.freeze({
        ok: false,
        outcome: "no_action"
      });
    }

    return session.previewReaction({
      action: active.action,
      reactionSkill,
      elapsedMs: elapsedForActive(now())
    });
  }

  function cancelActive() {
    const cancelled = active !== null;
    active = null;
    if (cancelled) {
      onProgress(Object.freeze({
        skillId: null,
        elapsedMs: 0,
        chargeProgress: 0,
        phase: "idle",
        released: false,
        reaction: null
      }));
    }
    return cancelled;
  }

  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    running = false;
    cancelActive();
    clearScheduledTick();
  }

  return Object.freeze({
    start,
    startSkill,
    previewReaction,
    react,
    cancelActive,
    dispose,
    get isRunning() {
      return running && !disposed;
    },
    get hasActiveAction() {
      return active !== null;
    }
  });
}
