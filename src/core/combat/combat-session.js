import {
  addChargeTimeEffect,
  advanceCombatTime,
  createCombatState
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

export function createCombatSession({
  distance = "medium",
  fighters
}) {
  const initialDistance = distance;
  const initialFighters = fighters.map((fighter) => ({ ...fighter }));
  let state = createCombatState({
    distance: initialDistance,
    fighters: initialFighters
  });

  function snapshot() {
    return state;
  }

  function previewMovement(actorId, toDistance) {
    return resolveMovement({ state, actorId, toDistance });
  }

  function move(actorId, toDistance) {
    const result = resolveMovement({ state, actorId, toDistance });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function previewSkill({ actorId, targetId, skill, reactionSkill = null }) {
    return resolveSkill({
      state,
      actorId,
      targetId,
      skill,
      reactionSkill
    });
  }

  function useSkill({ actorId, targetId, skill, reactionSkill = null }) {
    const result = previewSkill({
      actorId,
      targetId,
      skill,
      reactionSkill
    });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function startSkill({ actorId, targetId, skill }) {
    const result = resolveSkillStart({
      state,
      actorId,
      targetId,
      skill
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
      elapsedMs
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

  function completeSkill({ action, reaction = null }) {
    const result = resolveSkillCompletion({
      state,
      action,
      reaction
    });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function completeCommand({ action }) {
    const result = resolveCommandCompletion({
      state,
      action
    });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function completeAction({ action, reaction = null }) {
    return action.actionType === "command"
      ? completeCommand({ action })
      : completeSkill({ action, reaction });
  }

  function advanceMs(deltaMs) {
    state = advanceCombatTime(state, deltaMs);
    return state;
  }

  function advance(seconds) {
    return advanceMs(Number(seconds) * 1000);
  }

  function addChargeEffect(fighterId, effect) {
    state = addChargeTimeEffect(state, fighterId, effect);
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
    reset
  });
}
