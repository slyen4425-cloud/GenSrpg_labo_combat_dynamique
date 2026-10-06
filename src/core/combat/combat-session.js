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
  removePersistentZonesFromActorV1
} from "./persistent-zone-runtime-v1.js";

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
      deltaMs
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

  function replaceFighter(fighterId, fighter, { clearSourceZones = false } = {}) {
    state = replaceCombatFighter(state, fighterId, fighter);
    if (clearSourceZones) state = removePersistentZonesFromActorV1(state, fighterId);
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
    completeSkill,
    completeCommand,
    completeAction,
    advanceMs,
    advance,
    addChargeEffect,
    replaceFighter,
    reset
  });
}
