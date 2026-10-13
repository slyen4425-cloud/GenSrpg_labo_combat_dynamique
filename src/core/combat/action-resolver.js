import { movementEnergyCost, isSkillInRange } from "./distance.js";
import { isReserveEffectTargetScopeV2 } from "../../contracts/skill-effect-v1.js";
import {
  skillCooldownRemainingMs,
  skillUseCount,
  withDistance,
  withFighterEnergy,
  withSkillCooldown,
  withSkillUseRecorded
} from "./combat-state.js";
import {
  effectivePreparationMs,
  effectiveSkillTimingMs,
  effectiveApproachTimingMs
} from "./combat-timing.js";
import {
  evaluateSkillActivationRequirementsV1
} from "./skill-activation-requirements-v1.js";
import {
  applyImmediateTacticalEffectsV1,
  unsupportedImmediateTacticalEffectV1
} from "./immediate-tactical-effects-v1.js";
import {
  computeCombatDamageV1
} from "./combat-damage-v1.js";
import {
  applyCombatDamageV1,
  applyCombatContactRetaliationV1
} from "./combat-damage-application-v1.js";
import { combatProtectionForIncomingV1 } from "./combat-protection-v1.js";
import {
  projectStatusStatEffectsV1
} from "./status-effect-projection-v1.js";
import {
  applyPersistentZoneEffectsV1,
  snapshotPersistentZoneReinforcementsV1
} from "./persistent-zone-runtime-v1.js";
import {
  activeTauntSourceActorIdV1,
  hasActiveStatusKindV1
} from "./status-effect-runtime-v1.js";
import {
  skillPresenceReachV1
} from "./combat-presence-v1.js";

function fighterOf(state, fighterId) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }
  return fighter;
}

function spendEnergy(state, fighterId, amount) {
  const fighter = fighterOf(state, fighterId);
  return withFighterEnergy(state, fighterId, fighter.energy - amount);
}

function damageChannelFor(skill) {
  return skill.element ?? "physical";
}

function statAdjustedDamageFor(
  state,
  attackerId,
  targetId,
  skill
) {
  return computeCombatDamageV1({
    state,
    attackerId,
    targetId,
    baseDamage: skill.effect.damage,
    channel: damageChannelFor(skill)
  });
}

function isPurePersistentZoneSkill(skill) {
  const effects =
    Array.isArray(skill?.effects)
      ? skill.effects
      : [];

  return (
    effects.length > 0 &&
    effects.every(
      (effect) =>
        effect?.kind === "persistent_zone"
    ) &&
    Number(skill?.effect?.damage ?? 0) === 0 &&
    Number(skill?.effect?.heal ?? 0) === 0 &&
    skill?.effect?.interruptsPreparation !== true &&
    Number(skill?.effect?.stunMs ?? 0) === 0
  );
}

function event(type, atMs, data = {}) {
  return Object.freeze({ type, atMs, ...data });
}

function preparationFor(
  state,
  fighterId,
  skill,
  skillSpeedMultiplier = 1
) {
  const fighter = fighterOf(state, fighterId);
  const statusStats =
    projectStatusStatEffectsV1({
      fighter,
      atMs: state.elapsedMs
    });
  const modified = effectivePreparationMs({
    baseMs: skill.preparationMs,
    permanentPct:
      fighter.chargeTimeModifierPct -
      statusStats.chargeTimeReductionPct,
    effects: fighter.chargeTimeEffects,
    atMs: state.elapsedMs
  });
  return effectiveSkillTimingMs({
    baseMs: modified,
    speedMultiplier: skillSpeedMultiplier
  });
}

function presenceEvasionFor(
  incomingSkill,
  targetActionContext
) {
  const reach =
    skillPresenceReachV1({
      skill: incomingSkill,
      targetActionContext
    });

  if (reach.reachable) {
    return Object.freeze({
      reach,
      evasion: null
    });
  }

  return Object.freeze({
    reach,
    evasion: Object.freeze({
      outcome: "evaded",
      reason: "presence",
      presence: reach.presence,
      sourceSkillId:
        targetActionContext?.action?.actionId ??
        null,
      sourceApproachMode:
        targetActionContext?.action?.skill
          ?.approachMode ?? "none"
    })
  });
}

