function requiredMethod(owner, method, label) {
  if (!owner || typeof owner[method] !== "function") {
    throw new TypeError(`${label} must provide ${method}()`);
  }
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function createBattleActorAiController({
  session,
  runtime,
  actorId,
  targetIds,
  skillIds,
  skillsById
}) {
  requiredMethod(session, "snapshot", "session");
  requiredMethod(session, "previewSkill", "session");
  requiredMethod(runtime, "startSkill", "runtime");
  requiredMethod(runtime, "hasActiveActionFor", "runtime");

  const normalizedActorId = requiredString(actorId, "actorId");
  if (!Array.isArray(targetIds) || targetIds.length === 0) {
    throw new TypeError("targetIds must be a non-empty array");
  }
  if (!Array.isArray(skillIds) || skillIds.length === 0) {
    throw new TypeError("skillIds must be a non-empty array");
  }

  const targets = Object.freeze(
    targetIds.map((id, index) =>
      requiredString(id, `targetIds[${index}]`)
    )
  );
  const skills = Object.freeze(
    skillIds.map((id, index) => {
      const skillId = requiredString(id, `skillIds[${index}]`);
      const skill =
        skillsById instanceof Map
          ? skillsById.get(skillId)
          : skillsById?.[skillId];
      if (!skill) {
        throw new RangeError(`Unknown AI skill: ${skillId}`);
      }
      return skill;
    })
  );

  let skillIndex = 0;

  function aliveTarget(state) {
    return targets.find((id) => Number(state.fighters[id]?.hp) > 0) ?? null;
  }

  function takeTurn() {
    const state = session.snapshot();
    const actor = state.fighters[normalizedActorId];

    if (!actor || Number(actor.hp) <= 0) {
      return Object.freeze({
        status: "defeated",
        actorId: normalizedActorId
      });
    }

    if (runtime.hasActiveActionFor(normalizedActorId)) {
      return Object.freeze({
        status: "busy",
        actorId: normalizedActorId
      });
    }

    const targetId = aliveTarget(state);
    if (!targetId) {
      return Object.freeze({
        status: "no_target",
        actorId: normalizedActorId
      });
    }

    const skill = skills[skillIndex];
    const preview = session.previewSkill({
      actorId: normalizedActorId,
      targetId,
      skill
    });

    if (!preview.ok) {
      if (preview.outcome === "insufficient_energy") {
        return Object.freeze({
          status: "saving",
          actorId: normalizedActorId,
          targetId,
          skillId: skill.id,
          skillName: skill.name,
          currentEnergy: actor.energy,
          requiredEnergy: skill.energyCost
        });
      }

      return Object.freeze({
        status: "waiting",
        actorId: normalizedActorId,
        targetId,
        skillId: skill.id,
        skillName: skill.name,
        reason: preview.outcome
      });
    }

    const result = runtime.startSkill({
      actorId: normalizedActorId,
      targetId,
      skill
    });

    if (!result.ok) {
      return Object.freeze({
        status: "waiting",
        actorId: normalizedActorId,
        targetId,
        skillId: skill.id,
        skillName: skill.name,
        reason: result.outcome
      });
    }

    skillIndex = (skillIndex + 1) % skills.length;
    return Object.freeze({
      status: "skill_started",
      actorId: normalizedActorId,
      targetId,
      skillId: skill.id,
      skillName: skill.name,
      result
    });
  }

  return Object.freeze({
    takeTurn,
    reset() {
      skillIndex = 0;
    },
    snapshot() {
      return Object.freeze({
        actorId: normalizedActorId,
        targetIds: targets,
        nextSkillId: skills[skillIndex].id
      });
    }
  });
}
