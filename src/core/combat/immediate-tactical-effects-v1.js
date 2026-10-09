import {
  withFighterEnergy,
  withFighterHp
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
import {
  applyStatusEffectV1,
  removeStatusEffectsV1,
  validateStatusEffectForTargetV1
} from "./status-effect-runtime-v1.js";
import {
  combatProtectionForIncomingV1
} from "./combat-protection-v1.js";
import {
  scheduleSkillEffectV1
} from "./scheduled-effect-runtime-v1.js";

const SUPPORTED_KINDS = new Set([
  "damage",
  "heal",
  "energy_restore",
  "energy_drain",
  "apply_status",
  "cleanse",
  "dispel",
  "persistent_zone",
  "scheduled_effect"
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

function targetIdsForEffect({
  state,
  actorId,
  targetId,
  effect,
  battleFormat
}) {
  return resolveTacticalEffectTargetIdsV1({
    format: battleFormat,
    state,
    actorId,
    targetId,
    targetScope: effect.targetScope
  });
}

export function unsupportedImmediateTacticalEffectV1(
  skill,
  {
    battleFormat = null,
    state = null,
    actorId = null,
    targetId = null
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

    if (
      effect.kind === "apply_status" &&
      effect.status.kind === "stat_modifier" &&
      state !== null
    ) {
      const affectedIds =
        targetIdsForEffect({
          state,
          actorId,
          targetId,
          effect,
          battleFormat
        });

      for (const affectedId of affectedIds) {
        const validation =
          validateStatusEffectForTargetV1({
            state,
            targetActorId: affectedId,
            status: effect.status
          });

        if (!validation.ok) {
          return Object.freeze({
            kind: effect.kind,
            targetScope:
              effect.targetScope,
            reason:
              "unsupported_status_stat",
            statId: validation.statId
          });
        }
      }
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
  atMs,
  combatAtMs
}) {
  const damage = computeCombatDamageV1({
    state,
    attackerId: actorId,
    targetId: affectedId,
    baseDamage: effect.amount,
    channel:
      effect.channel ??
      skill.element ??
      "physical",
    ignoreResistancePct:
      effect.ignoreResistancePct ?? 0,
    ignoreDamageReductionPct:
      effect.ignoreDamageReductionPct ?? 0,
    atMs: combatAtMs
  });

  const applied = applyCombatDamageV1({
    state,
    sourceActorId: actorId,
    targetActorId: affectedId,
    damage: damage.damage,
    atMs: combatAtMs
  });

  return Object.freeze({
    state: applied.state,
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
      absorbedByShield:
        applied.absorbedByShield,
      appliedDamage:
        applied.appliedDamage,
      hpBefore: applied.hpBefore,
      hpAfter: applied.hpAfter
    })
  });
}

export function applyImmediateTacticalEffectsV1({
  state,
  actorId,
  targetId,
  skill,
  atMs,
  combatAtMs = atMs,
  battleFormat = null
}) {
  const unsupported =
    unsupportedImmediateTacticalEffectV1(
      skill,
      {
        battleFormat,
        state,
        actorId,
        targetId
      }
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

  // Legacy editor field effect.heal uses the SAME canonical tactical HP
  // application and event path as modern effects[].heal. The Skill Contract
  // rejects a positive legacy heal combined with an effects[] heal.
  const legacyHeal = Math.max(0, Number(skill.effect?.heal) || 0);
  const effects = legacyHeal > 0
    ? [{ kind: "heal", targetScope: "target", amount: legacyHeal }, ...(skill.effects ?? [])]
    : skill.effects ?? [];

  for (const effect of effects) {
    if (effect.kind === "persistent_zone") {
      continue;
    }

    if (effect.kind === "scheduled_effect") {
      const scheduled =
        scheduleSkillEffectV1({
          state: nextState,
          sourceActorId: actorId,
          targetActorId: targetId,
          sourceSkillId: skill.id,
          skillElement:
            skill.element ?? null,
          effect,
          atMs: combatAtMs
        });
      nextState = scheduled.state;
      events.push(Object.freeze({
        type: "scheduled-effect-created",
        atMs,
        actorId,
        targetId,
        skillId: skill.id,
        scheduledEffectId:
          scheduled.record.id,
        dueAtMs:
          scheduled.record.dueAtMs
      }));
      continue;
    }

    const affectedIds =
      targetIdsForEffect({
        state: nextState,
        actorId,
        targetId,
        effect,
        battleFormat
      });

    for (const affectedId of affectedIds) {
      if (effect.kind === "damage") {
        const applied = applyDamageEffect({
          state: nextState,
          actorId,
          affectedId,
          skill,
          effect,
          atMs,
          combatAtMs
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

      if (
        effect.kind === "energy_restore" ||
        effect.kind === "energy_drain"
      ) {
        const before = fighterOf(
          nextState,
          affectedId
        ).energy;
        nextState = withFighterEnergy(
          nextState,
          affectedId,
          effect.kind === "energy_restore"
            ? before + effect.amount
            : before - effect.amount
        );
        const after = fighterOf(
          nextState,
          affectedId
        ).energy;

        events.push(Object.freeze({
          type:
            effect.kind === "energy_restore"
              ? "energy-restored"
              : "energy-drained",
          atMs,
          actorId: affectedId,
          sourceActorId: actorId,
          skillId: skill.id,
          requested: effect.amount,
          applied:
            effect.kind === "energy_restore"
              ? after - before
              : before - after,
          energyBefore: before,
          energyAfter: after
        }));
        continue;
      }

      if (effect.kind === "apply_status") {
        const protection =
          effect.status.polarity ===
            "detrimental"
            ? combatProtectionForIncomingV1({
                state: nextState,
                targetActorId: affectedId,
                domain: "negative_status",
                atMs: combatAtMs
              })
            : Object.freeze({
                protected: false,
                protectingStatusIds:
                  Object.freeze([])
              });

        if (protection.protected) {
          events.push(Object.freeze({
            type: "status-immune",
            atMs,
            actorId: affectedId,
            sourceActorId: actorId,
            skillId: skill.id,
            statusId: effect.status.id,
            statusKind: effect.status.kind,
            protectingStatusIds:
              protection.protectingStatusIds
          }));
          continue;
        }

        nextState = applyStatusEffectV1({
          state: nextState,
          targetActorId: affectedId,
          sourceActorId: actorId,
          sourceSkillId: skill.id,
          status: effect.status,
          atMs: combatAtMs
        });
        events.push(Object.freeze({
          type: "status-applied",
          atMs,
          actorId: affectedId,
          sourceActorId: actorId,
          skillId: skill.id,
          statusId: effect.status.id,
          statusKind: effect.status.kind
        }));

        if (effect.status.kind === "stun") {
          events.push(Object.freeze({
            type: "charge-interrupt",
            atMs,
            actorId: affectedId,
            sourceActorId: actorId,
            skillId: skill.id,
            reason: "stun",
            stunMs:
              effect.status.durationMs
          }));
        }
        continue;
      }

      if (
        effect.kind === "cleanse" ||
        effect.kind === "dispel"
      ) {
        const beforeIds =
          fighterOf(
            nextState,
            affectedId
          ).statusEffects.map(
            (entry) => entry.definition.id
          );
        nextState = removeStatusEffectsV1({
          state: nextState,
          targetActorId: affectedId,
          polarity:
            effect.kind === "cleanse"
              ? "detrimental"
              : "beneficial",
          statusTags: effect.statusTags
        });
        const afterIds = new Set(
          fighterOf(
            nextState,
            affectedId
          ).statusEffects.map(
            (entry) => entry.definition.id
          )
        );
        events.push(Object.freeze({
          type:
            effect.kind === "cleanse"
              ? "status-cleansed"
              : "status-dispelled",
          atMs,
          actorId: affectedId,
          sourceActorId: actorId,
          skillId: skill.id,
          removedStatusIds:
            Object.freeze(
              beforeIds.filter(
                (id) => !afterIds.has(id)
              )
            )
        }));
      }
    }
  }

  return Object.freeze({
    state: nextState,
    events: Object.freeze(events)
  });
}
