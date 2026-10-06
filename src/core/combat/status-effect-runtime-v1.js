import {
  withFighterHp,
  withFighterStatusEffects
} from "./combat-state.js";
import {
  computeCombatDamageV1
} from "./combat-damage-v1.js";
import {
  applyCombatDamageV1
} from "./combat-damage-application-v1.js";
import {
  createStatusEffectRuntimeInstanceV1,
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

function replaceInstance(
  state,
  fighterId,
  instance
) {
  const fighter = fighterOf(state, fighterId);
  const statuses = [
    ...(fighter.statusEffects ?? [])
  ];
  const index = statuses.findIndex(
    (entry) =>
      entry.definition.id ===
      instance.definition.id
  );

  if (index < 0) {
    statuses.push(instance);
  } else {
    statuses[index] = instance;
  }

  return withFighterStatusEffects(
    state,
    fighterId,
    statuses
  );
}

function removeInstanceById(
  state,
  fighterId,
  statusId
) {
  const fighter = fighterOf(state, fighterId);
  return withFighterStatusEffects(
    state,
    fighterId,
    fighter.statusEffects.filter(
      (entry) =>
        entry.definition.id !== statusId
    )
  );
}

export function activeStatusEffectsV1(
  state,
  fighterId,
  atMs = state.elapsedMs
) {
  const fighter = fighterOf(state, fighterId);
  return Object.freeze(
    fighter.statusEffects.filter(
      (instance) =>
        isStatusEffectRuntimeInstanceActiveV1(
          instance,
          atMs
        )
    )
  );
}

// A reserve is outside the active combat clock: expire by absolute time,
// but do not replay damage/heal ticks that were missed while it was absent.
export function resumeStatusEffectsV1(statusEffects, atMs) {
  return Object.freeze(statusEffects.filter(instance => isStatusEffectRuntimeInstanceActiveV1(instance, atMs)).map(instance => {
    if (instance.nextTickAtMs == null || instance.nextTickAtMs > atMs) return instance;
    const interval = instance.definition.tickIntervalMs;
    return Object.freeze({ ...instance, nextTickAtMs: instance.nextTickAtMs
      + (Math.floor((atMs - instance.nextTickAtMs) / interval) + 1) * interval });
  }));
}

export function hasActiveStatusKindV1(
  state,
  fighterId,
  kind,
  atMs = state.elapsedMs
) {
  return activeStatusEffectsV1(
    state,
    fighterId,
    atMs
  ).some(
    (instance) =>
      instance.definition.kind === kind
  );
}

export function activeTauntSourceActorIdV1(
  state,
  fighterId,
  atMs = state.elapsedMs
) {
  const taunts = activeStatusEffectsV1(
    state,
    fighterId,
    atMs
  ).filter(
    (instance) =>
      instance.definition.kind === "taunt"
  );

  for (
    let index = taunts.length - 1;
    index >= 0;
    index -= 1
  ) {
    const sourceActorId =
      taunts[index].sourceActorId;
    if (
      Number(
        state.fighters[sourceActorId]?.hp
      ) > 0
    ) {
      return sourceActorId;
    }
  }

  return null;
}

export function validateStatusEffectForTargetV1({
  state,
  targetActorId,
  status
}) {
  const target = fighterOf(
    state,
    targetActorId
  );

  if (
    status.kind === "stat_modifier" &&
    !target.statEffectRulesById?.[
      status.statId
    ]
  ) {
    return Object.freeze({
      ok: false,
      outcome: "unsupported_status_stat",
      statId: status.statId
    });
  }

  if (
    status.kind === "stat_modifier" &&
    status.modifierMode === "percent" &&
    !Object.prototype.hasOwnProperty.call(
      target.statValuesById ?? {},
      status.statId
    )
  ) {
    return Object.freeze({
      ok: false,
      outcome: "unsupported_status_stat_value",
      statId: status.statId
    });
  }

  return Object.freeze({
    ok: true
  });
}

function refreshedLifetime(existing, now) {
  if (
    existing.definition.durationModel ===
    "owner_action_end"
  ) {
    return {
      expiresAtMs: null,
      remainingActionEnds:
        existing.definition.durationActions
    };
  }

  return {
    expiresAtMs:
      now + existing.definition.durationMs,
    remainingActionEnds: null
  };
}

export function applyStatusEffectV1({
  state,
  targetActorId,
  sourceActorId,
  sourceSkillId = null,
  status,
  atMs = state.elapsedMs
}) {
  const validation =
    validateStatusEffectForTargetV1({
      state,
      targetActorId,
      status
    });

  if (!validation.ok) {
    throw new RangeError(
      "Unsupported status statId: " +
        validation.statId
    );
  }

  const now = Number(atMs);
  if (!Number.isFinite(now) || now < 0) {
    throw new RangeError(
      "atMs must be a non-negative finite number"
    );
  }

  if (status.polarity === "detrimental") {
    const protection =
      combatProtectionForIncomingV1({
        state,
        targetActorId,
        domain: "negative_status",
        atMs: now
      });
    if (protection.protected) {
      return state;
    }
  }

  const target = fighterOf(
    state,
    targetActorId
  );
  const existing =
    target.statusEffects.find(
      (entry) =>
        entry.definition.id === status.id
    ) ?? null;

  if (
    existing === null ||
    status.stacking === "replace"
  ) {
    return replaceInstance(
      state,
      targetActorId,
      createStatusEffectRuntimeInstanceV1({
        definition: status,
        sourceActorId,
        sourceSkillId,
        appliedAtMs: now
      })
    );
  }

  if (status.stacking === "refresh") {
    const refreshed = Object.freeze({
      ...existing,
      ...refreshedLifetime(existing, now),
      sourceActorId,
      sourceSkillId
    });
    return replaceInstance(
      state,
      targetActorId,
      refreshed
    );
  }

  const nextStacks = Math.min(
    existing.definition.maxStacks,
    existing.stacks + 1
  );
  const addedStack =
    nextStacks - existing.stacks;
  const stacked = Object.freeze({
    ...existing,
    ...refreshedLifetime(existing, now),
    sourceActorId,
    sourceSkillId,
    stacks: nextStacks,
    shieldRemaining:
      existing.definition.kind === "shield"
        ? (
            Number(
              existing.shieldRemaining
            ) || 0
          ) +
          existing.definition.amount *
            addedStack
        : existing.shieldRemaining
  });

  return replaceInstance(
    state,
    targetActorId,
    stacked
  );
}

function tagsMatch(definition, tags) {
  if (tags.length === 0) {
    return true;
  }
  return definition.tags.some(
    (tag) => tags.includes(tag)
  );
}

export function removeStatusEffectsV1({
  state,
  targetActorId,
  polarity,
  statusTags = []
}) {
  const target = fighterOf(
    state,
    targetActorId
  );
  const tags = Array.isArray(statusTags)
    ? statusTags
    : [];

  return withFighterStatusEffects(
    state,
    targetActorId,
    target.statusEffects.filter(
      (instance) =>
        !(
          instance.definition.polarity ===
            polarity &&
          tagsMatch(
            instance.definition,
            tags
          )
        )
    )
  );
}

function updateTickSchedule(
  state,
  fighterId,
  statusId,
  nextTickAtMs
) {
  const fighter = fighterOf(state, fighterId);
  const statuses = fighter.statusEffects.map(
    (instance) =>
      instance.definition.id === statusId
        ? Object.freeze({
            ...instance,
            nextTickAtMs
          })
        : instance
  );
  return withFighterStatusEffects(
    state,
    fighterId,
    statuses
  );
}

function updateRemainingActionEnds(
  state,
  fighterId,
  statusId,
  remainingActionEnds
) {
  if (remainingActionEnds <= 0) {
    return removeInstanceById(
      state,
      fighterId,
      statusId
    );
  }

  const fighter = fighterOf(state, fighterId);
  const statuses = fighter.statusEffects.map(
    (instance) =>
      instance.definition.id === statusId
        ? Object.freeze({
            ...instance,
            remainingActionEnds
          })
        : instance
  );

  return withFighterStatusEffects(
    state,
    fighterId,
    statuses
  );
}

function applyHotTick({
  state,
  targetActorId,
  amount
}) {
  const before =
    fighterOf(state, targetActorId).hp;
  const nextState = withFighterHp(
    state,
    targetActorId,
    before + amount
  );
  const after =
    fighterOf(nextState, targetActorId).hp;

  return Object.freeze({
    state: nextState,
    applied: after - before
  });
}

function applyDotTick({
  state,
  fighterId,
  instance,
  amount,
  atMs
}) {
  if (
    instance.definition.damageMode ===
    "fixed"
  ) {
    return applyCombatDamageV1({
      state,
      sourceActorId:
        instance.sourceActorId,
      targetActorId: fighterId,
      damage: amount,
      atMs
    }).state;
  }

  const damage =
    computeCombatDamageV1({
      state,
      attackerId:
        instance.sourceActorId,
      targetId: fighterId,
      baseDamage: amount,
      channel:
        instance.definition.channel,
      atMs
    });

  return applyCombatDamageV1({
    state,
    sourceActorId:
      instance.sourceActorId,
    targetActorId: fighterId,
    damage: damage.damage,
    atMs
  }).state;
}

export function advanceStatusEffectsOnOwnerActionEndV1({
  state,
  fighterId
}) {
  fighterOf(state, fighterId);

  let nextState = state;
  const statusIds =
    state.fighters[
      fighterId
    ].statusEffects
      .filter(
        (instance) =>
          instance.definition.durationModel ===
          "owner_action_end"
      )
      .map(
        (instance) =>
          instance.definition.id
      );

  for (const statusId of statusIds) {
    let instance =
      fighterOf(
        nextState,
        fighterId
      ).statusEffects.find(
        (entry) =>
          entry.definition.id === statusId
      );

    if (
      !instance ||
      Number(instance.remainingActionEnds) <= 0
    ) {
      continue;
    }

    const amount =
      (
        instance.definition.amount ??
        0
      ) * instance.stacks;

    if (
      instance.definition.kind ===
      "damage_over_time"
    ) {
      nextState = applyDotTick({
        state: nextState,
        fighterId,
        instance,
        amount,
        atMs: nextState.elapsedMs
      });
    } else if (
      instance.definition.kind ===
      "heal_over_time"
    ) {
      nextState = applyHotTick({
        state: nextState,
        targetActorId: fighterId,
        amount
      }).state;
    }

    instance =
      fighterOf(
        nextState,
        fighterId
      ).statusEffects.find(
        (entry) =>
          entry.definition.id === statusId
      );

    if (!instance) {
      continue;
    }

    nextState = updateRemainingActionEnds(
      nextState,
      fighterId,
      statusId,
      instance.remainingActionEnds - 1
    );
  }

  return nextState;
}

export function advanceStatusEffectsV1({
  state,
  deltaMs
}) {
  const delta = Number(deltaMs);
  if (!Number.isFinite(delta) || delta < 0) {
    throw new RangeError(
      "deltaMs must be a non-negative finite number"
    );
  }
  if (delta === 0) {
    return state;
  }

  const endMs = state.elapsedMs + delta;
  let nextState = state;

  for (
    const fighterId of
    Object.keys(state.fighters)
  ) {
    const statusIds =
      state.fighters[
        fighterId
      ].statusEffects
        .filter(
          (instance) =>
            instance.definition.durationModel ===
            "time_ms"
        )
        .map(
          (instance) =>
            instance.definition.id
        );

    for (const statusId of statusIds) {
      let instance =
        fighterOf(
          nextState,
          fighterId
        ).statusEffects.find(
          (entry) =>
            entry.definition.id ===
            statusId
        );

      while (
        instance &&
        instance.nextTickAtMs !== null &&
        instance.nextTickAtMs <= endMs &&
        instance.nextTickAtMs <=
          instance.expiresAtMs
      ) {
        const tickAt =
          instance.nextTickAtMs;
        const amount =
          (
            instance.definition.amount ??
            0
          ) * instance.stacks;

        if (
          instance.definition.kind ===
          "damage_over_time"
        ) {
          nextState = applyDotTick({
            state: nextState,
            fighterId,
            instance,
            amount,
            atMs: tickAt
          });
        } else if (
          instance.definition.kind ===
          "heal_over_time"
        ) {
          nextState = applyHotTick({
            state: nextState,
            targetActorId: fighterId,
            amount
          }).state;
        }

        instance =
          fighterOf(
            nextState,
            fighterId
          ).statusEffects.find(
            (entry) =>
              entry.definition.id ===
              statusId
          );

        if (!instance) {
          break;
        }

        const nextTickAtMs =
          tickAt +
          instance.definition.tickIntervalMs;
        nextState = updateTickSchedule(
          nextState,
          fighterId,
          statusId,
          nextTickAtMs
        );
        instance =
          fighterOf(
            nextState,
            fighterId
          ).statusEffects.find(
            (entry) =>
              entry.definition.id ===
              statusId
          );
      }
    }
  }

  for (
    const fighterId of
    Object.keys(nextState.fighters)
  ) {
    const fighter = fighterOf(
      nextState,
      fighterId
    );
    const kept = fighter.statusEffects.filter(
      (instance) =>
        instance.definition.durationModel !==
          "time_ms" ||
        instance.expiresAtMs > endMs
    );
    if (
      kept.length !==
      fighter.statusEffects.length
    ) {
      nextState =
        withFighterStatusEffects(
          nextState,
          fighterId,
          kept
        );
    }
  }

  return nextState;
}
