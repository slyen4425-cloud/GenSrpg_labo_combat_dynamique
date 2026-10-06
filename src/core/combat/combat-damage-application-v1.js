import {
  recordFighterDamage,
  recordFighterKnockout,
  withFighterHp,
  withFighterStatusEffects
} from "./combat-state.js";
import {
  isStatusEffectRuntimeInstanceActiveV1
} from "./status-effect-instance-v1.js";
import {
  combatProtectionForIncomingV1
} from "./combat-protection-v1.js";

function fighterOf(state, fighterId) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(
      "Unknown fighter: " + fighterId
    );
  }
  return fighter;
}

function activeShield(instance, atMs) {
  return (
    instance.definition.kind === "shield" &&
    isStatusEffectRuntimeInstanceActiveV1(
      instance,
      atMs
    ) &&
    Number(instance.shieldRemaining) > 0
  );
}

export function applyCombatDamageV1({
  state,
  sourceActorId,
  targetActorId,
  damage,
  atMs = state.elapsedMs
}) {
  const requested = Math.max(
    0,
    Number(damage) || 0
  );
  const time = Number(atMs);
  if (!Number.isFinite(time) || time < 0) {
    throw new RangeError(
      "atMs must be a non-negative finite number"
    );
  }

  let nextState = state;
  let remaining = requested;
  let absorbedByShield = 0;

  const target = fighterOf(
    nextState,
    targetActorId
  );
  const protection =
    combatProtectionForIncomingV1({
      state: nextState,
      targetActorId,
      domain: "damage",
      atMs: time
    });

  if (protection.protected) {
    return Object.freeze({
      state: nextState,
      requestedDamage: requested,
      absorbedByShield: 0,
      immuneDamage: requested,
      appliedDamage: 0,
      hpBefore: target.hp,
      hpAfter: target.hp,
      protectingStatusIds:
        protection.protectingStatusIds
    });
  }
  const statuses = [
    ...(target.statusEffects ?? [])
  ];

  for (
    let index = 0;
    index < statuses.length &&
    remaining > 0;
    index += 1
  ) {
    const instance = statuses[index];
    if (!activeShield(instance, time)) {
      continue;
    }

    const available =
      Number(instance.shieldRemaining) || 0;
    const absorbed = Math.min(
      available,
      remaining
    );
    remaining -= absorbed;
    absorbedByShield += absorbed;

    statuses[index] = Object.freeze({
      ...instance,
      shieldRemaining:
        available - absorbed
    });
  }

  if (absorbedByShield > 0) {
    nextState = withFighterStatusEffects(
      nextState,
      targetActorId,
      statuses
    );
  }

  const hpBefore =
    fighterOf(nextState, targetActorId).hp;
  nextState = withFighterHp(
    nextState,
    targetActorId,
    hpBefore - remaining
  );
  const hpAfter =
    fighterOf(nextState, targetActorId).hp;
  const appliedDamage = hpBefore - hpAfter;

  nextState = recordFighterDamage(
    nextState,
    {
      sourceActorId,
      targetActorId,
      amount: appliedDamage
    }
  );

  if (
    hpBefore > 0 &&
    hpAfter === 0 &&
    sourceActorId !== targetActorId
  ) {
    nextState = recordFighterKnockout(
      nextState,
      sourceActorId,
      targetActorId
    );
  }

  return Object.freeze({
    state: nextState,
    requestedDamage: requested,
    absorbedByShield,
    immuneDamage: 0,
    appliedDamage,
    hpBefore,
    hpAfter
  });
}
