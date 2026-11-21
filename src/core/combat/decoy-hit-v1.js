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

// A strike locked before Dédale appeared must NOT retain perfect knowledge
// of the original. The existing combat action is re-aimed ONCE at impact,
// among the real fighter and its native decoy statuses. Later casts that
// explicitly selected the real body or a decoy preserve that choice.
export function reselectPrelockedDecoyV1({state,action,atMs=state.elapsedMs}) {
  const skill=action?.skill;
  if(action?.actionType!=="skill" || action.decoyId!=null ||
      !skill?.targetRelations?.includes("enemy") ||
      !["contact","projectile","beam"].includes(skill.form))
    return Object.freeze({reselected:false,decoyId:null});
  const decoys=activeStatusEffectsV1(state,action.targetId,atMs)
    .filter(x=>x.definition.kind==="decoy");
  const previouslySeen=new Set(action.targetDecoyIdsAtStart??[]);
  if(!decoys.some(x=>!previouslySeen.has(x.definition.id)))
    return Object.freeze({reselected:false,decoyId:null});
  // Pure stable roll: one of N+1 silhouettes, with the old lock providing
  // no advantage. Consecutive native casts rotate instead of consistently
  // selecting the real fighter under a fixed AI seed.
  let seed=2166136261;
  for(const char of String(action.actorId)+"|"+String(action.targetId)+"|"+String(skill.id))
    seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
  const serial=Math.max(0,Math.trunc(Number(action.targetingSequence)||0));
  const slot=(seed+serial)%(decoys.length+1);
  return Object.freeze({reselected:true,
    decoyId:slot===decoys.length?null:decoys[slot].definition.id});
}

// A genuine hostile hit exposes the original creature: all remaining decoys
// disappear in ONE CombatState transition. A wrong-choice decoy interception
// never uses this path, and no rendering module mutates the fighter.
export function dismissDecoysOnTrueHitV1(state,targetId){
  const fighter=state.fighters?.[targetId];
  if(!fighter)return Object.freeze({state,removedIds:Object.freeze([])});
  const decoys=fighter.statusEffects.filter(x=>x.definition.kind==="decoy");
  if(decoys.length===0)return Object.freeze({state,removedIds:Object.freeze([])});
  const remaining=fighter.statusEffects.filter(x=>x.definition.kind!=="decoy");
  return Object.freeze({
    state:withFighterStatusEffects(state,targetId,remaining),
    removedIds:Object.freeze(decoys.map(x=>x.definition.id))
  });
}
