import { createCombatState, regenerateEnergy } from "./combat-state.js";
import { resolveMovement, resolveSkill } from "./action-resolver.js";

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

  function advance(seconds) {
    state = regenerateEnergy(state, seconds);
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
    move,
    useSkill,
    advance,
    reset
  });
}