function mobilityEvasionFor(
  incomingSkill,
  targetActionContext
) {
  const targetAction = targetActionContext?.action;
  if (
    !targetAction ||
    targetAction.actionType !== "skill"
  ) {
    return null;
  }

  const elapsedMs = Number(targetActionContext.elapsedMs);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return null;
  }

  const evasion = targetAction.skill?.evasion;
  const explicitMobilityEvasion =
    evasion?.window === "travel" &&
    evasion.incomingForms.includes(incomingSkill.form);
  // Only fixed-point projectiles (e.g. skyfall) lock the target location at
  // release; direct projectiles do not grant a passive dodge while moving.
  // A teleport has no target model on the direct projectile lane between
  // its release (disappearance) and impact (reappearance). This is distinct
  // from ground/aerial movement, which a direct projectile still tracks.
  const vanishedFromDirectProjectile =
    incomingSkill.category === "offensive" &&
    incomingSkill.form === "projectile" &&
    incomingSkill.projectileTargeting === "direct" &&
    targetAction.skill?.approachMode === "teleport" &&
    elapsedMs >= targetAction.releaseAtMs &&
    elapsedMs < targetAction.impactAtMs;

  const movingOutOfProjectilePath =
    incomingSkill.form === "projectile" &&
    incomingSkill.projectileTargeting === "fixed_point" &&
    incomingSkill.category === "offensive" &&
    ["ground", "aerial", "teleport", "burrow"].includes(
      targetAction.skill?.approachMode ?? "none"
    ) &&
    elapsedMs >= targetAction.releaseAtMs &&
    elapsedMs < targetAction.impactAtMs;

  if (!explicitMobilityEvasion && !movingOutOfProjectilePath &&
      !vanishedFromDirectProjectile) {
    return null;
  }

  if (
    elapsedMs < targetAction.releaseAtMs ||
    elapsedMs > targetAction.impactAtMs
  ) {
    return null;
  }

  return Object.freeze({
    outcome: "evaded",
    reason:
      vanishedFromDirectProjectile
        ? "teleport_vanish"
        : movingOutOfProjectilePath
          ? "moving_target"
          : "mobility",
    sourceSkillId: targetAction.actionId,
    sourceApproachMode:
      targetAction.skill?.approachMode ?? "none",
    elapsedMs
  });
}

function reactionEvasionMatches(
  skill,
  reactionSkill
) {
  return (
    reactionSkill.reaction.evadeForms.includes(
      skill.form
    ) ||
    reactionSkill.reaction.evadeApproaches.includes(
      skill.approachMode
    )
  );
}

function reactionOutcome(skill, reactionSkill) {
  if (
    skill.dodgeable !== false &&
    reactionEvasionMatches(
      skill,
      reactionSkill
    )
  ) {
    return "evaded";
  }
  if (
    skill.element &&
    reactionSkill.reaction.immuneElements.includes(skill.element)
  ) {
    return "immune";
  }
  if (reactionSkill.reaction.reflectForms.includes(skill.form)) {
    return "reflected";
  }
  if (reactionSkill.reaction.counterForms.includes(skill.form)) {
    return "countered";
  }
  if (reactionSkill.reaction.blockForms.includes(skill.form)) {
    return "blocked";
  }
  return null;
}

export function resolveMovement({ state, actorId, toDistance }) {
  const actor = fighterOf(state, actorId);

  for (const [kind, outcome] of [
    ["stun", "stunned"],
    ["immobilize", "immobilized"]
  ]) {
    if (
      hasActiveStatusKindV1(
        state,
        actorId,
        kind
      )
    ) {
      return Object.freeze({
        ok: false,
        outcome,
        cost: 0,
        state,
        events: Object.freeze([
          event("movement-rejected", 0, {
            actorId,
            reason: outcome
          })
        ])
      });
    }
  }

  const cost = movementEnergyCost({
    from: state.distance,
    to: toDistance,
    energyPerStep: actor.movementEnergyPerStep
  });

  if (actor.energy < cost) {
    return Object.freeze({
      ok: false,
      outcome: "insufficient_energy",
      cost,
      state,
      events: Object.freeze([
        event("movement-rejected", 0, { actorId, reason: "insufficient_energy" })
      ])
    });
  }

  const spent = spendEnergy(state, actorId, cost);
  const next = withDistance(spent, toDistance);

  return Object.freeze({
    ok: true,
    outcome: "moved",
    cost,
    state: next,
    events: Object.freeze([
      event("distance-changed", 0, {
        actorId,
        from: state.distance,
        to: toDistance,
        cost
      })
    ])
  });
}

