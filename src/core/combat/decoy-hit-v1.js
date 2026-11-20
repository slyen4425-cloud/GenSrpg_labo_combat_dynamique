import {activeStatusEffectsV1} from "./status-effect-runtime-v1.js";
import {withFighterStatusEffects} from "./combat-state.js";
import {computeCombatDamageV1} from "./combat-damage-v1.js";
import {applyCombatDamageV1} from "./combat-damage-application-v1.js";

// A decoy is an explicit selectable presentation of one live status. It is
// NEVER a second combat fighter, an invisible hitbox or a random auto dodge.
export function activeDecoyForV1(state,targetId,decoyId,atMs=state.elapsedMs){
  if(typeof decoyId!=="string"||!decoyId)return null;
  return activeStatusEffectsV1(state,targetId,atMs).find(instance=>
    instance.definition.kind==="decoy" && instance.definition.id===decoyId)??null;
}

export function resolveDecoyHitV1({state,actorId,targetId,decoyId,skillId,atMs=state.elapsedMs,impactAtMs=0}){
  const chosen=activeDecoyForV1(state,targetId,decoyId,atMs);
  if(!chosen)return Object.freeze({state,events:Object.freeze([]),hit:false});
  const victim=state.fighters[targetId];
  const remaining=victim.statusEffects.filter(instance=>!(
    instance.definition.kind==="decoy"&&instance.definition.id===chosen.definition.id&&
    instance.appliedAtMs===chosen.appliedAtMs&&instance.sourceSkillId===chosen.sourceSkillId
  ));
  let next=withFighterStatusEffects(state,targetId,remaining);
  const damage=computeCombatDamageV1({state:next,attackerId:targetId,targetId:actorId,
    baseDamage:chosen.definition.retaliationDamage,channel:chosen.definition.channel});
  const applied=applyCombatDamageV1({state:next,sourceActorId:targetId,targetActorId:actorId,
    damage:damage.damage,atMs,incomingKind:"other"});
  next=applied.state;
  return Object.freeze({state:next,hit:true,events:Object.freeze([
    Object.freeze({type:"decoy-intercepted",atMs:impactAtMs,actorId:targetId,
      sourceActorId:actorId,decoyId,skillId}),
    Object.freeze({type:"hit",atMs:impactAtMs,actorId,sourceActorId:targetId,
      skillId:chosen.sourceSkillId,decoyRetaliation:true,
      damage:damage.damage,appliedDamage:applied.appliedDamage,
      absorbedByShield:applied.absorbedByShield,hpBefore:applied.hpBefore,hpAfter:applied.hpAfter})
  ])});
}
