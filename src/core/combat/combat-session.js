import {
  addChargeTimeEffect,
  advanceCombatTime,
  createCombatState
} from "./combat-state.js";
import {
  resolveUtilityActionCompletion,
  resolveUtilityActionStart
} from "./utility-action-resolver.js";
import {
  resolveMovement,
  resolveReaction,
  resolveSkill,
  resolveSkillCompletion,
  resolveSkillStart
} from "./action-resolver.js";

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

  function fighterIdByPresence(side, presence) {
    return (
      Object.values(state.fighters).find(
        (fighter) =>
          fighter.side === side && fighter.presence === presence
      )?.id ?? null
    );
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

  function previewUtilityAction({ actorId, definition }) {
    return resolveUtilityActionStart({
      state,
      actorId,
      definition
    });
  }

  function startUtilityAction({ actorId, definition }) {
    const result = previewUtilityAction({ actorId, definition });
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

  function completeUtilityAction({ action }) {
    const result = resolveUtilityActionCompletion({
      state,
      action
    });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function completeAction({ action, reaction = null }) {
    if (action.kind === "skill") {
      return completeSkill({ action, reaction });
    }
    return completeUtilityAction({ action });
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
    fighterIdByPresence,
    previewMovement,
    previewSkill,
    move,
    useSkill,
    previewUtilityAction,
    startUtilityAction,
    startSkill,
    previewReaction,
    reactToSkill,
    completeSkill,
    completeUtilityAction,
    completeAction,
    advanceMs,
    advance,
    addChargeEffect,
    reset
  });
}