export function resolveSkillStart({
  state,
  actorId,
  targetId,
  skill,
  skillSpeedMultiplier = 1,
  battleFormat = null
}) {
  const actor = fighterOf(state, actorId);
  fighterOf(state, targetId);

  for (const [kind, outcome] of [
    ["stun", "stunned"],
    ["silence", "silenced"]
  ]) {
    if (
      hasActiveStatusKindV1(
        state,
        actorId,
        kind
      )
    ) {
      return Object.freeze({
        ok: false,
        outcome,
        state,
        events: Object.freeze([
          event("skill-rejected", 0, {
            actorId,
            skillId: skill.id,
            reason: outcome
          })
        ])
      });
    }
  }

  const tauntSource =
    skill.category === "offensive" &&
    (
      skill.targetRelations.includes("enemy") ||
      skill.targetRelations.includes("any")
    )
      ? activeTauntSourceActorIdV1(
          state,
          actorId
        )
      : null;
  const effectiveTargetId =
    tauntSource ?? targetId;
  fighterOf(state, effectiveTargetId);

  if (!isSkillInRange(skill, state.distance)) {
    return Object.freeze({
      ok: false,
      outcome: "out_of_range",
      state,
      events: Object.freeze([
        event("skill-rejected", 0, {
          actorId,
          skillId: skill.id,
          reason: "out_of_range"
        })
      ])
    });
  }

  const activationRequirements =
    evaluateSkillActivationRequirementsV1({
      state,
      actorId,
      skill,
      battleFormat
    });

  if (!activationRequirements.satisfied) {
    return Object.freeze({
      ok: false,
      outcome: "activation_requirements",
      skillId: skill.id,
      activationRequirements,
      state,
      events: Object.freeze([
        event("skill-rejected", 0, {
          actorId,
          skillId: skill.id,
          reason: "activation_requirements",
          activationRequirements
        })
      ])
    });
  }

  const unsupportedTacticalEffect =
    unsupportedImmediateTacticalEffectV1(
      skill,
      {
        battleFormat,
        state,
        actorId,
        targetId: effectiveTargetId
      }
    );
  if (unsupportedTacticalEffect !== null) {
    const unsupportedOutcome =
      unsupportedTacticalEffect.reason ===
        "unsupported_status_stat"
        ? "unsupported_status_stat"
        : "unsupported_tactical_effect";
    return Object.freeze({
      ok: false,
      outcome: unsupportedOutcome,
      skillId: skill.id,
      tacticalEffect: unsupportedTacticalEffect,
      state,
      events: Object.freeze([
        event("skill-rejected", 0, {
          actorId,
          skillId: skill.id,
          reason: unsupportedOutcome,
          tacticalEffect:
            unsupportedTacticalEffect
        })
      ])
    });
  }

  const remainingCooldownMs = skillCooldownRemainingMs(
    state,
    actorId,
    skill.id
  );
  if (remainingCooldownMs > 0) {
    return Object.freeze({
      ok: false,
      outcome: "cooldown",
      skillId: skill.id,
      remainingCooldownMs,
      state,
      events: Object.freeze([
        event("skill-rejected", 0, {
          actorId,
          skillId: skill.id,
          reason: "cooldown",
          remainingCooldownMs
        })
      ])
    });
  }

  const usedCount = skillUseCount(
    state,
    actorId,
    skill.id
  );
  if (
    skill.maxUsesPerCombat !== null &&
    usedCount >= skill.maxUsesPerCombat
  ) {
    return Object.freeze({
      ok: false,
      outcome: "usage_limit",
      skillId: skill.id,
      maxUsesPerCombat: skill.maxUsesPerCombat,
      usedCount,
      state,
      events: Object.freeze([
        event("skill-rejected", 0, {
          actorId,
          skillId: skill.id,
          reason: "usage_limit",
          maxUsesPerCombat:
            skill.maxUsesPerCombat,
          usedCount
        })
      ])
    });
  }

  if (actor.energy < skill.energyCost) {
    return Object.freeze({
      ok: false,
      outcome: "insufficient_energy",
      state,
      events: Object.freeze([
        event("skill-rejected", 0, {
          actorId,
          skillId: skill.id,
          reason: "insufficient_energy"
        })
      ])
    });
  }

  const preparationMs = preparationFor(
    state,
    actorId,
    skill,
    skillSpeedMultiplier
  );
  const travelMs = effectiveApproachTimingMs({
    baseMs: skill.travelMs,
    approachMode: skill.approachMode,
    permanentPct:
      actor.approachTimeModifierPct,
    statusEffects: actor.statusEffects,
    atMs: state.elapsedMs,
    speedMultiplier: skillSpeedMultiplier
  });
  const recoveryMs = effectiveSkillTimingMs({
    baseMs: skill.recoveryMs,
    speedMultiplier: skillSpeedMultiplier
  });
  const action = Object.freeze({
    actionType: "skill",
    actionId: skill.id,
    actorId,
    targetId: effectiveTargetId,
    skill,
    persistentZoneReinforcementsAtStart: snapshotPersistentZoneReinforcementsV1({
      state, actorId, skill
    }),
    preparationMs,
    travelMs,
    recoveryMs,
    releaseAtMs: preparationMs,
    impactAtMs: preparationMs + travelMs,
    interruptibleDuringPreparation: skill.interruptibleDuringPreparation
  });

  const spent = spendEnergy(
    state,
    actorId,
    skill.energyCost
  );
  const cooldownCommitted = withSkillCooldown(
    spent,
    actorId,
    skill.id,
    skill.cooldownMs
  );
  const committed = withSkillUseRecorded(
    cooldownCommitted,
    actorId,
    skill.id
  );

  return Object.freeze({
    ok: true,
    outcome: "started",
    state: committed,
    action,
    events: Object.freeze([
      ...(
        effectiveTargetId !== targetId
          ? [
              event("target-forced", 0, {
                actorId,
                fromTargetId: targetId,
                targetId:
                  effectiveTargetId,
                reason: "taunt"
              })
            ]
          : []
      ),
      event("skill-start", 0, {
        actorId,
        targetId: effectiveTargetId,
        skillId: skill.id,
        preparationMs
      })
    ])
  });
}

