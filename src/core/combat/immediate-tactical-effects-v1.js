import {
  withFighterEnergy,
  withFighterHp
} from "./combat-state.js";

const SUPPORTED_KINDS = new Set([
  "heal",
  "energy_restore",
  "energy_drain"
]);

const SUPPORTED_SCOPES = new Set([
  "target",
  "self"
]);

function fighterOf(state, fighterId) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(
      "Unknown fighter: " + fighterId
    );
  }
  return fighter;
}

function targetIdForScope({
  actorId,
  targetId,
  scope
}) {
  if (scope === "self") {
    return actorId;
  }
  if (scope === "target") {
    return targetId;
  }
  throw new RangeError(
    "Unsupported immediate tactical targetScope: " +
      scope
  );
}

export function unsupportedImmediateTacticalEffectV1(
  skill
) {
  const effects = Array.isArray(skill?.effects)
    ? skill.effects
    : [];

  for (const effect of effects) {
    if (!SUPPORTED_KINDS.has(effect.kind)) {
      return Object.freeze({
        kind: effect.kind,
        targetScope: effect.targetScope,
        reason: "unsupported_kind"
      });
    }
    if (!SUPPORTED_SCOPES.has(effect.targetScope)) {
      return Object.freeze({
        kind: effect.kind,
        targetScope: effect.targetScope,
        reason: "unsupported_target_scope"
      });
    }
  }

  return null;
}

export function applyImmediateTacticalEffectsV1({
  state,
  actorId,
  targetId,
  skill,
  atMs
}) {
  const unsupported =
    unsupportedImmediateTacticalEffectV1(skill);
  if (unsupported !== null) {
    throw new RangeError(
      "Unsupported tactical effect: " +
        unsupported.kind +
        " / " +
        unsupported.targetScope
    );
  }

  let nextState = state;
  const events = [];

  for (const effect of skill.effects ?? []) {
    const affectedId = targetIdForScope({
      actorId,
      targetId,
      scope: effect.targetScope
    });

    if (effect.kind === "heal") {
      const before = fighterOf(
        nextState,
        affectedId
      ).hp;
      nextState = withFighterHp(
        nextState,
        affectedId,
        before + effect.amount
      );
      const after = fighterOf(
        nextState,
        affectedId
      ).hp;
      events.push(Object.freeze({
        type: "heal",
        atMs,
        actorId: affectedId,
        sourceActorId: actorId,
        requested: effect.amount,
        applied: after - before,
        hpBefore: before,
        hpAfter: after
      }));
      continue;
    }

    const before = fighterOf(
      nextState,
      affectedId
    ).energy;

    if (effect.kind === "energy_restore") {
      nextState = withFighterEnergy(
        nextState,
        affectedId,
        before + effect.amount
      );
      const after = fighterOf(
        nextState,
        affectedId
      ).energy;
      events.push(Object.freeze({
        type: "energy-restored",
        atMs,
        actorId: affectedId,
        sourceActorId: actorId,
        requested: effect.amount,
        applied: after - before,
        energyBefore: before,
        energyAfter: after
      }));
      continue;
    }

    if (effect.kind === "energy_drain") {
      nextState = withFighterEnergy(
        nextState,
        affectedId,
        before - effect.amount
      );
      const after = fighterOf(
        nextState,
        affectedId
      ).energy;
      events.push(Object.freeze({
        type: "energy-drained",
        atMs,
        actorId: affectedId,
        sourceActorId: actorId,
        requested: effect.amount,
        applied: before - after,
        energyBefore: before,
        energyAfter: after
      }));
    }
  }

  return Object.freeze({
    state: nextState,
    events: Object.freeze(events)
  });
}
