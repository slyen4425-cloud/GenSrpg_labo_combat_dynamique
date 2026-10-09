import {
  withPersistentZones,
  withFighterStatusEffects
} from "./combat-state.js";
import { visiblePersistentZoneRelationV1 } from "../../contracts/persistent-zone-spatial-v1.js";
import {
  computeCombatDamageV1
} from "./combat-damage-v1.js";
import {
  applyCombatDamageV1
} from "./combat-damage-application-v1.js";
import {
  resolveTacticalEffectTargetIdsV1
} from "./tactical-effect-targeting-v1.js";
import { applyStatusEffectV1, validateStatusEffectForTargetV1 } from "./status-effect-runtime-v1.js";
import { isStatusEffectRuntimeInstanceActiveV1 } from "./status-effect-instance-v1.js";

const DISTANCE_ORDER = Object.freeze([
  "short",
  "medium",
  "long"
]);

// Zone binding ids are native status ids with a reserved collision-resistant
// namespace. Neither author-created statuses nor other zones are removed.
function zoneStatusIdV1(zone) {
  return (isBoundStatusZoneV1(zone) ? "__zone_bound_status__:" : "__zone_entry_status__:") +
    encodeURIComponent(zone.id) + ":" + encodeURIComponent(zone.tickEffect.status.id);
}
function isBoundStatusZoneV1(zone) {
  return zone?.tickEffect?.kind === "apply_status" &&
    zone.statusBehavior === "while_inside";
}
function stripZoneBoundStatusV1(state, zone, targetIds = Object.keys(state.fighters)) {
  if (!isBoundStatusZoneV1(zone)) return state;
  const id = zoneStatusIdV1(zone);
  let result = state;
  for (const actorId of targetIds) {
    const fighter = result.fighters[actorId];
    if (!fighter?.statusEffects?.some(entry => entry.definition.id === id)) continue;
    result = withFighterStatusEffects(result, actorId,
      fighter.statusEffects.filter(entry => entry.definition.id !== id));
  }
  return result;
}

// A reserved roster snapshot must not revive a removed area buff on re-summon.
export function removeInheritedZoneBoundStatusesV1(state, actorId) {
  const fighter = state.fighters[actorId];
  if (!fighter?.statusEffects?.some(x => x.definition.id.startsWith("__zone_bound_status__:"))) return state;
  return withFighterStatusEffects(state, actorId,
    fighter.statusEffects.filter(x => !x.definition.id.startsWith("__zone_bound_status__:")));
}

// The roster owns member identities; a kept zone retains its original
// caster even when another member occupies the same combat slot.
export function removePersistentZonesFromActorV1(state, actorId, {departingMemberId = null} = {}) {
  const zones = state.persistentZones ?? [];
  let result = state;
  const kept = [];
  for (const zone of zones) {
    if (zone.sourceActorId !== actorId) {
      kept.push(zone);
      continue;
    }
    if (zone.persistAfterRecall === true) {
      kept.push(Object.freeze({
        ...zone,
        detachedFromSource: true,
        originRosterMemberId: zone.originRosterMemberId ?? departingMemberId
      }));
    } else {
      result = stripZoneBoundStatusV1(result, zone);
    }
  }
  return withPersistentZones(result, kept);
}

// A replacement is a new occupant even though its stable combat slot is the
// same. All zones must recompute entry after that atomic roster transition.
export function resetPersistentZoneOccupancyForSlotV1(state, actorId, {absent = false} = {}) {
  const zones = state.persistentZones ?? [];
  if (zones.length === 0) return state;
  return withPersistentZones(state, zones.map(zone => {
    const occupied = (zone.occupiedActorIds ?? []).filter(id => id !== actorId);
    const oldAbsent = zone.absentRosterSlots ?? [];
    const newAbsent = absent
      ? [...new Set([...oldAbsent, actorId])]
      : oldAbsent.filter(id => id !== actorId);
    const occupancyChanged = occupied.length !== (zone.occupiedActorIds ?? []).length;
    const absentChanged = newAbsent.length !== oldAbsent.length;
    if (!occupancyChanged && !absentChanged) return zone;
    return Object.freeze({
      ...zone,
      ...(zone.occupiedActorIds ? {occupiedActorIds: Object.freeze(occupied)} : {}),
      absentRosterSlots: Object.freeze(newAbsent)
    });
  }));
}

