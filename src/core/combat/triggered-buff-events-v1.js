import { activeStatusEffectsV1 } from "./status-effect-runtime-v1.js";
import { applyImmediateTacticalEffectsV1 } from "./immediate-tactical-effects-v1.js";

// Shared, native, event-driven status dispatcher. A trigger is a source event
// produced by Combat Rules, never a DOM animation or an AI decision.
// Its generated events are NOT fed back into this dispatcher.
export function applyEventTriggeredBuffsV2({
  state,
  statusState = state,
  eventType,
  ownerId,
  otherId = ownerId,
  skill = null,
  atMs = 0,
  combatAtMs = statusState.elapsedMs,
  battleFormat = null
}) {
  if (!state.fighters[ownerId] || !state.fighters[otherId]) {
    return Object.freeze({ state, events: Object.freeze([]) });
  }
  const statuses = activeStatusEffectsV1(statusState, ownerId, combatAtMs);
  let nextState = state;
  const events = [];
  for (const instance of statuses) {
    if (instance.definition.kind !== "triggered_buff") continue;
    const trigger = instance.definition.onEvent ??
      (instance.definition.onDamageDealt
        ? {event:"damage_dealt",effects:instance.definition.onDamageDealt.effects}
        : null);
    if (trigger?.event !== eventType) continue;
    const sourceSkill = {
      id: instance.sourceSkillId ?? instance.definition.id,
      element: skill?.element ?? null,
      form: skill?.form ?? "other",
      effect: {damage:0,heal:0},
      effects: trigger.effects
    };
    const result = applyImmediateTacticalEffectsV1({
      state: nextState,
      actorId: ownerId,
      targetId: otherId,
      skill: sourceSkill,
      atMs,
      combatAtMs,
      battleFormat,
      thresholdDepth: 1,
      directDamageApplied: 0,
      allowLifeSteal: false
    });
    nextState = result.state;
    events.push(...result.events);
  }
  return Object.freeze({
    state: nextState,
    events: Object.freeze(events)
  });
}
