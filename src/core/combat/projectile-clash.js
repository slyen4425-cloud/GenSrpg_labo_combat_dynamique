const EPSILON_MS = 1e-7;

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(
      field + " must be a finite number"
    );
  }
  return number;
}

function projectileClashConfig(action) {
  if (
    action?.actionType !== "skill" ||
    action.skill?.form !== "projectile"
  ) {
    return null;
  }

  const clash =
    action.skill?.projectileClash;

  if (
    !clash ||
    typeof clash.tag !== "string" ||
    clash.tag.length === 0 ||
    !Array.isArray(clash.rules)
  ) {
    return null;
  }

  return clash;
}

function strengthAgainst(
  clash,
  otherTag
) {
  return (
    clash.rules.find(
      (rule) =>
        rule.againstTag === otherTag
    )?.strength ?? 0
  );
}

function clashOutcome(
  leftStrength,
  rightStrength
) {
  if (leftStrength > rightStrength) {
    return "left_survives";
  }
  if (rightStrength > leftStrength) {
    return "right_survives";
  }
  return "mutual_cancel";
}

export function projectileClashCandidate({
  leftAction,
  leftStartedAtClockMs,
  rightAction,
  rightStartedAtClockMs
}) {
  const leftClash =
    projectileClashConfig(
      leftAction
    );
  const rightClash =
    projectileClashConfig(
      rightAction
    );

  if (
    leftClash === null ||
    rightClash === null
  ) {
    return null;
  }

  const leftTag = leftClash.tag;
  const rightTag = rightClash.tag;
  const leftStrength =
    strengthAgainst(
      leftClash,
      rightTag
    );
  const rightStrength =
    strengthAgainst(
      rightClash,
      leftTag
    );

  if (
    leftStrength <= 0 &&
    rightStrength <= 0
  ) {
    return null;
  }

  if (
    leftAction.actorId !==
      rightAction.targetId ||
    rightAction.actorId !==
      leftAction.targetId
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

  if (
    leftTravelMs <= 0 ||
    rightTravelMs <= 0
  ) {
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
    leftStart +
    finiteNumber(
      leftAction.releaseAtMs,
      "leftAction.releaseAtMs"
    );
  const rightRelease =
    rightStart +
    finiteNumber(
      rightAction.releaseAtMs,
      "rightAction.releaseAtMs"
    );
  const leftImpact =
    leftStart +
    finiteNumber(
      leftAction.impactAtMs,
      "leftAction.impactAtMs"
    );
  const rightImpact =
    rightStart +
    finiteNumber(
      rightAction.impactAtMs,
      "rightAction.impactAtMs"
    );

  const atClockMs =
    (
      rightTravelMs * leftRelease +
      leftTravelMs * rightRelease +
      leftTravelMs * rightTravelMs
    ) /
    (
      leftTravelMs +
      rightTravelMs
    );

  const sharedTravelStart =
    Math.max(
      leftRelease,
      rightRelease
    );
  const sharedTravelEnd =
    Math.min(
      leftImpact,
      rightImpact
    );

  if (
    atClockMs <
      sharedTravelStart -
        EPSILON_MS ||
    atClockMs >
      sharedTravelEnd +
        EPSILON_MS
  ) {
    return null;
  }

  const leftProgress =
    Math.min(
      1,
      Math.max(
        0,
        (
          atClockMs -
          leftRelease
        ) /
          leftTravelMs
      )
    );
  const rightProgress =
    Math.min(
      1,
      Math.max(
        0,
        (
          atClockMs -
          rightRelease
        ) /
          rightTravelMs
      )
    );

  if (
    Math.abs(
      leftProgress +
        rightProgress -
        1
    ) >
    1e-6
  ) {
    return null;
  }

  const interactionKey =
    [leftTag, rightTag]
      .sort()
      .join("::");

  return Object.freeze({
    atClockMs,
    leftTag,
    rightTag,
    leftStrength,
    rightStrength,
    outcome:
      clashOutcome(
        leftStrength,
        rightStrength
      ),
    interactionKey,
    leftProgress,
    rightProgress
  });
}

function cancelledResolution({
  state,
  action,
  otherAction,
  startedAtClockMs,
  candidate,
  side
}) {
  const isLeft =
    side === "left";
  const ownTag =
    isLeft
      ? candidate.leftTag
      : candidate.rightTag;
  const otherTag =
    isLeft
      ? candidate.rightTag
      : candidate.leftTag;
  const ownStrength =
    isLeft
      ? candidate.leftStrength
      : candidate.rightStrength;
  const otherStrength =
    isLeft
      ? candidate.rightStrength
      : candidate.leftStrength;
  const progress =
    isLeft
      ? candidate.leftProgress
      : candidate.rightProgress;
  const atMs =
    Math.max(
      0,
      candidate.atClockMs -
        startedAtClockMs
    );

  const survivorActorId =
    candidate.outcome ===
    "left_survives"
      ? (
          isLeft
            ? action.actorId
            : otherAction.actorId
        )
      : candidate.outcome ===
        "right_survives"
        ? (
            isLeft
              ? otherAction.actorId
              : action.actorId
          )
        : null;

  return Object.freeze({
    ok: true,
    actionType: "skill",
    actorId: action.actorId,
    targetId: action.targetId,
    skillId: action.actionId,
    outcome: "clashed",
    state,
    clash: Object.freeze({
      ownTag,
      otherTag,
      ownStrength,
      otherStrength,
      interactionKey:
        candidate.interactionKey,
      clashOutcome:
        candidate.outcome,
      survivorActorId,
      otherActorId:
        otherAction.actorId,
      otherSkillId:
        otherAction.actionId,
      progress
    }),
    events: Object.freeze([
      Object.freeze({
        type:
          "projectile-clash",
        atMs,
        actorId:
          action.actorId,
        targetId:
          action.targetId,
        skillId:
          action.actionId,
        otherActorId:
          otherAction.actorId,
        otherSkillId:
          otherAction.actionId,
        ownTag,
        otherTag,
        ownStrength,
        otherStrength,
        interactionKey:
          candidate.interactionKey,
        clashOutcome:
          candidate.outcome,
        survivorActorId,
        progress
      }),
      Object.freeze({
        type:
          "skill-cancelled",
        atMs,
        actorId:
          action.actorId,
        targetId:
          action.targetId,
        skillId:
          action.actionId,
        reason:
          "projectile_clash"
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

  const cancelLeft =
    candidate.outcome !==
    "left_survives";
  const cancelRight =
    candidate.outcome !==
    "right_survives";

  return Object.freeze({
    outcome: candidate.outcome,
    left:
      cancelLeft
        ? cancelledResolution({
            state,
            action:
              leftAction,
            otherAction:
              rightAction,
            startedAtClockMs:
              leftStartedAtClockMs,
            candidate,
            side: "left"
          })
        : null,
    right:
      cancelRight
        ? cancelledResolution({
            state,
            action:
              rightAction,
            otherAction:
              leftAction,
            startedAtClockMs:
              rightStartedAtClockMs,
            candidate,
            side: "right"
          })
        : null
  });
}