export function prepareZoneStatusDeparturesV1({
  state, deltaMs, battleFormat = null, zoneSpatialContext = null
}) {
  const endMs = state.elapsedMs + Number(deltaMs);
  let result = state;
  for (const zone of state.persistentZones ?? []) {
    if (!isBoundStatusZoneV1(zone)) continue;
    const current = zone.expiresAtMs > endMs
      ? affectedIdsForZone({state:result,zone,battleFormat,atMs:endMs,zoneSpatialContext})
      : [];
    const left = (zone.occupiedActorIds ?? []).filter(id => !current.includes(id));
    result = stripZoneBoundStatusV1(result, zone, left);
  }
  return result;
}

const APPROACH_ENTRY_PROGRESS =
  Object.freeze({
    short: 2 / 3,
    medium: 1 / 3,
    long: 0
  });

function distanceIndex(value) {
  const index = DISTANCE_ORDER.indexOf(value);
  if (index < 0) {
    throw new RangeError(
      "Unsupported combat distance: " + value
    );
  }
  return index;
}

function radiusFor({
  baseRadius,
  activations,
  radiusGrowthSteps
}) {
  const base = distanceIndex(baseRadius);
  const growth =
    Math.max(
      0,
      Number(radiusGrowthSteps) || 0
    ) *
    Math.max(
      0,
      Number(activations) - 1
    );

  return DISTANCE_ORDER[
    Math.min(
      DISTANCE_ORDER.length - 1,
      base + growth
    )
  ];
}

function zoneInstanceId(actorId, skillId, zoneId) {
  return String(actorId) + ":" + String(skillId) + ":" + String(zoneId);
}

// A detached zone cannot be refreshed by a different member casting the
// same skill. A new generation is created without touching the old area.
function activeZoneOwnedBySlotV1(state, actorId, skillId, zoneId) {
  return (state.persistentZones ?? []).find(zone =>
    zone.sourceActorId === actorId &&
    zone.skillId === skillId &&
    zone.zoneId === zoneId &&
    zone.detachedFromSource !== true &&
    zone.expiresAtMs > state.elapsedMs
  ) ?? null;
}
function nextZoneInstanceIdV1(state, actorId, skillId, zoneId) {
  const base = zoneInstanceId(actorId, skillId, zoneId);
  if (!(state.persistentZones ?? []).some(zone => zone.id === base)) return base;
  let generation = 2;
  while ((state.persistentZones ?? []).some(zone => zone.id === base + ":generation:" + generation)) {
    generation += 1;
  }
  return base + ":generation:" + generation;
}

// A reinforcement is chosen when the Combat Rules accept its cast, not after
// the subsequent preparation delay. Capture only the old owner's identity and
// activation count, never a second persistent-zone/tick state.
export function snapshotPersistentZoneReinforcementsV1({ state, actorId, skill }) {
  return Object.freeze(
    (skill.effects ?? [])
      .filter(effect => effect.kind === "persistent_zone" && effect.reactivation === "reinforce")
      .flatMap(effect => {
        const active = activeZoneOwnedBySlotV1(state, actorId, skill.id, effect.zoneId);
        const id = active?.id ?? null;
        return active
          ? [Object.freeze({ id, activations: active.activations, expiresAtMs: active.expiresAtMs })]
          : [];
      })
  );
}

function replaceZone(
  state,
  zone
) {
  const zones = [
    ...(state.persistentZones ?? [])
  ];
  const index = zones.findIndex(
    (entry) => entry.id === zone.id
  );

  if (index < 0) {
    zones.push(zone);
  } else {
    zones[index] = zone;
  }

  return withPersistentZones(
    state,
    zones
  );
}

function updateZoneTick(
  state,
  zoneId,
  nextTickAtMs
) {
  return withPersistentZones(
    state,
    (state.persistentZones ?? []).map(
      (zone) =>
        zone.id === zoneId
          ? Object.freeze({
              ...zone,
              nextTickAtMs
            })
          : zone
    )
  );
}

