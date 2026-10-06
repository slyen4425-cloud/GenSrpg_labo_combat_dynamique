import {
  withScheduledEffects
} from "./combat-state.js";

function nonNegativeNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(
      field +
        " must be a non-negative finite number"
    );
  }
  return number;
}

function requiredString(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }
  return value.trim();
}

function scheduledId({
  state,
  sourceActorId,
  targetActorId,
  sourceSkillId,
  dueAtMs
}) {
  const prefix =
    sourceSkillId +
    ":" +
    sourceActorId +
    ":" +
    targetActorId +
    ":" +
    dueAtMs +
    ":";

  const ordinal =
    state.scheduledEffects.filter(
      (entry) =>
        String(entry.id).startsWith(prefix)
    ).length;

  return prefix + ordinal;
}

export function scheduleSkillEffectV1({
  state,
  sourceActorId,
  targetActorId,
  sourceSkillId,
  skillElement = null,
  effect,
  atMs = state.elapsedMs
}) {
  const appliedAtMs = nonNegativeNumber(
    atMs,
    "atMs"
  );
  const sourceId = requiredString(
    sourceActorId,
    "sourceActorId"
  );
  const targetId = requiredString(
    targetActorId,
    "targetActorId"
  );
  const skillId = requiredString(
    sourceSkillId,
    "sourceSkillId"
  );

  if (effect?.kind !== "scheduled_effect") {
    throw new TypeError(
      "effect must be scheduled_effect"
    );
  }

  const delayMs = nonNegativeNumber(
    effect.trigger?.delayMs,
    "effect.trigger.delayMs"
  );
  const dueAtMs = appliedAtMs + delayMs;

  const record = Object.freeze({
    id: scheduledId({
      state,
      sourceActorId: sourceId,
      targetActorId: targetId,
      sourceSkillId: skillId,
      dueAtMs
    }),
    sourceActorId: sourceId,
    targetActorId: targetId,
    sourceSkillId: skillId,
    skillElement:
      skillElement == null
        ? null
        : String(skillElement),
    scheduledAtMs: appliedAtMs,
    dueAtMs,
    effects: Object.freeze([
      ...effect.effects
    ])
  });

  return Object.freeze({
    state: withScheduledEffects(
      state,
      [
        ...state.scheduledEffects,
        record
      ]
    ),
    record
  });
}

export function advanceScheduledEffectsV1({
  state,
  deltaMs,
  resolveEffects
}) {
  const delta = nonNegativeNumber(
    deltaMs,
    "deltaMs"
  );
  if (typeof resolveEffects !== "function") {
    throw new TypeError(
      "resolveEffects must be a function"
    );
  }
  if (delta === 0) {
    return state;
  }

  const endMs = state.elapsedMs + delta;
  let nextState = state;

  const dueRecords = [
    ...state.scheduledEffects
      .filter(
        (record) =>
          record.dueAtMs <= endMs
      )
  ].sort(
    (a, b) =>
      a.dueAtMs - b.dueAtMs ||
      String(a.id).localeCompare(
        String(b.id)
      )
  );

  for (const record of dueRecords) {
    const stillPending =
      nextState.scheduledEffects.some(
        (entry) =>
          entry.id === record.id
      );
    if (!stillPending) {
      continue;
    }

    nextState = withScheduledEffects(
      nextState,
      nextState.scheduledEffects.filter(
        (entry) =>
          entry.id !== record.id
      )
    );

    const resolved = resolveEffects({
      state: nextState,
      record,
      atMs: record.dueAtMs
    });

    if (
      !resolved ||
      typeof resolved !== "object" ||
      !resolved.state
    ) {
      throw new TypeError(
        "resolveEffects must return an object with state"
      );
    }

    nextState = resolved.state;
  }

  return nextState;
}
