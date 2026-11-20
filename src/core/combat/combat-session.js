import { isReserveEffectTargetScopeV2 } from "../../contracts/skill-effect-v1.js";
import {hasActiveStatusKindV1} from "./status-effect-runtime-v1.js";
import {
  addChargeTimeEffect,
  advanceCombatTime,
  createCombatState,
  withFighterEnergy,
  withFighterMovementActiveV1,
  skillCooldownRemainingMs,
  skillUseCount,
  replaceFighter as replaceCombatFighter
} from "./combat-state.js";
import {
  resolveMovement,
  resolveReaction,
  resolveSkill,
  resolveSkillCompletion,
  resolveSkillStart
} from "./action-resolver.js";
import {
  resolveCommandCompletion,
  resolveCommandStart
} from "./command-resolver.js";
import {
  normalizeSkillSpeedMultiplier
} from "./combat-timing.js";
import {
  advanceStatusEffectsV1,
  advanceStatusEffectsOnOwnerActionEndV1
} from "./status-effect-runtime-v1.js";
import {
  advancePersistentZonesV1,
  prepareZoneStatusDeparturesV1,
  removePersistentZonesFromActorV1,
  resetPersistentZoneOccupancyForSlotV1,
  removeInheritedZoneBoundStatusesV1
} from "./persistent-zone-runtime-v1.js";
import {
  advanceScheduledEffectsV1
} from "./scheduled-effect-runtime-v1.js";
import {
  rechargeableActionAvailabilityV1,
  consumeRechargeableActionChargeV1,
  rechargeableActionWindowStatusV1,
  activateRechargeableActionV1
} from "./rechargeable-action-v1.js";
import {
  applyImmediateTacticalEffectsV1
} from "./immediate-tactical-effects-v1.js";
import {projectNativeSkillEchoV1} from "./skill-echo-v1.js";