function updateZoneOccupancyV1(state, zoneId, occupiedActorIds) {
  return withPersistentZones(state, (state.persistentZones ?? []).map(zone =>
    zone.id === zoneId
      ? Object.freeze({...zone, occupiedActorIds: Object.freeze([...occupiedActorIds])})
      : zone
  ));
}

// An entry poison retains its native lifetime after leaving; a while-inside
// buff/debuff is bound to the zone and removed when occupancy ends.
function applyZoneStatusV1({state, zone, targetActorId, atMs, whileInside}) {
  const status = zone.tickEffect.status;
  const id = zoneStatusIdV1(zone);
  const existing = state.fighters[targetActorId]?.statusEffects?.find(
    entry => entry.definition.id === id
  );
  if (whileInside && existing &&
      isStatusEffectRuntimeInstanceActiveV1(existing, atMs) &&
      existing.expiresAtMs >= zone.expiresAtMs) {
    return state;
  }
  const validated = validateStatusEffectForTargetV1({
    state, targetActorId, status
  });
  // A custom game may define Defense only for a subset of creatures.
  // A zone must never crash its combat clock on an unsupported stat.
  if (!validated.ok) return state;
  const effectiveStatus = {
    ...status,
    id,
    ...(whileInside
      ? { durationMs: Math.max(status.durationMs, zone.expiresAtMs - atMs + 1),
          stacking: "refresh", maxStacks: 1 }
      : {})
  };
  return applyStatusEffectV1({
    state,
    targetActorId,
    sourceActorId: zone.sourceActorId,
    sourceSkillId: zone.skillId,
    status: effectiveStatus,
    atMs
  });
}

function updateZoneStatusOccupancyV1({
  state, zone, endMs, battleFormat, zoneSpatialContext, entryEvents
}) {
  const current = zone.expiresAtMs > endMs
    ? affectedIdsForZone({state,zone,battleFormat,atMs:endMs,zoneSpatialContext})
    : [];
  const previous = zone.occupiedActorIds ?? [];
  let result = state;
  if (zone.statusBehavior === "while_inside") {
    result = stripZoneBoundStatusV1(result, zone,
      previous.filter(id => !current.includes(id)));
    for (const targetActorId of current) {
      result = applyZoneStatusV1({
        state:result,zone,targetActorId,atMs:endMs,whileInside:true
      });
    }
  } else {
    const entrants = new Map();
    for (const event of entryEvents) {
      if (event.type === "entry") entrants.set(event.targetActorId, event.atMs);
    }
    for (const id of current) {
      if (!previous.includes(id) && !entrants.has(id)) entrants.set(id,endMs);
    }
    for (const [targetActorId, atMs] of entrants) {
      result = applyZoneStatusV1({
        state:result,zone,targetActorId,atMs,whileInside:false
      });
    }
  }
  return updateZoneOccupancyV1(result, zone.id, current);
}

function spatialModeEnabled(
  zoneSpatialContext
) {
  return (
    zoneSpatialContext?.mode ===
      "approach-bands-v1" &&
    Array.isArray(
      zoneSpatialContext.approaches
    )
  );
}

function approachFor({
  zoneSpatialContext,
  actorId,
  targetId
}) {
  if (
    !spatialModeEnabled(
      zoneSpatialContext
    )
  ) {
    return null;
  }

  return (
    zoneSpatialContext.approaches.find(
      (approach) =>
        approach.actorId === actorId &&
        approach.targetId === targetId &&
        approach.approachMode ===
          "ground"
    ) ?? null
  );
}

function approachProgressAt(
  approach,
  atMs
) {
  if (!approach) {
    return null;
  }

  const releaseAtMs =
    Number(approach.releaseAtMs);
  const impactAtMs =
    Number(approach.impactAtMs);

  if (
    !Number.isFinite(releaseAtMs) ||
    !Number.isFinite(impactAtMs)
  ) {
    return null;
  }

  if (atMs < releaseAtMs) {
    return 0;
  }

  if (impactAtMs <= releaseAtMs) {
    return 1;
  }

  return Math.max(
    0,
    Math.min(
      1,
      (
        Number(atMs) -
        releaseAtMs
      ) /
      (
        impactAtMs -
        releaseAtMs
      )
    )
  );
}

