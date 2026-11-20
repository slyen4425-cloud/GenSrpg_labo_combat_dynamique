// One author projection for the native decoy statuses and stampede contract.
// No special creature ID, fallback skill catalogue or extra combat authority.
export const DECOY_EDITOR_DEFAULTS_V1=Object.freeze({
  count:2,durationMs:20000,retaliationDamage:10,reshuffleMs:5000,spacingPct:56
});

const isDecoy=effect=>effect?.kind==="apply_status"&&effect?.status?.kind==="decoy";

export function captureDecoySettingsFromDefinitionV1(definition){
  const decoys=(definition?.effects??[]).filter(isDecoy);
  const first=decoys[0]?.status??null;
  return Object.freeze({
    enabled:decoys.length>0,
    count:decoys.length||DECOY_EDITOR_DEFAULTS_V1.count,
    durationMs:first?.durationMs??DECOY_EDITOR_DEFAULTS_V1.durationMs,
    retaliationDamage:first?.retaliationDamage??DECOY_EDITOR_DEFAULTS_V1.retaliationDamage,
    reshuffleMs:definition?.decoyFormation?.reshuffleMs??DECOY_EDITOR_DEFAULTS_V1.reshuffleMs,
    spacingPct:definition?.decoyFormation?.spacingPct??DECOY_EDITOR_DEFAULTS_V1.spacingPct,
    // These are the original existing author entries. Their IDs and metadata
    // are retained when the human editor rewrites the exact same native list.
    templates:Object.freeze(decoys)
  });
}

export function captureDecoyEffectsFromEditorV1(effects,settings,skillId,element){
  const original=Array.isArray(effects)?effects:[];
  const other=original.filter(x=>!isDecoy(x));
  if(settings?.enabled!==true)return other;
  const count=Number(settings.count);
  const durationMs=Number(settings.durationMs);
  const retaliationDamage=Number(settings.retaliationDamage);
  if(!Number.isInteger(count)||count<1||count>6)
    throw new RangeError("Le nombre de leurres doit être compris entre 1 et 6.");
  if(!Number.isInteger(durationMs)||durationMs<500||durationMs>120000)
    throw new RangeError("La durée des leurres doit être comprise entre 0,5 et 120 secondes.");
  if(!Number.isFinite(retaliationDamage)||retaliationDamage<=0)
    throw new RangeError("Les dégâts de riposte doivent être supérieurs à zéro.");
  const originals=Array.isArray(settings.templates)?settings.templates:[];
  const taken=new Set(other.flatMap(x=>x?.status?.id?[x.status.id]:[]));
  const owned=[];
  for(let index=0;index<count;index++){
    const template=originals[index]??null;
    const stable=template?.status?.id;
    let generated=String(skillId)+"-decoy-"+(index+1);
    let suffix=1;
    while(taken.has(generated))generated=String(skillId)+"-decoy-"+(index+1)+"-"+(++suffix);
    const id=typeof stable==="string"&&stable&&!taken.has(stable)?stable:generated;
    taken.add(id);
    const base=template?.status??{};
    owned.push({
      kind:"apply_status",targetScope:"self",
      status:{
        ...base,id,kind:"decoy",polarity:"beneficial",
        durationModel:"time_ms",durationMs,stacking:"refresh",
        retaliationDamage,channel:base.channel??element??"shadow",
        label:base.label??"Leurre",tags:base.tags??["illusion"]
      }
    });
  }
  return [...other,...owned];
}

export function stampedeTravelMsV1(stampede){
  const count=Number(stampede?.passes),travel=Number(stampede?.passDurationMs),
    gap=Number(stampede?.gapMs);
  if(!Number.isInteger(count)||count<2||count>6||
     !Number.isInteger(travel)||travel<250||travel>5000||
     !Number.isInteger(gap)||gap<100||gap>6000)
    throw new RangeError("Charge de troupeau : 2 à 6 vagues, trajet 250–5000 ms, pause 100–6000 ms.");
  return count*travel+(count-1)*gap;
}

export function stampedeDirectDamageFromEffectsV1(effects){
  if(!Array.isArray(effects)||effects.length!==1||
     effects[0]?.kind!=="damage"||effects[0]?.targetScope!=="target"||
     !(Number(effects[0].amount)>0))
    throw new RangeError("Charge de troupeau : configure exactement un effet « Dégâts » ciblé dans Effets tactiques. Les autres effets ne sont pas compatibles.");
  return Number(effects[0].amount);
}
