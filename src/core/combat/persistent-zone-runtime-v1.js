import {
  withPersistentZones
} from "./combat-state.js";
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

function relationInRadius({
  state,
  battleFormat,
  sourceActorId,
  candidateId,
  radius
}) {
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

  return (
    distanceIndex(state.distance) <=
    distanceIndex(radius)
  );
}

function affectedIdsForZone({
  state,
  zone,
  battleFormat
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
      relationInRadius({
        state,
        battleFormat,
        sourceActorId:
          zone.sourceActorId,
        candidateId,
        radius: zone.radius
      })
  );
}

function applyZoneDamageTick({
  state,
  zone,
  atMs,
  battleFormat
}) {
  let nextState = state;

  for (
    const targetActorId of
    affectedIdsForZone({
      state: nextState,
      zone,
      battleFormat
    })
  ) {
    const damage =
      computeCombatDamageV1({
        state: nextState,
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

    nextState =
      applyCombatDamageV1({
        state: nextState,
        sourceActorId:
          zone.sourceActorId,
        targetActorId,
        damage: damage.damage,
        atMs
      }).state;
  }

  return nextState;
}

export function applyPersistentZoneEffectsV1({
  state,
  actorId,
  targetId,
  skill,
  atMs = state.elapsedMs
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

    const activations =
      existing === null
        ? 1
        : effect.reactivation ===
            "reinforce"
          ? Math.min(
              effect.maxActivations,
              existing.activations + 1
            )
          : existing.activations;

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
        atMs + effect.tickIntervalMs
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
  battleFormat = null
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
    delta === 0 ||
    (state.persistentZones ?? [])
      .length === 0
  ) {
    return state;
  }

  const endMs =
    state.elapsedMs + delta;
  let nextState = state;
  const zoneIds =
    (state.persistentZones ?? [])
      .map((zone) => zone.id);

  for (const zoneId of zoneIds) {
    let zone =
      (nextState.persistentZones ?? [])
        .find(
          (entry) =>
            entry.id === zoneId
        ) ?? null;

    while (
      zone !== null &&
      zone.nextTickAtMs <= endMs &&
      zone.nextTickAtMs <=
        zone.expiresAtMs
    ) {
      const tickAt =
        zone.nextTickAtMs;

      nextState =
        applyZoneDamageTick({
          state: nextState,
          zone,
          atMs: tickAt,
          battleFormat
        });

      nextState =
        updateZoneTick(
          nextState,
          zone.id,
          tickAt +
            zone.tickIntervalMs
        );

      zone =
        (nextState.persistentZones ?? [])
          .find(
            (entry) =>
              entry.id === zoneId
          ) ?? null;
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
