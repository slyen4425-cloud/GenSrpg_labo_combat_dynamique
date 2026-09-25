const EPSILON_MS = 1e-7;

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return number;
}

function isMutualCancelProjectile(action) {
  return (
    action?.actionType === "skill" &&
    action.skill?.form === "projectile" &&
    action.skill?.projectileClash?.mode === "mutual_cancel" &&
    typeof action.skill.projectileClash.group === "string" &&
    action.skill.projectileClash.group.length > 0
  );
}

export function projectileClashCandidate({
  leftAction,
  leftStartedAtClockMs,
  rightAction,
  rightStartedAtClockMs
}) {
  if (
    !isMutualCancelProjectile(leftAction) ||
    !isMutualCancelProjectile(rightAction)
  ) {
    return null;
  }

  if (
    leftAction.skill.projectileClash.group !==
    rightAction.skill.projectileClash.group
  ) {
    return null;
  }

  if (
    leftAction.actorId !== rightAction.targetId ||
    rightAction.actorId !== leftAction.targetId
  ) {
    return null;
  }

  const leftTravelMs = finiteNumber(
    leftAction.travelMs,
    "leftAction.travelMs"
  );
  const rightTravelMs = finiteNumber(
    rightAction.travelMs,
    "rightAction.travelMs"
  );

  if (leftTravelMs <= 0 || rightTravelMs <= 0) {
    return null;
  }

  const leftStart = finiteNumber(
    leftStartedAtClockMs,
    "leftStartedAtClockMs"
  );
  const rightStart = finiteNumber(
    rightStartedAtClockMs,
    "rightStartedAtClockMs"
  );

  const leftRelease =
    leftStart + finiteNumber(leftAction.releaseAtMs, "leftAction.releaseAtMs");
  const rightRelease =
    rightStart + finiteNumber(
      rightAction.releaseAtMs,
      "rightAction.releaseAtMs"
    );
  const leftImpact =
    leftStart + finiteNumber(leftAction.impactAtMs, "leftAction.impactAtMs");
  const rightImpact =
    rightStart + finiteNumber(
      rightAction.impactAtMs,
      "rightAction.impactAtMs"
    );

  const atClockMs =
    (
      rightTravelMs * leftRelease +
      leftTravelMs * rightRelease +
      leftTravelMs * rightTravelMs
    ) /
    (leftTravelMs + rightTravelMs);

  const sharedTravelStart = Math.max(leftRelease, rightRelease);
  const sharedTravelEnd = Math.min(leftImpact, rightImpact);

  if (
    atClockMs < sharedTravelStart - EPSILON_MS ||
    atClockMs > sharedTravelEnd + EPSILON_MS
  ) {
    return null;
  }

  const leftProgress = Math.min(
    1,
    Math.max(0, (atClockMs - leftRelease) / leftTravelMs)
  );
  const rightProgress = Math.min(
    1,
    Math.max(0, (atClockMs - rightRelease) / rightTravelMs)
  );

  if (Math.abs(leftProgress + rightProgress - 1) > 1e-6) {
    return null;
  }

  return Object.freeze({
    atClockMs,
    group: leftAction.skill.projectileClash.group,
    leftProgress,
    rightProgress
  });
}

function clashResolution({
  state,
  action,
  otherAction,
  startedAtClockMs,
  atClockMs,
  progress,
  group
}) {
  const atMs = Math.max(0, atClockMs - startedAtClockMs);

  return Object.freeze({
    ok: true,
    actionType: "skill",
    actorId: action.actorId,
    targetId: action.targetId,
    skillId: action.actionId,
    outcome: "clashed",
    state,
    clash: Object.freeze({
      group,
      otherActorId: otherAction.actorId,
      otherSkillId: otherAction.actionId,
      progress
    }),
    events: Object.freeze([
      Object.freeze({
        type: "projectile-clash",
        atMs,
        actorId: action.actorId,
        targetId: action.targetId,
        skillId: action.actionId,
        otherActorId: otherAction.actorId,
        otherSkillId: otherAction.actionId,
        group,
        progress
      }),
      Object.freeze({
        type: "skill-cancelled",
        atMs,
        actorId: action.actorId,
        targetId: action.targetId,
        skillId: action.actionId,
        reason: "projectile_clash"
      })
    ])
  });
}

export function resolveProjectileClash({
  state,
  leftAction,
  leftStartedAtClockMs,
  rightAction,
  rightStartedAtClockMs,
  candidate
}) {
  if (!candidate) {
    return null;
  }

  return Object.freeze({
    left: clashResolution({
      state,
      action: leftAction,
      otherAction: rightAction,
      startedAtClockMs: leftStartedAtClockMs,
      atClockMs: candidate.atClockMs,
      progress: candidate.leftProgress,
      group: candidate.group
    }),
    right: clashResolution({
      state,
      action: rightAction,
      otherAction: leftAction,
      startedAtClockMs: rightStartedAtClockMs,
      atClockMs: candidate.atClockMs,
      progress: candidate.rightProgress,
      group: candidate.group
    })
  });
}