function relationInRadius({
  state,
  battleFormat,
  zoneId,
  sourceActorId,
  candidateId,
  radius,
  atMs,
  zoneSpatialContext
}) {
  // "long" is the canonical full-battlefield radius. A live visual sample
  // may refine short/medium occupancy, but must never shrink this gameplay
  // guarantee when an idle/scale transform momentarily moves a silhouette
  // across the rendered FX boundary.
  if (radius === "long") {
    return true;
  }

  const measured = visiblePersistentZoneRelationV1({ sample: zoneSpatialContext?.visibleZones, zoneId, sourceActorId, radius, candidateId });
  if (measured !== null) return measured;
  if (candidateId === sourceActorId) {
    return true;
  }

  if (
    battleFormat &&
    typeof battleFormat.teamOf === "function"
  ) {
    const sourceTeam =
      battleFormat.teamOf(sourceActorId);
    const candidateTeam =
      battleFormat.teamOf(candidateId);

    if (
      sourceTeam !== null &&
      candidateTeam === sourceTeam
    ) {
      return true;
    }
  }

  if (
    spatialModeEnabled(
      zoneSpatialContext
    )
  ) {
    if (radius === "long") {
      return true;
    }

    const approach = approachFor({
      zoneSpatialContext,
      actorId: candidateId,
      targetId: sourceActorId
    });
    const progress =
      approachProgressAt(
        approach,
        atMs
      );

    return (
      progress !== null &&
      progress >=
        APPROACH_ENTRY_PROGRESS[radius]
    );
  }

  return (
    distanceIndex(state.distance) <=
    distanceIndex(radius)
  );
}

function affectedIdsForZone({
  state,
  zone,
  battleFormat,
  atMs,
  zoneSpatialContext,
  excludedTargetIds = null
}) {
  const candidates =
    resolveTacticalEffectTargetIdsV1({
      format: battleFormat,
      state,
      actorId: zone.sourceActorId,
      targetId: zone.targetId,
      targetScope: zone.targetScope
    });

  return candidates.filter(
    (candidateId) =>
      (
        !excludedTargetIds ||
        !excludedTargetIds.has(
          candidateId
        )
      ) &&
      relationInRadius({
        zoneId: zone.id,
        state,
        battleFormat,
        sourceActorId:
          zone.sourceActorId,
        candidateId,
        radius: zone.radius,
        atMs,
        zoneSpatialContext
      })
  );
}

function applyZoneDamageToTarget({
  state,
  zone,
  targetActorId,
  atMs
}) {
  const damage =
    computeCombatDamageV1({
      state,
      attackerId:
        zone.sourceActorId,
      targetId:
        targetActorId,
      baseDamage:
        zone.tickEffect.amount,
      channel:
        zone.tickEffect.channel ??
        zone.skillElement ??
        "physical",
      atMs
    });

  return applyCombatDamageV1({
    state,
    sourceActorId:
      zone.sourceActorId,
    targetActorId,
    damage: damage.damage,
    atMs
  }).state;
}

function applyZoneDamageTick({
  state,
  zone,
  atMs,
  battleFormat,
  zoneSpatialContext,
  excludedTargetIds = null
}) {
  let nextState = state;

  for (
    const targetActorId of
    affectedIdsForZone({
      state: nextState,
      zone,
      battleFormat,
      atMs,
      zoneSpatialContext,
      excludedTargetIds
    })
  ) {
    nextState =
      applyZoneDamageToTarget({
        state: nextState,
        zone,
        targetActorId,
        atMs
      });
  }

  return nextState;
}

