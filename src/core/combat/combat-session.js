import {
  addChargeTimeEffect,
  advanceCombatTime,
  createCombatState,
  replaceFighter as replaceCombatFighter
} from "./combat-state.js";
import {
  resolveMovement,
  resolveReaction,
  resolveSkill,
  resolveSkillCompletion,
  resolveSkillStart
} from "./action-resolver.js";
import {
  resolveCommandCompletion,
  resolveCommandStart
} from "./command-resolver.js";
import {
  normalizeSkillSpeedMultiplier
} from "./combat-timing.js";
import {
  advanceStatusEffectsV1,
  advanceStatusEffectsOnOwnerActionEndV1
} from "./status-effect-runtime-v1.js";
import {
  advancePersistentZonesV1,
  prepareZoneStatusDeparturesV1,
  removePersistentZonesFromActorV1,
  resetPersistentZoneOccupancyForSlotV1,
  removeInheritedZoneBoundStatusesV1
} from "./persistent-zone-runtime-v1.js";
import {
  advanceScheduledEffectsV1
} from "./scheduled-effect-runtime-v1.js";
import {
  rechargeableActionAvailabilityV1,
  consumeRechargeableActionChargeV1,
  rechargeableActionWindowStatusV1,
  activateRechargeableActionV1
} from "./rechargeable-action-v1.js";
import {
  applyImmediateTacticalEffectsV1
} from "./immediate-tactical-effects-v1.js";

