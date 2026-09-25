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
  let sequence = 0;
  let lastStateSignal = null;
  const activeByActor = new Map();

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

  function elapsedFor(record, atNowMs) {
    if (!record) {
      return 0;
    }
    return Math.max(0, atNowMs - record.startedAtClockMs);
  }

  function resolutionAtMs(record) {
    return record.reaction?.outcome === "countered"
      ? record.reaction.readyAtMs
      : record.action.impactAtMs;
  }

  function absoluteReleaseAt(record) {
    return record.startedAtClockMs + record.action.releaseAtMs;
  }

  function absoluteResolutionAt(record) {
    return record.startedAtClockMs + resolutionAtMs(record);
  }

  function idleProgress(actorId = null) {
    return Object.freeze({
      actionType: null,
      actionId: null,
      actorId,
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
        preparationMs: duration,
        remainingPreparationMs: Math.max(
          0,
          record.reaction.readyAtMs - elapsedMs
        ),
        readyAtMs: record.reaction.readyAtMs
      });
    }

    return Object.freeze({
      actionType: record.action.actionType,
      actionId: record.action.actionId,
      actorId: record.action.actorId,
      targetId: record.action.targetId,
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

  function activeRecords() {
    return [...activeByActor.values()];
  }

  function koActorIdFromResolution(resolution) {
    const hit = resolution?.events?.find(
      (item) =>
        item.type === "hit" &&
        Number(item.hpAfter) <= 0
    );
    return hit?.actorId ?? null;
  }

  function emitInterrupted(record, reason, atNowMs) {
    const result = Object.freeze({
      ok: true,
      outcome: "interrupted",
      reason,
      elapsedMs: elapsedFor(record, atNowMs),
      action: record.action
    });
    onProgress(idleProgress(record.action.actorId));
    onInterrupted(result);
    return result;
  }

  function cancelActionsForActor(
    actorId,
    {
      includeTargeted = false,
      reason = "cancelled"
    } = {}
  ) {
    const current = now();
    const cancelled = [];

    for (const record of activeRecords()) {
      const matchesActor = record.action.actorId === actorId;
      const matchesTarget =
        includeTargeted &&
        record.action.targetId === actorId;

      if (!matchesActor && !matchesTarget) {
        continue;
      }

      if (
        activeByActor.get(record.action.actorId) !== record
      ) {
        continue;
      }

      activeByActor.delete(record.action.actorId);
      cancelled.push(
        emitInterrupted(record, reason, current)
      );
    }

    return Object.freeze({
      ok: cancelled.length > 0,
      outcome:
        cancelled.length > 0
          ? "actions_cancelled"
          : "no_action",
      actorId,
      includeTargeted,
      cancelled: Object.freeze(cancelled)
    });
  }

  function processRelease(record) {
    if (
      activeByActor.get(record.action.actorId) !== record ||
      record.released
    ) {
      return;
    }

    const earlyCounter =
      record.reaction?.outcome === "countered" &&
      record.reaction.readyAtMs < record.action.releaseAtMs;

    record.released = true;

    if (!earlyCounter) {
      onRelease(Object.freeze({
        action: record.action,
        elapsedMs: record.action.releaseAtMs
      }));
    }
  }

  function processResolution(record, atNowMs) {
    if (
      activeByActor.get(record.action.actorId) !== record
    ) {
      return;
    }

    const resolution = session.completeAction({
      action: record.action,
      reaction: record.reaction
    });

    activeByActor.delete(record.action.actorId);
    onProgress(idleProgress(record.action.actorId));

    const koActorId = koActorIdFromResolution(resolution);
    if (koActorId) {
      cancelActionsForActor(koActorId, {
        includeTargeted: true,
        reason: "ko"
      });
    }

    onResolved(resolution);
    emitStateIfChanged({ force: true });
  }

  function settleDue(atNowMs) {
    const due = [];

    for (const record of activeRecords()) {
      if (!record.released) {
        due.push({
          type: "release",
          at: absoluteReleaseAt(record),
          sequence: record.sequence,
          record
        });
      }
      due.push({
        type: "resolution",
        at: absoluteResolutionAt(record),
        sequence: record.sequence,
        record
      });
    }

    due
      .filter((item) => item.at <= atNowMs)
      .sort((left, right) => {
        if (left.at !== right.at) {
          return left.at - right.at;
        }
        if (left.type !== right.type) {
          return left.type === "release" ? -1 : 1;
        }
        return left.sequence - right.sequence;
      })
      .forEach((item) => {
        if (item.type === "release") {
          processRelease(item.record);
        } else {
          processResolution(item.record, atNowMs);
        }
      });

    for (const record of activeRecords()) {
      onProgress(
        progressSnapshot(
          record,
          elapsedFor(record, atNowMs)
        )
      );
    }
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

    settleDue(current);

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

  function canStartAction(actorId) {
    if (disposed) {
      return Object.freeze({
        ok: false,
        outcome: "disposed"
      });
    }
    if (activeByActor.has(actorId)) {
      return Object.freeze({
        ok: false,
        outcome: "action_in_progress"
      });
    }
    return null;
  }

  function beginAction(result) {
    if (!result.ok) {
      return result;
    }

    const actorId = result.action.actorId;
    const rejected = canStartAction(actorId);
    if (rejected) {
      return rejected;
    }

    const current = now();
    const record = {
      action: result.action,
      reaction: null,
      startedAtClockMs: current,
      released: false,
      sequence: sequence++
    };

    activeByActor.set(actorId, record);

    emitStateIfChanged({ force: true });
    onProgress(progressSnapshot(record, 0));

    if (result.action.releaseAtMs === 0) {
      processRelease(record);
    }

    settleDue(current);

    return Object.freeze({
      ok: true,
      outcome: "started",
      action: result.action
    });
  }

  function startSkill({ actorId, targetId, skill }) {
    const rejected = canStartAction(actorId);
    if (rejected) {
      return rejected;
    }

    return beginAction(
      session.startSkill({ actorId, targetId, skill })
    );
  }

  function startCommand({ actorId, command }) {
    const rejected = canStartAction(actorId);
    if (rejected) {
      return rejected;
    }

    return beginAction(
      session.startCommand({ actorId, command })
    );
  }

  function reactionRecord(againstActorId = null) {
    if (againstActorId !== null) {
      const record = activeByActor.get(againstActorId);
      return record?.action.actionType === "skill"
        ? record
        : null;
    }

    const candidates = activeRecords().filter(
      (record) =>
        record.action.actionType === "skill" &&
        !record.reaction
    );

    return candidates.length === 1
      ? candidates[0]
      : null;
  }

  function previewReaction(
    reactionSkill,
    { againstActorId = null } = {}
  ) {
    const record = reactionRecord(againstActorId);

    if (!record) {
      return Object.freeze({
        ok: false,
        outcome:
          activeByActor.size > 1 &&
          againstActorId === null
            ? "reaction_ambiguous"
            : "no_action"
      });
    }

    if (record.reaction) {
      return Object.freeze({
        ok: false,
        outcome: "reaction_already_selected"
      });
    }

    return session.previewReaction({
      action: record.action,
      reactionSkill,
      elapsedMs: elapsedFor(record, now())
    });
  }

  function react(
    reactionSkill,
    { againstActorId = null } = {}
  ) {
    const record = reactionRecord(againstActorId);
    if (!record) {
      return previewReaction(
        reactionSkill,
        { againstActorId }
      );
    }

    const preview = previewReaction(
      reactionSkill,
      { againstActorId }
    );
    if (!preview.ok) {
      return preview;
    }

    const elapsedMs = elapsedFor(record, now());
    const result = session.reactToSkill({
      action: record.action,
      reactionSkill,
      elapsedMs
    });

    if (!result.ok) {
      return result;
    }

    record.reaction = result.reaction;
    emitStateIfChanged({ force: true });
    onProgress(progressSnapshot(record, elapsedMs));
    return result;
  }

  function interruptActive({
    targetActorId,
    reason = "stun"
  }) {
    const record = activeByActor.get(targetActorId);

    if (!record) {
      return Object.freeze({
        ok: false,
        outcome: "no_action"
      });
    }

    const elapsedMs = elapsedFor(record, now());

    if (!record.action.interruptibleDuringPreparation) {
      return Object.freeze({
        ok: false,
        outcome: "not_interruptible",
        elapsedMs
      });
    }

    if (elapsedMs >= record.action.releaseAtMs) {
      return Object.freeze({
        ok: false,
        outcome: "too_late",
        elapsedMs
      });
    }

    activeByActor.delete(targetActorId);

    const result = Object.freeze({
      ok: true,
      outcome: "interrupted",
      reason,
      elapsedMs,
      action: record.action
    });

    onProgress(idleProgress(targetActorId));
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

  function cancelActive(actorId = null) {
    if (actorId !== null) {
      const record = activeByActor.get(actorId);
      if (!record) {
        return false;
      }
      activeByActor.delete(actorId);
      onProgress(idleProgress(actorId));
      return true;
    }

    const records = activeRecords();
    activeByActor.clear();

    for (const record of records) {
      onProgress(idleProgress(record.action.actorId));
    }

    return records.length > 0;
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
    cancelActionsForActor,
    cancelActive,
    dispose,
    hasActiveActionFor(actorId) {
      return activeByActor.has(actorId);
    },
    activeActionFor(actorId) {
      return activeByActor.get(actorId)?.action ?? null;
    },
    get isRunning() {
      return running && !disposed;
    },
    get hasActiveAction() {
      return activeByActor.size > 0;
    },
    get activeAction() {
      return activeRecords()[0]?.action ?? null;
    },
    get activeActions() {
      return Object.freeze(
        activeRecords().map((record) => record.action)
      );
    }
  });
}