function approachEntryEventsForZone({
  state,
  zone,
  battleFormat,
  startMs,
  endMs,
  zoneSpatialContext
}) {
  if (
    !spatialModeEnabled(
      zoneSpatialContext
    ) ||
    zone.radius === "long"
  ) {
    return [];
  }

  const threshold =
    APPROACH_ENTRY_PROGRESS[
      zone.radius
    ];
  const candidates =
    resolveTacticalEffectTargetIdsV1({
      format: battleFormat,
      state,
      actorId: zone.sourceActorId,
      targetId: zone.targetId,
      targetScope: zone.targetScope
    });
  const events = [];

  for (const candidateId of candidates) {
    if (visiblePersistentZoneRelationV1({ sample: zoneSpatialContext?.visibleZones, zoneId: zone.id, sourceActorId: zone.sourceActorId, radius: zone.radius, candidateId }) !== null) continue;
    const approach = approachFor({
      zoneSpatialContext,
      actorId: candidateId,
      targetId: zone.sourceActorId
    });
    if (!approach) {
      continue;
    }

    const before =
      approachProgressAt(
        approach,
        startMs
      );
    const after =
      approachProgressAt(
        approach,
        endMs
      );

    if (
      before === null ||
      after === null ||
      before >= threshold ||
      after < threshold
    ) {
      continue;
    }

    const releaseAtMs =
      Number(approach.releaseAtMs);
    const impactAtMs =
      Number(approach.impactAtMs);
    const crossingAtMs =
      impactAtMs <= releaseAtMs
        ? releaseAtMs
        : (
            releaseAtMs +
            (
              impactAtMs -
              releaseAtMs
            ) *
            threshold
          );

    if (
      crossingAtMs < startMs ||
      crossingAtMs > endMs ||
      crossingAtMs >
        zone.expiresAtMs
    ) {
      continue;
    }

    events.push(
      Object.freeze({
        type: "entry",
        atMs: crossingAtMs,
        targetActorId:
          candidateId
      })
    );
  }

  // A Runtime-accepted contact is already semantic proof that the ground
  // attacker reached the zone owner. Large/mobile sprites can meet before
  // the nominal approach-band threshold, including between equal clock ticks.
  for (const contact of zoneSpatialContext.contacts ?? []) {
    if (visiblePersistentZoneRelationV1({ sample: zoneSpatialContext?.visibleZones, zoneId: zone.id, sourceActorId: zone.sourceActorId, radius: zone.radius, candidateId: contact.actorId }) !== null) continue;
    if (contact.approachMode !== "ground" || contact.targetId !== zone.sourceActorId ||
        !candidates.includes(contact.actorId) || zone.expiresAtMs <= endMs) continue;
    if (relationInRadius({ state, battleFormat, sourceActorId: zone.sourceActorId,
      candidateId: contact.actorId, radius: zone.radius, atMs: endMs, zoneSpatialContext })) continue;
    if (!events.some(event => event.targetActorId === contact.actorId)) {
      events.push(Object.freeze({ type: "entry", atMs: endMs, targetActorId: contact.actorId }));
    }
  }
  return events;
}

export function applyPersistentZoneEffectsV1({
  state,
  actorId,
  targetId,
  skill,
  atMs = state.elapsedMs,
  reinforcementsAtStart = []
}) {
  let nextState = state;

  for (
    const effect of
    skill.effects ?? []
  ) {
    if (
      effect.kind !==
      "persistent_zone"
    ) {
      continue;
    }

    const existing = activeZoneOwnedBySlotV1(nextState, actorId, skill.id, effect.zoneId);
    const id = existing?.id ?? nextZoneInstanceIdV1(nextState, actorId, skill.id, effect.zoneId);

    // Only recover the accepted reinforcement when the previous zone expired
    // during preparation. An activation STARTED after expiration has no seed.
    const acceptedPrior =
      existing === null && effect.reactivation === "reinforce"
        ? reinforcementsAtStart.find(
            prior => prior.id === id && prior.expiresAtMs <= atMs
          ) ?? null
        : null;
    const prior = existing ?? acceptedPrior;
    const activations =
      prior === null
        ? 1
        : effect.reactivation === "reinforce"
          ? Math.min(effect.maxActivations, prior.activations + 1)
          : prior.activations;
    const preservesCadence =
      existing !== null &&
      effect.reactivation ===
        "reinforce";

    const zone = Object.freeze({
      id,
      sourceActorId: actorId,
      targetId,
      skillId: skill.id,
      skillElement:
        skill.element ?? null,
      zoneId: effect.zoneId,
      targetScope:
        effect.targetScope,
      baseRadius:
        effect.radius,
      radius:
        radiusFor({
          baseRadius: effect.radius,
          activations,
          radiusGrowthSteps:
            effect.radiusGrowthSteps
        }),
      durationMs:
        effect.durationMs,
      tickIntervalMs:
        effect.tickIntervalMs,
      reactivation:
        effect.reactivation,
      maxActivations:
        effect.maxActivations,
      radiusGrowthSteps:
        effect.radiusGrowthSteps,
      activations,
      tickEffect:
        effect.tickEffect,
      ...(effect.persistAfterRecall !== undefined
        ? {persistAfterRecall: effect.persistAfterRecall} : {}),
      ...(effect.tickEffect.kind === "apply_status"
        ? { statusBehavior: effect.statusBehavior,
            occupiedActorIds: existing?.occupiedActorIds ?? Object.freeze([]) }
        : {}),
      appliedAtMs: atMs,
      expiresAtMs:
        atMs + effect.durationMs,
      nextTickAtMs:
        preservesCadence
          ? existing.nextTickAtMs
          : atMs + effect.tickIntervalMs
    });

    nextState =
      replaceZone(
        nextState,
        zone
      );
  }

  return nextState;
}

