import { movementEnergyCost, isSkillInRange } from "./distance.js";
import {
  withDistance,
  withFighterEnergy,
  withFighterHp
} from "./combat-state.js";
import { effectivePreparationMs } from "./combat-timing.js";

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

function applyDamage(state, fighterId, amount) {
  const fighter = fighterOf(state, fighterId);
  const damage = Math.max(0, Number(amount) || 0);
  return withFighterHp(state, fighterId, fighter.hp - damage);
}

function event(type, atMs, data = {}) {
  return Object.freeze({ type, atMs, ...data });
}

function preparationFor(state, fighterId, skill) {
  const fighter = fighterOf(state, fighterId);
  return effectivePreparationMs({
    baseMs: skill.preparationMs,
    permanentPct: fighter.chargeTimeModifierPct,
    effects: fighter.chargeTimeEffects,
    atMs: state.elapsedMs
  });
}

function reactionOutcome(skill, reactionSkill) {
  if (
    reactionSkill.reaction.evadeForms.includes(skill.form) ||
    reactionSkill.reaction.evadeApproaches.includes(skill.approachMode)
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
  skill
}) {
  const actor = fighterOf(state, actorId);
  fighterOf(state, targetId);

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

  const preparationMs = preparationFor(state, actorId, skill);
  const action = Object.freeze({
    actionType: "skill",
    actionId: skill.id,
    actorId,
    targetId,
    skill,
    preparationMs,
    travelMs: skill.travelMs,
    recoveryMs: skill.recoveryMs,
    releaseAtMs: preparationMs,
    impactAtMs: preparationMs + skill.travelMs,
    interruptibleDuringPreparation: skill.interruptibleDuringPreparation
  });

  return Object.freeze({
    ok: true,
    outcome: "started",
    state: spendEnergy(state, actorId, skill.energyCost),
    action,
    events: Object.freeze([
      event("skill-start", 0, {
        actorId,
        targetId,
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
  elapsedMs
}) {
  const elapsed = Number(elapsedMs);
  if (!Number.isFinite(elapsed) || elapsed < 0) {
    throw new RangeError("elapsedMs must be a non-negative finite number");
  }

  const target = fighterOf(state, action.targetId);
  const outcome = reactionOutcome(action.skill, reactionSkill);

  if (!outcome) {
    return Object.freeze({
      ok: false,
      outcome: "no_effect",
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

  const preparationMs = preparationFor(state, action.targetId, reactionSkill);
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

  return Object.freeze({
    ok: true,
    outcome,
    state: spendEnergy(state, action.targetId, reactionSkill.energyCost),
    reaction
  });
}

export function resolveSkillCompletion({
  state,
  action,
  reaction = null
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

  const outcome = reaction?.outcome ?? "hit";
  const reactionReadyAt = reaction?.readyAtMs ?? null;
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
      const before = fighterOf(nextState, targetId).hp;
      nextState = applyDamage(nextState, targetId, skill.effect.damage);
      const after = fighterOf(nextState, targetId).hp;

      events.push(event("hit", impactAtMs, {
        actorId: targetId,
        sourceActorId: actorId,
        skillId: skill.id,
        damage: skill.effect.damage,
        hpBefore: before,
        hpAfter: after
      }));

      if (skill.effect.interruptsPreparation) {
        events.push(event("charge-interrupt", impactAtMs, {
          actorId: targetId,
          sourceActorId: actorId,
          skillId: skill.id,
          reason: "stun",
          stunMs: skill.effect.stunMs
        }));
      }
    } else if (outcome === "reflected") {
      const before = fighterOf(nextState, actorId).hp;
      nextState = applyDamage(nextState, actorId, skill.effect.damage);
      const after = fighterOf(nextState, actorId).hp;

      events.push(event("hit", impactAtMs, {
        actorId,
        sourceActorId: targetId,
        skillId: skill.id,
        reflected: true,
        damage: skill.effect.damage,
        hpBefore: before,
        hpAfter: after
      }));
    } else {
      events.push(event(`skill-${outcome}`, impactAtMs, {
        actorId,
        targetId,
        skillId: skill.id,
        reactionSkillId: reaction?.skillId ?? null
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
    skillId: skill.id,
    actorId,
    targetId,
    outcome,
    state: nextState,
    reactionApplied: reaction?.skillId ?? null,
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
  reactionSkill = null
}) {
  const started = resolveSkillStart({
    state,
    actorId,
    targetId,
    skill
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
      elapsedMs: 0
    });
    if (reactionResult.ok) {
      nextState = reactionResult.state;
      reaction = reactionResult.reaction;
    }
  }

  return resolveSkillCompletion({
    state: nextState,
    action: started.action,
    reaction
  });
}
