import { effectivePreparationMs } from "./combat-timing.js";
import { withFighterEnergy, withFighterHp } from "./combat-state.js";

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


export function resolveTimedActionInterruption({
  state,
  action,
  reaction
}) {
  if (!reaction || reaction.outcome !== "interrupted") {
    throw new TypeError("an interrupted reaction is required");
  }

  const actor = fighterOf(state, action.actorId);
  const damage = Math.max(
    0,
    Number(reaction.skill?.effect?.damage) || 0
  );
  const nextState = withFighterHp(
    state,
    action.actorId,
    actor.hp - damage
  );
  const hpAfter = fighterOf(nextState, action.actorId).hp;

  return Object.freeze({
    ok: true,
    outcome: "interrupted",
    state: nextState,
    events: Object.freeze([
      Object.freeze({
        type: "action-interrupted",
        atMs: reaction.readyAtMs,
        actorId: action.actorId,
        actionId: action.id,
        sourceActorId: reaction.actorId,
        sourceSkillId: reaction.skillId,
        reason: "stun"
      }),
      Object.freeze({
        type: "hit",
        atMs: reaction.readyAtMs,
        actorId: action.actorId,
        sourceActorId: reaction.actorId,
        skillId: reaction.skillId,
        damage,
        hpBefore: actor.hp,
        hpAfter,
        tags: reaction.skill?.effect?.tags ?? []
      })
    ])
  });
}