export function advancePersistentZonesV1({
  state,
  deltaMs,
  battleFormat = null,
  zoneSpatialContext = null
}) {
  const delta = Number(deltaMs);
  if (
    !Number.isFinite(delta) ||
    delta < 0
  ) {
    throw new RangeError(
      "deltaMs must be a non-negative finite number"
    );
  }
  if (
    (delta === 0 && !(zoneSpatialContext?.contacts?.length > 0)) ||
    (state.persistentZones ?? [])
      .length === 0
  ) {
    return state;
  }

  const startMs =
    Number(state.elapsedMs ?? 0);
  const endMs =
    startMs + delta;
  let nextState = state;
  const zoneIds =
    (state.persistentZones ?? [])
      .map((zone) => zone.id);

  for (const zoneId of zoneIds) {
    const zone =
      (nextState.persistentZones ?? [])
        .find(
          (entry) =>
            entry.id === zoneId
        ) ?? null;

    if (!zone) {
      continue;
    }

    const events =
      approachEntryEventsForZone({
        state: nextState,
        zone,
        battleFormat,
        startMs,
        endMs,
        zoneSpatialContext
      });

    if (zone.tickEffect.kind === "apply_status") {
      nextState = updateZoneStatusOccupancyV1({
        state:nextState,zone,endMs,battleFormat,zoneSpatialContext,
        entryEvents:events
      });
      continue;
    }

    let nextTickAtMs =
      zone.nextTickAtMs;

    while (
      nextTickAtMs <= endMs &&
      nextTickAtMs <=
        zone.expiresAtMs
    ) {
      events.push(
        Object.freeze({
          type: "tick",
          atMs: nextTickAtMs
        })
      );
      nextTickAtMs +=
        zone.tickIntervalMs;
    }

    events.sort(
      (left, right) => {
        if (left.atMs !== right.atMs) {
          return (
            left.atMs -
            right.atMs
          );
        }
        return left.type === "entry"
          ? -1
          : right.type === "entry"
            ? 1
            : 0;
      }
    );

    for (const event of events) {
      if (event.type === "entry") {
        nextState =
          applyZoneDamageToTarget({
            state: nextState,
            zone,
            targetActorId:
              event.targetActorId,
            atMs: event.atMs
          });
        continue;
      }

      const enteredAtSameTime =
        new Set(
          events
            .filter(
              (candidate) =>
                candidate.type ===
                  "entry" &&
                candidate.atMs ===
                  event.atMs
            )
            .map(
              (candidate) =>
                candidate.targetActorId
            )
        );

      nextState =
        applyZoneDamageTick({
          state: nextState,
          zone,
          atMs: event.atMs,
          battleFormat,
          zoneSpatialContext,
          excludedTargetIds:
            enteredAtSameTime
        });
    }

    if (
      nextTickAtMs !==
      zone.nextTickAtMs
    ) {
      nextState =
        updateZoneTick(
          nextState,
          zone.id,
          nextTickAtMs
        );
    }
  }

  const expired = (nextState.persistentZones ?? []).filter(zone => zone.expiresAtMs <= endMs);
  for (const zone of expired) nextState = stripZoneBoundStatusV1(nextState, zone);
  return withPersistentZones(nextState,
    (nextState.persistentZones ?? []).filter(zone => zone.expiresAtMs > endMs));
}