export function createCombatSession({
  distance = "medium",
  fighters,
  skillSpeedMultiplier = 1,
  battleFormat = null
}) {
  const normalizedSkillSpeedMultiplier =
    normalizeSkillSpeedMultiplier(
      skillSpeedMultiplier
    );
  const initialDistance = distance;
  const initialFighters = fighters.map((fighter) => ({ ...fighter }));
  // Each active fighter slot owns only its own last real non-ultimate cast.
  // A replacement clears this pointer: two occupants can never share history.
  const lastStandardSkillByActor=new Map();
  const rememberSkill=(actorId,skill)=>{
    if(skill && skill.loadoutSlot!=="ultimate" && !skill.echoCopy && !skill.echoSourceSkillId)
      lastStandardSkillByActor.set(actorId,skill);
  };
  const projectEcho=({actorId,targetId,skill,allowReserveTarget=false})=>
    !skill?.echoCopy ? Object.freeze({ok:true,skill,targetId}) :
      projectNativeSkillEchoV1({echoSkill:skill,sourceSkill:lastStandardSkillByActor.get(targetId)??null,
        actorId,targetId,allowReserveTarget});

  // Read-only projection for the UI to display legal bench targets. A later
  // Roster preview and timed Runtime activation MUST recheck this choice.
  function inspectEchoSource({actorId,targetId,skill}){
    if(!skill?.echoCopy)return Object.freeze({ok:false,outcome:"not_echo"});
    const actor=state.fighters[actorId],source=state.fighters[targetId];
    if(!actor||!source||actor.hp<=0||source.hp<=0||actorId===targetId)
      return Object.freeze({ok:false,outcome:"invalid_copy_source"});
    const cooldown=skillCooldownRemainingMs(state,actorId,skill.id);
    if(cooldown>0)return Object.freeze({ok:false,outcome:"cooldown",remainingCooldownMs:cooldown});
    if(actor.energy<skill.energyCost)return Object.freeze({ok:false,outcome:"insufficient_energy"});
    if(skill.maxUsesPerCombat!==null && skillUseCount(state,actorId,skill.id)>=skill.maxUsesPerCombat)
      return Object.freeze({ok:false,outcome:"usage_limit"});
    return projectEcho({actorId,targetId,skill,allowReserveTarget:true});
  }
  function recordRosterSkillCommit(actorId,skill){
    // Called only after Roster confirms a real direct reserve spell. Timed
    // spells already pass through session.startSkill and are not double-counted.
    rememberSkill(actorId,skill);
  }
  let reserveSkillResolver = null;
  const hasReserveSplash = skill => skill?.effects?.some(effect => isReserveEffectTargetScopeV2(effect.targetScope)) === true;
  function registerReserveSkillResolver(resolver) {
    if (typeof resolver !== "function") throw new TypeError("Roster resolver must be a function");
    // Legacy test harnesses may construct two Roster projections on one Session;
    // the first registered owner remains authoritative and is never shadowed.
    if (reserveSkillResolver !== null) return false;
    reserveSkillResolver = resolver;
    return true;
  }
  function reserveSkillGuard(skill) {
    return hasReserveSplash(skill) && reserveSkillResolver === null
      ? Object.freeze({ok:false,outcome:"reserve_roster_required",state}) : null;
  }
  let state = createCombatState({
    distance: initialDistance,
    fighters: initialFighters
  });

  function snapshot() {
    return state;
  }

  // One transaction owner for incremental charged-attack energy payments.
  // Normal skill-start cost/use/cooldown remains owned by resolveSkillStart.
  function payChargedActivationEnergy({actorId,cost}) {
    const fighter=state.fighters[actorId];
    const amount=Number(cost);
    if (!fighter || !Number.isFinite(amount) || amount < 0) {
      return Object.freeze({ok:false,outcome:"invalid_charge_payment"});
    }
    if (fighter.energy < amount) {
      return Object.freeze({ok:false,outcome:"insufficient_energy",cost:amount,availableEnergy:fighter.energy});
    }
    if (amount > 0) state=withFighterEnergy(state,actorId,fighter.energy-amount);
    return Object.freeze({ok:true,outcome:"charge_energy_paid",cost:amount,remainingEnergy:state.fighters[actorId].energy});
  }

  function setMovementActiveV1(actorId, active) {
    state = withFighterMovementActiveV1(state, actorId, active);
    return state;
  }

  function commitCompletedOwnerAction(
    result,
    actorId
  ) {
    if (!result.ok) {
      return result;
    }

    state = advanceStatusEffectsOnOwnerActionEndV1({
      state: result.state,
      fighterId: actorId
    });

    return Object.freeze({
      ...result,
      state
    });
  }

  function previewMovement(actorId, toDistance) {
    return resolveMovement({ state, actorId, toDistance });
  }

  function move(actorId, toDistance) {
    const result = resolveMovement({
      state,
      actorId,
      toDistance
    });
    return commitCompletedOwnerAction(
      result,
      actorId
    );
  }

  function previewSkill({ actorId, targetId, skill, reactionSkill = null, decoyId = null }) {
    const copy=projectEcho({actorId,targetId,skill});
    if(!copy.ok)return Object.freeze({...copy,state});
    const guard=reserveSkillGuard(copy.skill);
    if(guard)return guard;
    return resolveSkill({
      state,
      actorId,
      targetId:copy.targetId,
      skill:copy.skill,
      reactionSkill,
      decoyId,
      skillSpeedMultiplier:
        normalizedSkillSpeedMultiplier,
      battleFormat
    });
  }

  function useSkill({ actorId, targetId, skill, reactionSkill = null, decoyId = null }) {
    const projected=projectEcho({actorId,targetId,skill});
    if(!projected.ok)return Object.freeze({...projected,state});
    const result=previewSkill({actorId,targetId,skill,reactionSkill,decoyId});
    if(result.ok)rememberSkill(actorId,skill);
    // A copied spell may include all_enemy_reserves / all_ally_reserves.
    // The canonical Roster owner must receive the EFFECTIVE copied skill,
    // never the authored Remanence shell with no tactical effects.
    return withReserveSkillEffects(commitCompletedOwnerAction(result, actorId),actorId,projected.skill);
  }

  function startSkill({ actorId, targetId, skill, decoyId = null }) {
    const copy=projectEcho({actorId,targetId,skill});
    if(!copy.ok)return Object.freeze({...copy,state});
    const guard=reserveSkillGuard(copy.skill);
    if(guard)return guard;
    const result = resolveSkillStart({
      state,
      actorId,
      targetId:copy.targetId,
      skill:copy.skill,
      decoyId,
      skillSpeedMultiplier:
        normalizedSkillSpeedMultiplier,
      battleFormat
    });
    if (result.ok) {
      state = result.state;
      rememberSkill(actorId,skill);
    }
    return result;
  }

  function previewCommand({ actorId, command }) {
    return resolveCommandStart({
      state,
      actorId,
      command
    });
  }

  function startCommand({ actorId, command }) {
    const result = previewCommand({ actorId, command });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function previewReaction({ action, reactionSkill, elapsedMs }) {
    return resolveReaction({
      state,
      action,
      reactionSkill,
      elapsedMs,
      skillSpeedMultiplier:
        normalizedSkillSpeedMultiplier,
      battleFormat
    });
  }

  function reactToSkill({ action, reactionSkill, elapsedMs }) {
    const result = previewReaction({
      action,
      reactionSkill,
      elapsedMs
    });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function rechargeableActionAvailability(config) {
    return rechargeableActionAvailabilityV1({
      state,
      ...config
    });
  }

  function rechargeableActionWindowStatus(config) {
    return rechargeableActionWindowStatusV1({
      state,
      ...config
    });
  }

  function activateRechargeableAction(config) {
    const result =
      activateRechargeableActionV1({
        state,
        ...config
      });
    if (result.ok) {
      state = result.state;
    }
    return result;
  }

  function previewRechargeableReaction({
    action,
    reactionSkill,
    elapsedMs,
    recharge
  }) {
    const result = previewReaction({
      action,
      reactionSkill,
      elapsedMs
    });
    if (!result.ok) {
      return result;
    }

    const availability =
      rechargeableActionAvailabilityV1({
        state,
        actorId: action.targetId,
        actionId: recharge.actionId,
        maxCharges: recharge.maxCharges,
        rechargeMs: recharge.rechargeMs
      });

    if (availability.charges <= 0) {
      return Object.freeze({
        ok: false,
        outcome: "no_charges",
        state,
        availability
      });
    }

    return Object.freeze({
      ...result,
      availability
    });
  }

  function reactWithRechargeableAction({
    action,
    reactionSkill,
    elapsedMs,
    recharge
  }) {
    const preview =
      previewRechargeableReaction({
        action,
        reactionSkill,
        elapsedMs,
        recharge
      });
    if (!preview.ok) {
      return preview;
    }

    const reaction = resolveReaction({
      state,
      action,
      reactionSkill,
      elapsedMs,
      skillSpeedMultiplier:
        normalizedSkillSpeedMultiplier,
      battleFormat
    });
    if (!reaction.ok) {
      return reaction;
    }

    const consumed =
      consumeRechargeableActionChargeV1({
        state: reaction.state,
        actorId: action.targetId,
        actionId: recharge.actionId,
        maxCharges: recharge.maxCharges,
        rechargeMs: recharge.rechargeMs
      });
    if (!consumed.ok) {
      return consumed;
    }

    state = consumed.state;

    return Object.freeze({
      ...reaction,
      state,
      availability:
        consumed.availability
    });
  }

  function withReserveSkillEffects(committed, actorId, skill) {
    if (committed.ok && committed.outcome === "hit" && hasReserveSplash(skill)) {
      if (reserveSkillResolver === null) throw new Error("Missing roster owner during skill completion");
      const reserve = reserveSkillResolver({actorId,skill});
      if (!reserve.ok) throw new Error("Roster reserve effect failed: " + reserve.outcome);
      return Object.freeze({...committed,state,reserveResults:reserve.results});
    }
    return committed;
  }

  function completeSkill({
    action,
    reaction = null,
    targetActionContext = null,
    resolutionAtMs = null,
    forcedOutcome = null,
    confirmedVisibleBodyContact = false
  }) {
    const result = resolveSkillCompletion({
      state,
      action,
      reaction,
      targetActionContext,
      battleFormat,
      resolutionAtMs,
      forcedOutcome,
      confirmedVisibleBodyContact
    });
    const committed = action.mirrorReturn
      ? (state = result.state, result)
      : commitCompletedOwnerAction(result, action.actorId);
    return withReserveSkillEffects(committed, action.actorId, action.skill);
  }

  // A wave pays its energy/use/cooldown exactly once at startSkill.
  // Every genuine visual contact is resolved by the SAME combat resolver,
  // without ending the caster's action or ticking owner-action statuses again.
  function completeExpandingWaveTarget({
    action, targetId, reaction = null,
    targetActionContext = null, resolutionAtMs = null
  }) {
    const sourceTeam = battleFormat?.teamOf?.(action?.actorId);
    const targetTeam = battleFormat?.teamOf?.(targetId);
    if (
      action?.actionType !== "skill" ||
      !["expanding_wave", "stampede"].includes(action.skill?.projectileTargeting) ||
      action.skill?.category !== "offensive" ||
      sourceTeam == null || targetTeam == null ||
      sourceTeam === targetTeam ||
      !state.fighters[targetId] ||
      Number(state.fighters[targetId].hp) <= 0 ||
      // Global and reserve scopes would otherwise duplicate their effects.
      action.skill.effects?.some(effect =>
        ["all_enemies", "all_allies", "all_except_self",
          "all_enemy_reserves", "all_ally_reserves"].includes(effect.targetScope)
      )
    ) {
      return Object.freeze({ ok:false, outcome:"invalid_wave_target", state });
    }
    const result = resolveSkillCompletion({
      state,
      action: Object.freeze({ ...action, targetId }),
      reaction,
      targetActionContext,
      battleFormat,
      resolutionAtMs
    });
    if (result.ok) state = result.state;
    return result;
  }

  function completeCommand({ action }) {
    const result = resolveCommandCompletion({
      state,
      action
    });
    return commitCompletedOwnerAction(
      result,
      action.actorId
    );
  }

  function completeAction({
    action,
    reaction = null,
    targetActionContext = null,
    resolutionAtMs = null,
    forcedOutcome = null,
    confirmedVisibleBodyContact = false
  }) {
    return action.actionType === "command"
      ? completeCommand({ action })
      : completeSkill({
          action,
          reaction,
          targetActionContext,
          resolutionAtMs,
          forcedOutcome,
          confirmedVisibleBodyContact
        });
  }

  function advanceMs(
    deltaMs,
    {
      zoneSpatialContext = null
    } = {}
  ) {
    state = advanceScheduledEffectsV1({
      state,
      deltaMs,
      mineSpatialContext: zoneSpatialContext?.visibleMines ?? null,
      resolveEffects({
        state: scheduledState,
        record,
        atMs
      }) {
        return applyImmediateTacticalEffectsV1({
          state: scheduledState,
          actorId: record.sourceActorId,
          targetId: record.targetActorId,
          skill: {
            id: record.sourceSkillId,
            element: record.skillElement,
            hitsIntangible: record.hitsIntangible === true,
            effects: record.effects
          },
          atMs,
          combatAtMs: atMs,
          battleFormat
        });
      }
    });
    // Remove departed/expired zone-bound statuses before the native status
    // clock can apply an obsolete periodic effect outside its real radius.
    state = prepareZoneStatusDeparturesV1({
      state, deltaMs, battleFormat, zoneSpatialContext
    });
    // Keep timed energy buffs visible to the single energy clock even if
    // StatusRuntime expires them within this large frame step.
    const energyStatusAtStart = Object.fromEntries(
      Object.entries(state.fighters).map(([id, fighter]) => [
        id,
        fighter.statusEffects.filter(
          instance => instance.definition.kind === "energy_regen_modifier"
        )
      ])
    );
    const cooldownStatusAtStart = Object.fromEntries(
      Object.entries(state.fighters).map(([id, fighter]) => [
        id,
        fighter.statusEffects.filter(
          instance => instance.definition.kind === "skill_cooldown_rate_modifier"
        )
      ])
    );
    state = advanceStatusEffectsV1({
      state,
      deltaMs
    });
    state = advancePersistentZonesV1({
      state,
      deltaMs,
      battleFormat,
      zoneSpatialContext
    });
    state = advanceCombatTime(
      state,
      deltaMs,
      { energyStatusAtStart, cooldownStatusAtStart }
    );
    return state;
  }

  function advance(seconds) {
    return advanceMs(Number(seconds) * 1000);
  }

  // Physical touch comes from the SAME wall sensor as interception. Combat
  // State owns wall HP, lifetimes, contact throttling and all negative statuses.
  function touchCombatBarrierV1({contactedEntityId,hostileActorId,atMs=state.elapsedMs}){
    const wall=(state.combatEntities??[]).find(entity=>entity.id===contactedEntityId &&
      entity.kind==="barrier"&&entity.hp>0);
    if(!wall || wall.ownerActorId===hostileActorId ||
       !state.fighters[hostileActorId] || state.fighters[hostileActorId].hp<=0 ||
       (wall.expiresAtMs!=null && wall.expiresAtMs<=atMs))
      return Object.freeze({ok:false,outcome:"no_hostile_contact",state});
    const now=Number(atMs),previous=wall.contactTimesByActor?.[hostileActorId]??{};
    if(!Number.isFinite(now)||now<0)throw new RangeError("atMs must be non-negative");
    const damageReady=wall.contactDamage>0 &&
      (previous.damageAtMs==null || now-previous.damageAtMs>=wall.contactDamageIntervalMs);
    const lockReady=wall.contactImmobilizeMs>0 &&
      (previous.immobilizeAtMs==null || now-previous.immobilizeAtMs>=wall.contactImmobilizeCooldownMs);
    if(!damageReady&&!lockReady)return Object.freeze({ok:true,outcome:"contact_cooldown",state});
    const effects=[
      ...(damageReady?[{kind:"damage",targetScope:"target",amount:wall.contactDamage,channel:"electric"}]:[]),
      ...(lockReady?[{kind:"apply_status",targetScope:"target",status:{
        id:wall.sourceSkillId+":contact-immobilize",kind:"immobilize",
        polarity:"detrimental",durationModel:"time_ms",durationMs:wall.contactImmobilizeMs,
        stacking:"refresh",maxStacks:1,tags:["barrier-contact"]
      }}]:[])
    ];
    const resolved=applyImmediateTacticalEffectsV1({
      state,actorId:wall.ownerActorId,targetId:hostileActorId,
      skill:{id:wall.sourceSkillId,element:"electric",effects},
      atMs:now,combatAtMs:now,battleFormat
    });
    state=resolved.state;
    const latest=state.combatEntities.find(entity=>entity.id===contactedEntityId);
    if(latest){
      const times=Object.freeze({...latest.contactTimesByActor,
        [hostileActorId]:Object.freeze({...previous,
          ...(damageReady?{damageAtMs:now}:{}),
          ...(lockReady?{immobilizeAtMs:now}:{})})});
      state=Object.freeze({...state,combatEntities:Object.freeze(state.combatEntities.map(
        entity=>entity.id===contactedEntityId?Object.freeze({...entity,contactTimesByActor:times}):entity
      ))});
    }
    return Object.freeze({ok:true,outcome:"contact_pulse",damageReady,immobilized:lockReady,
      events:resolved.events,state});
  }

  // Pulse effects are resolved through the SINGLE native tactical HP/status
  // application path. ContactHold does not own a private damage calculator.
  function applyContactHoldTickV1({ actorId, targetId, skill, atMs, contactedEntityId = null }) {
    if (!skill?.contactHold || !state.fighters[actorId] ||
        !state.fighters[targetId] ||
        Number(state.fighters[actorId].hp) <= 0 ||
        Number(state.fighters[targetId].hp) <= 0) {
      return Object.freeze({ ok: false, outcome: "contact_not_alive", state });
    }
    const result = applyImmediateTacticalEffectsV1({
      state,
      actorId,
      targetId,
      skill: {
        id: skill.id,
        category: skill.category,
        form: "contact",
        element: skill.element,
        hitsIntangible: skill.hitsIntangible,
        effects: skill.contactHold.effects
      },
      atMs,
      combatAtMs: atMs,
      battleFormat,
      contactedEntityId
    });
    state = result.state;
    return Object.freeze({ ok: true, outcome: "contact_tick", state,
      events: result.events });
  }

  // Channeling uses the existing tactical effects and fighter energy owner.
  // Invalid ticks must leave both energy and targets untouched atomically.
  function applyChannelingTickV1({actorId,targetId,skill,atMs,tickIndex=0}){
    const config=skill?.channeling;
    const source=state.fighters[actorId],target=state.fighters[targetId];
    if(!config)return Object.freeze({ok:false,outcome:"not_channeling",state});
    if(!source||!target||source.hp<=0||target.hp<=0)
      return Object.freeze({ok:false,outcome:"channel_ko_or_absent",state});
    if(config.stopOnStun&&hasActiveStatusKindV1(state,actorId,"stun"))
      return Object.freeze({ok:false,outcome:"stun",state});
    if(config.stopOnSilence&&hasActiveStatusKindV1(state,actorId,"silence"))
      return Object.freeze({ok:false,outcome:"silence",state});
    const cost=config.energyCostPerTick;
    if(source.energy<cost)
      return Object.freeze({ok:false,outcome:"insufficient_energy",state});
    const paid=cost>0?withFighterEnergy(state,actorId,source.energy-cost):state;
    const effects=applyImmediateTacticalEffectsV1({
      state:paid,actorId,targetId,
      skill:{id:skill.id,category:skill.category,form:skill.form,
        element:skill.element,hitsIntangible:skill.hitsIntangible,
        effects:[...config.effects,...(tickIndex===config.maxTicks ? config.finalTickEffects??[] : [])]},
      atMs,combatAtMs:atMs,battleFormat
    });
    state=effects.state;
    return Object.freeze({ok:true,outcome:"channel_tick",state,
      energyPaid:cost,events:effects.events});
  }

  function addChargeEffect(fighterId, effect) {
    state = addChargeTimeEffect(state, fighterId, effect);
    return state;
  }

  function departFighter(fighterId, {departingMemberId = null} = {}) {
    lastStandardSkillByActor.delete(fighterId);
    state = removePersistentZonesFromActorV1(state, fighterId, {departingMemberId});
    state = removeInheritedZoneBoundStatusesV1(state, fighterId);
    state = resetPersistentZoneOccupancyForSlotV1(state, fighterId, {absent:true});
    return state;
  }

  function replaceFighter(fighterId, fighter, {
    clearSourceZones = false, departingMemberId = null,
    preserveSkillEchoHistory = false
  } = {}) {
    // True replacement: a new creature inherits no action history.
    // Roster's atomic same-actor effect settlement is NOT a replacement.
    if(!preserveSkillEchoHistory)lastStandardSkillByActor.delete(fighterId);
    if (clearSourceZones) {
      state = removePersistentZonesFromActorV1(state, fighterId, {departingMemberId});
    }
    state = replaceCombatFighter(state, fighterId, fighter);
    if (clearSourceZones) {
      state = removeInheritedZoneBoundStatusesV1(state, fighterId);
      state = resetPersistentZoneOccupancyForSlotV1(state, fighterId);
    }
    return state;
  }

  function reset() {
    lastStandardSkillByActor.clear();
    state = createCombatState({
      distance: initialDistance,
      fighters: initialFighters
    });
    return state;
  }

  return Object.freeze({
    get skillSpeedMultiplier() {
      return normalizedSkillSpeedMultiplier;
    },
    snapshot,
    inspectEchoSource,
    recordRosterSkillCommit,
    setMovementActiveV1,
    payChargedActivationEnergy,
    registerReserveSkillResolver,
    previewMovement,
    previewSkill,
    previewCommand,
    move,
    useSkill,
    startSkill,
    startCommand,
    previewReaction,
    reactToSkill,
    rechargeableActionAvailability,
    rechargeableActionWindowStatus,
    activateRechargeableAction,
    previewRechargeableReaction,
    reactWithRechargeableAction,
    completeSkill,
    completeExpandingWaveTarget,
    completeCommand,
    completeAction,
    advanceMs,
    advance,
    applyContactHoldTickV1,
    applyChannelingTickV1,
    touchCombatBarrierV1,
    addChargeEffect,
    replaceFighter,
    departFighter,
    reset
  });
}
