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

    const attempts = [];

    for (let offset = 0; offset < skills.length; offset += 1) {
      const candidateIndex =
        (skillIndex + offset) % skills.length;
      const skill = skills[candidateIndex];
      const preview = session.previewSkill({
        actorId: normalizedActorId,
        targetId,
        skill
      });

      attempts.push({ skill, preview, candidateIndex });

      if (!preview.ok) {
        continue;
      }

      const result = runtime.startSkill({
        actorId: normalizedActorId,
        targetId,
        skill
      });

      if (!result.ok) {
        attempts[attempts.length - 1] = {
          skill,
          preview: result,
          candidateIndex
        };
        continue;
      }

      skillIndex =
        (candidateIndex + 1) % skills.length;

      return Object.freeze({
        status: "skill_started",
        actorId: normalizedActorId,
        targetId,
        skillId: skill.id,
        skillName: skill.name,
        result
      });
    }

    const energyBlocked = attempts.find(
      ({ preview }) =>
        preview.outcome === "insufficient_energy"
    );

    if (energyBlocked) {
      return Object.freeze({
        status: "saving",
        actorId: normalizedActorId,
        targetId,
        skillId: energyBlocked.skill.id,
        skillName: energyBlocked.skill.name,
        currentEnergy: actor.energy,
        requiredEnergy: energyBlocked.skill.energyCost
      });
    }

    const blocked = attempts[0];
    return Object.freeze({
      status: "waiting",
      actorId: normalizedActorId,
      targetId,
      skillId: blocked?.skill.id ?? null,
      skillName: blocked?.skill.name ?? null,
      reason: blocked?.preview.outcome ?? "no_usable_skill"
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
