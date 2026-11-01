import {
  planSkillFx,
  planSkillOutcomeFx,
  planSkillPreparationFx,
  planSkillReleaseFx
} from "../../core/fx/skill-fx-plan.js";

// Presentation anticipation only: Combat Runtime retains exclusive ownership of hit timing.
const DEFAULT_INSTANT_ATTACK_ANTICIPATION_MS = 250;

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
  onActionTravelEnd = null,
  barrierRectsFor = null,
  setTimer = defaultSetTimer,
  clearTimer = defaultClearTimer,
  instantAttackAnticipationMs = DEFAULT_INSTANT_ATTACK_ANTICIPATION_MS
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
  if (onActionTravelEnd !== null && typeof onActionTravelEnd !== "function") {
    throw new TypeError("onActionTravelEnd must be a function");
  }
  if (barrierRectsFor !== null && typeof barrierRectsFor !== "function") {
    throw new TypeError("barrierRectsFor must be a function");
  }
  if (typeof setTimer !== "function" || typeof clearTimer !== "function") {
    throw new TypeError("timer functions are required");
  }

  if (!Number.isFinite(instantAttackAnticipationMs) || instantAttackAnticipationMs < 0) {
    throw new RangeError("instantAttackAnticipationMs must be nonnegative");
  }

  let disposed = false;
  const timers = new Set();
  const preparedAttacksByActor = new Map();
  const preparationFxByActor = new Map();
  const preparationAudioByActor = new Map();
  const travelAudioByActor = new Map();
  const footfallAudioByActor = new Map();
  const footfallTokenByActor = new Map();
  const repeatingMovementByActor = new Map();
  const outcomeByActor = new Map();
  const rosterVisualsByActor = new Map();
  const approachVisualsByActor = new Map();

  function presentRosterVisual(actorSlot, type, options = {}) {
    const record = { type };
    rosterVisualsByActor.set(actorSlot, record);
    const finished = Promise.resolve(visuals.playEventFor(actorSlot, type, options)).catch(() => ({ status: "cancelled" }));
    // Recall's last pose is held until completion or interruption of the command.
    if (type !== "recall") void finished.finally(() => {
      if (rosterVisualsByActor.get(actorSlot) === record) rosterVisualsByActor.delete(actorSlot);
    });
    return Object.freeze({ status: type === "recall" ? "preparing" : "arriving", finished });
  }

   function presentRosterArrival({ actorSlot, result }) {
    if (disposed) return Object.freeze({ status: "disposed" });
    if (!result?.ok || !["summoned", "switched", "ko_replaced"].includes(result.outcome)) return Object.freeze({ status: "no_fx" });
    return presentRosterVisual(actorSlot, "enter");
  }

  function outcomeSequence(actorSlot, firstType, nextType = null) {
    // A normal recoil cannot replace a still-preparing trainer command's channel.
    // Damage numbers/flash remain independent; lethal hits keep the native KO flow.
    if (firstType === "hit" && nextType === null && rosterVisualsByActor.get(actorSlot)?.type === "recall") {
      return Promise.resolve({ status: "presented" });
    }
    if (nextType === "ko") rosterVisualsByActor.delete(actorSlot);
    const record = {};
    outcomeByActor.set(actorSlot, record);
    return visuals.playEventFor(actorSlot, firstType)
      .then(result => {
        if (disposed || outcomeByActor.get(actorSlot) !== record || result?.status === "cancelled") {
          return { status: "cancelled" };
        }
        return nextType ? visuals.playEventFor(actorSlot, nextType) : { status: "finished" };
      })
      .catch(() => ({ status: "cancelled" }))
      .finally(() => {
        if (outcomeByActor.get(actorSlot) === record) outcomeByActor.delete(actorSlot);
      });
  }

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

  // A single scheduled presentation cue belongs to this actor's current cast.
  // Consuming it on release preserves a pose that already started, without
  // playing a duplicate. Interrupting it also cancels the pose if necessary.
  function consumePreparedAttack(actorSlot) {
    const cue = preparedAttacksByActor.get(actorSlot) ?? null;
    if (!cue) return null;
    preparedAttacksByActor.delete(actorSlot);
    if (cue.timerId !== null) {
      clearTimer(cue.timerId);
      timers.delete(cue.timerId);
      cue.timerId = null;
    }
    return cue;
  }

  function cancelPreparedAttack(actorSlot) {
    const cue = consumePreparedAttack(actorSlot);
    if (cue?.started) visuals.cancelFor(actorSlot);
    return Boolean(cue);
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
    let cancelled = cancelPreparedAttack(actorSlot);

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

  function cancelFootfallAudio(actorSlot = "player") {
    const token = footfallTokenByActor.get(actorSlot);
    footfallTokenByActor.delete(actorSlot);
    const repeating=repeatingMovementByActor.get(actorSlot);
    repeatingMovementByActor.delete(actorSlot);
    if(repeating?.timerId!=null){
      clearTimer(repeating.timerId);
      timers.delete(repeating.timerId);
    }
    const handles = footfallAudioByActor.get(actorSlot);
    footfallAudioByActor.delete(actorSlot);
    for (const handle of handles ?? []) handle.stop?.();
    return Boolean(token || repeating || handles?.size);
  }

  function playFootfallAudio({ actorSlot, targetSlot, token, approachMode }) {
    if (disposed || footfallTokenByActor.get(actorSlot) !== token) return;
    // The creature owns its sound; only aerial approach replaces the
    // footfall cue by an optional continuous or interval-based wing sound.
    const sound=audio?.movementForCreature?.(actorSlot)??null;
    const mode=approachMode==="aerial"&&["repeat","loop"].includes(sound?.mode)
      ? sound.mode:"once";
    if(mode!=="once"&&repeatingMovementByActor.has(actorSlot))return;
    const repeating=mode==="once"?null:{
      token,timerId:null,intervalMs:sound?.repeatIntervalMs??400
    };
    if(repeating)repeatingMovementByActor.set(actorSlot,repeating);
    function playOnce(){
      if(disposed||footfallTokenByActor.get(actorSlot)!==token)return;
      if(repeating&&repeatingMovementByActor.get(actorSlot)!==repeating)return;
      const handle=audio?.play({
        type:"movement",actorSlot,targetSlot,loop:mode==="loop"
      });
      if(handle?.status!=="running")return;
      let handles=footfallAudioByActor.get(actorSlot);
      if(!handles){
        handles=new Set();
        footfallAudioByActor.set(actorSlot,handles);
      }
      handles.add(handle);
      Promise.resolve(handle.finished).finally(()=>{
        handles.delete(handle);
        if(footfallAudioByActor.get(actorSlot)===handles&&handles.size===0){
          footfallAudioByActor.delete(actorSlot);
        }
      }).catch(()=>{});
      if(mode==="repeat"){
        Promise.resolve(handle.finished).then(()=>{
          if(disposed||repeatingMovementByActor.get(actorSlot)!==repeating||
            footfallTokenByActor.get(actorSlot)!==token)return;
          repeating.timerId=schedule(()=>{
            repeating.timerId=null;
            playOnce();
          },repeating.intervalMs);
        }).catch(()=>{});
      }
    }
    playOnce();
  }

  function cancelActionPresentation(
    actorSlot = "player"
  ) {
    const rosterCancelled = rosterVisualsByActor.delete(actorSlot);
    // Movement is started through playApproachFor, outside the roster map.
    // Cancel the creature only if an owned visual is actually active.
    // Unconditional cancelFor would double-cancel the recall/enter sequence.
    const approachCancelled = approachVisualsByActor.delete(actorSlot);
    if (rosterCancelled || approachCancelled) visuals.cancelFor(actorSlot);
    const outcomeCancelled = outcomeByActor.delete(actorSlot);
    const preparationCancelled =
      cancelPreparation(actorSlot);
    const travelCancelled =
      cancelTravelAudio(actorSlot);
    const footfallCancelled =
      cancelFootfallAudio(actorSlot);
    const projectileCount =
      Number(
        fx?.cancelProjectileFor?.(actorSlot) ?? 0
      ) || 0;

    return (
      preparationCancelled ||
      travelCancelled ||
      footfallCancelled ||
      outcomeCancelled ||
      rosterCancelled ||
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

    // For an instant-impact ranged attack, release and damage occur on the
    // same native combat tick. Start its creature pose near the end of the
    // existing preparation, before the hit. Do not postpone gameplay damage.
    if (action?.actionType === "skill" &&
        ["projectile", "beam", "area"].includes(action.skill?.form) &&
        (action.skill?.approachMode ?? "none") === "none" &&
        !action.chargeState &&
        Number(action.travelMs) === 0 &&
        Number(action.preparationMs) > 0 &&
        instantAttackAnticipationMs > 0) {
      const leadMs = Math.min(
        Number(action.preparationMs), instantAttackAnticipationMs
      );
      const cue = { timerId: null, started: false };
      preparedAttacksByActor.set(actorSlot, cue);
      cue.timerId = schedule(() => {
        cue.timerId = null;
        if (preparedAttacksByActor.get(actorSlot) !== cue) return;
        cue.started = true;
        Promise.resolve(visuals.playEventFor(actorSlot, "attack", {
          targetSlot: action.targetId,
          metadata: { useRangedAppearance: true }
        })).catch(() => {});
      }, Math.max(0, Number(action.releaseAtMs ?? action.preparationMs) - leadMs));
    }

    if (action?.actionType === "command") {
      if (["recall", "switch"].includes(action.command?.kind) && action.preparationMs > 0) {
        cancelActionPresentation(actorSlot);
        return presentRosterVisual(actorSlot, "recall", { metadata: { durationMs: action.preparationMs } });
      }
      return Object.freeze({ status: "no_fx" });
    }

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

  // Presentation-only update on the one native cast. Combat Runtime owns
  // charge count and scale; this does not create another animation/timer.
  function presentChargeAmplification({actorSlot = "player", sizeMultiplier, durationMs = null}) {
    if (disposed || !Number.isFinite(sizeMultiplier) || sizeMultiplier <= 0) return false;
    const cast=preparationFxByActor.get(actorSlot);
    if (durationMs !== null) cast?.setDuration?.(durationMs);
    return cast?.setSizeMultiplier?.(sizeMultiplier) ?? false;
  }

  function presentRelease({
    action,
    actorSlot = "player",
    targetSlot = "opponent"
  }) {
    if (disposed) {
      return Object.freeze({ status: "disposed" });
    }

    const preparedAttack = consumePreparedAttack(actorSlot);
    cancelPreparation(
      actorSlot,
      { audioMode: "loop-only" }
    );
    cancelFootfallAudio(actorSlot);

    const approachMode = action.skill?.approachMode ?? "none";
    // Charge solaire and similar authored support skills may keep legacy
    // contact/ground presentation metadata, even when every effect is a
    // beneficial ally/self status. Never turn those into a live-model
    // collision or a one-millisecond self-approach. Only the Presentation
    // owner opts out; Combat Rules and the author's export remain unchanged.
    const skill = action.skill;
    const supportiveOnly = skill &&
      Array.isArray(skill.targetRelations) &&
      skill.targetRelations.length > 0 &&
      skill.targetRelations.every(relation => relation === "self" || relation === "ally") &&
      Number(skill.effect?.damage ?? 0) === 0 &&
      Array.isArray(skill.effects) &&
      skill.effects.length > 0 &&
      skill.effects.every(effect =>
        (effect.kind === "apply_status" && effect.status?.polarity === "beneficial") ||
        effect.kind === "heal" ||
        effect.kind === "energy_restore" ||
        effect.kind === "cleanse"
      );
    if (
      !supportiveOnly &&
      ["ground", "teleport", "aerial", "burrow"].includes(approachMode) &&
      typeof visuals.playApproachFor === "function"
    ) {
      const skillId = action.skill?.id ?? null;
      const footfallToken = skillId && action.skill?.form === "contact" &&
        Number(action.travelMs) > 0 ? {} : null;
      if (footfallToken) footfallTokenByActor.set(actorSlot, footfallToken);
      const approachToken = {};
      approachVisualsByActor.set(actorSlot, approachToken);
      visuals
        .playApproachFor(actorSlot, approachMode, {
          // Native -100% speed modifier permits an instantaneous impact.
          // Visual movement planning and cue dispatch require positive
          // duration: use a 1ms visual-only envelope, never mutate action.
          travelMs: Math.max(1, Number(action.travelMs) || 0),
          holdOnContact: Boolean(action.skill?.contactHold),
          obstacleRectsFor: approachMode === "ground" &&
            action.skill?.form === "contact" && barrierRectsFor
              ? () => barrierRectsFor({
                  sourceActorId: actorSlot, targetActorId: targetSlot,
                  kind: "contact", skillId
                })
              : null,
          burrowTerrainSprites: approachMode === "burrow"
            ? fx?.burrowTerrainForSkill?.(skillId,actorSlot,targetSlot) ?? null
            : null,
          targetSlot,
          onFootfall: footfallToken ? () => playFootfallAudio({
            actorSlot, targetSlot, token: footfallToken, approachMode
          }) : null,
          onContact:
            approachMode !== "burrow" &&
            action.skill?.form === "contact" &&
            typeof onActionContact === "function"
              ? contact =>
                  onActionContact(
                    Object.freeze({
                      actorId: actorSlot,
                      targetId: targetSlot,
                      skillId,
                      ...(contact?.combatEntityId ? {
                        combatEntityId: contact.combatEntityId,
                        contactPoint: contact.contactPoint ?? null
                      } : {})
                    })
                  )
              : null,
          onPhase({ label, phaseDurationMs }) {
            if (label === "ground-home" && approachMode === "ground" &&
                action.skill?.form === "contact" &&
                typeof onActionTravelEnd === "function") {
              // The existing collision watcher's rAF receives the last
              // outbound frame before declaring an uncontacted approach over.
              const complete = () => {
                if (!disposed && approachVisualsByActor.get(actorSlot) === approachToken)
                  onActionTravelEnd(Object.freeze({
                    actorId:actorSlot,targetId:targetSlot,skillId
                  }));
              };
              if (typeof globalThis.requestAnimationFrame === "function")
                globalThis.requestAnimationFrame(complete);
              else complete();
            }
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
        .catch(() => {})
        .finally(() => {
          if (approachVisualsByActor.get(actorSlot) === approachToken) {
            approachVisualsByActor.delete(actorSlot);
            if(repeatingMovementByActor.get(actorSlot)?.token===footfallToken){
              cancelFootfallAudio(actorSlot);
            }
          }
        });
    } else if (!action.mirrorReturn && !preparedAttack?.started) {
      // Only an explicitly authored ranged creature pose replaces the
      // default attacking silhouette; FX projectiles/beams remain unchanged.
      visuals
        .playEventFor(actorSlot, "attack", {
          targetSlot,
          metadata: {
            useRangedAppearance: ["projectile", "beam", "area"].includes(action.skill?.form)
          }
        })
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
    if (releaseSkillId && !action.mirrorReturn) {
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
      ["projectile", "beam"].includes(action.skill?.form) &&
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

    if (resolution.waveContact !== true) cancelTravelAudio(actorSlot);
    // Finish aerial loop/repeats on semantic arrival; old one-shot
    // footsteps retain their historical natural end.
    if(repeatingMovementByActor.has(actorSlot))cancelFootfallAudio(actorSlot);
    else footfallTokenByActor.delete(actorSlot);

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
      ["projectile", "beam"].includes(releaseEvent?.form) &&
      resolution.outcome !== "clashed" &&
      resolution.waveContact !== true
    ) {
      // On an actual wave contact, let the same sprite shell finish
      // expanding visually. The hit has already been resolved by Combat
      // Runtime, so this does not extend or repeat gameplay collisions.
      fx?.cancelProjectileFor?.(actorSlot, {
        preserveContactedWave: resolution.outcome === "hit",
        skillId: outcomeSkillId
      });
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
        (
          fxPlan.type === "impact" ||
          fxPlan.type === "clash-impact"
        ) &&
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
        // The native combat-entity-hit event proves the wall intercepted
        // this strike. No fighter body contact: no hit, recoil or KO pose.
        // Its impact sprite/audio are handled by the existing FX plan.
        if (resolution.events?.some(event=>event.type==="combat-entity-hit")) {
          break;
        }
        const hitEvent = resolution.events?.find(
          (item) =>
            item.type === "hit" &&
            item.reflected !== true
        );

        if (
          resolution.persistentZoneOnly === true
        ) {
          ko = false;
          koActorId = null;
          break;
        }

        // The canonical heal event means successful healing, not an incoming
        // hit. Recoil would make self/ally healing look like taking damage.
        // Keep the existing impact FX and the Runtime's actual +HP feedback.
        const appliedHeal = resolution.events?.some(
          item => item.type === "heal"
        );
        const appliedDamage = resolution.events?.some(
          item =>
            item.type === "hit" &&
            Number(item.appliedDamage) > 0
        );
        if (appliedHeal && !appliedDamage) {
          break;
        }

        ko = Number(hitEvent?.hpAfter) <= 0;
        koActorId = ko ? hitEvent?.actorId ?? null : null;

        if (ko) {
          visuals.cancelFor(targetSlot);
        }

        finished = outcomeSequence(targetSlot, "hit", ko ? "ko" : null);
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
        finished = outcomeSequence(actorSlot, "hit", ko ? "ko" : null);
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
    for (const actorSlot of new Set([
      ...rosterVisualsByActor.keys(), ...approachVisualsByActor.keys()
    ])) visuals.cancelFor(actorSlot);
    rosterVisualsByActor.clear();
    approachVisualsByActor.clear();
    const presentationActors = new Set([
      ...preparationFxByActor.keys(),
      ...preparationAudioByActor.keys(),
      ...travelAudioByActor.keys(),
      ...footfallAudioByActor.keys(),
      ...footfallTokenByActor.keys(),
      ...repeatingMovementByActor.keys()
    ]);
    for (const actorSlot of preparedAttacksByActor.keys()) {
      cancelPreparedAttack(actorSlot);
    }
    for (const actorSlot of presentationActors) {
      cancelPreparation(actorSlot);
      cancelTravelAudio(actorSlot);
      cancelFootfallAudio(actorSlot);
    }
    disposed = true;
    outcomeByActor.clear();
  }

  return Object.freeze({
    present,
    presentPreparation,
    presentChargeAmplification,
    presentRosterArrival,
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
