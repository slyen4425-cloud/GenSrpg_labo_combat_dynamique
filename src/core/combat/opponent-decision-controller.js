import { COMBAT_DISTANCES } from "../../contracts/skill-definition.js";

function requiredMethod(owner, method, label) {
  if (!owner || typeof owner[method] !== "function") {
    throw new TypeError(`${label} must provide ${method}()`);
  }
}

function lookup(source, id, label) {
  const value = source instanceof Map ? source.get(id) : source?.[id];
  if (!value) {
    throw new RangeError(`Unknown ${label}: ${id}`);
  }
  return value;
}

function matchesRule(skill, when) {
  return Object.entries(when).every(
    ([field, expected]) => skill?.[field] === expected
  );
}

function nextDistanceTowards(from, to) {
  const fromIndex = COMBAT_DISTANCES.indexOf(from);
  const toIndex = COMBAT_DISTANCES.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) {
    throw new RangeError(
      `Unsupported AI distance transition: ${from} -> ${to}`
    );
  }
  if (fromIndex === toIndex) {
    return from;
  }
  return COMBAT_DISTANCES[
    fromIndex + Math.sign(toIndex - fromIndex)
  ];
}

export function createOpponentDecisionController({
  session,
  runtime,
  roster,
  policy,
  skillsById,
  reactionsById
}) {
  requiredMethod(session, "snapshot", "session");
  requiredMethod(session, "previewMovement", "session");
  requiredMethod(session, "move", "session");
  requiredMethod(session, "previewSkill", "session");
  requiredMethod(runtime, "previewReaction", "runtime");
  requiredMethod(runtime, "react", "runtime");
  requiredMethod(runtime, "startSkill", "runtime");
  requiredMethod(roster, "snapshot", "roster");

  if (!policy?.actorId || !policy?.targetId) {
    throw new TypeError("normalized opponent AI policy is required");
  }

  for (const rule of policy.reactionRules) {
    lookup(reactionsById, rule.skillId, "reaction skill");
  }
  for (const step of policy.turnPlan) {
    const skill = lookup(skillsById, step.skillId, "offensive skill");
    if (!skill.allowedDistances.includes(step.preferredDistance)) {
      throw new RangeError(
        `AI preferred distance ${step.preferredDistance} is invalid for ${step.skillId}`
      );
    }
  }

  let planIndex = 0;

  function activeRosterReady() {
    const state = roster.snapshot();
    const actorTeam = state[policy.actorId];
    const targetTeam = state[policy.targetId];

    if (!actorTeam?.activeMemberId) {
      return Object.freeze({
        ok: false,
        outcome: "no_active_actor"
      });
    }
    if (!targetTeam?.activeMemberId) {
      return Object.freeze({
        ok: false,
        outcome: "no_active_target"
      });
    }
    return Object.freeze({ ok: true });
  }

  function maybeReactToActiveAction() {
    const action = runtime.activeAction;
    if (
      !action ||
      action.actionType !== "skill" ||
      action.actorId !== policy.targetId ||
      action.targetId !== policy.actorId
    ) {
      return Object.freeze({
        status: "ignored",
        reason: "no_reactable_player_skill"
      });
    }

    for (const rule of policy.reactionRules) {
      if (!matchesRule(action.skill, rule.when)) {
        continue;
      }

      const reactionSkill = lookup(
        reactionsById,
        rule.skillId,
        "reaction skill"
      );
      const preview = runtime.previewReaction(reactionSkill);
      if (!preview.ok) {
        continue;
      }

      const result = runtime.react(reactionSkill);
      if (!result.ok) {
        continue;
      }

      return Object.freeze({
        status: "reacted",
        skillId: reactionSkill.id,
        skillName: reactionSkill.name,
        outcome: result.outcome,
        result
      });
    }

    return Object.freeze({
      status: "waiting",
      reason: "no_legal_reaction"
    });
  }

  function takeTurn() {
    if (runtime.hasActiveAction) {
      return Object.freeze({
        status: "busy",
        reason: "action_in_progress"
      });
    }

    const rosterReady = activeRosterReady();
    if (!rosterReady.ok) {
      return Object.freeze({
        status: "waiting",
        reason: rosterReady.outcome
      });
    }

    const step = policy.turnPlan[planIndex];
    const skill = lookup(
      skillsById,
      step.skillId,
      "offensive skill"
    );
    const state = session.snapshot();

    if (state.distance !== step.preferredDistance) {
      const toDistance = nextDistanceTowards(
        state.distance,
        step.preferredDistance
      );
      const preview = session.previewMovement(
        policy.actorId,
        toDistance
      );

      if (!preview.ok) {
        return Object.freeze({
          status: "waiting",
          reason: preview.outcome,
          plannedSkillId: skill.id,
          preferredDistance: step.preferredDistance
        });
      }

      const result = session.move(
        policy.actorId,
        toDistance
      );

      return Object.freeze({
        status: "moved",
        actorId: policy.actorId,
        targetId: policy.targetId,
        plannedSkillId: skill.id,
        preferredDistance: step.preferredDistance,
        result
      });
    }

    const preview = session.previewSkill({
      actorId: policy.actorId,
      targetId: policy.targetId,
      skill
    });

    if (!preview.ok) {
      return Object.freeze({
        status: "waiting",
        reason: preview.outcome,
        plannedSkillId: skill.id,
        preferredDistance: step.preferredDistance
      });
    }

    const started = runtime.startSkill({
      actorId: policy.actorId,
      targetId: policy.targetId,
      skill
    });

    if (!started.ok) {
      return Object.freeze({
        status: "waiting",
        reason: started.outcome,
        plannedSkillId: skill.id,
        preferredDistance: step.preferredDistance
      });
    }

    planIndex = (planIndex + 1) % policy.turnPlan.length;

    return Object.freeze({
      status: "skill_started",
      actorId: policy.actorId,
      targetId: policy.targetId,
      skillId: skill.id,
      skillName: skill.name,
      preferredDistance: step.preferredDistance,
      result: started
    });
  }

  function reset() {
    planIndex = 0;
  }

  return Object.freeze({
    maybeReactToActiveAction,
    takeTurn,
    reset,
    snapshot() {
      return Object.freeze({
        planIndex,
        currentStep: policy.turnPlan[planIndex]
      });
    }
  });
}
