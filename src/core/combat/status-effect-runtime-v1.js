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
import { applyImmediateTacticalEffectsV1 } from "./immediate-tactical-effects-v1.js";
import { isCaptureMarkerStatusV1, CAPTURE_MARKER_ID_PREFIX_V1 } from "../../contracts/capture-marker-v1.js";

// Status IDs are authored locally to each skill (often "status-1").
 // The runtime identity is therefore (sourceSkillId, definition.id), not id alone.
function sameStatusSourceV1(entry, statusId, sourceSkillId, definition = null) {
  if (entry.definition.id !== statusId) return false;
  // Shared markers are keyed by their canonical library ID across skills.
  // Keep the *actual* last casting skill for feedback and attribution.
  if (isCaptureMarkerStatusV1(entry) &&
      statusId.startsWith(CAPTURE_MARKER_ID_PREFIX_V1)) {
    return definition === null || isCaptureMarkerStatusV1({definition});
  }
  if ((entry.sourceSkillId ?? null) === (sourceSkillId ?? null)) return true;
  // Preserve established cross-skill stacking/refresh for truly identical
  // authored status definitions; distinct kinds/settings must never collide.
  return definition !== null &&
    JSON.stringify(entry.definition) === JSON.stringify(definition);
}

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
      sameStatusSourceV1(entry, instance.definition.id, instance.sourceSkillId, instance.definition)
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
  statusId,
  sourceSkillId = null
) {
  const fighter = fighterOf(state, fighterId);
  return withFighterStatusEffects(
    state,
    fighterId,
    fighter.statusEffects.filter(
      (entry) => !sameStatusSourceV1(entry,statusId,sourceSkillId)
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

function resolveStackThresholdV1({ state, status, sourceActorId, targetActorId, sourceSkillId, atMs, eventAtMs, hitsIntangible, before, after, thresholdDepth, onThresholdEvents }) {
  const trigger = status.onStackThreshold;
  if (!trigger || !(before < trigger.count && after >= trigger.count)) return state;
  if (thresholdDepth >= 8) throw new RangeError("Stack threshold recursion limit reached");
  const consumed = trigger.consume === "reset"
    ? removeInstanceById(state, targetActorId, status.id, sourceSkillId)
    : state;
  const resolved = applyImmediateTacticalEffectsV1({
    state: consumed,
    actorId: sourceActorId,
    targetId: targetActorId,
    skill: { id: sourceSkillId ?? status.id, effects: trigger.effects, hitsIntangible },
    atMs: eventAtMs,
    combatAtMs: atMs,
    thresholdDepth: thresholdDepth + 1
  });
  if (typeof onThresholdEvents === "function") onThresholdEvents(resolved.events);
  return resolved.state;
}

export function applyStatusEffectV1({
  state,
  targetActorId,
  sourceActorId,
  sourceSkillId = null,
  status,
  atMs = state.elapsedMs,
  hitsIntangible = false,
  thresholdDepth = 0,
  eventAtMs = atMs,
  onThresholdEvents = null
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
        atMs: now,
        hitsIntangible
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
        sameStatusSourceV1(entry, status.id, sourceSkillId, status)
    ) ?? null;

  if (isCaptureMarkerStatusV1({definition: status}) && existing !== null &&
      JSON.stringify(existing.definition) !== JSON.stringify(status)) {
    throw new RangeError("Conflicting marker definition: " + status.id);
  }

  if (
    existing === null ||
    status.stacking === "replace"
  ) {
    const applied = replaceInstance(
      state,
      targetActorId,
      createStatusEffectRuntimeInstanceV1({
        definition: status,
        sourceActorId,
        sourceSkillId,
        hitsIntangible,
        appliedAtMs: now
      })
    );
    return resolveStackThresholdV1({ state: applied, status, sourceActorId, targetActorId,
      sourceSkillId, atMs: now, eventAtMs, hitsIntangible, before: 0, after: 1,
      thresholdDepth, onThresholdEvents });
  }

  if (status.stacking === "refresh") {
    const refreshed = Object.freeze({
      ...existing,
      ...refreshedLifetime(existing, now),
      sourceActorId,
      sourceSkillId,
      hitsIntangible
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
    hitsIntangible,
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

  const applied = replaceInstance(state, targetActorId, stacked);
  return resolveStackThresholdV1({state: applied, status, sourceActorId, targetActorId,
    sourceSkillId, atMs: now, eventAtMs, hitsIntangible, before: existing.stacks,
    after: nextStacks, thresholdDepth, onThresholdEvents });
}

// Consume only shared marker counters. Buffs, debuffs, ordinary stack counters,
// shields and immunity statuses are untouched. No threshold callback runs on
// removal: thresholds belong strictly to placing/stacking, never consuming.
export function consumeCaptureMarkerStacksV1({
  state,
  targetActorId,
  markerId = "*",
  count = "all",
  minimum = 1,
  atMs = state.elapsedMs
}) {
  const fighter = fighterOf(state, targetActorId);
  if (markerId !== "*" &&
      (typeof markerId !== "string" || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(markerId))) {
    throw new RangeError("Invalid marker ID");
  }
  if (count !== "all" && (!Number.isInteger(count) || count < 1)) {
    throw new RangeError("count must be 'all' or a positive integer");
  }
  if (!Number.isInteger(minimum) || minimum < 1 ||
      (count !== "all" && minimum > count)) {
    throw new RangeError("minimum must be positive and not exceed count");
  }
  const eligible = fighter.statusEffects.filter(item =>
    isCaptureMarkerStatusV1(item) &&
    isStatusEffectRuntimeInstanceActiveV1(item, atMs) &&
    (markerId === "*" || item.definition.id === CAPTURE_MARKER_ID_PREFIX_V1 + markerId)
  ).sort((a, b) => a.definition.id.localeCompare(b.definition.id));
  const total = eligible.reduce((sum, entry) => sum + entry.stacks, 0);
  if (total < minimum) {
    return Object.freeze({state, consumed: 0, available: total, removed: Object.freeze([])});
  }
  let remaining = count === "all" ? total : Math.min(total, count);
  const applied = new Map();
  const removed = [];
  for (const entry of eligible) {
    if (remaining === 0) break;
    const taken = Math.min(entry.stacks, remaining);
    remaining -= taken;
    applied.set(entry, taken);
    removed.push(Object.freeze({id:entry.definition.id.slice(CAPTURE_MARKER_ID_PREFIX_V1.length), count:taken}));
  }
  const next = fighter.statusEffects.flatMap(entry => {
    const spent = applied.get(entry) ?? 0;
    if (spent === 0) return [entry];
    if (spent === entry.stacks) return [];
    return [Object.freeze({...entry, stacks:entry.stacks - spent})];
  });
  return Object.freeze({
    state: withFighterStatusEffects(state, targetActorId, next),
    consumed: removed.reduce((sum, entry) => sum + entry.count, 0),
    available: total,
    removed: Object.freeze(removed)
  });
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
  sourceSkillId,
  nextTickAtMs
) {
  const fighter = fighterOf(state, fighterId);
  const statuses = fighter.statusEffects.map(
    (instance) =>
      sameStatusSourceV1(instance,statusId,sourceSkillId)
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
  sourceSkillId,
  remainingActionEnds
) {
  if (remainingActionEnds <= 0) {
    return removeInstanceById(
      state,
      fighterId,
      statusId,
      sourceSkillId
    );
  }

  const fighter = fighterOf(state, fighterId);
  const statuses = fighter.statusEffects.map(
    (instance) =>
      sameStatusSourceV1(instance,statusId,sourceSkillId)
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
      atMs,
      hitsIntangible: instance.hitsIntangible === true,
      incomingKind: "dot"
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
    atMs,
    hitsIntangible: instance.hitsIntangible === true,
    incomingKind: "dot"
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
        (instance) => ({id:instance.definition.id,sourceSkillId:instance.sourceSkillId})
      );

  for (const {id:statusId, sourceSkillId} of statusIds) {
    let instance =
      fighterOf(
        nextState,
        fighterId
      ).statusEffects.find(
        (entry) =>
          sameStatusSourceV1(entry,statusId,sourceSkillId)
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
          sameStatusSourceV1(entry,statusId,sourceSkillId)
      );

    if (!instance) {
      continue;
    }

    nextState = updateRemainingActionEnds(
      nextState,
      fighterId,
      statusId,
      sourceSkillId,
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
          (instance) => ({id:instance.definition.id,sourceSkillId:instance.sourceSkillId})
        );

    for (const {id:statusId, sourceSkillId} of statusIds) {
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
              sameStatusSourceV1(entry,statusId,sourceSkillId)
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
          sourceSkillId,
          nextTickAtMs
        );
        instance =
          fighterOf(
            nextState,
            fighterId
          ).statusEffects.find(
            (entry) =>
              sameStatusSourceV1(entry,statusId,sourceSkillId)
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
