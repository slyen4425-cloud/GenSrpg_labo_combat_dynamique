import {
  withFighterEnergy,
  withFighterHp
} from "./combat-state.js";
import { effectivePreparationMs } from "./combat-timing.js";

function fighterOf(state, fighterId) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }
  return fighter;
}

function event(type, atMs, data = {}) {
  return Object.freeze({ type, atMs, ...data });
}

function spendEnergy(state, fighterId, amount) {
  const fighter = fighterOf(state, fighterId);
  return withFighterEnergy(state, fighterId, fighter.energy - amount);
}

function preparationFor(state, fighterId, command) {
  const fighter = fighterOf(state, fighterId);
  return effectivePreparationMs({
    baseMs: command.preparationMs,
    permanentPct: fighter.chargeTimeModifierPct,
    effects: fighter.chargeTimeEffects,
    atMs: state.elapsedMs
  });
}

export function resolveCommandStart({
  state,
  actorId,
  command
}) {
  const actor = fighterOf(state, actorId);

  if (actor.energy < command.energyCost) {
    return Object.freeze({
      ok: false,
      outcome: "insufficient_energy",
      state,
      events: Object.freeze([
        event("command-rejected", 0, {
          actorId,
          commandId: command.id,
          reason: "insufficient_energy"
        })
      ])
    });
  }

  const preparationMs = preparationFor(state, actorId, command);
  const action = Object.freeze({
    actionType: "command",
    actionId: command.id,
    actorId,
    targetId: actorId,
    command,
    preparationMs,
    travelMs: 0,
    recoveryMs: command.recoveryMs,
    releaseAtMs: preparationMs,
    impactAtMs: preparationMs,
    interruptibleDuringPreparation: command.interruptibleDuringPreparation
  });

  return Object.freeze({
    ok: true,
    outcome: "started",
    state: spendEnergy(state, actorId, command.energyCost),
    action,
    events: Object.freeze([
      event("command-start", 0, {
        actorId,
        commandId: command.id,
        kind: command.kind,
        preparationMs
      })
    ])
  });
}

export function resolveCommandCompletion({
  state,
  action
}) {
  if (action.actionType !== "command") {
    throw new TypeError("action must be a command action");
  }

  const { actorId, command, impactAtMs, recoveryMs } = action;
  let nextState = state;

  if (command.effect.heal > 0) {
    const fighter = fighterOf(nextState, actorId);
    nextState = withFighterHp(
      nextState,
      actorId,
      fighter.hp + command.effect.heal
    );
  }

  const events = [
    event("command-release", impactAtMs, {
      actorId,
      commandId: command.id,
      kind: command.kind
    }),
    event("command-complete", impactAtMs, {
      actorId,
      commandId: command.id,
      kind: command.kind,
      itemId: command.effect.itemId,
      summonCreatureId: command.effect.summonCreatureId,
      heal: command.effect.heal
    }),
    event("command-recovery-complete", impactAtMs + recoveryMs, {
      actorId,
      commandId: command.id
    })
  ];

  return Object.freeze({
    ok: true,
    actionType: "command",
    outcome: "completed",
    commandId: command.id,
    commandKind: command.kind,
    state: nextState,
    events: Object.freeze(events)
  });
}
