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
  if (typeof setTimer !== "function" || typeof clearTimer !== "function") {
    throw new TypeError("timer functions are required");
  }

  let disposed = false;
  const timers = new Set();
  const preparationFxByActor = new Map();

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

  function cancelPreparation(actorSlot = "player") {
    const handle = preparationFxByActor.get(actorSlot);
    if (!handle) {
      return false;
    }

    preparationFxByActor.delete(actorSlot);
    handle.animation?.cancel?.();
    return true;
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

    return Object.freeze({
      status: handle ? "preparing" : "no_fx",
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

    cancelPreparation(actorSlot);

    const approachMode = action.skill?.approachMode ?? "none";
    if (
      ["ground", "teleport", "aerial"].includes(approachMode) &&
      typeof visuals.playApproachFor === "function"
    ) {
      visuals
        .playApproachFor(actorSlot, approachMode, {
          travelMs: action.travelMs
        })
        .catch(() => {});
    } else {
      visuals.playEventFor(actorSlot, "attack").catch(() => {});
    }

    for (const fxPlan of planSkillReleaseFx({
      action,
      actorSlot,
      targetSlot
    })) {
      fx?.play(fxPlan);
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

    for (const fxPlan of planSkillOutcomeFx({
      resolution,
      targetSlot
    })) {
      fx?.play(fxPlan);
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
    for (const actorSlot of [...preparationFxByActor.keys()]) {
      cancelPreparation(actorSlot);
    }
    disposed = true;
  }

  return Object.freeze({
    present,
    presentPreparation,
    presentRelease,
    presentOutcome,
    cancelPreparation,
    cancelPending,
    dispose,
    get pendingCount() {
      return timers.size;
    }
  });
}
