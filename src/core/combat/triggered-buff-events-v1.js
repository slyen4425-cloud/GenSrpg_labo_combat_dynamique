import { activeStatusEffectsV1 } from "./status-effect-runtime-v1.js";
import { applyImmediateTacticalEffectsV1 } from "./immediate-tactical-effects-v1.js";
import { withFighterStatusEffects } from "./combat-state.js";

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
    // A hostile action can detonate a one-use curse already on its author.
    // Combat Rules owns the event, the source and its native HP damage;
    // this dispatcher never creates a second gameplay clock.
    const curse = eventType === "offensive_skill_start";
    const sourceActorId = curse ? instance.sourceActorId : ownerId;
    if (curse && (!state.fighters[sourceActorId] || sourceActorId === ownerId)) continue;
    if (trigger.consume === true) {
      nextState = withFighterStatusEffects(nextState, ownerId,
        nextState.fighters[ownerId].statusEffects.filter(item =>
          !(item.definition.id === instance.definition.id &&
            item.sourceSkillId === instance.sourceSkillId &&
            item.appliedAtMs === instance.appliedAtMs)));
    }
    const sourceSkill = {
      id: instance.sourceSkillId ?? instance.definition.id,
      element: curse ? "shadow" : skill?.element ?? null,
      form: curse ? "other" : skill?.form ?? "other",
      effect: {damage:0,heal:0},
      effects: trigger.effects
    };
    const result = applyImmediateTacticalEffectsV1({
      state: nextState,
      actorId: sourceActorId,
      targetId: curse ? ownerId : otherId,
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
