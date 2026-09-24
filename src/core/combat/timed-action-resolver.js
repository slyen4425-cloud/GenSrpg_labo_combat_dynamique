import { effectivePreparationMs } from "./combat-timing.js";
import { withFighterEnergy } from "./combat-state.js";

function fighterOf(state, fighterId) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }
  return fighter;
}

export function effectiveActionPreparationMs({
  state,
  actorId,
  baseMs
}) {
  const fighter = fighterOf(state, actorId);
  return effectivePreparationMs({
    baseMs,
    permanentPct: fighter.chargeTimeModifierPct,
    effects: fighter.chargeTimeEffects,
    atMs: state.elapsedMs
  });
}

export function resolveTimedActionStart({
  state,
  actorId,
  targetId = null,
  definition,
  travelMs = 0
}) {
  const actor = fighterOf(state, actorId);

  if (actor.energy < definition.energyCost) {
    return Object.freeze({
      ok: false,
      outcome: "insufficient_energy",
      state
    });
  }

  const preparationMs = effectiveActionPreparationMs({
    state,
    actorId,
    baseMs: definition.preparationMs
  });

  const nextState = withFighterEnergy(
    state,
    actorId,
    actor.energy - definition.energyCost
  );

  return Object.freeze({
    ok: true,
    outcome: "started",
    state: nextState,
    action: Object.freeze({
      id: definition.id,
      name: definition.name,
      kind: definition.kind,
      actorId,
      targetId,
      definition,
      preparationMs,
      travelMs,
      recoveryMs: definition.recoveryMs,
      releaseAtMs: preparationMs,
      impactAtMs: preparationMs + travelMs
    })
  });
}
