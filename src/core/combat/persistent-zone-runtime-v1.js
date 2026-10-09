import {
  withPersistentZones
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

const DISTANCE_ORDER = Object.freeze([
  "short",
  "medium",
  "long"
]);

export function removePersistentZonesFromActorV1(state, actorId) {
  return withPersistentZones(state, (state.persistentZones ?? []).filter(zone => zone.sourceActorId !== actorId));
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

function zoneInstanceId(
  actorId,
  skillId,
  zoneId
) {
  return (
    String(actorId) +
    ":" +
    String(skillId) +
    ":" +
    String(zoneId)
  );
}

// A reinforcement is chosen when the Combat Rules accept its cast, not after
// the subsequent preparation delay. Capture only the old owner's identity and
// activation count, never a second persistent-zone/tick state.
export function snapshotPersistentZoneReinforcementsV1({ state, actorId, skill }) {
  return Object.freeze(
    (skill.effects ?? [])
      .filter(effect => effect.kind === "persistent_zone" && effect.reactivation === "reinforce")
      .flatMap(effect => {
        const id = zoneInstanceId(actorId, skill.id, effect.zoneId);
        const active = (state.persistentZones ?? []).find(
          zone => zone.id === id && zone.expiresAtMs > state.elapsedMs
        );
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

    const id =
      zoneInstanceId(
        actorId,
        skill.id,
        effect.zoneId
      );
    const existing =
      (nextState.persistentZones ?? [])
        .find(
          (zone) => zone.id === id
        ) ?? null;

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

  return withPersistentZones(
    nextState,
    (nextState.persistentZones ?? [])
      .filter(
        (zone) =>
          zone.expiresAtMs > endMs
      )
  );
}
