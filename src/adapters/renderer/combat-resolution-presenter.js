import {
  planSkillFx,
  planSkillOutcomeFx,
  planSkillPreparationFx,
  planSkillReleaseFx
} from "../../core/fx/skill-fx-plan.js";

function defaultSetTimer(callback, delayMs) {
  return setTimeout(callback, delayMs);
}

function defaultClearTimer(timerId) {
  clearTimeout(timerId);
}

export function createCombatResolutionPresenter({
  visuals,
  fx = null,
  audio = null,
  onActionContact = null,
  setTimer = defaultSetTimer,
  clearTimer = defaultClearTimer
}) {
  if (
    !visuals ||
    typeof visuals.playEventFor !== "function" ||
    typeof visuals.cancelFor !== "function"
  ) {
    throw new TypeError("visuals must provide playEventFor() and cancelFor()");
  }
  if (fx && typeof fx.play !== "function") {
    throw new TypeError("fx must provide play() when supplied");
  }
  if (audio && typeof audio.play !== "function") {
    throw new TypeError("audio must provide play() when supplied");
  }
  if (
    onActionContact !== null &&
    typeof onActionContact !== "function"
  ) {
    throw new TypeError(
      "onActionContact must be a function when supplied"
    );
  }
  if (typeof setTimer !== "function" || typeof clearTimer !== "function") {
    throw new TypeError("timer functions are required");
  }

  let disposed = false;
  const timers = new Set();
  const preparationFxByActor = new Map();
  const preparationAudioByActor = new Map();
  const travelAudioByActor = new Map();

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

  function outcomeTime(resolution) {
    if (resolution.outcome === "countered") {
      return (
        resolution.events.find((item) => item.type === "skill-countered")?.atMs ??
        0
      );
    }
    return (
      resolution.events.find((item) => item.type === "skill-arrive")?.atMs ?? 0
    );
  }

  function cancelPreparation(
    actorSlot = "player",
    { audioMode = "all" } = {}
  ) {
    let cancelled = false;

    const fxHandle = preparationFxByActor.get(actorSlot);
    if (fxHandle) {
      preparationFxByActor.delete(actorSlot);
      fxHandle.animation?.cancel?.();
      cancelled = true;
    }

    const audioHandle = preparationAudioByActor.get(actorSlot);
    if (audioHandle) {
      const shouldStopAudio =
        audioMode === "all" ||
        (
          audioMode === "loop-only" &&
          audioHandle.loop === true
        );

      if (shouldStopAudio) {
        preparationAudioByActor.delete(actorSlot);
        audioHandle.stop?.();
        cancelled = true;
      }
    }

    return cancelled;
  }

  function cancelTravelAudio(
    actorSlot = "player"
  ) {
    const handle =
      travelAudioByActor.get(actorSlot) ?? null;
    if (!handle) {
      return false;
    }

    travelAudioByActor.delete(actorSlot);
    handle.stop?.();
    return true;
  }

  function cancelActionPresentation(
    actorSlot = "player"
  ) {
    const preparationCancelled =
      cancelPreparation(actorSlot);
    const travelCancelled =
      cancelTravelAudio(actorSlot);
    const projectileCount =
      Number(
        fx?.cancelProjectileFor?.(actorSlot) ?? 0
      ) || 0;

    return (
      preparationCancelled ||
      travelCancelled ||
      projectileCount > 0
    );
  }

  function presentPreparation({
    action,
    actorSlot = "player"
  }) {
    if (disposed) {
      return Object.freeze({ status: "disposed" });
    }

    cancelPreparation(actorSlot);

    let handle = null;
    for (const fxPlan of planSkillPreparationFx({
      action,
      actorSlot
    })) {
      const next = fx?.play(fxPlan) ?? null;
      if (next?.status === "running") {
        handle = next;
      }
    }

    if (handle) {
      preparationFxByActor.set(actorSlot, handle);
      Promise.resolve(handle.finished)
        .finally(() => {
          if (preparationFxByActor.get(actorSlot) === handle) {
            preparationFxByActor.delete(actorSlot);
          }
        })
        .catch(() => {});
    }

    const skillId = action?.skill?.id ?? null;
    const audioHandle = skillId
      ? audio?.play({
          type: "cast",
          skillId,
          actorSlot,
          targetSlot: action?.targetId ?? null
        }) ?? null
      : null;

    if (audioHandle?.status === "running") {
      preparationAudioByActor.set(actorSlot, audioHandle);
      Promise.resolve(audioHandle.finished)
        .finally(() => {
          if (preparationAudioByActor.get(actorSlot) === audioHandle) {
            preparationAudioByActor.delete(actorSlot);
          }
        })
        .catch(() => {});
    }

    return Object.freeze({
      status:
        handle || audioHandle?.status === "running"
          ? "preparing"
          : "no_fx",
      preparationMs: action?.preparationMs ?? 0
    });
  }

  function presentRelease({
    action,
    actorSlot = "player",
    targetSlot = "opponent"
  }) {
    if (disposed) {
      return Object.freeze({ status: "disposed" });
    }

    cancelPreparation(
      actorSlot,
      { audioMode: "loop-only" }
    );

    const approachMode = action.skill?.approachMode ?? "none";
    if (
      ["ground", "teleport", "aerial"].includes(approachMode) &&
      typeof visuals.playApproachFor === "function"
    ) {
      const skillId = action.skill?.id ?? null;
      visuals
        .playApproachFor(actorSlot, approachMode, {
          travelMs: action.travelMs,
          targetSlot,
          onContact:
            action.skill?.form === "contact" &&
            typeof onActionContact === "function"
              ? () =>
                  onActionContact(
                    Object.freeze({
                      actorId: actorSlot,
                      targetId: targetSlot,
                      skillId
                    })
                  )
              : null,
          onPhase({ label, phaseDurationMs }) {
            if (!skillId) {
              return;
            }
            fx?.play({
              type: "phase",
              skillId,
              actorSlot,
              phase: label,
              durationMs: phaseDurationMs
            });
            audio?.play({
              type: "phase",
              skillId,
              actorSlot,
              targetSlot,
              phase: label
            });
          }
        })
        .catch(() => {});
    } else {
      visuals
        .playEventFor(actorSlot, "attack", { targetSlot })
        .catch(() => {});
    }

    for (const fxPlan of planSkillReleaseFx({
      action,
      actorSlot,
      targetSlot
    })) {
      fx?.play(fxPlan);
    }

    const releaseSkillId = action.skill?.id ?? null;
    if (releaseSkillId) {
      audio?.play({
        type: "release",
        skillId: releaseSkillId,
        actorSlot,
        targetSlot
      });
    }

    cancelTravelAudio(actorSlot);
    if (
      releaseSkillId &&
      action.skill?.form === "projectile" &&
      Number(action.travelMs) > 0
    ) {
      const travelHandle =
        audio?.play({
          type: "travel",
          skillId: releaseSkillId,
          actorSlot,
          targetSlot
        }) ?? null;

      if (travelHandle?.status === "running") {
        travelAudioByActor.set(
          actorSlot,
          travelHandle
        );
        Promise.resolve(travelHandle.finished)
          .finally(() => {
            if (
              travelAudioByActor.get(actorSlot) ===
              travelHandle
            ) {
              travelAudioByActor.delete(actorSlot);
            }
          })
          .catch(() => {});
      }
    }

    return Object.freeze({
      status: "released",
      travelMs: action.travelMs
    });
  }

  function presentOutcome({
    resolution,
    actorSlot = "player",
    targetSlot = "opponent"
  }) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        finished: Promise.resolve({ status: "disposed" })
      });
    }
    if (!resolution?.ok) {
      return Object.freeze({
        status: "rejected",
        finished: Promise.resolve({ status: "rejected" })
      });
    }

    let ko = false;
    let koActorId = null;
    let finished = Promise.resolve({ status: "presented" });

    cancelTravelAudio(actorSlot);

    const releaseEvent =
      resolution.events?.find(
        (item) => item.type === "skill-release"
      ) ?? null;
    const outcomeSkillId =
      resolution.events?.find(
        (item) => item.type === "skill-arrive"
      )?.skillId ??
      releaseEvent?.skillId ??
      resolution.skillId ??
      null;

    if (
      releaseEvent?.form === "projectile" &&
      resolution.outcome !== "clashed"
    ) {
      fx?.cancelProjectileFor?.(actorSlot);
    }

    let impactAudioPlayed = false;
    for (const fxPlan of planSkillOutcomeFx({
      resolution,
      actorSlot,
      targetSlot
    })) {
      fx?.play(fxPlan);

      if (
        !impactAudioPlayed &&
        fxPlan.type === "impact" &&
        outcomeSkillId
      ) {
        audio?.play({
          type: "impact",
          skillId: outcomeSkillId,
          actorSlot,
          targetSlot
        });
        impactAudioPlayed = true;
      }
    }

    switch (resolution.outcome) {
      case "hit": {
        const hitEvent = resolution.events?.find(
          (item) =>
            item.type === "hit" &&
            item.reflected !== true
        );
        ko = Number(hitEvent?.hpAfter) <= 0;
        koActorId = ko ? hitEvent?.actorId ?? null : null;

        if (ko) {
          visuals.cancelFor(targetSlot);
        }

        finished = visuals
          .playEventFor(targetSlot, "hit")
          .then(() =>
            ko
              ? visuals.playEventFor(targetSlot, "ko")
              : { status: "finished" }
          )
          .catch(() => ({ status: "cancelled" }));
        break;
      }

      case "reflected": {
        const reflectedHit = resolution.events?.find(
          (item) =>
            item.type === "hit" &&
            item.reflected === true
        );
        ko = Number(reflectedHit?.hpAfter) <= 0;
        koActorId = ko ? reflectedHit?.actorId ?? null : null;
        visuals.cancelFor(actorSlot);
        finished = visuals
          .playEventFor(actorSlot, "hit")
          .then(() =>
            ko
              ? visuals.playEventFor(actorSlot, "ko")
              : { status: "finished" }
          )
          .catch(() => ({ status: "cancelled" }));
        break;
      }

      case "countered":
        visuals.cancelFor(actorSlot);
        finished = visuals
          .playEventFor(targetSlot, "attack")
          .then(() => visuals.playEventFor(actorSlot, "hit"))
          .catch(() => ({ status: "cancelled" }));
        break;

      case "clashed":
        fx?.cancelProjectileFor?.(actorSlot);
        break;

      case "blocked":
      case "immune":
        visuals.cancelFor(actorSlot);
        break;

      default:
        break;
    }

    return Object.freeze({
      status: "resolved",
      outcome: resolution.outcome,
      ko,
      koActorId,
      finished
    });
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

    const release = resolution.events.find((item) => item.type === "skill-release");
    if (release) {
      schedule(() => {
        visuals.playEventFor(actorSlot, "attack").catch(() => {});
      }, release.atMs);
    }

    for (const fxPlan of planSkillFx({
      resolution,
      actorSlot,
      targetSlot
    })) {
      schedule(() => {
        fx?.play({ ...fxPlan, delayMs: 0 });
      }, fxPlan.delayMs);
    }

    const atMs = outcomeTime(resolution);
    schedule(() => {
      presentOutcome({ resolution, actorSlot, targetSlot });
    }, atMs);

    return Object.freeze({
      status: "scheduled",
      outcome: resolution.outcome,
      impactAtMs: atMs
    });
  }

  function cancelPending() {
    for (const timerId of timers) {
      clearTimer(timerId);
    }
    timers.clear();
  }

  function dispose() {
    if (disposed) {
      return;
    }
    cancelPending();
    const presentationActors = new Set([
      ...preparationFxByActor.keys(),
      ...preparationAudioByActor.keys(),
      ...travelAudioByActor.keys()
    ]);
    for (const actorSlot of presentationActors) {
      cancelPreparation(actorSlot);
      cancelTravelAudio(actorSlot);
    }
    disposed = true;
  }

  return Object.freeze({
    present,
    presentPreparation,
    presentRelease,
    presentOutcome,
    cancelPreparation,
    cancelActionPresentation,
    cancelPending,
    dispose,
    get pendingCount() {
      return timers.size;
    }
  });
}
