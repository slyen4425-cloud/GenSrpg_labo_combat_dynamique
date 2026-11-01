import {amplifyChargedEffectSkillV1} from "./charged-effects-v1.js";
import {
  combatHealthDeltaEventsV1
} from "./combat-health-feedback-v1.js";
import { isStatusEffectRuntimeInstanceActiveV1 } from "./status-effect-instance-v1.js";
import { hasActiveStatusKindV1 } from "./status-effect-runtime-v1.js";
import { normalizePersistentZoneSpatialV1 } from "../../contracts/persistent-zone-spatial-v1.js";
import {
  projectileClashCandidate,
  projectileClashAtVisualContactV1,
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
  readBarrierContact = null,
  enableExpandingWaveMultiTarget = false,
  groundContactResolution = "timed",
  onState = () => {},
  onHealthDelta = () => {},
  onClock = () => {},
  onProgress = () => {},
  onStarted = () => {},
  onRelease = () => {},
  onResolved = () => {},
  onInterrupted = () => {},
  onContactHoldStart = () => {},
  onContactHoldTick = () => {},
  onContactHoldEnd = () => {},
  onChannelStart = () => {},
  onChannelTick = () => {},
  onChannelEnd = () => {}
}) {
  if (!session || typeof session.advanceMs !== "function") {
    throw new TypeError("session with advanceMs() is required");
  }
  if (!Number.isFinite(tickMs) || tickMs <= 0) {
    throw new RangeError("tickMs must be greater than 0");
  }
  if (readZoneSpatialContext !== null && typeof readZoneSpatialContext !== "function") throw new TypeError("readZoneSpatialContext must be a function");
  if (readBarrierContact !== null && typeof readBarrierContact !== "function") throw new TypeError("readBarrierContact must be a function");

  let disposed = false;
  let running = false;
  let timerId = null;
  let lastNowMs = null;
  let sequence = 0;
  let lastStateSignal = null;
  let lastFeedbackState = null;
  const activeByActor = new Map();
  const contactHoldsByActor = new Map();
  // Returning shots share the authoritative scheduler without occupying the defender action slot.
  const returningProjectiles = new Map();
  const MAX_MIRROR_BOUNCES = 2;
  const armedRechargeableReactions = new Map();

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
        state.persistentZones ?? [],
      // Combat State owns summoned entities. A wall can be created, damaged
      // or destroyed without changing any fighter HP; never suppress that
      // state projection merely because the roster is unchanged.
      combatEntities:
        state.combatEntities ?? []
    });
  }

  function endContactHold(actorId, reason = "cancelled") {
    const record = contactHoldsByActor.get(actorId);
    if (!record) return false;
    contactHoldsByActor.delete(actorId);
    const info=Object.freeze({ actorId, targetId:record.targetId,
      skillId:record.skill.id, reason });
    if(record.kind==="channeling")onChannelEnd(info);
    else onContactHoldEnd(info);
    return true;
  }
  function syncContactHoldsWithState(state) {
    for(const hold of [...contactHoldsByActor.values()]){
      const source=state.fighters[hold.actorId], target=state.fighters[hold.targetId];
      const taken=Number(source?.damageTakenTotal);
      if(!source||!target||source.hp<=0||target.hp<=0)
        endContactHold(hold.actorId,"ko_or_absent");
      else if(!Number.isFinite(taken)||taken<hold.damageTakenTotalAtStart)
        endContactHold(hold.actorId,"actor_replaced");
      else if(hold.kind==="channeling"&&
          hold.skill.channeling.stopOnStun&&hasActiveStatusKindV1(state,hold.actorId,"stun"))
        endContactHold(hold.actorId,"stun");
      else if(hold.kind==="channeling"&&
          hold.skill.channeling.stopOnSilence&&hasActiveStatusKindV1(state,hold.actorId,"silence"))
        endContactHold(hold.actorId,"silence");
      else if(taken>hold.damageTakenTotalAtStart&&
          (hold.kind!=="channeling"||hold.skill.channeling.stopOnDamage))
        endContactHold(hold.actorId,"damage_taken");
    }
  }
  function pulseContactHolds(atNowMs) {
    for(const hold of [...contactHoldsByActor.values()]){
      if(contactHoldsByActor.get(hold.actorId)!==hold)continue;
      const config=hold.kind==="channeling"?hold.skill.channeling:hold.skill.contactHold;
      const duration=config.maxDurationMs;
      const endAt=duration?hold.startedAtClockMs+duration:Infinity;
      const until=Math.min(endAt,atNowMs);
      let count=0;
      while(contactHoldsByActor.get(hold.actorId)===hold &&
          hold.nextTickClockMs<=until){
        if(hold.kind==="channeling"&&config.maxTicks!==null&&hold.ticks>=config.maxTicks){
          endContactHold(hold.actorId,"max_ticks");break;
        }
        const tickAtMs=Math.max(0,Number(session.snapshot().elapsedMs)-
          (atNowMs-hold.nextTickClockMs));
        const result=hold.kind==="channeling"
          ?session.applyChannelingTickV1({
              actorId:hold.actorId,targetId:hold.targetId,skill:hold.skill,atMs:tickAtMs
            })
          :session.applyContactHoldTickV1({
              actorId:hold.actorId,targetId:hold.targetId,skill:hold.skill,
              contactedEntityId:readBarrierContact?.({sourceActorId:hold.actorId,
                targetActorId:hold.targetId,kind:"contact",skillId:hold.skill.id})?.entityId??null,
              atMs:tickAtMs
            });
        if(!result.ok){endContactHold(hold.actorId,result.outcome);break;}
        hold.ticks=(hold.ticks??0)+1;
        hold.nextTickClockMs+=config.tickIntervalMs;
        const event=Object.freeze({actorId:hold.actorId,targetId:hold.targetId,
          skillId:hold.skill.id,tick:hold.ticks,events:result.events});
        if(hold.kind==="channeling")onChannelTick(event);
        else onContactHoldTick(event);
        syncContactHoldsWithState(session.snapshot());
        if(++count>2000)throw new Error("contactHold max pulse safety exceeded");
      }
      if(contactHoldsByActor.get(hold.actorId)===hold&&atNowMs>=endAt)
        endContactHold(hold.actorId,"duration_expired");
      else if(hold.kind==="channeling"&&contactHoldsByActor.get(hold.actorId)===hold&&
        config.maxTicks!==null&&hold.ticks>=config.maxTicks)
        endContactHold(hold.actorId,"max_ticks");
    }
  }

  function emitStateIfChanged({ force = false } = {}) {
    syncContactHoldsWithState(session.snapshot());
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
    // For a charged attack, the cast stays in preparation until the actual
    // projectile release. The authored wind-up is a minimum, not a deadline.
    const preparationMs = record.action.chargeState
      ? record.action.releaseAtMs : record.action.preparationMs;
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
      reaction,
      ...(record.action.chargeState ? {
        chargeCount:record.action.chargeState.chargeCount,
        chargeMax:record.action.chargeState.maxCharges,
        sizeMultiplier:record.action.chargeState.sizeMultiplier
      } : {})
    });
  }

  function activeRecords() {
    return [...activeByActor.values(), ...returningProjectiles.values()];
  }

  function recordIsActive(record) {
    return record.mirrorReturn === true
      ? returningProjectiles.get(record.sequence) === record
      : activeByActor.get(record.action.actorId) === record;
  }

  function removeRecord(record) {
    if (record.mirrorReturn !== true && record.action?.actorId &&
        typeof session.setMovementActiveV1 === "function") {
      session.setMovementActiveV1(record.action.actorId, false);
    }
    if (record.mirrorReturn === true) {
      returningProjectiles.delete(record.sequence);
    } else {
      activeByActor.delete(record.action.actorId);
    }
  }

  function activeMirrorFor(targetActorId, atMs) {
    const defender = session.snapshot().fighters[targetActorId];
    return (defender?.statusEffects ?? []).some((instance) =>
      instance.definition?.kind === "projectile_mirror" &&
      isStatusEffectRuntimeInstanceActiveV1(instance, atMs)
    );
  }

  function mirrorCanIntercept(record, action, atMs, visibleContact, {
    mirrorSpritePresent = false,
    mirrorSpriteContact = false
  } = {}) {
    // If the status has a visible barrier surface, a creature-body hit
    // outside that sprite MUST NOT be treated as a mirror rebound.
    // Legacy mirrors without a sprite keep their body-contact behavior.
    if (mirrorSpritePresent === true && mirrorSpriteContact !== true) return false;
    return visibleContact &&
      action.actionType === "skill" &&
      action.skill?.form === "projectile" &&
      action.skill?.projectileTargeting === "direct" &&
      action.actorId !== action.targetId &&
      Number(action.mirrorReturn?.bounceCount ?? 0) < MAX_MIRROR_BOUNCES &&
      activeMirrorFor(action.targetId, atMs);
  }

  function returnMirroredProjectile(action, atNowMs, contactPoint = null) {
    const returnDurationMs = Math.max(1, Number(action.skill?.travelMs) || Number(action.travelMs) || 1);
    const mirrored = Object.freeze({
      ...action,
      actorId: action.targetId,
      targetId: action.actorId,
      preparationMs: 0,
      releaseAtMs: 0,
      travelMs: returnDurationMs,
      impactAtMs: returnDurationMs,
      recoveryMs: 0,
      mirrorReturn: Object.freeze({
        originalActorId: action.mirrorReturn?.originalActorId ?? action.actorId,
        bounceCount: Number(action.mirrorReturn?.bounceCount ?? 0) + 1,
        ...(contactPoint !== null ? { contactPoint } : {})
      })
    });
    const returnRecord = {
      action: mirrored,
      reaction: null,
      startedAtClockMs: atNowMs,
      startedAtCombatMs: Number(session.snapshot().elapsedMs) || 0,
      released: false,
      resolved: false,
      resolvedAtMs: null,
      sequence: sequence++,
      mirrorReturn: true
    };
    returningProjectiles.set(returnRecord.sequence, returnRecord);
    processRelease(returnRecord);
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
    stopImmobilizedApproaches();
    syncContactHoldsWithState(session.snapshot());
    pulseContactHolds(current);
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
    // Visible aerial contact resolves damage early, not the flight itself.
    // Keep the existing action record through its original travel deadline:
    // this is the same CombatRuntime clock used for defensive presence.
    const recoveredAtMs =
      record.resolvedAtMs +
      Math.max(0, Number(record.action.recoveryMs) || 0);
    const completeAtMs = record.aerialFollowThrough === true
      ? Math.max(recoveredAtMs, record.action.impactAtMs)
      : recoveredAtMs;
    return record.startedAtClockMs + completeAtMs;
  }

  function processRecoveryComplete(
    record,
    atNowMs
  ) {
    if (
      !recordIsActive(record) ||
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

    removeRecord(record);
    if (!record.mirrorReturn) onProgress(idleProgress(record.action.actorId));
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

    // A mid-dive hit is not the end of the creature's aerial movement.
    // removeRecord() clears movementActive when the natural flight ends.
    if (!record.mirrorReturn && record.aerialFollowThrough !== true &&
        typeof session.setMovementActiveV1 === "function") {
      session.setMovementActiveV1(record.action.actorId, false);
    }
    record.resolved = true;
    record.resolvedAtMs = Math.max(
      0,
      Number(resolvedAtMs) || 0
    );

    if (recoveryMs <= 0 && record.aerialFollowThrough !== true) {
      removeRecord(record);
      if (!record.mirrorReturn) onProgress(idleProgress(record.action.actorId));
      return false;
    }

    if (!record.mirrorReturn) onProgress(
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
    let endedContactHolds = 0;
    for (const hold of [...contactHoldsByActor.values()]) {
      if (hold.actorId === actorId || (includeTargeted && hold.targetId === actorId)) {
        if (endContactHold(hold.actorId, reason)) endedContactHolds++;
      }
    }

    for (const record of activeRecords()) {
      const matchesActor = record.action.actorId === actorId;
      const matchesTarget =
        includeTargeted &&
        !record.resolved &&
        record.action.targetId === actorId &&
        // A released expanding wave keeps travelling even when the
        // initially selected enemy is KO; the other target is independent.
        !(record.multiTargetWave && record.released);

      if (!matchesActor && !matchesTarget) {
        continue;
      }

      if (!recordIsActive(record)) {
        continue;
      }

      removeRecord(record);
      if (record.resolved && record.aerialFollowThrough !== true) {
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
      ok: cancelled.length > 0 || endedContactHolds > 0,
      outcome:
        cancelled.length > 0 || endedContactHolds > 0
          ? "actions_cancelled"
          : "no_action",
      actorId,
      includeTargeted,
      cancelled: Object.freeze(cancelled)
    });
  }

  // The Combat Session alone owns whether a status is active. A new
  // immobilization stops an actual approach immediately; the existing
  // interrupt callback cancels the same visual movement on screen.
  function stopImmobilizedApproaches() {
    const state = session.snapshot();
    for (const record of activeRecords()) {
      if ((record.resolved && record.aerialFollowThrough !== true) ||
          record.action?.actionType !== "skill") continue;
      if ((record.action.skill?.approachMode ?? "none") === "none") continue;
      const actorId = record.action.actorId;
      if (hasActiveStatusKindV1(state, actorId, "immobilize")) {
        cancelActionsForActor(actorId, { reason: "immobilized" });
      }
    }
  }

  function processRelease(record) {
    if (
      !recordIsActive(record) ||
      record.released
    ) {
      return;
    }

    const earlyCounter =
      record.reaction?.outcome === "countered" &&
      record.reaction.readyAtMs < record.action.releaseAtMs;

    record.released = true;

    if (!earlyCounter && record.action.chargeState) {
      const skill=record.action.skill,config=skill.chargedAttack??skill.chargedEffects;
      const count=record.action.chargeState.chargeCount;
      const damage=skill.chargedAttack?config.baseDamage+(count-1)*config.bonusDamagePerCharge:null;
      const sizeMultiplier=record.action.chargeState.sizeMultiplier;
      record.action=Object.freeze({...record.action,
        chargeState:Object.freeze({...record.action.chargeState,...(damage===null?{}:{damage}),sizeMultiplier}),
        skill:skill.chargedAttack
          ?Object.freeze({...skill,effect:Object.freeze({...skill.effect,damage})})
          :amplifyChargedEffectSkillV1(skill,count)});

    }

    if (!earlyCounter) {
      // One combat-owned movement gate, not a sprite timer or HUD guess.
      const action = record.action;
      if (!record.mirrorReturn &&
          action?.actionType === "skill" &&
          ["ground", "aerial", "burrow"].includes(action.skill?.approachMode) &&
          Number(action.travelMs) > 0 &&
          typeof session.setMovementActiveV1 === "function") {
        session.setMovementActiveV1(action.actorId, true);
      }
      onRelease(Object.freeze({
        action: record.action,
        elapsedMs: record.action.releaseAtMs
      }));
    }
  }

  function rechargeableReactionKey(
    actorId,
    actionId
  ) {
    return String(actorId) + "::" + String(actionId);
  }

  function armedRechargeableReactionFor({
    record,
    action,
    impactAtMs
  }) {
    if (
      action?.actionType !== "skill" ||
      record.reaction !== null
    ) {
      return null;
    }

    const resolutionAtMs =
      record.startedAtCombatMs +
      impactAtMs;

    for (
      const [key, armed] of
      armedRechargeableReactions
    ) {
      if (armed.actorId !== action.targetId || armed.reactionSkill === null) {
        // Defense uses this very same recharge clock but reduces damage in
        // CombatDamage; it never intercepts as a zero-damage dodge or block.
        continue;
      }

      const window =
        session.rechargeableActionWindowStatus({
          actorId: armed.actorId,
          actionId: armed.actionId,
          activeWindowMs:
            armed.activeWindowMs,
          atMs: resolutionAtMs
        });

      if (!window.active) {
        const combatNow =
          Number(
            session.snapshot().elapsedMs
          ) || 0;
        if (
          window.activeUntilMs !== null &&
          window.activeUntilMs <= combatNow
        ) {
          armedRechargeableReactions.delete(
            key
          );
        }
        continue;
      }

      const preview = session.previewReaction({
        action,
        reactionSkill:
          armed.reactionSkill,
        elapsedMs: impactAtMs
      });

      if (preview.ok) {
        return preview.reaction;
      }
    }

    return null;
  }

  function processResolution(
    record,
    atNowMs,
    { impactAtMs = null, visibleContact = false, contactPoint = null,
      combatEntityId = undefined, mirrorSpritePresent = false, mirrorSpriteContact = false,
      forcedOutcomeOverride = null } = {}
  ) {
    if (
      !recordIsActive(record) ||
      record.resolved
    ) {
      return null;
    }

    // Once any 2v2 wave target is contacted, each defender has already
    // been resolved independently. End the single paid action at its
    // natural deadline without adding a duplicate hit or a fake miss.
    if (record.multiTargetWave && record.waveTargetsResolved.size > 0) {
      enterRecovery(record, {
        resolvedAtMs: record.action.impactAtMs,
        atNowMs
      });
      emitStateIfChanged({ force: true });
      return Object.freeze({
        ok: true, outcome: "wave_finished",
        actorId: record.action.actorId
      });
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
    const automaticReaction =
      armedRechargeableReactionFor({
        record,
        action: effectiveAction,
        impactAtMs: effectiveImpactAtMs
      });

    if (automaticReaction !== null) {
      record.reaction = automaticReaction;
    }

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
      (!targetRecord.resolved || targetRecord.aerialFollowThrough === true)
        ? Object.freeze({
            action: targetRecord.action,
            elapsedMs: Math.max(
              0,
              resolutionClockMs -
                targetRecord.startedAtClockMs
            )
          })
        : null;

    // Status durations belong to CombatState.elapsedMs, not the browser
    // performance.now() clock. Using resolutionClockMs here makes every
    // timed mirror appear expired on a long-running browser tab.
    const resolutionCombatMs = record.startedAtCombatMs +
      (effectiveReaction?.outcome === "countered"
        ? effectiveReaction.readyAtMs
        : effectiveAction.impactAtMs);
    const mirrorContact = mirrorCanIntercept(record, effectiveAction, resolutionCombatMs, visibleContact,
      {mirrorSpritePresent, mirrorSpriteContact});
    // An uncaught returning projectile cannot inflict damage at a timer boundary.
    const forcedOutcome = forcedOutcomeOverride ?? (mirrorContact ? "mirrored" :
      (record.mirrorReturn && !visibleContact ? "evaded" :
        (effectiveAction.actionType === "skill" &&
         effectiveAction.skill?.projectileTargeting === "expanding_wave" &&
         !visibleContact ? "evaded" : null)));

    // One spatial observation at the existing semantic impact. Never infer a
    // wall from the attack kind or expiry clock. Projectile evidence comes
    // from its own swept sprite sensor; beam/contact from the same FX adapter.
    const physicalKind=effectiveAction.actionType==="skill"
      ? effectiveAction.skill?.form : null;
    const spatialBarrierContact=["beam","contact"].includes(physicalKind)
      ? readBarrierContact?.({sourceActorId:effectiveAction.actorId,
          targetActorId:effectiveAction.targetId,kind:physicalKind,
          skillId:effectiveAction.skill.id})??null
      : null;
    const spatialBarrierId=spatialBarrierContact?.entityId??null;
    const barrierContactId=physicalKind==="projectile"
      ? (visibleContact?combatEntityId??null:null)
      : physicalKind==="contact" && visibleContact && combatEntityId
        ? combatEntityId : spatialBarrierId;
    const resolvedAction=["projectile","beam","contact"].includes(physicalKind)
      ? Object.freeze({...effectiveAction,barrierContactId})
      : effectiveAction;
    const resolution = session.completeAction({
      action: resolvedAction,
      forcedOutcome,
      confirmedVisibleBodyContact: visibleContact && !combatEntityId &&
        effectiveAction.actionType === "skill" &&
        effectiveAction.skill?.form === "contact" &&
        effectiveAction.skill?.approachMode === "ground",
      reaction: effectiveReaction,
      targetActionContext,
      resolutionAtMs:
        record.startedAtCombatMs +
        (
          effectiveReaction?.outcome === "countered"
            ? effectiveReaction.readyAtMs
            : effectiveAction.impactAtMs
        )
    });

    const resolvedAtMs =
      effectiveReaction?.outcome === "countered"
        ? effectiveReaction.readyAtMs
        : effectiveAction.impactAtMs;

    // Visible body contact ends the damage exchange once, but aerial
    // follow-through has its own remaining *existing* travel window.
    // Do not create a separate dodge state or visual clock.
    record.aerialFollowThrough =
      visibleContact && !record.mirrorReturn &&
      record.action.skill?.approachMode === "aerial" &&
      effectiveImpactAtMs < record.action.impactAtMs;
    enterRecovery(record, {
      resolvedAtMs,
      atNowMs
    });

    applyResolutionInterrupt(resolution);
    // A direct immobilization hit can arrive between clock ticks.
    // Stop the target's still-moving action before any later impact.
    stopImmobilizedApproaches();

    const koActorId = koActorIdFromResolution(resolution);
    if (koActorId) {
      cancelActionsForActor(koActorId, {
        includeTargeted: true,
        reason: "ko"
      });
    }

    // Presentation-only position from the SAME swept wall contact already
    // observed by the runtime. Never compute new collision/HP authority.
    // Keep it even if the strike destroys the entity in Combat State.
    const barrierHit=resolution.events?.some(e=>e.type==="combat-entity-hit");
    const wallPoint=combatEntityId?contactPoint:spatialBarrierContact?.point??null;
    const presentationResolution=barrierHit&&
      Number.isFinite(wallPoint?.x)&&Number.isFinite(wallPoint?.y)
      ? Object.freeze({...resolution,barrierImpactPoint:Object.freeze({
          x:wallPoint.x,y:wallPoint.y
        })})
      : resolution;
    onResolved(presentationResolution);
    if(resolution.ok&&resolution.outcome==="hit"&&
        effectiveAction.actionType==="skill"&&effectiveAction.skill?.channeling&&
        Number(session.snapshot().fighters[effectiveAction.actorId]?.hp)>0&&
        Number(session.snapshot().fighters[effectiveAction.targetId]?.hp)>0&&
        !contactHoldsByActor.has(effectiveAction.actorId) &&
        !resolution.events?.some(event=>event.type==="combat-entity-hit")){
      const hold={
        kind:"channeling",actorId:effectiveAction.actorId,targetId:effectiveAction.targetId,
        skill:effectiveAction.skill,startedAtClockMs:atNowMs,
        nextTickClockMs:atNowMs+effectiveAction.skill.channeling.tickIntervalMs,
        ticks:0,damageTakenTotalAtStart:
          Number(session.snapshot().fighters[effectiveAction.actorId]?.damageTakenTotal)||0
      };
      contactHoldsByActor.set(hold.actorId,hold);
      onChannelStart(Object.freeze({actorId:hold.actorId,targetId:hold.targetId,
        skillId:hold.skill.id}));
    }
    if (mirrorContact) {
      returnMirroredProjectile(effectiveAction, atNowMs, contactPoint);
    }
    emitStateIfChanged({ force: true });
    return presentationResolution;
  }

  function processProjectileClash({
    leftRecord,
    rightRecord,
    candidate,
    visualContact = false
  }) {
    if (
      !recordIsActive(leftRecord) ||
      !recordIsActive(rightRecord) ||
      leftRecord.resolved ||
      rightRecord.resolved
    ) {
      return;
    }

    const currentCandidate = visualContact
      ? projectileClashAtVisualContactV1({
          leftAction: leftRecord.action,
          rightAction: rightRecord.action,
          atClockMs: candidate.atClockMs,
          leftProgress: candidate.leftProgress,
          rightProgress: candidate.rightProgress
        })
      : projectileClashCandidate({
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
    return currentCandidate;
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
          const action = item.record.action;
          if (groundContactResolution === "visible" &&
              action.actionType === "skill" && action.skill?.form === "contact" &&
              action.skill?.approachMode === "ground" && !item.record.mirrorReturn) {
            // The same outbound AnimationPlan owns the final contact opportunity.
            return;
          }
          processResolution(item.record, atNowMs);
        } else {
          processRecoveryComplete(
            item.record,
            atNowMs
          );
        }
      });

    for (const record of activeByActor.values()) {
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
    if (contactHoldsByActor.has(actorId))
      return Object.freeze({ok:false,outcome:contactHoldsByActor.get(actorId).kind==="channeling"
        ?"channeling_active":"contact_hold_active"});
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
      action: (result.action.skill?.chargedAttack || result.action.skill?.chargedEffects)
        ? Object.freeze({
            ...result.action,
            // Each successful activation owns a COMPLETE cast stage, then an
            // optional reactivation window. The first paid stage starts now.
            releaseAtMs:result.action.preparationMs+
              (result.action.skill.chargedAttack??result.action.skill.chargedEffects).reactivationWindowMs,
            impactAtMs:result.action.preparationMs+
              (result.action.skill.chargedAttack??result.action.skill.chargedEffects).reactivationWindowMs+result.action.travelMs,
            chargeState:Object.freeze({
              chargeCount:1,
              maxCharges:(result.action.skill.chargedAttack??result.action.skill.chargedEffects).maxCharges,
              lastTapAtMs:current,
              chargeReadyAtMs:current+result.action.preparationMs,
              ...(result.action.skill.chargedAttack?{damage:result.action.skill.chargedAttack.baseDamage}:{}),
              sizeMultiplier:1
            })
          })
        : result.action,
      reaction: null,
      startedAtClockMs: current,
      startedAtCombatMs:
        Number(session.snapshot().elapsedMs) || 0,
      released: false,
      resolved: false,
      resolvedAtMs: null,
      sequence: sequence++,
      multiTargetWave:
        enableExpandingWaveMultiTarget === true &&
        result.action.actionType === "skill" &&
        result.action.skill?.projectileTargeting === "expanding_wave",
      waveTargetsResolved: new Set()
    };

    activeByActor.set(actorId, record);

    onStarted(Object.freeze({
      action: record.action,
      elapsedMs: 0
    }));
    emitStateIfChanged({ force: true });
    onProgress(progressSnapshot(record, 0));

    if (record.action.releaseAtMs === 0) {
      processRelease(record);
    }

    settleDue(current);

    return Object.freeze({
      ok: true,
      outcome: "started",
      action: record.action
    });
  }

  function previewChargedSkillRetrigger({actorId,skillId}) {
    const record = activeByActor.get(actorId);
    if (!record || record.action.actionType !== "skill" ||
        record.action.actionId !== skillId || !record.action.chargeState ||
        record.resolved) {
      return Object.freeze({ok:false,outcome:"action_in_progress"});
    }
    const config = record.action.skill.chargedAttack ?? record.action.skill.chargedEffects;
    const charge = record.action.chargeState;
    const elapsed = elapsedFor(record,now());
    if (record.released || elapsed >= record.action.releaseAtMs) {
      return Object.freeze({ok:false,outcome:"charge_released"});
    }
    if (charge.chargeCount >= config.maxCharges) {
      return Object.freeze({ok:false,outcome:"charge_max"});
    }
    const remainingCastMs=Math.max(0,charge.chargeReadyAtMs-now());
    if (remainingCastMs>0) {
      return Object.freeze({ok:false,outcome:"charge_preparing",remainingCastMs,
        chargeCount:charge.chargeCount,maxCharges:config.maxCharges});
    }
    const remainingWindowMs=record.action.releaseAtMs-elapsed;
    if (remainingWindowMs<=0) {
      return Object.freeze({ok:false,outcome:"charge_window_expired"});
    }
    const cost=record.action.skill.energyCost;
    const energy=session.snapshot().fighters[actorId]?.energy ?? 0;
    if (energy<cost) return Object.freeze({ok:false,outcome:"insufficient_energy",cost,availableEnergy:energy});
    return Object.freeze({ok:true,outcome:"charge_ready",
      chargeCount:charge.chargeCount,maxCharges:config.maxCharges,remainingWindowMs});
  }

  function startSkill({ actorId, targetId, skill }) {
    const active = activeByActor.get(actorId);
    if (active && active.action.actionType === "skill" &&
        active.action.actionId === skill?.id && active.action.chargeState) {
      const preview = previewChargedSkillRetrigger({actorId,skillId:skill.id});
      if (!preview.ok) return preview;
      if (active.action.targetId !== targetId) {
        return Object.freeze({ok:false,outcome:"charge_target_locked"});
      }
      // Recheck and commit energy atomically BEFORE changing damage or size.
      // A rejected spam tap or an empty energy bar is never an amplification.
      const payment=session.payChargedActivationEnergy({
        actorId,cost:active.action.skill.energyCost
      });
      if (!payment.ok) return payment;
      const previous = active.action.chargeState;
      const next = Object.freeze({
        ...previous,chargeCount:previous.chargeCount+1,lastTapAtMs:now(),
        chargeReadyAtMs:now()+active.action.preparationMs,
        sizeMultiplier:1 + previous.chargeCount * (active.action.skill.chargedAttack??active.action.skill.chargedEffects).sizeIncreasePct / 100
      });
      // Every activation must finish its OWN preparation, even the final one.
      // The optional window starts AFTER that cast stage has finished.
      const elapsed = elapsedFor(active,now());
      const releaseAtMs = elapsed+active.action.preparationMs+
        (next.chargeCount >= next.maxCharges ? 0 : (active.action.skill.chargedAttack??active.action.skill.chargedEffects).reactivationWindowMs);
      active.action = Object.freeze({...active.action,
        releaseAtMs,impactAtMs:releaseAtMs+active.action.travelMs,chargeState:next});
      onProgress(progressSnapshot(active,elapsedFor(active,now())));
      emitStateIfChanged({force:true});
      return Object.freeze({ok:true,outcome:"charged",chargeCount:next.chargeCount,
        maxCharges:next.maxCharges,action:active.action});
    }
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

  function previewRechargeableReaction(
    reactionSkill,
    {
      againstActorId = null,
      recharge
    } = {}
  ) {
    const record = reactionRecord(
      againstActorId
    );

    if (!record) {
      return previewReaction(
        reactionSkill,
        { againstActorId }
      );
    }

    if (record.reaction) {
      return Object.freeze({
        ok: false,
        outcome:
          "reaction_already_selected"
      });
    }

    return session.previewRechargeableReaction({
      action: record.action,
      reactionSkill,
      elapsedMs:
        elapsedFor(record, now()),
      recharge
    });
  }

  function reactWithRechargeableAction(
    reactionSkill,
    {
      againstActorId = null,
      recharge
    } = {}
  ) {
    const record = reactionRecord(
      againstActorId
    );
    if (!record) {
      return previewRechargeableReaction(
        reactionSkill,
        {
          againstActorId,
          recharge
        }
      );
    }

    const result =
      session.reactWithRechargeableAction({
        action: record.action,
        reactionSkill,
        elapsedMs:
          elapsedFor(record, now()),
        recharge
      });

    if (!result.ok) {
      return result;
    }

    record.reaction = result.reaction;
    emitStateIfChanged({ force: true });
    onProgress(
      progressSnapshot(
        record,
        elapsedFor(record, now())
      )
    );
    return result;
  }

  function rechargeableActionAvailability(
    config
  ) {
    return session.rechargeableActionAvailability(
      config
    );
  }

  function rechargeableReactionWindowStatus({
    actorId,
    recharge,
    activeWindowMs
  }) {
    const status =
      session.rechargeableActionWindowStatus({
        actorId,
        actionId: recharge.actionId,
        activeWindowMs
      });

    if (
      !status.active &&
      status.activeUntilMs !== null &&
      status.activeUntilMs <=
        Number(
          session.snapshot().elapsedMs
        )
    ) {
      armedRechargeableReactions.delete(
        rechargeableReactionKey(
          actorId,
          recharge.actionId
        )
      );
    }

    return status;
  }

  function activateRechargeableReaction(
    reactionSkill,
    {
      actorId,
      recharge,
      activeWindowMs
    } = {}
  ) {
    if (disposed) {
      return Object.freeze({
        ok: false,
        outcome: "disposed"
      });
    }

    const current = now();
    advanceSessionToClock(current);
    settleDue(current);

    // A manual dodge is an action of its own. It cannot overlap the actor's
    // still active preparation, travel, or recovery. Check *before* consuming
    // a rechargeable charge, in the native owner (not just the button).
    const occupied = canStartAction(actorId);
    if (occupied) {
      return Object.freeze({
        ...occupied,
        state: session.snapshot()
      });
    }

    const result =
      session.activateRechargeableAction({
        actorId,
        actionId: recharge.actionId,
        maxCharges: recharge.maxCharges,
        rechargeMs: recharge.rechargeMs,
        activeWindowMs
      });

    if (!result.ok) {
      return result;
    }

    armedRechargeableReactions.set(
      rechargeableReactionKey(
        actorId,
        recharge.actionId
      ),
      Object.freeze({
        actorId,
        actionId: recharge.actionId,
        reactionSkill,
        activeWindowMs
      })
    );

    emitStateIfChanged({ force: true });
    return result;
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

    const targetActorId = interruptEvent.actorId;
    const reason = interruptEvent.reason ?? "stun";
    // A real stun *status* is a hard control: while an actor still owns an
    // unresolved attack/approach, terminate its native action and visual.
    // The historical "interruptsPreparation" effect without an active stun
    // remains governed by interruptibleDuringPreparation/releaseAtMs below.
    if (reason === "stun" &&
        hasActiveStatusKindV1(session.snapshot(), targetActorId, "stun")) {
      const record = activeByActor.get(targetActorId);
      if (record && (!record.resolved || record.aerialFollowThrough === true)) {
        const cancelled = cancelActionsForActor(targetActorId, {reason:"stun"});
        return cancelled.cancelled[0] ?? Object.freeze({ok:false,outcome:"no_action"});
      }
    }

    return interruptActive({targetActorId,reason});
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

  // Geometry is supplied by DomSkillFxRenderer only when two opposing
  // visible projectile shells have actually intersected. No midpoint guess.
  // The existing CombatRuntime owns every cancellation, effect and outcome.
  function reportProjectileClashContact({
    waveActorId,
    waveSkillId = null,
    projectileActorId,
    projectileSkillId = null
  }) {
    if (disposed) return Object.freeze({ok:false,outcome:"disposed"});
    const current = now();
    advanceSessionToClock(current);
    settleDue(current);
    const waveRecord = activeByActor.get(waveActorId);
    const projectileRecord = activeByActor.get(projectileActorId);
    if (!waveRecord || !projectileRecord ||
        waveRecord === projectileRecord ||
        waveRecord.resolved || projectileRecord.resolved ||
        !waveRecord.released || !projectileRecord.released) {
      return Object.freeze({ok:false,outcome:"no_active_pair"});
    }
    if (waveSkillId != null && String(waveRecord.action.skill?.id) !== String(waveSkillId) ||
        projectileSkillId != null && String(projectileRecord.action.skill?.id) !== String(projectileSkillId)) {
      return Object.freeze({ok:false,outcome:"skill_mismatch"});
    }
    if (current > absoluteResolutionAt(waveRecord) ||
        current > absoluteResolutionAt(projectileRecord)) {
      return Object.freeze({ok:false,outcome:"travel_finished"});
    }
    const progress = record => {
      const duration = Math.max(1,Number(record.action.travelMs)||1);
      return Math.max(0,Math.min(1,(
        current-(record.startedAtClockMs+record.action.releaseAtMs)
      )/duration));
    };
    const candidate = projectileClashAtVisualContactV1({
      leftAction: waveRecord.action,
      rightAction: projectileRecord.action,
      atClockMs: current,
      leftProgress: progress(waveRecord),
      rightProgress: progress(projectileRecord)
    });
    if (!candidate) return Object.freeze({ok:false,outcome:"incompatible_clash"});
    const settled = processProjectileClash({
      leftRecord: waveRecord,
      rightRecord: projectileRecord,
      candidate,
      visualContact: true
    });
    return Object.freeze({
      ok: Boolean(settled),
      outcome: settled?.outcome ?? "no_active_pair",
      ...(settled ? {candidate: settled} : {})
    });
  }

  // The renderer may report each opaque enemy as the single visible ring
  // crosses it. Rules, teams, states, statuses and damage belong here and
  // to CombatSession, never to the visual sensor or 2v2 UI.
  function reportExpandingWaveTargetContact({
    actorId, targetId, skillId = null
  }) {
    if (disposed) return Object.freeze({ok:false,outcome:"disposed"});
    const current = now();
    advanceSessionToClock(current);
    settleDue(current);
    const record = activeByActor.get(actorId);
    if (!record || !record.multiTargetWave || record.resolved) {
      return Object.freeze({ok:false,outcome:"no_action"});
    }
    if (skillId != null && String(skillId) !== String(record.action.skill?.id)) {
      return Object.freeze({ok:false,outcome:"skill_mismatch"});
    }
    if (!record.released || current < absoluteReleaseAt(record)) {
      return Object.freeze({ok:false,outcome:"not_released"});
    }
    if (current > absoluteResolutionAt(record)) {
      return Object.freeze({ok:false,outcome:"travel_finished"});
    }
    if (record.waveTargetsResolved.has(targetId)) {
      return Object.freeze({ok:false,outcome:"already_contacted"});
    }
    const targetRecord = activeByActor.get(targetId) ?? null;
    const targetActionContext =
      targetRecord && targetRecord !== record &&
      (!targetRecord.resolved || targetRecord.aerialFollowThrough === true)
        ? Object.freeze({
            action: targetRecord.action,
            elapsedMs: elapsedFor(targetRecord, current)
          })
        : null;
    const impactAtMs = Math.min(record.action.impactAtMs,
      Math.max(record.action.releaseAtMs, elapsedFor(record,current)));
    const aimedAction = Object.freeze({
      ...record.action, targetId,
      travelMs: impactAtMs - record.action.releaseAtMs,
      impactAtMs
    });
    const reaction = targetId === record.action.targetId
      ? record.reaction
      : armedRechargeableReactionFor({
          record: {...record, reaction:null},
          action: aimedAction,
          impactAtMs
        });
    const resolution = session.completeExpandingWaveTarget({
      action:aimedAction, targetId, reaction, targetActionContext,
      resolutionAtMs:record.startedAtCombatMs + impactAtMs
    });
    if (!resolution.ok) {
      return Object.freeze({ok:false,outcome:"invalid_target"});
    }
    record.waveTargetsResolved.add(targetId);
    applyResolutionInterrupt(resolution);
    stopImmobilizedApproaches();
    const koActorId = koActorIdFromResolution(resolution);
    if (koActorId) {
      cancelActionsForActor(koActorId,{
        includeTargeted:true,reason:"ko"
      });
    }
    const presented = Object.freeze({...resolution,waveContact:true});
    onResolved(presented);
    emitStateIfChanged({force:true});
    return Object.freeze({
      ok:true,outcome:"contact_resolved",
      actorId,targetId,skillId:record.action.skill?.id,
      resolution:presented
    });
  }

  function reportGroundApproachEnd({actorId,targetId,skillId = null}) {
    if (disposed || groundContactResolution !== "visible")
      return Object.freeze({ok:false,outcome:"not_authoritative"});
    const current = now();
    advanceSessionToClock(current);
    settleDue(current);
    const record = activeByActor.get(actorId) ?? null;
    if (!record || record.resolved || !record.released ||
        record.action.actionType !== "skill" ||
        record.action.skill?.form !== "contact" ||
        record.action.skill?.approachMode !== "ground" ||
        record.action.targetId !== targetId ||
        (skillId !== null && String(record.action.skill.id) !== String(skillId)))
      return Object.freeze({ok:false,outcome:"no_matching_ground_approach"});
    // No visible model intersection throughout the outbound path -> miss.
    const resolution = processResolution(record,current,{
      forcedOutcomeOverride:"evaded"
    });
    return Object.freeze({ok:Boolean(resolution),outcome:"travel_finished",resolution});
  }

  function reportActionContact({
    actorId,
    targetId,
    skillId = null,
    contactPoint = null,
    combatEntityId = null,
    mirrorSpritePresent = false,
    mirrorSpriteContact = false
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

    const nativeRecord = activeByActor.get(actorId);
    const returnRecord = [...returningProjectiles.values()].find((candidate) =>
      candidate.action.actorId === actorId &&
      candidate.action.targetId === targetId &&
      (skillId == null || String(candidate.action.skill?.id) === String(skillId)) &&
      !candidate.resolved
    );
    const record = returnRecord ?? nativeRecord;
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
      // A visible wall is not body-to-body contact: movement-zone crossings
      // still update, but the defender's body is not falsely reached.
      session.advanceMs(0, { zoneSpatialContext: Object.freeze({ ...spatial,
        contacts: combatEntityId
          ? Object.freeze([])
          : Object.freeze([Object.freeze({ actorId, targetId, approachMode: "ground" })])
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

    const visualPoint = contactPoint &&
      Number.isFinite(contactPoint.x) && Number.isFinite(contactPoint.y)
        ? Object.freeze({ x: Number(contactPoint.x), y: Number(contactPoint.y) })
        : null;
    const resolution = processResolution(
      record,
      current,
      { impactAtMs: contactImpactAtMs, visibleContact: true, contactPoint: visualPoint,
        combatEntityId, mirrorSpritePresent, mirrorSpriteContact }
    );

    if (!resolution) {
      return Object.freeze({
        ok: false,
        outcome: "no_action"
      });
    }

    if (resolution.ok && resolution.outcome === "hit" &&
        record.action.skill?.contactHold &&
        Number(session.snapshot().fighters[actorId]?.hp) > 0 &&
        Number(session.snapshot().fighters[targetId]?.hp) > 0 &&
        !contactHoldsByActor.has(actorId) &&
        !resolution.events?.some(event=>event.type==="combat-entity-hit")) {
      const hold = {
        actorId, targetId, skill: record.action.skill,
        startedAtClockMs: current,
        nextTickClockMs: current + record.action.skill.contactHold.tickIntervalMs,
        damageTakenTotalAtStart:
          Number(session.snapshot().fighters[actorId].damageTakenTotal) || 0
      };
      contactHoldsByActor.set(actorId, hold);
      onContactHoldStart(Object.freeze({
        actorId, targetId, skillId: hold.skill.id
      }));
    }

    return Object.freeze({
      ok: true,
      outcome: contactHoldsByActor.has(actorId) ? "contact_held" : "contact_resolved",
      actorId,
      targetId,
      skillId: record.action.skill?.id ?? null,
      impactAtMs: contactImpactAtMs,
      resolution
    });
  }

  function cancelActive(actorId = null) {
    if (actorId !== null) {
      const held = endContactHold(actorId, "cancelled");
      const record = activeByActor.get(actorId);
      if (!record) return held;
      removeRecord(record);
      onProgress(idleProgress(actorId));
      return true;
    }

    const records = activeRecords();
    for (const record of records) removeRecord(record);
    const heldCount = contactHoldsByActor.size;
    for (const hold of [...contactHoldsByActor.values()])
      endContactHold(hold.actorId, "cancelled");

    for (const record of records) {
      if (!record.mirrorReturn) onProgress(idleProgress(record.action.actorId));
    }

    return records.length > 0 || heldCount > 0;
  }

  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    running = false;
    cancelActive();
    armedRechargeableReactions.clear();
    clearScheduledTick();
  }

  return Object.freeze({
    start,
    startSkill,
    previewChargedSkillRetrigger,
    startCommand,
    previewReaction,
    react,
    previewRechargeableReaction,
    reactWithRechargeableAction,
    rechargeableActionAvailability,
    rechargeableReactionWindowStatus,
    activateRechargeableReaction,
    interruptActive,
    applyResolutionInterrupt,
    reportActionContact,
    reportGroundApproachEnd,
    reportExpandingWaveTargetContact,
    reportProjectileClashContact,
    cancelActionsForActor,
    cancelActive,
    dispose,
    hasContactHoldFor(actorId) {
      return contactHoldsByActor.has(actorId);
    },
    hasActiveActionFor(actorId) {
      return activeByActor.has(actorId) || contactHoldsByActor.has(actorId);
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
