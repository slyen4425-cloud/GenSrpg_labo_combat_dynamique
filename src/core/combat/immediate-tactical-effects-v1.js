import {
  recordFighterDamage,
  withFighterEnergy,
  withFighterHp
} from "./combat-state.js";
import {
  computeCombatDamageV1
} from "./combat-damage-v1.js";
import {
  resolveTacticalEffectTargetIdsV1
} from "./tactical-effect-targeting-v1.js";

const SUPPORTED_KINDS = new Set([
  "damage",
  "heal",
  "energy_restore",
  "energy_drain"
]);

const MULTI_TARGET_SCOPES = new Set([
  "all_enemies",
  "all_allies",
  "all_except_self"
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

export function unsupportedImmediateTacticalEffectV1(
  skill,
  {
    battleFormat = null
  } = {}
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

    if (
      MULTI_TARGET_SCOPES.has(
        effect.targetScope
      ) &&
      (
        !battleFormat ||
        typeof battleFormat.teamOf !== "function"
      )
    ) {
      return Object.freeze({
        kind: effect.kind,
        targetScope: effect.targetScope,
        reason: "missing_battle_format"
      });
    }
  }

  return null;
}

function applyDamageEffect({
  state,
  actorId,
  affectedId,
  skill,
  effect,
  atMs
}) {
  const damage = computeCombatDamageV1({
    state,
    attackerId: actorId,
    targetId: affectedId,
    baseDamage: effect.amount,
    channel:
      effect.channel ??
      skill.element ??
      "physical"
  });
  const before =
    fighterOf(state, affectedId).hp;
  let nextState = withFighterHp(
    state,
    affectedId,
    before - damage.damage
  );
  const after =
    fighterOf(nextState, affectedId).hp;
  const actualDamage = before - after;

  nextState = recordFighterDamage(
    nextState,
    {
      sourceActorId: actorId,
      targetActorId: affectedId,
      amount: actualDamage
    }
  );

  return Object.freeze({
    state: nextState,
    event: Object.freeze({
      type: "hit",
      atMs,
      actorId: affectedId,
      sourceActorId: actorId,
      skillId: skill.id,
      tacticalEffect: true,
      baseDamage: damage.baseDamage,
      damageChannel:
        damage.damageChannel,
      damageBonusPct:
        damage.damageBonusPct,
      resistancePct:
        damage.resistancePct,
      damage: damage.damage,
      hpBefore: before,
      hpAfter: after
    })
  });
}

export function applyImmediateTacticalEffectsV1({
  state,
  actorId,
  targetId,
  skill,
  atMs,
  battleFormat = null
}) {
  const unsupported =
    unsupportedImmediateTacticalEffectV1(
      skill,
      { battleFormat }
    );
  if (unsupported !== null) {
    throw new RangeError(
      "Unsupported tactical effect: " +
        unsupported.kind +
        " / " +
        unsupported.targetScope +
        " / " +
        unsupported.reason
    );
  }

  let nextState = state;
  const events = [];

  for (const effect of skill.effects ?? []) {
    const affectedIds =
      resolveTacticalEffectTargetIdsV1({
        format: battleFormat,
        state: nextState,
        actorId,
        targetId,
        targetScope: effect.targetScope
      });

    for (const affectedId of affectedIds) {
      if (effect.kind === "damage") {
        const applied = applyDamageEffect({
          state: nextState,
          actorId,
          affectedId,
          skill,
          effect,
          atMs
        });
        nextState = applied.state;
        events.push(applied.event);
        continue;
      }

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
          skillId: skill.id,
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
          skillId: skill.id,
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
          skillId: skill.id,
          requested: effect.amount,
          applied: before - after,
          energyBefore: before,
          energyAfter: after
        }));
      }
    }
  }

  return Object.freeze({
    state: nextState,
    events: Object.freeze(events)
  });
}
