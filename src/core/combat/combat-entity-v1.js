// Passive CombatEntity V1: one native combat-state authority, not a status
// and not a fighter/roster replacement. Combat Damage owns every HP reduction.
const frozen=value=>Object.freeze(value);
export function createCombatBarrierV1({state,sourceActorId,protectedActorId,sourceSkillId,effect,atMs=state.elapsedMs}){
  const source=state.fighters[sourceActorId],target=state.fighters[protectedActorId];
  if(!source||!target)throw new RangeError("Unknown barrier owner or protected fighter");
  if(effect.kind!=="summon_entity"||effect.entityKind!=="barrier")
    throw new RangeError("Expected summon_entity barrier effect");
  const statPoints=Number(source.statValuesById?.[effect.statId]??0);
  if(!Number.isFinite(statPoints)||statPoints<0)throw new RangeError("Invalid native stat for barrier");
  const maxHp=Math.round(statPoints*effect.hpPerStatPoint*100)/100;
  if(maxHp<=0)return frozen({state,record:null,outcome:"no_stat_points"});
  const current=state.combatEntities??[];
  const same=entry=>entry.ownerActorId===sourceActorId&&entry.sourceSkillId===sourceSkillId&&
    entry.protectedActorId===protectedActorId&&entry.kind==="barrier";
  const previous=current.find(same);
  const id=previous?.id??("barrier:"+sourceActorId+":"+sourceSkillId+":"+protectedActorId);
  const record=frozen({id,kind:"barrier",ownerActorId:sourceActorId,protectedActorId,sourceSkillId,
    statId:effect.statId,statPoints,hpPerStatPoint:effect.hpPerStatPoint,hp:maxHp,maxHp,
    visualScale:effect.visualScale??1,offsetForwardPx:effect.offsetForwardPx??0,offsetUpPx:effect.offsetUpPx??0,
    interceptKinds:effect.interceptKinds,...(effect.spriteAssetId?{spriteAssetId:effect.spriteAssetId}:{}),createdAtMs:atMs});
  return frozen({outcome:previous?"refreshed":"created",record,
    state:frozen({...state,combatEntities:frozen([...current.filter(entry=>!same(entry)),record])})});
}
export function interceptCombatBarrierV1({state,sourceActorId,targetActorId,damage,incomingKind,contactedEntityId=undefined}){
  const amount=Math.max(0,Number(damage)||0);
  const empty=frozen({state,remainingDamage:amount,absorbedByEntity:0,entityId:null,destroyedEntityId:null,
    entityHpBefore:null,entityHpAfter:null});
  if(amount<=0||sourceActorId===targetActorId)return empty;
  const found=(state.combatEntities??[]).find(entry=>entry.kind==="barrier"&&entry.hp>0&&
    entry.protectedActorId===targetActorId&&entry.ownerActorId!==sourceActorId&&
    entry.interceptKinds.includes(incomingKind)&&
    // A projectile is intercepted only after the visible sensor confirms the exact wall.
    // Absence of evidence is not evidence of a collision at nominal impact time.
    (incomingKind!=="projectile"||contactedEntityId===entry.id));
  if(!found)return empty;
  const absorbed=Math.min(found.hp,amount);
  const after=Math.round((found.hp-absorbed)*100)/100;
  const entries=after===0?(state.combatEntities??[]).filter(x=>x.id!==found.id)
    :(state.combatEntities??[]).map(x=>x.id===found.id?frozen({...x,hp:after}):x);
  return frozen({state:frozen({...state,combatEntities:frozen(entries)}),
    remainingDamage:Math.round((amount-absorbed)*100)/100,absorbedByEntity:absorbed,
    entityId:found.id,destroyedEntityId:after===0?found.id:null,
    entityHpBefore:found.hp,entityHpAfter:after});
}
