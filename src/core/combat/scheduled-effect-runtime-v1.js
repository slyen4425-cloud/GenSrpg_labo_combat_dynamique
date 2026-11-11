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
  hitsIntangible = false,
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
    hitsIntangible: hitsIntangible === true,
    ...(effect.visualCue==="ground_mine"?{visualCue:"ground_mine"}:{}),
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

// Les coordonnées proviennent uniquement du rendu réel. La règle décide si
// l'empreinte au sol de la cible est dans l'ellipse au moment de l'explosion.
export function scheduledMineContainsTargetV1({mineBounds,targetBounds}={}) {
  const values=[mineBounds?.left,mineBounds?.top,mineBounds?.width,mineBounds?.height,
    targetBounds?.left,targetBounds?.top,targetBounds?.width,targetBounds?.height];
  if(!values.every(value=>typeof value==="number"&&Number.isFinite(value)) ||
     mineBounds.width<=0||mineBounds.height<=0||targetBounds.width<=0||targetBounds.height<=0)return false;
  const x=targetBounds.left+targetBounds.width/2;
  const y=targetBounds.top+targetBounds.height;
  const cx=mineBounds.left+mineBounds.width/2;
  const cy=mineBounds.top+mineBounds.height/2;
  return ((x-cx)/(mineBounds.width/2))**2+((y-cy)/(mineBounds.height/2))**2<=1;
}

export function advanceScheduledEffectsV1({
  state,
  deltaMs,
  resolveEffects,
  mineSpatialContext = null
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

    // A ground mine is anchored at placement, never homing on the target.
    // When live spatial samples are provided by Combat Runtime, a missing
    // sample or a foot outside the visible ring means NO damage/status.
    if(record.visualCue==="ground_mine" && mineSpatialContext!==null) {
      const sample=Array.isArray(mineSpatialContext)
        ?mineSpatialContext.find(x=>x.mineId===record.id&&x.targetActorId===record.targetActorId)
        :null;
      if(!sample||!scheduledMineContainsTargetV1(sample))continue;
    }

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
