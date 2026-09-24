import {
  withFighterHp,
  withFighterPresence
} from "./combat-state.js";
import {
  resolveTimedActionInterruption,
  resolveTimedActionStart
} from "./timed-action-resolver.js";

function fighterOf(state, fighterId) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }
  return fighter;
}

export function resolveUtilityActionStart({
  state,
  actorId,
  definition
}) {
  const actor = fighterOf(state, actorId);

  if (definition.kind === "item" && actor.presence !== "active") {
    return Object.freeze({
      ok: false,
      outcome: "actor_not_active",
      state
    });
  }

  if (definition.kind === "recall" && actor.presence !== "active") {
    return Object.freeze({
      ok: false,
      outcome: "actor_not_active",
      state
    });
  }

  if (definition.kind === "summon") {
    if (actor.presence !== "recalled") {
      return Object.freeze({
        ok: false,
        outcome: "recall_required",
        state
      });
    }

    const reserve = fighterOf(state, definition.effect.summonFighterId);
    if (reserve.side !== actor.side || reserve.presence !== "reserve") {
      return Object.freeze({
        ok: false,
        outcome: "reserve_unavailable",
        state
      });
    }
  }

  return resolveTimedActionStart({
    state,
    actorId,
    targetId: actorId,
    definition,
    travelMs: 0
  });
}

export function resolveUtilityActionCompletion({
  state,
  action,
  reaction = null
}) {
  const { definition, actorId } = action;

  if (reaction?.outcome === "interrupted") {
    const interrupted = resolveTimedActionInterruption({
      state,
      action,
      reaction
    });

    return Object.freeze({
      ...interrupted,
      events: Object.freeze([
        ...interrupted.events,
        Object.freeze({
          type: "utility-cancelled",
          atMs: reaction.readyAtMs,
          actorId,
          actionId: definition.id,
          reason: "stun"
        })
      ])
    });
  }

  let nextState = state;
  const events = [];

  if (definition.kind === "item") {
    const fighter = fighterOf(nextState, actorId);
    const hpBefore = fighter.hp;
    nextState = withFighterHp(
      nextState,
      actorId,
      fighter.hp + definition.effect.heal
    );
    const hpAfter = fighterOf(nextState, actorId).hp;

    events.push(Object.freeze({
      type: "item-used",
      atMs: action.impactAtMs,
      actorId,
      actionId: definition.id,
      heal: definition.effect.heal,
      hpBefore,
      hpAfter
    }));
  }

  if (definition.kind === "recall") {
    nextState = withFighterPresence(nextState, actorId, "recalled");
    events.push(Object.freeze({
      type: "fighter-recalled",
      atMs: action.impactAtMs,
      actorId,
      actionId: definition.id
    }));
  }

  if (definition.kind === "summon") {
    const summonedId = definition.effect.summonFighterId;
    nextState = withFighterPresence(nextState, summonedId, "active");
    events.push(Object.freeze({
      type: "fighter-summoned",
      atMs: action.impactAtMs,
      actorId,
      summonedFighterId: summonedId,
      actionId: definition.id
    }));
  }

  events.push(Object.freeze({
    type: "utility-recovery-complete",
    atMs: action.impactAtMs + action.recoveryMs,
    actorId,
    actionId: definition.id
  }));

  return Object.freeze({
    ok: true,
    outcome: definition.kind,
    state: nextState,
    events: Object.freeze(events)
  });
}
