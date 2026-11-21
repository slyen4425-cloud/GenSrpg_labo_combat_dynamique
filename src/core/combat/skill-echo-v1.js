// This module only projects a previously validated SkillDefinition.
// CombatSession alone remembers real activations and owns the transaction.
// There is no synthetic damage/HP authority or second spell implementation.
const SCALABLE_KINDS=new Set(["damage","heal","life_steal","damage_over_time","heal_over_time"]);
const DAMAGE_KINDS=new Set(["damage","life_steal","damage_over_time"]);

// Copy compatibility is evaluated against the ORIGINAL native definition.
// A creature with no wings or private siphon cannot execute those mechanics.
const FORBIDDEN_APPROACH_MODES=new Set(["aerial","teleport","burrow"]);
const FORBIDDEN_TACTICAL_KINDS=new Set([
  "force_reserve_switch","ally_reserve_relay","drain_energy","steal_energy",
  "summon","spawn_creature","transform_creature"
]);
export function isCopyableReceivedSkillV1(skill) {
  if(!skill || skill.echoCopyable===false || skill.loadoutSlot==="ultimate" ||
    skill.echoCopy || skill.echoSourceSkillId || skill.evasionSiphon ||
    skill.decoyFormation || skill.stampede || skill.chargedAttack ||
    skill.chargedEffects || skill.markerCost ||
    FORBIDDEN_APPROACH_MODES.has(skill.approachMode) ||
    skill.targetLocations?.includes("reserve") ||
    skill.projectileTargeting==="stampede") return false;
  const effects=[...(skill.effects??[]),...(skill.channeling?.effects??[]),
    ...(skill.contactHold?.effects??[])];
  return !effects.some(effect=>FORBIDDEN_TACTICAL_KINDS.has(effect.kind) ||
    (effect.kind==="apply_status" && effect.status?.kind==="decoy") ||
    ["all_enemy_reserves","all_ally_reserves"].includes(effect.targetScope));
}

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
export function projectNativeSkillEchoV1({echoSkill,sourceSkill,actorId,targetId,allowReserveTarget=false}){
  if(!echoSkill?.echoCopy)return Object.freeze({ok:false,outcome:"not_echo"});
  if(!sourceSkill)return Object.freeze({ok:false,outcome:"no_copy_source"});
  if(sourceSkill.id===echoSkill.id || !isCopyableReceivedSkillV1(sourceSkill))
    return Object.freeze({ok:false,outcome:"copy_source_forbidden"});
  // For explicit reserve-only spells, a genuine Roster member must be
  // selected. The UI may INSPECT this source but may not activate it on a
  // fabricated active slot. The native Roster transaction remains authoritative.
  const reserveOnly=sourceSkill.targetLocations?.includes("reserve") &&
    !sourceSkill.targetLocations?.includes("active");
  const reserveTransfer=sourceSkill.effects?.some(e=>
    ["force_reserve_switch","ally_reserve_relay"].includes(e.kind))===true;
  const requiresMember=reserveOnly || reserveTransfer;
  if(requiresMember && !allowReserveTarget)
    return Object.freeze({ok:false,outcome:"copy_reserve_requires_member_selection",
      sourceSkillId:sourceSkill.id});
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
  // Copy the source's REAL form/timing/geometry/statuses; only damage is
  // shadow. Slot 4 still owns its cooldown/cost to prevent a second authority.
  const skill=Object.freeze({...sourceSkill,
    id:echoSkill.id,name:sourceSkill.name,element:"shadow",
    loadoutSlot:"standard",energyCost:echoSkill.energyCost,
    cooldownMs:echoSkill.cooldownMs,maxUsesPerCombat:echoSkill.maxUsesPerCombat,
    activationRequirements:echoSkill.activationRequirements,
    // Original native windup/recovery/distance, trajectory and animations.
    targetRelations:requiresMember
      ? Object.freeze(sourceSkill.targetRelations.map(relation=>relation==="self"?"ally":relation))
      : supporting?Object.freeze(["self"]):sourceSkill.targetRelations,
    targetLocations:Object.freeze([requiresMember?"reserve":"active"]),
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
  return Object.freeze({ok:true,skill,targetId:aimId,sourceSkillId:sourceSkill.id,
    reserveMemberRequired:requiresMember});
}
