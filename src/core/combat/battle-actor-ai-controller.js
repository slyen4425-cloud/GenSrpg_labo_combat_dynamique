export const CAPTURE_AI_TACTICS_V1_DEFAULT = Object.freeze({
  enabled: true,
  seed: 17,
  dodgeChancePct: 45,
  repeatPenalty: 5
});

function bounded(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function textSeed(value) {
  let hash = 2166136261;
  for (const letter of String(value)) {
    hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

function tacticalVariation(seed, turn, index) {
  let v = (seed ^ Math.imul(turn + 1, 0x9e3779b1) ^ Math.imul(index + 1, 0x85ebca6b)) >>> 0;
  v = Math.imul(v ^ (v >>> 16), 0x7feb352d);
  v = Math.imul(v ^ (v >>> 15), 0x846ca68b);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967295;
}

function tacticalValue(skill, target, actor, enemy, recentSkillIds, profile, variation) {
  const effects = Array.isArray(skill.effects) ? skill.effects : [];
  const missing = Math.max(0, Number(target?.maxHp ?? target?.hp ?? 0) - Number(target?.hp ?? 0));
  let value = 3;
  let healing = 0;
  let damaging = 0;
  for (const effect of effects) {
    if (effect.kind === "damage") damaging += Math.max(0, Number(effect.amount) || 0);
    if (effect.kind === "heal") healing += Math.max(0, Number(effect.amount) || 0);
    if (effect.kind === "damage_over_time" || effect.kind === "stack_counter") value += 2;
    if (effect.kind === "stat_modifier" || effect.kind === "shield") value += 2;
    if (effect.kind === "persistent_zone") value += 5;
    if (effect.status?.kind === "stun" || effect.status?.kind === "stack_counter") value += 3;
  }
  damaging += Math.max(0, Number(skill.effect?.damage) || 0);
  healing += Math.max(0, Number(skill.effect?.heal) || 0);
  if (damaging > 0) {
    value += Math.min(12, damaging / 3);
    if (enemy && Number(target.hp) <= damaging) value += 5;
    if (enemy && Number(target.maxHp) > 0) value += 1 - Number(target.hp) / Number(target.maxHp);
  }
  if (healing > 0) {
    value += Math.min(18, Math.min(missing, healing) / 2);
    if (missing === 0) value -= 14;
    const ratio = Number(target.hp) / Math.max(1, Number(target.maxHp) || 1);
    if (ratio <= 0.35 && missing > 0) value += 7;
  }
  if (recentSkillIds[0] === skill.id) value -= profile.repeatPenalty;
  if (recentSkillIds[1] === skill.id) value -= profile.repeatPenalty / 3;
  value -= Math.max(0, Number(skill.energyCost) || 0) / 5;
  return value + variation * 2;
}

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
  skillsById,
  allyIds = [],
  tactics = null,
  dodge = null
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
  let tacticalTurnIndex = 0;
  let threatNumber = 0;
  let visibleThreat = null;
  const recentSkillIds = [];
  const adaptive = Boolean(tactics?.enabled);
  const profile = adaptive
    ? Object.freeze({ ...CAPTURE_AI_TACTICS_V1_DEFAULT, ...tactics })
    : null;
  const tacticSeed = textSeed(normalizedActorId) ^ (Number(profile?.seed) || 0);
  const allies = Object.freeze(allyIds.filter(id => typeof id === "string" && id !== normalizedActorId));

  function candidateTargetIds(skill) {
    const relations = Array.isArray(skill.targetRelations) ? skill.targetRelations : null;
    if (!relations) return targets;
    const result = [];
    if (relations.includes("self")) result.push(normalizedActorId);
    if (relations.includes("ally")) result.push(...allies);
    if (relations.includes("enemy")) result.push(...targets);
    return [...new Set(result)];
  }

  function tacticalTurn(state, actor, defaultTargetId) {
    const choices = [];
    let saving = null;
    let waiting = null;
    for (let index = 0; index < skills.length; index++) {
      const skill = skills[index];
      const goal = reinforcementGoal(state, actor, skill);
      for (const targetId of candidateTargetIds(skill)) {
        const target = state.fighters[targetId];
        if (!target || Number(target.hp) <= 0) continue;
        const preview = session.previewSkill({ actorId: normalizedActorId, targetId, skill });
        if (!preview.ok) {
          if (preview.outcome === "insufficient_energy" && !saving) {
            saving = { skill, targetId };
          }
          if (goal?.active && preview.outcome === "cooldown" && !waiting) {
            waiting = { skill, targetId, reason: preview.outcome };
          }
          continue;
        }
        const requiredEnergy = goal && !goal.active
          ? Math.max(skill.energyCost, Math.min(Number(actor.maxEnergy ?? skill.energyCost), skill.energyCost * goal.remaining))
          : skill.energyCost;
        if (actor.energy < requiredEnergy) {
          if (!saving) saving = {skill, targetId, requiredEnergy};
          continue;
        }
        choices.push({
          skill, targetId, candidateIndex: index,
          score: tacticalValue(skill, target, actor, targetId !== normalizedActorId && !allies.includes(targetId),
            recentSkillIds, profile, tacticalVariation(tacticSeed, tacticalTurnIndex, index + (targets.indexOf(targetId) + 1) * skills.length))
            + (goal?.active ? 75 : goal ? 16 : 0)
        });
      }
    }
    choices.sort((a,b) => b.score - a.score || a.candidateIndex - b.candidateIndex);
    for (const choice of choices) {
      const result = runtime.startSkill({actorId:normalizedActorId, targetId:choice.targetId, skill:choice.skill});
      if (!result.ok) continue;
      recentSkillIds.unshift(choice.skill.id);
      if (recentSkillIds.length > 2) recentSkillIds.pop();
      tacticalTurnIndex++;
      skillIndex = (choice.candidateIndex + 1) % skills.length;
      return Object.freeze({status:"skill_started",actorId:normalizedActorId,targetId:choice.targetId,
        skillId:choice.skill.id,skillName:choice.skill.name,result});
    }
    if (waiting) return Object.freeze({status:"waiting",actorId:normalizedActorId,
      targetId:waiting.targetId,skillId:waiting.skill.id,reason:waiting.reason});
    if (saving) return Object.freeze({status:"saving",actorId:normalizedActorId,
      targetId:saving.targetId,skillId:saving.skill.id,skillName:saving.skill.name,
      currentEnergy:actor.energy,requiredEnergy:saving.requiredEnergy ?? saving.skill.energyCost});
    return Object.freeze({status:"waiting",actorId:normalizedActorId,targetId:defaultTargetId,reason:"no_usable_skill"});
  }

  // Only released, observable hostile attacks can create an AI dodge threat.
  function observeRelease({ action, elapsedMs }) {
    if (!adaptive || !dodge || (dodge.type !== "defense" && !dodge.skill) || action?.actionType !== "skill" ||
      action.targetId !== normalizedActorId || action.actorId === normalizedActorId) {
      return Object.freeze({status:"ignored"});
    }
    const form = action.skill?.form;
    if (dodge.type !== "defense" && !dodge.skill.reaction?.evadeForms?.includes(form)) {
      return Object.freeze({status:"ignored"});
    }
    const travel = Number(action.impactAtMs) - Number(action.releaseAtMs);
    if (!Number.isFinite(travel) || travel <= 0) return Object.freeze({status:"ignored"});
    const number = ++threatNumber;
    const roll = tacticalVariation(tacticSeed, number, 19) * 100;
    visibleThreat = {sourceActorId:action.actorId, impactAtMs:Number(elapsedMs) + travel,
      willDodge:roll < bounded(profile.dodgeChancePct,0,100), decided:false};
    return Object.freeze({status:"observed",actorId:normalizedActorId});
  }

  function maybeDodge({elapsedMs}) {
    if (!adaptive || !dodge || (dodge.type !== "defense" && !dodge.skill) || !visibleThreat) return Object.freeze({status:"disabled"});
    const threat = visibleThreat;
    const actor = session.snapshot().fighters[normalizedActorId];
    if (!actor || Number(actor.hp) <= 0) {
      visibleThreat = null;
      return Object.freeze({status:"ignored"});
    }
    const remaining = threat.impactAtMs - Number(elapsedMs);
    if (remaining <= 0) { visibleThreat = null; return Object.freeze({status:"expired"}); }
    if (threat.decided || !threat.willDodge) return Object.freeze({status:"waiting"});
    const windowMs = Number(dodge.activeWindowMs);
    if (!Number.isFinite(windowMs) || windowMs <= 0 ||
        remaining > windowMs * 0.8) return Object.freeze({status:"waiting"});
    if (!runtime.rechargeableActionAvailability || !runtime.rechargeableReactionWindowStatus ||
        !runtime.previewRechargeableReaction || !runtime.activateRechargeableReaction) return Object.freeze({status:"unsupported"});
    const charges = runtime.rechargeableActionAvailability({actorId:normalizedActorId,...dodge.recharge});
    if (charges.charges <= 0) return Object.freeze({status:"no_charges"});
    const active = runtime.rechargeableReactionWindowStatus({actorId:normalizedActorId,
      recharge:dodge.recharge,activeWindowMs:windowMs});
    if (active.active) { threat.decided = true; return Object.freeze({status:"already_active"}); }
    if (dodge.type !== "defense") {
      const preview = runtime.previewRechargeableReaction(dodge.skill,
        {againstActorId:threat.sourceActorId,recharge:dodge.recharge});
      if (!preview.ok) return Object.freeze({status:"not_legal",reason:preview.outcome});
    }
    const result = runtime.activateRechargeableReaction(dodge.skill,
      {actorId:normalizedActorId,recharge:dodge.recharge,activeWindowMs:windowMs});
    if (!result.ok) return Object.freeze({status:"not_legal",reason:result.outcome});
    threat.decided = true;
    return Object.freeze({status:dodge.type === "defense" ? "defended" : "dodged",actorId:normalizedActorId,
      durationMs:Number(result.window?.remainingMs ?? windowMs),result});
  }


  function aliveTarget(state) {
    return targets.find((id) => Number(state.fighters[id]?.hp) > 0) ?? null;
  }

  function reinforcementGoal(state, actor, skill) {
    const usesLeft = skill.maxUsesPerCombat == null ? Infinity
      : skill.maxUsesPerCombat - Number(actor.skillUseCounts?.[skill.id] ?? 0);
    if (usesLeft <= 0) return null;
    for (const effect of skill.effects ?? []) {
      if (effect.kind !== "persistent_zone" || effect.reactivation !== "reinforce" || effect.radiusGrowthSteps <= 0 || effect.maxActivations <= 1) continue;
      const zone = (state.persistentZones ?? []).find(entry => entry.sourceActorId === normalizedActorId && entry.detachedFromSource !== true && entry.skillId === skill.id && entry.zoneId === effect.zoneId && entry.expiresAtMs > state.elapsedMs);
      if (zone?.radius === "long" || (zone?.activations ?? 0) >= effect.maxActivations) continue;
      return { active: Boolean(zone), remaining: Math.min(usesLeft, effect.maxActivations - (zone?.activations ?? 0)) };
    }
    return null;
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

    if (adaptive) return tacticalTurn(state, actor, targetId);

    const attempts = [];

    const candidates = skills.map((skill, candidateIndex) => ({ skill, candidateIndex,
      goal: reinforcementGoal(state, actor, skill) }));
    candidates.sort((left, right) => Number(Boolean(right.goal)) - Number(Boolean(left.goal))
      || (left.candidateIndex - skillIndex + skills.length) % skills.length
        - (right.candidateIndex - skillIndex + skills.length) % skills.length);

    for (const { skill, candidateIndex, goal } of candidates) {
      const preview = session.previewSkill({
        actorId: normalizedActorId,
        targetId,
        skill
      });

      attempts.push({ skill, preview, candidateIndex });

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
        // Keep the energy available for the next reinforcement during its cooldown.
        if (goal?.active && preview.outcome === "cooldown") {
          return Object.freeze({ status: "waiting", actorId: normalizedActorId, targetId,
            skillId: skill.id, skillName: skill.name, reason: preview.outcome });
        }
        continue;
      }

      // Bank the opening sequence before activating a short-lived growing zone.
      const requiredEnergy = goal && !goal.active
        ? Math.max(skill.energyCost, Math.min(Number(actor.maxEnergy ?? skill.energyCost), skill.energyCost * goal.remaining))
        : skill.energyCost;
      if (actor.energy < requiredEnergy) {
        return Object.freeze({ status: "saving", actorId: normalizedActorId, targetId,
          skillId: skill.id, skillName: skill.name, currentEnergy: actor.energy, requiredEnergy });
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
    observeRelease,
    maybeDodge,
    reset() {
      skillIndex = 0;
      tacticalTurnIndex = 0;
      threatNumber = 0;
      visibleThreat = null;
      recentSkillIds.length = 0;
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
