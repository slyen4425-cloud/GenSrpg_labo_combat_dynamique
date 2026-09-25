function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function stringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty array`);
  }
  return Object.freeze(
    [...new Set(value.map((item, index) =>
      requiredString(item, `${field}[${index}]`)
    ))]
  );
}

function normalizePolicy(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("opponent AI policy must be an object");
  }

  const reactionPriorityByApproach = {};
  const rawReactionMap = input.reactionPriorityByApproach ?? {};
  if (
    !rawReactionMap ||
    typeof rawReactionMap !== "object" ||
    Array.isArray(rawReactionMap)
  ) {
    throw new TypeError("reactionPriorityByApproach must be an object");
  }

  for (const [approach, ids] of Object.entries(rawReactionMap)) {
    reactionPriorityByApproach[
      requiredString(approach, "reaction approach")
    ] = stringArray(ids, `reactionPriorityByApproach.${approach}`);
  }

  return Object.freeze({
    id: requiredString(input.id, "policy.id"),
    skillCycle: stringArray(input.skillCycle, "policy.skillCycle"),
    reactionPriorityByApproach: Object.freeze(reactionPriorityByApproach),
    fallbackReactionPriority: stringArray(
      input.fallbackReactionPriority,
      "policy.fallbackReactionPriority"
    ),
    maxMovementActionsPerTurn: Math.max(
      0,
      Math.trunc(Number(input.maxMovementActionsPerTurn ?? 1))
    )
  });
}

function indexedById(items, field) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new TypeError(`${field} must be a non-empty array`);
  }

  const map = new Map();
  for (const item of items) {
    const id = requiredString(item?.id, `${field}.id`);
    if (map.has(id)) {
      throw new RangeError(`Duplicate ${field} id: ${id}`);
    }
    map.set(id, item);
  }
  return map;
}

export function createOpponentDecisionController({
  actorId = "opponent",
  targetId = "player",
  skills,
  reactions,
  policy
}) {
  const normalizedActorId = requiredString(actorId, "actorId");
  const normalizedTargetId = requiredString(targetId, "targetId");
  const skillById = indexedById(skills, "skills");
  const reactionById = indexedById(reactions, "reactions");
  const normalizedPolicy = normalizePolicy(policy);

  for (const skillId of normalizedPolicy.skillCycle) {
    if (!skillById.has(skillId)) {
      throw new RangeError(`Unknown AI skill in policy: ${skillId}`);
    }
  }

  const configuredReactionIds = new Set([
    ...normalizedPolicy.fallbackReactionPriority,
    ...Object.values(
      normalizedPolicy.reactionPriorityByApproach
    ).flat()
  ]);
  for (const reactionId of configuredReactionIds) {
    if (!reactionById.has(reactionId)) {
      throw new RangeError(
        `Unknown AI reaction in policy: ${reactionId}`
      );
    }
  }

  let skillCursor = 0;

  function cycleSkillAt(offset = 0) {
    const cycle = normalizedPolicy.skillCycle;
    const index = (skillCursor + offset) % cycle.length;
    return {
      index,
      skill: skillById.get(cycle[index])
    };
  }

  function reactionOrderFor(action) {
    const approachMode = action?.skill?.approachMode ?? "none";
    const primary =
      normalizedPolicy.reactionPriorityByApproach[approachMode] ?? [];
    return [...new Set([
      ...primary,
      ...normalizedPolicy.fallbackReactionPriority
    ])];
  }

  function chooseReaction({ action, previewReaction }) {
    if (typeof previewReaction !== "function") {
      throw new TypeError("previewReaction must be a function");
    }

    if (
      !action ||
      action.actionType !== "skill" ||
      action.actorId === normalizedActorId ||
      action.targetId !== normalizedActorId
    ) {
      return Object.freeze({
        kind: "wait",
        reason: "not_targeted"
      });
    }

    for (const reactionId of reactionOrderFor(action)) {
      const skill = reactionById.get(reactionId);
      const preview = previewReaction(skill);
      if (preview?.ok) {
        return Object.freeze({
          kind: "reaction",
          actorId: normalizedActorId,
          targetId: normalizedTargetId,
          skill,
          preview
        });
      }
    }

    return Object.freeze({
      kind: "wait",
      reason: "no_legal_reaction"
    });
  }

  function chooseAction({
    currentDistance,
    previewSkill,
    previewMovement
  }) {
    if (typeof previewSkill !== "function") {
      throw new TypeError("previewSkill must be a function");
    }
    if (typeof previewMovement !== "function") {
      throw new TypeError("previewMovement must be a function");
    }

    const desired = cycleSkillAt(0);
    const desiredPreview = previewSkill(desired.skill);

    if (desiredPreview?.ok) {
      return Object.freeze({
        kind: "skill",
        actorId: normalizedActorId,
        targetId: normalizedTargetId,
        skill: desired.skill,
        cycleIndex: desired.index,
        preview: desiredPreview
      });
    }

    if (
      desiredPreview?.outcome === "out_of_range" &&
      normalizedPolicy.maxMovementActionsPerTurn > 0
    ) {
      for (const toDistance of desired.skill.allowedDistances) {
        if (toDistance === currentDistance) {
          continue;
        }
        const preview = previewMovement(toDistance);
        if (preview?.ok) {
          return Object.freeze({
            kind: "move",
            actorId: normalizedActorId,
            toDistance,
            forSkillId: desired.skill.id,
            preview
          });
        }
      }
    }

    for (
      let offset = 1;
      offset < normalizedPolicy.skillCycle.length;
      offset += 1
    ) {
      const candidate = cycleSkillAt(offset);
      const preview = previewSkill(candidate.skill);
      if (preview?.ok) {
        return Object.freeze({
          kind: "skill",
          actorId: normalizedActorId,
          targetId: normalizedTargetId,
          skill: candidate.skill,
          cycleIndex: candidate.index,
          preview
        });
      }
    }

    return Object.freeze({
      kind: "wait",
      reason: desiredPreview?.outcome ?? "no_legal_action"
    });
  }

  function confirm(intent) {
    if (intent?.kind !== "skill") {
      return;
    }
    const cycleLength = normalizedPolicy.skillCycle.length;
    skillCursor = (Number(intent.cycleIndex) + 1) % cycleLength;
  }

  function reset() {
    skillCursor = 0;
  }

  return Object.freeze({
    chooseReaction,
    chooseAction,
    confirm,
    reset,
    get policyId() {
      return normalizedPolicy.id;
    },
    get actorId() {
      return normalizedActorId;
    },
    get targetId() {
      return normalizedTargetId;
    },
    get skillCursor() {
      return skillCursor;
    }
  });
}
