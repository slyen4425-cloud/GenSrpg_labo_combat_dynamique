import { movementEnergyCost, isSkillInRange } from "./distance.js";
import { withDistance, withFighterEnergy } from "./combat-state.js";

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

function event(type, atMs, data = {}) {
  return Object.freeze({ type, atMs, ...data });
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

export function resolveSkill({
  state,
  actorId,
  targetId,
  skill,
  reactionSkill = null
}) {
  const actor = fighterOf(state, actorId);
  const target = fighterOf(state, targetId);

  if (!isSkillInRange(skill, state.distance)) {
    return Object.freeze({
      ok: false,
      outcome: "out_of_range",
      state,
      events: Object.freeze([
        event("skill-rejected", 0, { actorId, skillId: skill.id, reason: "out_of_range" })
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

  let next = spendEnergy(state, actorId, skill.energyCost);

  const releaseAt = skill.preparationMs;
  const impactAt = releaseAt + skill.travelMs;
  const reactionReadyAt = reactionSkill?.preparationMs ?? null;

  let reaction = null;
  if (
    reactionSkill &&
    target.energy >= reactionSkill.energyCost &&
    reactionReadyAt <= impactAt
  ) {
    next = spendEnergy(next, targetId, reactionSkill.energyCost);
    reaction = reactionSkill;
  }

  const events = [
    event("skill-start", 0, { actorId, targetId, skillId: skill.id })
  ];

  if (reaction) {
    events.push(event("reaction-ready", reactionReadyAt, {
      actorId: targetId,
      targetId: actorId,
      skillId: reaction.id
    }));
  }

  let outcome = "hit";

  if (reaction) {
    if (skill.element && reaction.reaction.immuneElements.includes(skill.element)) {
      outcome = "immune";
    } else if (reaction.reaction.reflectForms.includes(skill.form)) {
      outcome = "reflected";
    } else if (reaction.reaction.counterForms.includes(skill.form)) {
      outcome = "countered";
    } else if (reaction.reaction.blockForms.includes(skill.form)) {
      outcome = "blocked";
    }
  }

  if (!(outcome === "countered" && reactionReadyAt < releaseAt)) {
    events.push(event("skill-release", releaseAt, {
      actorId,
      targetId,
      skillId: skill.id,
      form: skill.form,
      element: skill.element
    }));
  }

  if (outcome === "countered") {
    events.push(event("skill-countered", reactionReadyAt, {
      actorId,
      targetId,
      skillId: skill.id,
      reactionSkillId: reaction.id
    }));
    events.push(event("skill-cancelled", reactionReadyAt, {
      actorId,
      targetId,
      skillId: skill.id,
      reason: "countered"
    }));
  } else {
    events.push(event("skill-arrive", impactAt, {
      actorId,
      targetId,
      skillId: skill.id,
      outcome
    }));

    if (outcome === "hit") {
      events.push(event("hit", impactAt, {
        actorId: targetId,
        sourceActorId: actorId,
        skillId: skill.id,
        damage: skill.effect.damage
      }));
    } else if (outcome === "reflected") {
      events.push(event("hit", impactAt, {
        actorId,
        sourceActorId: targetId,
        skillId: skill.id,
        reflected: true,
        damage: skill.effect.damage
      }));
    } else {
      events.push(event(`skill-${outcome}`, impactAt, {
        actorId,
        targetId,
        skillId: skill.id,
        reactionSkillId: reaction?.id ?? null
      }));
    }
  }

  const resolutionAt = outcome === "countered" ? reactionReadyAt : impactAt;

  events.push(event("skill-recovery-complete", resolutionAt + skill.recoveryMs, {
    actorId,
    skillId: skill.id
  }));

  return Object.freeze({
    ok: true,
    outcome,
    state: next,
    reactionApplied: reaction?.id ?? null,
    timelineMs: Object.freeze({
      preparation: skill.preparationMs,
      travel: skill.travelMs,
      recovery: skill.recoveryMs,
      reactionReady: reaction ? reactionReadyAt : null
    }),
    events: Object.freeze(events.sort((a, b) => a.atMs - b.atMs))
  });
}
