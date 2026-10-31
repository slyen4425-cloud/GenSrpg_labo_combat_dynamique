import {normalizeSkillDefinition} from "../contracts/skill-definition.js";

// Player-facing projection of the one authoritative SkillDefinition.
// No manually maintained descriptions; no engine timings or ranges.
// Nested effects are interpreted recursively, with no gameplay simulation.
const elNames=Object.freeze({fire:"Feu",water:"Eau",earth:"Terre",air:"Air",electric:"Électricité",
  light:"Lumière",shadow:"Ombre",poison:"Poison",nature:"Nature",steel:"Acier",acier:"Acier",
  ice:"Glace",spirit:"Esprit",physical:"Physique"});
const statNames=Object.freeze({speed:"la vitesse",defense:"la défense",attack:"l'attaque",
  hp:"les PV",health:"les PV",initiative:"l'initiative",agility:"l'agilité",
  force:"la force",endurance:"l'endurance",intelligence:"l'intelligence",
  spirit:"l'esprit",energy:"l'énergie"});
const scopes=Object.freeze({self:"la créature",target:"la cible",
  all_enemies:"tous les ennemis",all_allies:"tous les alliés",
  all_except_self:"toutes les autres créatures",
  all_enemy_reserves:"les ennemis en réserve",all_ally_reserves:"les alliés en réserve",
  all_active:"toutes les créatures sur le terrain"});
const events=Object.freeze({damage_dealt:"inflige des dégâts",damage_taken:"subit des dégâts",
  movement:"se déplace",evaded:"esquive une attaque"});
const num=n=>String(Math.round(Number(n)*100)/100).replace(".",",");
const element=k=>elNames[k]??k??"";
const elementOf=k=>/^[aeéèêiouy]/i.test(element(k))?"d'"+element(k):"de "+element(k);
const stat=k=>statNames[k]??(elNames[k]?"l\'affinité "+elNames[k]:(k?"la caractéristique "+String(k).replace(/_/g," "):"la caractéristique"));
const duration=ms=>{const n=ms/1000;return num(n)+" "+(n===1?"seconde":"secondes");};
const lowerSentence=x=>x.replace(/^[A-Z]/,c=>c.toLowerCase()).replace(/\.$/,"").replace(/k\.o\b/gi,"K.O.");
const frequency=ms=>ms===1000?"chaque seconde":"toutes les "+duration(ms);
const words=(arr)=>arr.length<=1?(arr[0]??""):arr.length===2?
  arr.join(" et "):arr.slice(0,-1).join(", ")+" et "+arr[arr.length-1];
const subject=key=>scopes[key]??"la cible";
const actor=key=>key==="self"?"la créature":subject(key);
const onTarget=key=>key==="self"?"":key==="target"?" à la cible":
  key==="all_enemies"?" à tous les ennemis":key==="all_allies"?" à tous les alliés":
  key==="all_enemy_reserves"?" aux ennemis en réserve":
  key==="all_ally_reserves"?" aux alliés en réserve":" à "+subject(key);
const forTarget=key=>key==="self"?"":key==="target"?" chez la cible":" chez "+subject(key);
const period=s=>s.durationModel==="permanent"?"de façon permanente":
  s.durationModel==="owner_action_end"?"jusqu'à la fin de sa prochaine action":
  s.durationMs!=null?"pendant "+duration(s.durationMs):
  s.durationActions!=null?"pendant "+num(s.durationActions)+" actions":"";