export function resolveReaction({
  state,
  action,
  reactionSkill,
  elapsedMs,
  skillSpeedMultiplier = 1,
  battleFormat = null
}) {
  const elapsed = Number(elapsedMs);
  if (!Number.isFinite(elapsed) || elapsed < 0) {
    throw new RangeError("elapsedMs must be a non-negative finite number");
  }

  const target = fighterOf(state, action.targetId);
  const outcome = reactionOutcome(action.skill, reactionSkill);

  if (!outcome) {
    const attemptedForbiddenDodge =
      action.skill.dodgeable === false &&
      reactionEvasionMatches(
        action.skill,
        reactionSkill
      );

    return Object.freeze({
      ok: false,
      outcome:
        attemptedForbiddenDodge
          ? "not_dodgeable"
          : "no_effect",
      state,
      reaction: null
    });
  }

  const activationRequirements =
    evaluateSkillActivationRequirementsV1({
      state,
      actorId: action.targetId,
      skill: reactionSkill,
      battleFormat
    });

  if (!activationRequirements.satisfied) {
    return Object.freeze({
      ok: false,
      outcome: "activation_requirements",
      skillId: reactionSkill.id,
      activationRequirements,
      state,
      reaction: null
    });
  }

  if (target.energy < reactionSkill.energyCost) {
    return Object.freeze({
      ok: false,
      outcome: "insufficient_energy",
      state,
      reaction: null
    });
  }

  if (!isSkillInRange(reactionSkill, state.distance)) {
    return Object.freeze({
      ok: false,
      outcome: "out_of_range",
      state,
      reaction: null
    });
  }

  const remainingCooldownMs = skillCooldownRemainingMs(
    state,
    action.targetId,
    reactionSkill.id
  );
  if (remainingCooldownMs > 0) {
    return Object.freeze({
      ok: false,
      outcome: "cooldown",
      skillId: reactionSkill.id,
      remainingCooldownMs,
      state,
      reaction: null
    });
  }

  const usedCount = skillUseCount(
    state,
    action.targetId,
    reactionSkill.id
  );
  if (
    reactionSkill.maxUsesPerCombat !== null &&
    usedCount >= reactionSkill.maxUsesPerCombat
  ) {
    return Object.freeze({
      ok: false,
      outcome: "usage_limit",
      skillId: reactionSkill.id,
      maxUsesPerCombat:
        reactionSkill.maxUsesPerCombat,
      usedCount,
      state,
      reaction: null
    });
  }

  const preparationMs = preparationFor(
    state,
    action.targetId,
    reactionSkill,
    skillSpeedMultiplier
  );
  const readyAtMs = elapsed + preparationMs;

  if (elapsed > action.impactAtMs || readyAtMs > action.impactAtMs) {
    return Object.freeze({
      ok: false,
      outcome: "too_late",
      state,
      reaction: null,
      readyAtMs
    });
  }

  const reaction = Object.freeze({
    skill: reactionSkill,
    skillId: reactionSkill.id,
    outcome,
    startedAtMs: elapsed,
    preparationMs,
    readyAtMs
  });

  const spent = spendEnergy(
    state,
    action.targetId,
    reactionSkill.energyCost
  );
  const cooldownCommitted = withSkillCooldown(
    spent,
    action.targetId,
    reactionSkill.id,
    reactionSkill.cooldownMs
  );
  const committed = withSkillUseRecorded(
    cooldownCommitted,
    action.targetId,
    reactionSkill.id
  );

  return Object.freeze({
    ok: true,
    outcome,
    state: committed,
    reaction
  });
}

