// This module only projects a previously validated SkillDefinition.
// CombatSession alone remembers real activations and owns the transaction.
// There is no synthetic damage/HP authority or second spell implementation.
const SCALABLE_KINDS=new Set(["damage","heal","life_steal","damage_over_time","heal_over_time"]);
const DAMAGE_KINDS=new Set(["damage","life_steal","damage_over_time"]);

function scaleAmount(value,pct){
  return Math.max(0,Math.round(Number(value)*pct/100));
}
export function spectralizeCopiedEffectV1(value,powerPct){
  if(Array.isArray(value))return Object.freeze(value.map(x=>spectralizeCopiedEffectV1(x,powerPct)));
  if(!value||typeof value!=="object")return value;
  const next={};
  for(const [key,item] of Object.entries(value)){
    if(key==="amount" && SCALABLE_KINDS.has(value.kind) && Number.isFinite(Number(item)))
      next[key]=scaleAmount(item,powerPct);
    else if(key==="healAmount" && Number.isFinite(Number(item)))
      next[key]=scaleAmount(item,powerPct);
    else if(key==="channel" && DAMAGE_KINDS.has(value.kind))
      next[key]="shadow";
    else next[key]=spectralizeCopiedEffectV1(item,powerPct);
  }
  return Object.freeze(next);
}
export function projectNativeSkillEchoV1({echoSkill,sourceSkill,actorId,targetId}){
  if(!echoSkill?.echoCopy)return Object.freeze({ok:false,outcome:"not_echo"});
  if(!sourceSkill)return Object.freeze({ok:false,outcome:"no_copy_source"});
  if(sourceSkill.id===echoSkill.id||sourceSkill.echoCopy||
     sourceSkill.loadoutSlot==="ultimate")
    return Object.freeze({ok:false,outcome:"copy_source_forbidden"});
  // Reserve targets require a selected member and a RosterSession transaction.
  // Do not pretend a combat slot is a reserve member or silently use a fallback.
  if(sourceSkill.targetLocations?.includes("reserve") ||
     sourceSkill.effects?.some(e=>["force_reserve_switch","ally_reserve_relay"].includes(e.kind)||
       ["all_enemy_reserves","all_ally_reserves"].includes(e.targetScope)))
    return Object.freeze({ok:false,outcome:"copy_reserve_requires_roster"});
  const pct=echoSkill.echoCopy.powerPct;
  const supporting=!sourceSkill.targetRelations?.includes("enemy") &&
    (sourceSkill.targetRelations?.includes("self")||
     sourceSkill.targetRelations?.includes("ally")||
     ["heal","defensive","buff_debuff"].includes(sourceSkill.category));
  const aimId=supporting?actorId:targetId;
  const transformedEffects=spectralizeCopiedEffectV1(sourceSkill.effects??[],pct);
  const legacy=Object.freeze({...sourceSkill.effect,
    damage:scaleAmount(sourceSkill.effect.damage,pct),
    heal:scaleAmount(sourceSkill.effect.heal,pct)});
  // Preserve source form and native mechanics, but price the ONE Remanence
  // activation with its own declared energy, cooldown, uses and requirements.
  const skill=Object.freeze({...sourceSkill,
    id:echoSkill.id,name:echoSkill.name,element:"shadow",
    loadoutSlot:"standard",energyCost:echoSkill.energyCost,
    cooldownMs:echoSkill.cooldownMs,maxUsesPerCombat:echoSkill.maxUsesPerCombat,
    activationRequirements:echoSkill.activationRequirements,
    // Use the copied form's trajectory/area/ticks, but Remanence's windup.
    preparationMs:echoSkill.preparationMs,recoveryMs:echoSkill.recoveryMs,
    allowedDistances:echoSkill.allowedDistances,
    targetRelations:supporting?Object.freeze(["self"]):sourceSkill.targetRelations,
    targetLocations:Object.freeze(["active"]),
    effect:legacy,effects:transformedEffects,
    ...(sourceSkill.chargedAttack?{chargedAttack:Object.freeze({
      ...sourceSkill.chargedAttack,
      baseDamage:scaleAmount(sourceSkill.chargedAttack.baseDamage,pct),
      bonusDamagePerCharge:scaleAmount(sourceSkill.chargedAttack.bonusDamagePerCharge,pct)
    })}:{}),
    ...(sourceSkill.channeling?{channeling:spectralizeCopiedEffectV1(sourceSkill.channeling,pct)}:{}),
    ...(sourceSkill.contactHold?{contactHold:spectralizeCopiedEffectV1(sourceSkill.contactHold,pct)}:{}),
    echoSourceSkillId:sourceSkill.id,echoPowerPct:pct
  });
  return Object.freeze({ok:true,skill,targetId:aimId,sourceSkillId:sourceSkill.id});
}