const finish=s=>s? s.replace(/\s+/g," ").trim().replace(/[. ]*$/,"")+".":"";
const plus=(value)=>value>=0?"Augmente":"Réduit";
const modifier=(noun,value,unit)=>{
  const v=Number(value);
  if(v===0)return null;
  return {positive:v>0,text:noun+" de "+num(Math.abs(v))+" "+unit};
};
function simpleChange(s){
  if(s.kind==="stat_modifier"){
    const unit=s.modifierMode==="percent"?"%":"point"+(Math.abs(s.deltaPoints)===1?"":"s");
    return modifier(stat(s.statId),(s.modifierMode==="percent"?s.percent:s.deltaPoints),unit);
  }
  if(s.kind==="outgoing_damage_modifier")return modifier("les dégâts infligés",s.modifierPct,"%");
  if(s.kind==="incoming_effect_modifier")return modifier(s.affectedPolarity==="beneficial"?"les soins reçus":s.affectedPolarity==="both"?"les dégâts et soins reçus":"les dégâts reçus",s.modifierPct,"%");
  if(s.kind==="energy_regen_modifier")return modifier("la régénération d'énergie",s.modifierPct,"%");
  if(s.kind==="skill_cooldown_rate_modifier")return modifier("la vitesse de recharge des compétences",s.modifierPct,"%");
  if(s.kind==="approach_time_modifier")return modifier("le temps d'approche",s.modifierPct,"%");
  return null;
}
function groupChangeSentence(effects,indices){
  const first=effects[indices[0]],st=first.status,scope=first.targetScope;
  const pos=[],neg=[];
  for(const i of indices){
    const x=effects[i].status,m=simpleChange(x);
    if(!m)continue;
    // Reducing approach time is beneficial, but remains a reduction.
    (m.positive?pos:neg).push(m.text+
      (x.activationCondition==="moving"?" lors des déplacements":""));
  }
  // Changes of approach time use the stored sign, not invented movement speed.
  const parts=[];
  if(pos.length)parts.push("Augmente "+words(pos));
  if(neg.length)parts.push((parts.length?"mais réduit ":"Réduit ")+words(neg));
  return finish(parts.join(", ")+forTarget(scope)+" "+period(st));
}
function durationKey(s){
  return [s.durationModel,s.durationMs??"",s.durationActions??""].join(":");
}
function statusStory(s){
  const end=period(s);
  const tick=s.tickIntervalMs?frequency(s.tickIntervalMs):"à chaque fin d'action";
  let line;
  switch(s.kind){
    case "damage_over_time":line="Inflige "+num(s.amount)+" dégâts "+elementOf(s.channel)+" "+tick;break;
    case "heal_over_time":line="Rend "+num(s.amount)+" PV "+tick;break;
    case "shield":line="Accorde un bouclier de "+num(s.amount)+" points";break;
    case "damage_reflection":
      line="Renvoie "+num(s.percent)+" % des dégâts reçus";
      if(s.incomingKinds?.length && s.incomingKinds.length<7)
        line+=" pour les attaques "+words(s.incomingKinds.map(kind=>kind==="contact"?"au corps à corps":
          kind==="beam"?"par rayon":kind==="projectile"?"par projectile":kind));
      if(s.contactDamage>0)line+=" et inflige "+num(s.contactDamage)+" dégâts au contact";
      break;
    case "projectile_mirror":line="Renvoie les projectiles reçus";break;
    case "auto_dodge":line="Esquive automatiquement les attaques";break;
    case "immunity":line=s.intangible?"Devient immatérielle et résiste aux dégâts et aux états négatifs":
      "Devient immunisée contre "+words((s.domains??[]).map(x=>x==="damage"?"les dégâts":"les états négatifs"));break;
    case "immobilize":line="Immobilise la cible";break;
    case "silence":line="Empêche la cible d'utiliser certaines capacités";break;
    case "stun":line="Étourdit la cible";break;
    case "taunt":line="Provoque la cible";break;
    case "stack_counter":line="Accumule des charges"+(s.maxStacks>1?" (maximum "+num(s.maxStacks)+")":"");break;
    case "triggered_buff":line="Déclenche un effet sous certaines conditions";break;
    default:{
      const change=simpleChange(s);
      if(change)return finish((change.positive?"Augmente ":"Réduit ")+change.text+" "+end);
      line="Applique un effet (« "+(s.label??s.kind)+" »)";
    }
  }
  if(s.kind==="triggered_buff"){
    const trigger=s.onEvent??s.onDamageDealt;
    const evt=s.onEvent?.event??"damage_dealt";
    return [finish("Pendant "+duration(s.durationMs)+", quand la créature "+
      (events[evt]??"agit")+", "+
      descriptions(trigger.effects).map(x=>lowerSentence(x)).join(" et "))];
  }
  const result=[finish(line+" "+end)];
  if(s.periodic){
    const p=s.periodic;
    result.push(finish(frequency(p.intervalMs).replace(/^t/,"T").replace(/^c/,"C")+", "+
      (p.kind==="damage"?"inflige "+num(p.amount)+" dégâts "+elementOf(p.channel):
        p.kind==="life_steal"?"inflige "+num(p.amount)+" dégâts "+elementOf(p.channel)+
          " par charge et rend "+num(p.percent)+" % des PV réellement retirés au lanceur":
        "rend "+num(p.amount)+" PV")));
  }
  if(s.onEvent||s.onDamageDealt){
    const t=s.onEvent??s.onDamageDealt;
    const when=s.onEvent?.event??"damage_dealt";
    result.push(finish("Quand la créature "+(events[when]??"agit")+", "+
      descriptions(t.effects).map(x=>lowerSentence(x)).join(" et ")));
  }
  if(s.onStackThreshold){
    const t=s.onStackThreshold;
    result.push(finish("À "+num(t.count)+" charges, "+
      descriptions(t.effects).map(x=>lowerSentence(x)).join(" et ")+
      (t.consume==="reset"?", puis les charges sont remises à zéro":"")));
  }
  if(s.onStackAdded?.effects?.length){
    result.push(finish("À chaque charge gagnée, "+
      descriptions(s.onStackAdded.effects).map(x=>lowerSentence(x)).join(" et ")));
  }
  return result;
}
function statusSentence(effect){
  const result=statusStory(effect.status);
  if(effect.targetScope==="self"||effect.status.kind==="triggered_buff")return result;
  // Present targets only when they differ from the default self-effect.
  return result.map((line,i)=>i===0?
    line.replace(/\.$/,"")+" "+(effect.targetScope==="target"?"sur la cible":"sur "+subject(effect.targetScope))+".":line);
}
function penetrates(e){
  const clauses=[];
  if(e.ignoreResistancePct>0)clauses.push(e.ignoreResistancePct===100?
    "ignore la résistance":"ignore "+num(e.ignoreResistancePct)+" % de la résistance");
  if(e.ignoreDamageReductionPct>0)clauses.push(e.ignoreDamageReductionPct===100?
    "ignore la réduction des dégâts":"ignore "+num(e.ignoreDamageReductionPct)+" % de la réduction des dégâts");
  return clauses;
}
function effectSentence(e,{perCharge=false}={}){
  switch(e.kind){
    case "damage":return [finish("Inflige "+num(e.amount)+" dégâts"+(e.channel?" "+elementOf(e.channel):"")+
      (perCharge?" par charge consommée":"")+
      onTarget(e.targetScope)+(penetrates(e).length?" et "+words(penetrates(e)):""))];
    case "heal":return [finish("Rend "+num(e.amount)+" PV"+(perCharge?" par charge consommée":"")+onTarget(e.targetScope))];
    case "energy_restore":return [finish("Rend "+num(e.amount)+" points d'énergie"+(perCharge?" par charge consommée":"")+onTarget(e.targetScope))];
    case "energy_drain":return [finish("Retire "+num(e.amount)+" points d'énergie"+(perCharge?" par charge consommée":"")+onTarget(e.targetScope))];
    case "life_steal":return [finish("Récupère "+num(e.percent)+" % des dégâts infligés sous forme de PV"+
      (e.maxHeal!=null?" (maximum "+num(e.maxHeal)+" PV)":""))];
    case "knockout":return [finish("Met "+subject(e.targetScope)+" K.O.")];
    case "force_reserve_switch":return [
      "Force la créature ennemie choisie dans sa réserve à entrer en combat à la place de la créature adverse active, si l'attaque touche."
    ];
    case "apply_status":return statusSentence(e);
    case "cleanse":return [finish(e.statusTags.length===0?
      (e.targetScope==="target"?"Supprime tous les effets et marqueurs négatifs de la cible":
        e.targetScope==="self"?"Supprime tous les effets et marqueurs négatifs de la créature":
        "Supprime tous les effets et marqueurs négatifs"+onTarget(e.targetScope)):
      "Supprime les effets négatifs sélectionnés"+onTarget(e.targetScope))];
    case "dispel":return [finish("Retire les bonus"+onTarget(e.targetScope))];
    case "apply_marker":{
      const m=e.marker;
      const lines=[finish("Ajoute "+num(e.charges)+" charge"+(e.charges>1?"s":"")+" de "+m.name+
        onTarget(e.targetScope)+(m.maxStacks>1?" (maximum "+num(m.maxStacks)+")":"")+
        (m.permanent?" sans limite de durée":m.durationMs?" pendant "+duration(m.durationMs):""))];
      if(m.periodic){
        const p=m.periodic;
        lines.push(finish(frequency(p.intervalMs).replace(/^t/,"T").replace(/^c/,"C")+", ce marqueur "+
          (p.kind==="damage"?"inflige "+num(p.amount)+" dégâts "+elementOf(p.channel):
            p.kind==="life_steal"?"inflige "+num(p.amount)+" dégâts "+elementOf(p.channel)+
              " par charge et rend "+num(p.percent)+" % des PV réellement retirés au lanceur":
            "soigne "+num(p.amount)+" PV")));
      }
      if(m.onStackThreshold){
        const t=m.onStackThreshold;
        lines.push(finish("À "+num(t.count)+" charges, "+
          descriptions(t.effects).map(x=>lowerSentence(x)).join(" et ")+
          (t.consume==="reset"?", puis les charges sont remises à zéro":"")));
      }
      if(m.onStackAdded?.effects?.length){
        lines.push(finish("À chaque charge ajoutée, "+
          descriptions(m.onStackAdded.effects).map(x=>lowerSentence(x)).join(" et ")));
      }
      return lines;
    }
    case "consume_marker":return [
      finish("Consomme "+(e.count==="all"?"les charges":num(e.count)+" charges")+" de "+e.markerId+
        onTarget(e.targetScope)+(e.minimum>1?" (au moins "+num(e.minimum)+")":"")+
        ""),
      ...descriptions(e.effects,{perCharge:e.perCharge===true})];
    case "scheduled_effect":return [finish("Après "+duration(e.trigger.delayMs)+", "+
      descriptions(e.effects).map(x=>lowerSentence(x)).join(" et "))];
    case "persistent_zone":return groupZones([e]);
    default:return [finish("Effet non encore décrit : "+e.kind)];
  }
}
function zoneClause(zone){
  const e=zone.tickEffect;
  const status=e.kind==="apply_status"?e.status:null;
  const change=status?simpleChange(status):null;
  if(change)return (change.positive?"augmentent ":"réduisent ")+change.text;
  if(e.kind==="damage")return "infligent "+num(e.amount)+" dégâts"+
    (e.channel?" "+elementOf(e.channel):"")+
    (zone.damageTrigger==="entry_only"?" à l'entrée dans la zone":
      zone.damageTrigger==="entry_and_tick"?" à l'entrée puis "+frequency(zone.tickIntervalMs):
      " "+frequency(zone.tickIntervalMs));
  if(status?.kind==="heal_over_time")return "rendent "+num(status.amount)+" PV "+
    (status.tickIntervalMs?frequency(status.tickIntervalMs):"après chaque action");
  if(status?.kind==="damage_over_time")return "infligent "+num(status.amount)+" dégâts"+
    (status.channel?" de "+element(status.channel):"")+" "+
    (status.tickIntervalMs?frequency(status.tickIntervalMs):"après chaque action");
  if(status?.kind==="shield")return "accordent un bouclier de "+num(status.amount)+" points";
  if(status?.kind==="auto_dodge")return "permettent d'esquiver automatiquement";
  return null;
}
function groupZones(zones){
  const first=zones[0], many=zones.length>1;
  const clauses=zones.map(zoneClause);
  if(clauses.some(x=>x===null)){
    return zones.map(z=>finish("Crée une zone "+onTarget(z.targetScope)+
      " pendant "+duration(z.durationMs)+" : "+
      effectSentence(z.tickEffect).map(x=>x.replace(/\.$/,"")).join(" puis ")));
  }
  const target=first.targetScope==="self"?"autour de la créature":
    first.targetScope==="all_allies"?"pour tous les alliés":
    first.targetScope==="all_enemies"?"contre tous les ennemis":
    "sur "+subject(first.targetScope);
  let text="Crée "+(many?"des zones qui ":"une zone qui ")+words(clauses)+
    " "+target+" pendant "+duration(first.durationMs);
  if(first.statusBehavior==="while_inside")text+=", tant que les créatures s'y trouvent";
  if(first.statusBehavior==="on_enter")text+=", dès leur entrée dans la zone";
  if(first.persistAfterRecall)text+=" ; "+(many?"elles restent actives":"elle reste active")+
    " après un rappel";
  return [finish(text)];
}
function descriptions(effects,{perCharge=false}={}){
  const list=effects??[], used=new Set(),out=[];
  for(let i=0;i<list.length;i++){
    if(used.has(i))continue;
    const e=list[i];
    if(e.kind==="heal" && list[i+1]?.kind==="cleanse" &&
       list[i+1].targetScope===e.targetScope && list[i+1].statusTags?.length===0 &&
       !used.has(i+1)){
      // One gameplay sentence, but never misrepresent a tag-filtered cleanse
      // or an effect that targets a different recipient.
      used.add(i+1);
      const subject=e.targetScope==="target"?"à la cible":onTarget(e.targetScope);
      const clause=e.targetScope==="target"?
        "et supprime tous ses effets et marqueurs négatifs":
        "et supprime tous les effets et marqueurs négatifs"+onTarget(e.targetScope);
      out.push(finish("Rend "+num(e.amount)+" PV"+(perCharge?" par charge consommée":"")+" "+subject+" "+clause));
    }else if(e.kind==="persistent_zone"){
      const same=[];
      for(let j=i;j<list.length;j++){
        const x=list[j];
        if(x.kind==="persistent_zone" && x.targetScope===e.targetScope &&
           x.durationMs===e.durationMs && x.statusBehavior===e.statusBehavior &&
           Boolean(x.persistAfterRecall)===Boolean(e.persistAfterRecall) &&
           (x.tickEffect?.kind!=="damage" || x.damageTrigger===e.damageTrigger)){
          same.push(j);used.add(j);
        }
      }
      out.push(...groupZones(same.map(j=>list[j])));
    }else if(e.kind==="apply_marker"){
      // A single marker applied both on the field and to reserves is one
      // gameplay effect with two recipient groups, not two repetitions.
      const reserve=e.targetScope==="all_enemies"?"all_enemy_reserves":
        e.targetScope==="all_allies"?"all_ally_reserves":null;
      let reserveIndex=-1;
      if(reserve!==null){
        reserveIndex=list.findIndex((x,j)=>j>i&&!used.has(j)&&
          x.kind==="apply_marker"&&x.targetScope===reserve&&
          x.charges===e.charges&&JSON.stringify(x.marker)===JSON.stringify(e.marker));
      }
      const lines=effectSentence(e);
      if(reserveIndex>=0){
        used.add(reserveIndex);
        lines[0]=lines[0].replace(/\.$/,"")+
          (reserve==="all_enemy_reserves"?", y compris ceux en réserve.":", y compris ceux en réserve.");
      }
      out.push(...lines);
    }else if(e.kind==="apply_status" && simpleChange(e.status)){
      const same=[];
      for(let j=i;j<list.length;j++){
        const y=list[j];
        if(y.kind==="apply_status" && simpleChange(y.status) &&
           y.targetScope===e.targetScope && durationKey(y.status)===durationKey(e.status)){
          same.push(j);used.add(j);
        }
      }
      out.push(groupChangeSentence(list,same));
    }else{
      out.push(...effectSentence(e,{perCharge}));
    }
  }
  return out.filter(Boolean);
}
function conditions(d){
  const dict={
    combat_elapsed_ms:v=>"au moins "+duration(v)+" écoulées depuis le début du combat",
    damage_dealt:v=>"avoir infligé "+num(v)+" dégâts",
    damage_taken:v=>"avoir subi "+num(v)+" dégâts",
    hp_at_or_below_pct:v=>"être à "+num(v)+" % de PV ou moins",
    allies_defeated:v=>"avoir perdu "+num(v)+" alliés",
    enemies_defeated:v=>"avoir vaincu "+num(v)+" ennemis",
    kills_by_self:v=>"avoir mis "+num(v)+" ennemis K.O."
  };
  const clauses=d.activationRequirements.conditions.map(x=>dict[x.type]?.(x.threshold)??"remplir la condition « "+x.type+" »");
  if(clauses.length===0&&!d.markerCost)return [];
  const notes=[];
  if(clauses.length)notes.push(finish("Pour l'utiliser, il faut "+clauses.join(
    d.activationRequirements.mode==="any"?" ou ":" et ")));
  if(d.markerCost)notes.push(finish("Consomme "+num(d.markerCost.count)+" charges de "+
    d.markerCost.markerId+" "+(d.markerCost.source==="target"?"sur la cible":"sur la créature")));
  return notes;
}
// Exceptional reach only: the standard surface target is never a tooltip
// by itself. The explicit list is owned by SkillDefinition/Combat Rules;
// intangible immunity penetration is a separate, orthogonal flag.
function exceptionalReachSentence(d){
  const configured=Array.isArray(d.hitPresenceStates);
  const flight=configured && d.hitPresenceStates.includes("airborne");
  const underground=configured && d.hitPresenceStates.includes("underground");
  const intangible=d.hitsIntangible===true;
  if(!flight && !underground && !intangible)return null;

  const uncommon=[
    ...(flight?["en vol"]:[]),
    ...(underground?["sous terre"]:[])
  ];
  const surfaceAllowed=!configured || d.hitPresenceStates.includes("surface");
  if(uncommon.length===0) {
    return "Peut aussi toucher les créatures immatérielles.";
  }
  const targets=words(uncommon);
  if(surfaceAllowed) {
    return "Peut aussi toucher les créatures "+targets+
      (intangible?", même immatérielles.":".");
  }
  // Some authored attacks deliberately omit surface from hitPresenceStates;
  // avoid falsely claiming that they can also hit ordinary ground targets.
  return "Peut toucher les créatures "+targets+
    (intangible?", même immatérielles":"")+", mais pas celles au sol.";
}
function specialRules(d){
  const list=[];
  const exceptionalReach=exceptionalReachSentence(d);
  if(exceptionalReach)list.push(exceptionalReach);
  if(d.dodgeable===false)list.push("Cette attaque ne peut pas être esquivée.");
  if(d.reaction.reflectForms.length)list.push(finish("Renvoie les attaques "+
    words(d.reaction.reflectForms)));
  if(d.reaction.blockForms.length)list.push(finish("Bloque les attaques "+
    words(d.reaction.blockForms)));
  if(d.reaction.immuneElements.length)list.push(finish("Protège contre "+
    words(d.reaction.immuneElements.map(element))));
  if(d.reaction.evadeForms.length)list.push(finish("Esquive les attaques "+
    words(d.reaction.evadeForms)));
  if(d.reaction.counterForms.length)list.push(finish("Contre les attaques "+
    words(d.reaction.counterForms)));
  if(d.evasion?.incomingForms?.length)list.push(finish("Permet d'esquiver "+
    words(d.evasion.incomingForms)));
  return list;
}
export function describeCaptureSkillV1(input) {
  const d=normalizeSkillDefinition(input);
  const phrases=[];
  if(d.chargedAttack){
    const c=d.chargedAttack;
    const maxDamage=c.baseDamage+(c.maxCharges-1)*c.bonusDamagePerCharge;
    phrases.push(finish("Inflige "+num(c.baseDamage)+" dégâts de base. Après chaque préparation, une nouvelle activation pendant la fenêtre de "+duration(c.reactivationWindowMs)+
      " ajoute "+num(c.bonusDamagePerCharge)+
      " dégâts supplémentaires et augmente la taille du cast et du projectile de "+num(c.sizeIncreasePct)+
      " %, jusqu'à "+num(c.maxCharges)+" activations ("+num(maxDamage)+" dégâts maximum). Chaque activation exige une préparation complète et consomme "+num(d.energyCost)+" énergie. La fenêtre pour réactiver commence après chaque préparation ; à la charge maximale, le tir part une fois la dernière préparation terminée."));
  }
  if(d.chargedEffects){
    const c=d.chargedEffects;
    phrases.push(finish("Charge les soins, buffs ou debuffs : chaque activation après une préparation complète augmente leur intensité de "+num(c.potencyIncreasePct)+
      " % (maximum "+num(c.maxCharges)+" activations), sans changer leurs durées. Chaque activation consomme "+num(d.energyCost)+
      " énergie et peut agrandir le cast de "+num(c.sizeIncreasePct)+" %. Nouvelle activation possible pendant "+duration(c.reactivationWindowMs)+
      " après la préparation. Une seule application à l'impact, immunités conservées."));
  }
  if(d.effect.damage>0)phrases.push(finish("Inflige "+num(d.effect.damage)+" dégâts"));
  if(d.effect.heal>0)phrases.push(finish("Rend "+num(d.effect.heal)+" PV"));
  if(d.effect.stunMs>0)phrases.push(finish("Étourdit pendant "+duration(d.effect.stunMs)));
  if(d.effect.interruptsPreparation)phrases.push("Interrompt l'action en préparation.");
  phrases.push(...descriptions(d.effects));
  if(d.contactHold){
    const hold=d.contactHold,damage=hold.effects.filter(x=>x.kind==="damage");
    const steal=hold.effects.filter(x=>x.kind==="life_steal");
    if(hold.effects.length===2 && damage.length===1 && steal.length===1 &&
       damage[0].targetScope==="target" && steal[0].targetScope==="self"){
      phrases.push(finish("Au corps à corps, reste accroché à la cible et lui inflige "+
        num(damage[0].amount)+" dégâts"+(damage[0].channel?" "+elementOf(damage[0].channel):"")+
        " "+frequency(hold.tickIntervalMs)+", tout en récupérant "+num(steal[0].percent)+
        " % de ces dégâts sous forme de PV"+
        (steal[0].maxHeal!=null?" (maximum "+num(steal[0].maxHeal)+" PV)":"")+
        (hold.maxDurationMs>0?" pendant "+duration(hold.maxDurationMs):"")));
    }else{
      const held=descriptions(hold.effects);
      if(held.length)phrases.push(finish("Au corps à corps, reste accroché à la cible et "+
        held.map(x=>lowerSentence(x)).join(" et ")+
        " "+frequency(hold.tickIntervalMs)+
        (hold.maxDurationMs>0?" pendant "+duration(hold.maxDurationMs):"")));
    }
  }
  phrases.push(...specialRules(d),...conditions(d));
  if(d.maxUsesPerCombat!=null)phrases.push(finish("Utilisable "+
    (d.maxUsesPerCombat===1?"une fois":num(d.maxUsesPerCombat)+" fois")+" par combat"));
  if(!phrases.length)phrases.push("Aucun effet de combat défini.");
  return Object.freeze({sentences:Object.freeze(phrases.map(String))});
}