export function resolveSkillCompletion({
  state,
  action,
  reaction = null,
  targetActionContext = null,
  battleFormat = null,
  resolutionAtMs = null,
  forcedOutcome = null
}) {
  const {
    actorId,
    targetId,
    skill,
    preparationMs,
    travelMs,
    recoveryMs,
    releaseAtMs,
    impactAtMs
  } = action;

  const presence =
    presenceEvasionFor(
      skill,
      targetActionContext
    );
  const mobilityEvasion =
    reaction == null &&
    !(
      presence.reach.configured &&
      presence.reach.transientPresence
    )
      ? mobilityEvasionFor(
          skill,
          targetActionContext
        )
      : null;
  const outcome =
    forcedOutcome ??
    reaction?.outcome ??
    presence.evasion?.outcome ??
    mobilityEvasion?.outcome ??
    "hit";
  const reactionReadyAt = reaction?.readyAtMs ?? null;
  const hasAbsoluteResolutionAtMs =
    resolutionAtMs !== null &&
    resolutionAtMs !== undefined &&
    Number.isFinite(Number(resolutionAtMs));
  const combatImpactAtMs =
    hasAbsoluteResolutionAtMs
      ? Number(resolutionAtMs)
      : state.elapsedMs;
  let nextState = state;
  const events = [
    event("skill-start", 0, {
      actorId,
      targetId,
      skillId: skill.id,
      preparationMs
    })
  ];

  if (reaction) {
    events.push(event("reaction-start", reaction.startedAtMs, {
      actorId: targetId,
      targetId: actorId,
      skillId: reaction.skillId,
      preparationMs: reaction.preparationMs
    }));
    events.push(event("reaction-ready", reactionReadyAt, {
      actorId: targetId,
      targetId: actorId,
      skillId: reaction.skillId
    }));
  }

  if (!(outcome === "countered" && reactionReadyAt < releaseAtMs)) {
    events.push(event("skill-release", releaseAtMs, {
      actorId,
      targetId,
      skillId: skill.id,
      form: skill.form,
      element: skill.element,
      approachMode: skill.approachMode
    }));
  }

  if (outcome === "countered") {
    events.push(event("skill-countered", reactionReadyAt, {
      actorId,
      targetId,
      skillId: skill.id,
      reactionSkillId: reaction.skillId
    }));
    events.push(event("skill-cancelled", reactionReadyAt, {
      actorId,
      targetId,
      skillId: skill.id,
      reason: "countered"
    }));
  } else {
    events.push(event("skill-arrive", impactAtMs, {
      actorId,
      targetId,
      skillId: skill.id,
      outcome,
      form: skill.form,
      approachMode: skill.approachMode
    }));

    if (outcome === "hit") {
      const damage =
        statAdjustedDamageFor(
          nextState,
          action.mirrorReturn?.originalActorId ?? actorId,
          targetId,
          skill
        );
      const applied =
        applyCombatDamageV1({
          state: nextState,
          sourceActorId: actorId,
          targetActorId: targetId,
          damage: damage.damage,
          atMs: combatImpactAtMs,
          hitsIntangible: skill.hitsIntangible === true,
          incomingKind: skill.form
        });
      nextState = applied.state;

      events.push(event("hit", impactAtMs, {
        actorId: targetId,
        sourceActorId: actorId,
        skillId: skill.id,
        baseDamage: damage.baseDamage,
        damageChannel: damage.damageChannel,
        damageBonusPct: damage.damageBonusPct,
        resistancePct: damage.resistancePct,
        damage: damage.damage,
        absorbedByShield:
          applied.absorbedByShield,
        appliedDamage:
          applied.appliedDamage,
        hpBefore: applied.hpBefore,
        hpAfter: applied.hpAfter
      }));

      // A confirmed melee hit can trigger spikes even when its HP damage
      // was zero or shielded. Evades and mirror interceptions do not hit.
      if (skill.form === "contact") {
        const thorns = applyCombatContactRetaliationV1({
          state: nextState, attackerId: actorId, defenderId: targetId,
          atMs: combatImpactAtMs
        });
        nextState = thorns.state;
        if (thorns.requestedDamage > 0) {
          events.push(event("hit", impactAtMs, {
            actorId, sourceActorId: targetId, skillId: skill.id,
            contactRetaliation: true, damage: thorns.requestedDamage,
            appliedDamage: thorns.appliedDamage,
            absorbedByShield: thorns.absorbedByShield,
            hpBefore: thorns.hpBefore, hpAfter: thorns.hpAfter
          }));
        }
      }

      if (skill.effect.interruptsPreparation && !combatProtectionForIncomingV1({
        state: nextState, targetActorId: targetId,
        domain: "negative_status", atMs: combatImpactAtMs,
        hitsIntangible: skill.hitsIntangible === true
      }).protected) {
        events.push(event("charge-interrupt", impactAtMs, {
          actorId: targetId,
          sourceActorId: actorId,
          skillId: skill.id,
          reason: "stun",
          stunMs: skill.effect.stunMs
        }));
      }

      const tactical =
        applyImmediateTacticalEffectsV1({
          state: nextState,
          actorId,
          targetId,
          skill: skill.effects?.some(effect => isReserveEffectTargetScopeV2(effect.targetScope))
            ? { ...skill, effects: skill.effects.filter(effect => !isReserveEffectTargetScopeV2(effect.targetScope)) }
            : skill,
          atMs: impactAtMs,
          combatAtMs: combatImpactAtMs,
          battleFormat,
          // No lifesteal from the return leg of a mirrored projectile.
          directDamageApplied: action.mirrorReturn ? 0 : applied.appliedDamage
        });
      nextState = tactical.state;
      events.push(...tactical.events);

      nextState =
        applyPersistentZoneEffectsV1({
          state: nextState,
          actorId,
          targetId,
          skill,
          atMs:
            hasAbsoluteResolutionAtMs
              ? combatImpactAtMs
              : nextState.elapsedMs +
                impactAtMs,
          reinforcementsAtStart: action.persistentZoneReinforcementsAtStart ?? []
        });
    } else if (outcome === "reflected") {
      const damage =
        statAdjustedDamageFor(
          nextState,
          actorId,
          actorId,
          skill
        );
      const applied =
        applyCombatDamageV1({
          state: nextState,
          sourceActorId: targetId,
          targetActorId: actorId,
          damage: damage.damage,
          atMs: combatImpactAtMs,
          hitsIntangible: skill.hitsIntangible === true,
          incomingKind: skill.form
        });
      nextState = applied.state;

      events.push(event("hit", impactAtMs, {
        actorId,
        sourceActorId: targetId,
        skillId: skill.id,
        reflected: true,
        baseDamage: damage.baseDamage,
        damageChannel: damage.damageChannel,
        damageBonusPct: damage.damageBonusPct,
        resistancePct: damage.resistancePct,
        damage: damage.damage,
        absorbedByShield:
          applied.absorbedByShield,
        appliedDamage:
          applied.appliedDamage,
        hpBefore: applied.hpBefore,
        hpAfter: applied.hpAfter
      }));
    } else {
      events.push(event(`skill-${outcome}`, impactAtMs, {
        actorId,
        targetId,
        skillId: skill.id,
        reactionSkillId: reaction?.skillId ?? null,
        evasionSourceSkillId:
          presence.evasion?.sourceSkillId ??
          mobilityEvasion?.sourceSkillId ??
          null,
        evasionSourceApproachMode:
          presence.evasion?.sourceApproachMode ??
          mobilityEvasion?.sourceApproachMode ??
          null,
        evasionReason:
          presence.evasion?.reason ??
          (
            mobilityEvasion
              ? "mobility"
              : reaction
                ? "reaction"
                : null
          ),
        targetPresence:
          presence.reach.presence
      }));
    }
  }

  const resolutionAt =
    outcome === "countered" ? reactionReadyAt : impactAtMs;

  events.push(event("skill-recovery-complete", resolutionAt + recoveryMs, {
    actorId,
    skillId: skill.id
  }));

  return Object.freeze({
    ok: true,
    actionType: "skill",
    actorId,
    targetId,
    skillId: skill.id,
    outcome,
    persistentZoneOnly:
      isPurePersistentZoneSkill(skill),
    state: nextState,
    reactionApplied: reaction?.skillId ?? null,
    evasionApplied:
      presence.evasion?.sourceSkillId ??
      mobilityEvasion?.sourceSkillId ??
      null,
    evasionReason:
      presence.evasion?.reason ??
      (
        mobilityEvasion
          ? mobilityEvasion.reason ?? "mobility"
          : reaction
            ? "reaction"
            : null
      ),
    targetPresence:
      presence.reach.presence,
    timelineMs: Object.freeze({
      basePreparation: skill.preparationMs,
      preparation: preparationMs,
      travel: travelMs,
      recovery: recoveryMs,
      reactionReady: reactionReadyAt
    }),
    events: Object.freeze(events.sort((a, b) => a.atMs - b.atMs))
  });
}

export function resolveSkill({
  state,
  actorId,
  targetId,
  skill,
  reactionSkill = null,
  skillSpeedMultiplier = 1,
  battleFormat = null
}) {
  const started = resolveSkillStart({
    state,
    actorId,
    targetId,
    skill,
    skillSpeedMultiplier,
    battleFormat
  });
  if (!started.ok) {
    return started;
  }

  let nextState = started.state;
  let reaction = null;

  if (reactionSkill) {
    const reactionResult = resolveReaction({
      state: nextState,
      action: started.action,
      reactionSkill,
      elapsedMs: 0,
      skillSpeedMultiplier,
      battleFormat
    });
    if (reactionResult.ok) {
      nextState = reactionResult.state;
      reaction = reactionResult.reaction;
    }
  }

  return resolveSkillCompletion({
    state: nextState,
    action: started.action,
    reaction,
    battleFormat
  });
}
