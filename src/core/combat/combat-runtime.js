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
  onResolved = () => {},
  onInterrupted = () => {}
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
            hp: fighter.hp,
            maxHp: fighter.maxHp,
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

  function idleProgress() {
    return Object.freeze({
      actionType: null,
      actionId: null,
      actorId: null,
      targetId: null,
      skillId: null,
      commandId: null,
      elapsedMs: 0,
      chargeProgress: 0,
      phase: "idle",
      released: false,
      actionName: null,
      preparationMs: 0,
      remainingPreparationMs: 0,
      reaction: null
    });
  }

  function progressSnapshot(record, elapsedMs) {
    const preparationMs = record.action.preparationMs;
    const chargeProgress =
      preparationMs <= 0 ? 1 : Math.min(1, elapsedMs / preparationMs);

    let phase = "preparation";
    if (elapsedMs >= record.action.releaseAtMs) {
      phase = elapsedMs < record.action.impactAtMs ? "travel" : "impact";
    }

    const actionName =
      record.action.actionType === "skill"
        ? record.action.skill?.name ?? record.action.actionId
        : record.action.command?.name ?? record.action.actionId;
    const remainingPreparationMs = Math.max(
      0,
      record.action.releaseAtMs - elapsedMs
    );

    let reaction = null;
    if (record.reaction) {
      const duration = record.reaction.preparationMs;
      const reactionElapsed = Math.max(
        0,
        elapsedMs - record.reaction.startedAtMs
      );
      reaction = Object.freeze({
        actorId: record.action.targetId,
        targetId: record.action.actorId,
        skillId: record.reaction.skillId,
        actionName:
          record.reaction.skill?.name ?? record.reaction.skillId,
        progress:
          duration <= 0 ? 1 : Math.min(1, reactionElapsed / duration),
        remainingPreparationMs: Math.max(
          0,
          record.reaction.readyAtMs - elapsedMs
        ),
        readyAtMs: record.reaction.readyAtMs,
        outcome: record.reaction.outcome
      });
    }

    return Object.freeze({
      actionType: record.action.actionType,
      actionId: record.action.actionId,
      actorId: record.action.actorId,
      targetId: record.action.targetId ?? null,
      skillId:
        record.action.actionType === "skill"
          ? record.action.actionId
          : null,
      commandId:
        record.action.actionType === "command"
          ? record.action.actionId
          : null,
      elapsedMs,
      actionName,
      preparationMs,
      remainingPreparationMs,
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

    const resolution = session.completeAction({
      action: active.action,
      reaction: active.reaction
    });

    active = null;
    onResolved(resolution);
    onProgress(idleProgress());
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

  function beginAction(result) {
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

  function canStartAction() {
    if (disposed) {
      return Object.freeze({ ok: false, outcome: "disposed" });
    }
    if (active) {
      return Object.freeze({
        ok: false,
        outcome: "action_in_progress"
      });
    }
    return null;
  }

  function startSkill({ actorId, targetId, skill }) {
    const rejected = canStartAction();
    if (rejected) {
      return rejected;
    }

    return beginAction(
      session.startSkill({ actorId, targetId, skill })
    );
  }

  function startCommand({ actorId, command }) {
    const rejected = canStartAction();
    if (rejected) {
      return rejected;
    }

    return beginAction(
      session.startCommand({ actorId, command })
    );
  }

  function previewReaction(reactionSkill) {
    if (!active) {
      return Object.freeze({
        ok: false,
        outcome: "no_action"
      });
    }
    if (active.action.actionType !== "skill") {
      return Object.freeze({
        ok: false,
        outcome: "reaction_not_supported"
      });
    }
    if (active.reaction) {
      return Object.freeze({
        ok: false,
        outcome: "reaction_already_selected"
      });
    }

    return session.previewReaction({
      action: active.action,
      reactionSkill,
      elapsedMs: elapsedForActive(now())
    });
  }

  function react(reactionSkill) {
    const preview = previewReaction(reactionSkill);
    if (!preview.ok) {
      return preview;
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

  function interruptActive({
    targetActorId,
    reason = "stun"
  }) {
    if (!active) {
      return Object.freeze({
        ok: false,
        outcome: "no_action"
      });
    }

    if (active.action.actorId !== targetActorId) {
      return Object.freeze({
        ok: false,
        outcome: "wrong_target"
      });
    }

    const elapsedMs = elapsedForActive(now());

    if (!active.action.interruptibleDuringPreparation) {
      return Object.freeze({
        ok: false,
        outcome: "not_interruptible",
        elapsedMs
      });
    }

    if (elapsedMs >= active.action.releaseAtMs) {
      return Object.freeze({
        ok: false,
        outcome: "too_late",
        elapsedMs
      });
    }

    const interruptedAction = active.action;
    active = null;

    const result = Object.freeze({
      ok: true,
      outcome: "interrupted",
      reason,
      elapsedMs,
      action: interruptedAction
    });

    onProgress(idleProgress());
    onInterrupted(result);
    return result;
  }

  function applyResolutionInterrupt(resolution) {
    const interruptEvent = resolution?.events?.find(
      (item) => item.type === "charge-interrupt"
    );

    if (!interruptEvent) {
      return Object.freeze({
        ok: false,
        outcome: "no_interrupt_effect"
      });
    }

    return interruptActive({
      targetActorId: interruptEvent.actorId,
      reason: interruptEvent.reason ?? "stun"
    });
  }

  function cancelActive() {
    const cancelled = active !== null;
    active = null;
    if (cancelled) {
      onProgress(idleProgress());
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
    startCommand,
    previewReaction,
    react,
    interruptActive,
    applyResolutionInterrupt,
    cancelActive,
    dispose,
    get isRunning() {
      return running && !disposed;
    },
    get hasActiveAction() {
      return active !== null;
    },
    get activeAction() {
      return active?.action ?? null;
    }
  });
}
