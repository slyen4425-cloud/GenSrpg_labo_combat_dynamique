// Pure projection of charged effect potency, not a second combat effect executor.
const round=value=>Math.round(value*100)/100;
export function amplifyChargedEffectSkillV1(skill,count){
  if(!skill?.chargedEffects)return skill;
  const config=skill.chargedEffects;
  const activations=Math.max(1,Math.min(config.maxCharges,Number(count)||1));
  const factor=1+(activations-1)*config.potencyIncreasePct/100;
  const effects=Object.freeze(skill.effects.map(effect=>{
    if(["damage","heal"].includes(effect.kind))
      return Object.freeze({...effect,amount:round(effect.amount*factor)});
    if(effect.kind==="apply_status"){
      const status=effect.status;
      const key=status.kind==="stat_modifier"?
        (status.modifierMode==="percent"?"percent":"deltaPoints"):
        ["shield","heal_over_time","damage_over_time"].includes(status.kind)?"amount":"modifierPct";
      return Object.freeze({...effect,status:Object.freeze({...status,[key]:round(status[key]*factor)})});
    }
    throw new RangeError("Unsupported chargedEffects kind: "+effect.kind);
  }));
  return Object.freeze({...skill,effects});
}
