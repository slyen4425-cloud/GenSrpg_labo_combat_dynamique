import {
  combatHealthDeltaEventsV1
} from "./combat-health-feedback-v1.js";
import { normalizePersistentZoneSpatialV1 } from "../../contracts/persistent-zone-spatial-v1.js";
import {
  projectileClashCandidate,
  resolveProjectileClash
} from "./projectile-clash.js";

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
  readZoneSpatialContext = null,
  onState = () => {},
  onHealthDelta = () => {},
  onClock = () => {},
  onProgress = () => {},
  onStarted = () => {},
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
  if (readZoneSpatialContext !== null && typeof readZoneSpatialContext !== "function") throw new TypeError("readZoneSpatialContext must be a function");

  let disposed = false;
  let running = false;
  let timerId = null;
  let lastNowMs = null;
  let sequence = 0;
  let lastStateSignal = null;
  let lastFeedbackState = null;
  const activeByActor = new Map();

  function stateSignal(state) {
    return JSON.stringify({
      distance: state.distance,
      fighters: Object.fromEntries(
        Object.values(state.fighters).map((fighter) => {
          const {
            energyChargeProgressMs,
            ...observable
          } = fighter;

          return [
            fighter.id,
            observable
          ];
        })
      ),
      persistentZones:
        state.persistentZones ?? []
    });
  }

  function emitStateIfChanged({ force = false } = {}) {
    const state = session.snapshot();
    const signal = stateSignal(state);
    if (force || signal !== lastStateSignal) {
      if (lastFeedbackState !== null) {
        for (
          const feedback of
          combatHealthDeltaEventsV1(
            lastFeedbackState,
            state
          )
        ) {
          onHealthDelta(feedback);
        }
      }

      lastFeedbackState = state;
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
      recoveryMs: 0,
      remainingRecoveryMs: 0,
      recoveryProgress: 0,
      reaction: null
    });
  }

  function progressSnapshot(record, elapsedMs) {
    const preparationMs = record.action.preparationMs;
    const chargeProgress =
      preparationMs <= 0 ? 1 : Math.min(1, elapsedMs / preparationMs);

    let phase = "preparation";
    if (record.resolved) {
      phase = "recovery";
    } else if (elapsedMs >= record.action.releaseAtMs) {
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
    const recoveryMs = Math.max(
      0,
      Number(record.action.recoveryMs) || 0
    );
    const recoveryStartedAtMs =
      record.resolvedAtMs ?? null;
    const recoveryElapsedMs =
      recoveryStartedAtMs === null
        ? 0
        : Math.max(
            0,
            elapsedMs - recoveryStartedAtMs
          );
    const remainingRecoveryMs =
      record.resolved
        ? Math.max(
            0,
            recoveryMs - recoveryElapsedMs
          )
        : 0;
    const recoveryProgress =
      record.resolved
        ? (
            recoveryMs <= 0
              ? 1
              : Math.min(
                  1,
                  recoveryElapsedMs / recoveryMs
                )
          )
        : 0;

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
      recoveryMs,
      remainingRecoveryMs,
      recoveryProgress,
      chargeProgress,
      phase,
      released: record.released,
      reaction
    });
  }

  function activeRecords() {
    return [...activeByActor.values()];
  }

  function zoneSpatialContext({
    state,
    intervalStartClockMs
  }) {
    const combatStartMs =
      Number(state?.elapsedMs ?? 0);
    const approaches = [];

    for (const record of activeRecords()) {
      if (
        record.resolved ||
        record.action?.actionType !== "skill" ||
        record.action.skill?.approachMode !==
          "ground"
      ) {
        continue;
      }

      const startedAtCombatMs =
        combatStartMs +
        (
          record.startedAtClockMs -
          intervalStartClockMs
        );

      approaches.push(
        Object.freeze({
          actorId:
            record.action.actorId,
          targetId:
            record.action.targetId,
          actionId:
            record.action.actionId,
          approachMode: "ground",
          releaseAtMs:
            startedAtCombatMs +
            record.action.releaseAtMs,
          impactAtMs:
            startedAtCombatMs +
            record.action.impactAtMs
        })
      );
    }

    return Object.freeze({
      mode: "approach-bands-v1",
      visibleZones: normalizePersistentZoneSpatialV1(readZoneSpatialContext?.(state) ?? null),
      approaches:
        Object.freeze(approaches)
    });
  }

  function advanceSessionToClock(current) {
    const intervalStartClockMs =
      lastNowMs;

    if (intervalStartClockMs === null) {
      return false;
    }

    const delta = Math.max(
      0,
      current - intervalStartClockMs
    );
    lastNowMs = current;

    if (delta <= 0) {
      return false;
    }

    const stateBeforeAdvance =
      session.snapshot();
    session.advanceMs(
      delta,
      {
        zoneSpatialContext:
          zoneSpatialContext({
            state:
              stateBeforeAdvance,
            intervalStartClockMs
          })
      }
    );
    // Timed statuses/zones can KO a fighter before its pending command releases.
    for (const fighter of Object.values(session.snapshot().fighters)) {
      if (fighter.hp <= 0) cancelActionsForActor(fighter.id, { includeTargeted: true, reason: "ko" });
    }
    emitStateIfChanged();
    return true;
  }

  function unresolvedRecords() {
    return activeRecords().filter(
      (record) => !record.resolved
    );
  }

  function recoveryCompleteAtClockMs(record) {
    if (!record?.resolved) {
      return null;
    }
    return (
      record.startedAtClockMs +
      record.resolvedAtMs +
      Math.max(
        0,
        Number(record.action.recoveryMs) || 0
      )
    );
  }

  function processRecoveryComplete(
    record,
    atNowMs
  ) {
    if (
      activeByActor.get(record.action.actorId) !==
        record ||
      !record.resolved
    ) {
      return false;
    }

    const completeAt =
      recoveryCompleteAtClockMs(record);
    if (
      completeAt === null ||
      atNowMs < completeAt
    ) {
      return false;
    }

    activeByActor.delete(
      record.action.actorId
    );
    onProgress(
      idleProgress(record.action.actorId)
    );
    return true;
  }

  function enterRecovery(
    record,
    {
      resolvedAtMs,
      atNowMs
    }
  ) {
    const recoveryMs = Math.max(
      0,
      Number(record.action.recoveryMs) || 0
    );

    record.resolved = true;
    record.resolvedAtMs = Math.max(
      0,
      Number(resolvedAtMs) || 0
    );

    if (recoveryMs <= 0) {
      activeByActor.delete(
        record.action.actorId
      );
      onProgress(
        idleProgress(record.action.actorId)
      );
      return false;
    }

    onProgress(
      progressSnapshot(
        record,
        elapsedFor(record, atNowMs)
      )
    );

    const completeAt =
      recoveryCompleteAtClockMs(record);
    if (
      completeAt !== null &&
      atNowMs >= completeAt
    ) {
      processRecoveryComplete(
        record,
        atNowMs
      );
      return false;
    }

    return true;
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
        !record.resolved &&
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
      if (record.resolved) {
        onProgress(
          idleProgress(record.action.actorId)
        );
        cancelled.push(
          Object.freeze({
            ok: true,
            outcome: "recovery_cancelled",
            reason,
            actorId: record.action.actorId,
            action: record.action
          })
        );
      } else {
        cancelled.push(
          emitInterrupted(
            record,
            reason,
            current
          )
        );
      }
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

  function processResolution(
    record,
    atNowMs,
    { impactAtMs = null } = {}
  ) {
    if (
      activeByActor.get(record.action.actorId) !== record ||
      record.resolved
    ) {
      return null;
    }

    const requestedImpactAtMs =
      impactAtMs === null
        ? record.action.impactAtMs
        : Number(impactAtMs);
    const effectiveImpactAtMs =
      record.action.actionType === "skill"
        ? Math.min(
            record.action.impactAtMs,
            Math.max(
              record.action.releaseAtMs,
              Number.isFinite(requestedImpactAtMs)
                ? requestedImpactAtMs
                : record.action.impactAtMs
            )
          )
        : record.action.impactAtMs;
    const effectiveAction =
      record.action.actionType === "skill" &&
      effectiveImpactAtMs !== record.action.impactAtMs
        ? Object.freeze({
            ...record.action,
            travelMs:
              effectiveImpactAtMs -
              record.action.releaseAtMs,
            impactAtMs: effectiveImpactAtMs
          })
        : record.action;
    const effectiveReaction =
      record.reaction === null ||
      record.reaction?.readyAtMs <=
        effectiveAction.impactAtMs
        ? record.reaction
        : null;

    const targetRecord =
      activeByActor.get(effectiveAction.targetId) ?? null;
    const resolutionClockMs =
      record.startedAtClockMs +
      (
        effectiveReaction?.outcome === "countered"
          ? effectiveReaction.readyAtMs
          : effectiveAction.impactAtMs
      );
    const targetActionContext =
      targetRecord &&
      targetRecord !== record &&
      !targetRecord.resolved
        ? Object.freeze({
            action: targetRecord.action,
            elapsedMs: Math.max(
              0,
              resolutionClockMs -
                targetRecord.startedAtClockMs
            )
          })
        : null;

    const resolution = session.completeAction({
      action: effectiveAction,
      reaction: effectiveReaction,
      targetActionContext
    });

    const resolvedAtMs =
      effectiveReaction?.outcome === "countered"
        ? effectiveReaction.readyAtMs
        : effectiveAction.impactAtMs;

    enterRecovery(record, {
      resolvedAtMs,
      atNowMs
    });

    applyResolutionInterrupt(resolution);

    const koActorId = koActorIdFromResolution(resolution);
    if (koActorId) {
      cancelActionsForActor(koActorId, {
        includeTargeted: true,
        reason: "ko"
      });
    }

    onResolved(resolution);
    emitStateIfChanged({ force: true });
    return resolution;
  }

  function processProjectileClash({
    leftRecord,
    rightRecord,
    candidate
  }) {
    if (
      activeByActor.get(leftRecord.action.actorId) !== leftRecord ||
      activeByActor.get(rightRecord.action.actorId) !== rightRecord ||
      leftRecord.resolved ||
      rightRecord.resolved
    ) {
      return;
    }

    const currentCandidate = projectileClashCandidate({
      leftAction: leftRecord.action,
      leftStartedAtClockMs: leftRecord.startedAtClockMs,
      rightAction: rightRecord.action,
      rightStartedAtClockMs: rightRecord.startedAtClockMs
    });

    if (
      !currentCandidate ||
      Math.abs(currentCandidate.atClockMs - candidate.atClockMs) > 1e-6
    ) {
      return;
    }

    const resolutions = resolveProjectileClash({
      state: session.snapshot(),
      leftAction: leftRecord.action,
      leftStartedAtClockMs: leftRecord.startedAtClockMs,
      rightAction: rightRecord.action,
      rightStartedAtClockMs: rightRecord.startedAtClockMs,
      candidate: currentCandidate
    });

    const ordered = [];

    if (resolutions.left !== null) {
      enterRecovery(leftRecord, {
        resolvedAtMs: Math.max(
          0,
          currentCandidate.atClockMs -
            leftRecord.startedAtClockMs
        ),
        atNowMs: currentCandidate.atClockMs
      });
      ordered.push({
        sequence: leftRecord.sequence,
        resolution: resolutions.left
      });
    }

    if (resolutions.right !== null) {
      enterRecovery(rightRecord, {
        resolvedAtMs: Math.max(
          0,
          currentCandidate.atClockMs -
            rightRecord.startedAtClockMs
        ),
        atNowMs: currentCandidate.atClockMs
      });
      ordered.push({
        sequence: rightRecord.sequence,
        resolution: resolutions.right
      });
    }

    ordered.sort(
      (left, right) =>
        left.sequence -
        right.sequence
    );

    for (const item of ordered) {
      onResolved(item.resolution);
    }

    emitStateIfChanged({ force: true });
  }

  function settleDue(atNowMs) {
    const due = [];
    const records = activeRecords();

    for (const record of records) {
      if (record.resolved) {
        due.push({
          type: "recovery",
          at:
            recoveryCompleteAtClockMs(record) ??
            Number.POSITIVE_INFINITY,
          sequence: record.sequence,
          record
        });
        continue;
      }

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

    const clashRecords =
      unresolvedRecords();

    for (
      let leftIndex = 0;
      leftIndex < clashRecords.length;
      leftIndex += 1
    ) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < clashRecords.length;
        rightIndex += 1
      ) {
        const leftRecord =
          clashRecords[leftIndex];
        const rightRecord =
          clashRecords[rightIndex];
        const candidate = projectileClashCandidate({
          leftAction: leftRecord.action,
          leftStartedAtClockMs: leftRecord.startedAtClockMs,
          rightAction: rightRecord.action,
          rightStartedAtClockMs: rightRecord.startedAtClockMs
        });

        if (!candidate) {
          continue;
        }

        due.push({
          type: "clash",
          at: candidate.atClockMs,
          sequence: Math.min(
            leftRecord.sequence,
            rightRecord.sequence
          ),
          leftRecord,
          rightRecord,
          candidate
        });
      }
    }

    due
      .filter((item) => item.at <= atNowMs)
      .sort((left, right) => {
        if (left.at !== right.at) {
          return left.at - right.at;
        }
        if (left.type !== right.type) {
          const priority = {
            release: 0,
            clash: 1,
            resolution: 2,
            recovery: 3
          };
          return priority[left.type] - priority[right.type];
        }
        return left.sequence - right.sequence;
      })
      .forEach((item) => {
        if (item.type === "release") {
          processRelease(item.record);
        } else if (item.type === "clash") {
          processProjectileClash(item);
        } else if (item.type === "resolution") {
          processResolution(item.record, atNowMs);
        } else {
          processRecoveryComplete(
            item.record,
            atNowMs
          );
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
    advanceSessionToClock(current);

    onClock(session.snapshot());
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
    onClock(session.snapshot());
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
      const record =
        activeByActor.get(actorId);
      if (record?.resolved) {
        const completeAt =
          recoveryCompleteAtClockMs(record);
        return Object.freeze({
          ok: false,
          outcome: "recovering",
          remainingRecoveryMs:
            completeAt === null
              ? 0
              : Math.max(
                  0,
                  completeAt - now()
                )
        });
      }

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
      resolved: false,
      resolvedAtMs: null,
      sequence: sequence++
    };

    activeByActor.set(actorId, record);

    onStarted(Object.freeze({
      action: record.action,
      elapsedMs: 0
    }));
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
      return (
        record?.action.actionType === "skill" &&
        !record.resolved
      )
        ? record
        : null;
    }

    const candidates = activeRecords().filter(
      (record) =>
        record.action.actionType === "skill" &&
        !record.resolved &&
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
          unresolvedRecords().length > 1 &&
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

  function actionUsesVisibleContact(action) {
    if (action?.actionType !== "skill") {
      return false;
    }

    const form = action.skill?.form ?? null;
    if (form === "projectile") {
      return true;
    }

    return (
      form === "contact" &&
      ["ground", "aerial", "teleport"].includes(
        action.skill?.approachMode ?? "none"
      )
    );
  }

  function reportActionContact({
    actorId,
    targetId,
    skillId = null
  }) {
    if (disposed) {
      return Object.freeze({
        ok: false,
        outcome: "disposed"
      });
    }

    const current = now();

    // Visible contact can arrive between scheduled Runtime ticks.
    // Advance the authoritative Combat Session first, while this
    // unresolved ground approach still exists, so Persistent Zone
    // Runtime cannot miss a radius-entry crossing.
    advanceSessionToClock(current);

    // Process any semantic release/clash/nominal impact that was already
    // due before this observed contact. The contact signal never skips
    // an earlier Runtime-owned event.
    settleDue(current);

    const record = activeByActor.get(actorId);
    if (!record) {
      return Object.freeze({
        ok: false,
        outcome: "no_action"
      });
    }

    if (record.resolved) {
      return Object.freeze({
        ok: false,
        outcome: "already_resolved"
      });
    }

    if (!actionUsesVisibleContact(record.action)) {
      return Object.freeze({
        ok: false,
        outcome: "contact_not_authoritative"
      });
    }

    if (record.action.targetId !== targetId) {
      return Object.freeze({
        ok: false,
        outcome: "target_mismatch"
      });
    }

    if (
      skillId !== null &&
      skillId !== undefined &&
      String(skillId) !== String(record.action.skill?.id ?? "")
    ) {
      return Object.freeze({
        ok: false,
        outcome: "skill_mismatch"
      });
    }

    if (!record.released) {
      return Object.freeze({
        ok: false,
        outcome: "not_released"
      });
    }

    if (record.action.skill.approachMode === "ground") {
      const spatial = zoneSpatialContext({ state: session.snapshot(), intervalStartClockMs: current });
      session.advanceMs(0, { zoneSpatialContext: Object.freeze({ ...spatial,
        contacts: Object.freeze([Object.freeze({ actorId, targetId, approachMode: "ground" })])
      }) });
      for (const fighter of Object.values(session.snapshot().fighters)) {
        if (fighter.hp <= 0) cancelActionsForActor(fighter.id, { includeTargeted: true, reason: "ko" });
      }
      emitStateIfChanged();
      if (activeByActor.get(actorId) !== record) return Object.freeze({ ok: false, outcome: "no_action" });
    }

    const contactImpactAtMs = Math.min(
      record.action.impactAtMs,
      Math.max(
        record.action.releaseAtMs,
        elapsedFor(record, current)
      )
    );

    const resolution = processResolution(
      record,
      current,
      { impactAtMs: contactImpactAtMs }
    );

    if (!resolution) {
      return Object.freeze({
        ok: false,
        outcome: "no_action"
      });
    }

    return Object.freeze({
      ok: true,
      outcome: "contact_resolved",
      actorId,
      targetId,
      skillId: record.action.skill?.id ?? null,
      impactAtMs: contactImpactAtMs,
      resolution
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
    reportActionContact,
    cancelActionsForActor,
    cancelActive,
    dispose,
    hasActiveActionFor(actorId) {
      return activeByActor.has(actorId);
    },
    activeActionFor(actorId) {
      const record =
        activeByActor.get(actorId) ?? null;
      return record && !record.resolved
        ? record.action
        : null;
    },
    get isRunning() {
      return running && !disposed;
    },
    get hasActiveAction() {
      return unresolvedRecords().length > 0;
    },
    get activeAction() {
      return (
        unresolvedRecords()[0]?.action ??
        null
      );
    },
    get activeActions() {
      return Object.freeze(
        unresolvedRecords().map(
          (record) => record.action
        )
      );
    }
  });
}