export function createCombatSession({
  distance = "medium",
  fighters,
  skillSpeedMultiplier = 1,
  battleFormat = null
}) {
  const normalizedSkillSpeedMultiplier =
    normalizeSkillSpeedMultiplier(
      skillSpeedMultiplier
    );
  const initialDistance = distance;
  const initialFighters = fighters.map((fighter) => ({ ...fighter }));
  let state = createCombatState({
    distance: initialDistance,
    fighters: initialFighters
  });

  function snapshot() {
    return state;
  }

  function commitCompletedOwnerAction(
    result,
    actorId
  ) {
    if (!result.ok) {
      return result;
    }

    state = advanceStatusEffectsOnOwnerActionEndV1({
      state: result.state,
      fighterId: actorId
    });

    return Object.freeze({
      ...result,
      state
    });
  }

  function previewMovement(actorId, toDistance) {
    return resolveMovement({ state, actorId, toDistance });
  }

  function move(actorId, toDistance) {
    const result = resolveMovement({
      state,
      actorId,
      toDistance
    });
    return commitCompletedOwnerAction(
      result,
      actorId
    );
  }

  function previewSkill({ actorId, targetId, skill, reactionSkill = null }) {
    return resolveSkill({
      state,
      actorId,
      targetId,
      skill,
      reactionSkill,
      skillSpeedMultiplier:
        normalizedSkillSpeedMultiplier,
      battleFormat
    });
  }

  function useSkill({ actorId, targetId, skill, reactionSkill = null }) {
    const result = previewSkill({
      actorId,
      targetId,
      skill,
      reactionSkill
    });
    return commitCompletedOwnerAction(
      result,
      actorId
    );
  }

  function startSkill({ actorId, targetId, skill }) {
    const result = resolveSkillStart({
      state,
      actorId,
      targetId,
      skill,
      skillSpeedMultiplier:
        normalizedSkillSpeedMultiplier,
      battleFormat
    });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function previewCommand({ actorId, command }) {
    return resolveCommandStart({
      state,
      actorId,
      command
    });
  }

  function startCommand({ actorId, command }) {
    const result = previewCommand({ actorId, command });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function previewReaction({ action, reactionSkill, elapsedMs }) {
    return resolveReaction({
      state,
      action,
      reactionSkill,
      elapsedMs,
      skillSpeedMultiplier:
        normalizedSkillSpeedMultiplier,
      battleFormat
    });
  }

  function reactToSkill({ action, reactionSkill, elapsedMs }) {
    const result = previewReaction({
      action,
      reactionSkill,
      elapsedMs
    });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function rechargeableActionAvailability(config) {
    return rechargeableActionAvailabilityV1({
      state,
      ...config
    });
  }

  function rechargeableActionWindowStatus(config) {
    return rechargeableActionWindowStatusV1({
      state,
      ...config
    });
  }

  function activateRechargeableAction(config) {
    const result =
      activateRechargeableActionV1({
        state,
        ...config
      });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function previewRechargeableReaction({
    action,
    reactionSkill,
    elapsedMs,
    recharge
  }) {
    const result = previewReaction({
      action,
      reactionSkill,
      elapsedMs
    });
    if (!result.ok) {
      return result;
    }

    const availability =
      rechargeableActionAvailabilityV1({
        state,
        actorId: action.targetId,
        actionId: recharge.actionId,
        maxCharges: recharge.maxCharges,
        rechargeMs: recharge.rechargeMs
      });

    if (availability.charges <= 0) {
      return Object.freeze({
        ok: false,
        outcome: "no_charges",
        state,
        availability
      });
    }

    return Object.freeze({
      ...result,
      availability
    });
  }

  function reactWithRechargeableAction({
    action,
    reactionSkill,
    elapsedMs,
    recharge
  }) {
    const preview =
      previewRechargeableReaction({
        action,
        reactionSkill,
        elapsedMs,
        recharge
      });
    if (!preview.ok) {
      return preview;
    }

    const reaction = resolveReaction({
      state,
      action,
      reactionSkill,
      elapsedMs,
      skillSpeedMultiplier:
        normalizedSkillSpeedMultiplier,
      battleFormat
    });
    if (!reaction.ok) {
      return reaction;
    }

    const consumed =
      consumeRechargeableActionChargeV1({
        state: reaction.state,
        actorId: action.targetId,
        actionId: recharge.actionId,
        maxCharges: recharge.maxCharges,
        rechargeMs: recharge.rechargeMs
      });
    if (!consumed.ok) {
      return consumed;
    }

    state = consumed.state;

    return Object.freeze({
      ...reaction,
      state,
      availability:
        consumed.availability
    });
  }

  function completeSkill({
    action,
    reaction = null,
    targetActionContext = null,
    resolutionAtMs = null
  }) {
    const result = resolveSkillCompletion({
      state,
      action,
      reaction,
      targetActionContext,
      battleFormat,
      resolutionAtMs
    });
    return commitCompletedOwnerAction(
      result,
      action.actorId
    );
  }

  function completeCommand({ action }) {
    const result = resolveCommandCompletion({
      state,
      action
    });
    return commitCompletedOwnerAction(
      result,
      action.actorId
    );
  }

  function completeAction({
    action,
    reaction = null,
    targetActionContext = null,
    resolutionAtMs = null
  }) {
    return action.actionType === "command"
      ? completeCommand({ action })
      : completeSkill({
          action,
          reaction,
          targetActionContext,
          resolutionAtMs
        });
  }

  function advanceMs(
    deltaMs,
    {
      zoneSpatialContext = null
    } = {}
  ) {
    state = advanceScheduledEffectsV1({
      state,
      deltaMs,
      resolveEffects({
        state: scheduledState,
        record,
        atMs
      }) {
        return applyImmediateTacticalEffectsV1({
          state: scheduledState,
          actorId: record.sourceActorId,
          targetId: record.targetActorId,
          skill: {
            id: record.sourceSkillId,
            element: record.skillElement,
            effects: record.effects
          },
          atMs,
          combatAtMs: atMs,
          battleFormat
        });
      }
    });
    // Remove departed/expired zone-bound statuses before the native status
    // clock can apply an obsolete periodic effect outside its real radius.
    state = prepareZoneStatusDeparturesV1({
      state, deltaMs, battleFormat, zoneSpatialContext
    });
    // Keep timed energy buffs visible to the single energy clock even if
    // StatusRuntime expires them within this large frame step.
    const energyStatusAtStart = Object.fromEntries(
      Object.entries(state.fighters).map(([id, fighter]) => [
        id,
        fighter.statusEffects.filter(
          instance => instance.definition.kind === "energy_regen_modifier"
        )
      ])
    );
    const cooldownStatusAtStart = Object.fromEntries(
      Object.entries(state.fighters).map(([id, fighter]) => [
        id,
        fighter.statusEffects.filter(
          instance => instance.definition.kind === "skill_cooldown_rate_modifier"
        )
      ])
    );
    state = advanceStatusEffectsV1({
      state,
      deltaMs
    });
    state = advancePersistentZonesV1({
      state,
      deltaMs,
      battleFormat,
      zoneSpatialContext
    });
    state = advanceCombatTime(
      state,
      deltaMs,
      { energyStatusAtStart, cooldownStatusAtStart }
    );
    return state;
  }

  function advance(seconds) {
    return advanceMs(Number(seconds) * 1000);
  }

  function addChargeEffect(fighterId, effect) {
    state = addChargeTimeEffect(state, fighterId, effect);
    return state;
  }

  function departFighter(fighterId, {departingMemberId = null} = {}) {
    state = removePersistentZonesFromActorV1(state, fighterId, {departingMemberId});
    state = removeInheritedZoneBoundStatusesV1(state, fighterId);
    state = resetPersistentZoneOccupancyForSlotV1(state, fighterId, {absent:true});
    return state;
  }

  function replaceFighter(fighterId, fighter, {
    clearSourceZones = false, departingMemberId = null
  } = {}) {
    if (clearSourceZones) {
      state = removePersistentZonesFromActorV1(state, fighterId, {departingMemberId});
    }
    state = replaceCombatFighter(state, fighterId, fighter);
    if (clearSourceZones) {
      state = removeInheritedZoneBoundStatusesV1(state, fighterId);
      state = resetPersistentZoneOccupancyForSlotV1(state, fighterId);
    }
    return state;
  }

  function reset() {
    state = createCombatState({
      distance: initialDistance,
      fighters: initialFighters
    });
    return state;
  }

  return Object.freeze({
    get skillSpeedMultiplier() {
      return normalizedSkillSpeedMultiplier;
    },
    snapshot,
    previewMovement,
    previewSkill,
    previewCommand,
    move,
    useSkill,
    startSkill,
    startCommand,
    previewReaction,
    reactToSkill,
    rechargeableActionAvailability,
    rechargeableActionWindowStatus,
    activateRechargeableAction,
    previewRechargeableReaction,
    reactWithRechargeableAction,
    completeSkill,
    completeCommand,
    completeAction,
    advanceMs,
    advance,
    addChargeEffect,
    replaceFighter,
    departFighter,
    reset
  });
}
