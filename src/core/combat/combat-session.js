import { createCombatState, regenerateEnergy } from "./combat-state.js";
import { resolveMovement, resolveSkill } from "./action-resolver.js";

export function createCombatSession({
  distance = "medium",
  fighters
}) {
  let state = createCombatState({ distance, fighters });

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

  function useSkill({ actorId, targetId, skill, reactionSkill = null }) {
    const result = resolveSkill({
      state,
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

  return Object.freeze({
    snapshot,
    previewMovement,
    move,
    useSkill,
    advance
  });
}
