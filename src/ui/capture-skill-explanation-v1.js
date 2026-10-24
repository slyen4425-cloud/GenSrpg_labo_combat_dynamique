import {normalizeSkillDefinition} from "../contracts/skill-definition.js";

// Reusable, deterministic authoring explanation. All facts come from the
// gameplay contract, never from draft.description or visual asset filenames.
// Raw amounts are configured values, not a simulation of resistance/combat.
const elements = Object.freeze({
  fire:"Feu",water:"Eau",earth:"Terre",air:"Air",electric:"Électricité",
  light:"Lumière",shadow:"Ombre",poison:"Poison",nature:"Nature",
  steel:"Acier",acier:"Acier",ice:"Glace",spirit:"Esprit",physical:"Physique"
});
const relation = Object.freeze({target:"la cible",self:"l'utilisateur",
  all_enemies:"tous les ennemis",all_allies:"tous les alliés",
  all_except_self:"toutes les créatures sauf l'utilisateur",
  all_enemy_reserves:"les ennemis en réserve",
  all_ally_reserves:"les alliés en réserve",
  all_active:"toutes les créatures actives"});
const distances = Object.freeze({short:"courte",medium:"moyenne",long:"longue"});
const presence = Object.freeze({surface:"au sol",airborne:"en vol",underground:"sous terre"});
const forms = Object.freeze({contact:"corps à corps",projectile:"projectile",
  beam:"rayon",area:"zone",self:"sur soi",aura:"aura"});
const events = Object.freeze({damage_dealt:"l'utilisateur inflige des dégâts",
  damage_taken:"l'utilisateur reçoit des dégâts",
  movement:"l'utilisateur se déplace",evaded:"l'utilisateur esquive"});
const num = n => String(Math.round(Number(n)*100)/100).replace(".",",");
const pct = n => (n>0?"+":"")+num(n)+" %";
const seconds = ms => num(ms/1000)+" s";
const el = key => key == null ? "" : (elements[key] ?? key);
const scope = key => relation[key] ?? "la cible indiquée";
const join = parts => parts.filter(Boolean).join(" ; ");
const targetText = eff => "sur "+scope(eff.targetScope);
const pos = (n,unit) => num(n)+" "+unit;
function duration(status) {
  if(status.durationModel==="permanent")return "durée permanente";
  if(status.durationModel==="owner_action_end")return "jusqu'à la fin de l'action du porteur";
  if(status.durationMs!=null)return "durée "+seconds(status.durationMs);
  if(status.durationActions!=null)return "durée "+pos(status.durationActions,"actions");
  return "durée non précisée";
}
function stacking(status) {
  if(status.stacking==="stack")return "cumul jusqu'à "+num(status.maxStacks)+" charges";
  if(status.stacking==="refresh")return "nouvelle application : durée renouvelée";
  return "";
}
function interval(status) {
  return status.tickIntervalMs ? "toutes les "+seconds(status.tickIntervalMs) : "à chaque action du porteur";
}
function showStatus(status,indent="") {
  const lines=[];
  let body;
  switch(status.kind) {
    case "damage_over_time":
      body="Dégâts répétés : "+num(status.amount)+" "+el(status.channel)+" "+interval(status)+
        (status.damageMode==="fixed"?" (valeur fixe)":" (calcul du combat)");
      break;
    case "heal_over_time":
      body="Soins répétés : "+num(status.amount)+" PV "+interval(status);
      break;
    case "shield":body="Bouclier absorbant "+num(status.amount)+" dégâts";break;
    case "stat_modifier":
      body="Statistique "+status.statId+" : "+(status.modifierMode==="percent"?
        pct(status.percent):((status.deltaPoints>0?"+":"")+num(status.deltaPoints)+" points"))+
        (status.activationCondition==="moving"?" uniquement pendant un déplacement":"");
      break;
    case "outgoing_damage_modifier":body="Dégâts infligés : "+pct(status.modifierPct);break;
    case "approach_time_modifier":body="Temps d'approche : "+pct(status.modifierPct);break;
    case "energy_regen_modifier":body="Régénération d'énergie : "+pct(status.modifierPct);break;
    case "skill_cooldown_rate_modifier":body="Vitesse de recharge des compétences : "+pct(status.modifierPct);break;
    case "damage_reflection":
      body="Renvoi de "+num(status.percent)+" % des dégâts reçus"+
        (status.incomingKinds?.length?" (types : "+status.incomingKinds.join(", ")+")":"");
      if(status.contactDamage>0)body+=" ; "+num(status.contactDamage)+" dégâts au contact";
      break;
    case "projectile_mirror":body="Renvoie les projectiles";break;
    case "auto_dodge":body="Esquive automatique pendant l'effet";break;
    case "immunity":
      body=status.intangible?"État immatériel : immunité aux dégâts et aux états négatifs":
        "Immunité : "+(status.domains??[]).map(x=>x==="damage"?"dégâts":x==="negative_status"?"états négatifs":x).join(", ");
      break;
    case "immobilize":body="Immobilise la cible";break;
    case "silence":body="Applique le silence";break;
    case "stun":body="Étourdit la cible";break;
    case "taunt":body="Provoque la cible";break;
    case "stack_counter":body="Compteur de charges";break;
    case "triggered_buff":body="Effet déclenché par une action";break;
    default:body="Effet non encore interprété automatiquement ("+status.kind+")";
  }
  lines.push(indent+join([status.label??body,status.label?body:null,duration(status),stacking(status)]));
  if(status.periodic){
    const p=status.periodic;
    lines.push(indent+"↳ À intervalle régulier : "+num(p.amount)+(p.kind==="damage"?
      " dégâts "+el(p.channel):" PV soignés")+" toutes les "+seconds(p.intervalMs));
  }
  const triggered=status.onEvent??status.onDamageDealt;
  if(triggered){
    const key=status.onEvent?.event??"damage_dealt";
    lines.push(indent+"↳ Quand "+(events[key]??key)+" :");
    lines.push(...describeEffects(triggered.effects,indent+"  "));
  }
  if(status.onStackThreshold){
    const t=status.onStackThreshold;
    lines.push(indent+"↳ À "+num(t.count)+" charges :"+
      (t.consume==="keep"?" charges conservées":" remise à zéro des charges")+
      (t.repeat==="each_addition"?", déclenchement à chaque ajout":""));
    lines.push(...describeEffects(t.effects,indent+"  "));
  }
  if(status.onStackAdded?.effects?.length){
    lines.push(indent+"↳ À chaque charge ajoutée :");
    lines.push(...describeEffects(status.onStackAdded.effects,indent+"  "));
  }
  return lines;
}
function describeEffect(effect,indent="") {
  const where=targetText(effect);
  switch(effect.kind) {
    case "damage":{
      const penetration=join([
        effect.ignoreResistancePct>0?"ignore "+pct(effect.ignoreResistancePct)+" de résistance":null,
        effect.ignoreDamageReductionPct>0?"ignore "+pct(effect.ignoreDamageReductionPct)+" de réduction des dégâts":null
      ]);
      return [indent+"Inflige "+num(effect.amount)+" dégâts"+(effect.channel?" "+el(effect.channel):"")+
        " "+where+(penetration?" ("+penetration+")":"")];
    }
    case "heal":return [indent+"Soigne "+num(effect.amount)+" PV "+where];
    case "energy_restore":return [indent+"Restaure "+num(effect.amount)+" énergie "+where];
    case "energy_drain":return [indent+"Retire "+num(effect.amount)+" énergie "+where];
    case "life_steal":return [indent+"Récupère "+num(effect.percent)+" % des dégâts infligés en PV"+
      (effect.maxHeal!=null?" (maximum "+num(effect.maxHeal)+" PV)":"")];
    case "knockout":return [indent+"Met K.O. "+scope(effect.targetScope)];
    case "cleanse":return [indent+"Dissipe les états négatifs "+where+
      (effect.statusTags.length?" (tags : "+effect.statusTags.join(", ")+")":"")];
    case "dispel":return [indent+"Retire des effets positifs "+where+
      (effect.statusTags.length?" (tags : "+effect.statusTags.join(", ")+")":"")];
    case "apply_status":return [indent+"Applique un état "+where+" :",
      ...showStatus(effect.status,indent+"  ")];
    case "apply_marker":{
      const marker=effect.marker;
      const lines=[indent+"Applique "+num(effect.charges)+" charge(s) de « "+marker.name+
        " » "+where+" (maximum "+num(marker.maxStacks)+" charges"+
        (marker.permanent?", permanent":marker.durationMs?", "+seconds(marker.durationMs):"")+")"];
      if(marker.periodic)lines.push(indent+"  ↳ "+num(marker.periodic.amount)+
        (marker.periodic.kind==="damage"?" dégâts "+el(marker.periodic.channel):" PV soignés")+
        " toutes les "+seconds(marker.periodic.intervalMs));
      if(marker.onStackThreshold){
        lines.push(indent+"  ↳ À "+num(marker.onStackThreshold.count)+" charges :");
        lines.push(...describeEffects(marker.onStackThreshold.effects,indent+"    "));
      }
      if(marker.onStackAdded?.effects?.length){
        lines.push(indent+"  ↳ À chaque nouvelle charge :");
        lines.push(...describeEffects(marker.onStackAdded.effects,indent+"    "));
      }
      return lines;
    }
    case "consume_marker":return [
      indent+"Consomme "+(effect.count==="all"?"toutes les charges":num(effect.count)+" charges")+
        " du marqueur « "+effect.markerId+" » "+where+
        " (minimum "+num(effect.minimum)+")"+
        (effect.perCharge?" ; effets multipliés par charge consommée":""),
      ...describeEffects(effect.effects,indent+"  ")
    ];
    case "scheduled_effect":return [indent+"Après "+seconds(effect.trigger.delayMs)+" "+where+" :",
      ...describeEffects(effect.effects,indent+"  ")];
    case "persistent_zone":{
      const lines=[indent+"Crée une zone de portée "+(distances[effect.radius]??effect.radius)+
        " pendant "+seconds(effect.durationMs)+" "+where];
      if(effect.damageTrigger==="entry_only")lines.push(indent+"  ↳ Dégâts uniquement à l'entrée dans la zone");
      else if(effect.damageTrigger==="entry_and_tick")lines.push(indent+"  ↳ Dégâts à l'entrée puis à chaque intervalle");
      else if(effect.tickEffect.kind==="damage")lines.push(indent+"  ↳ Intervalle : "+seconds(effect.tickIntervalMs));
      if(effect.statusBehavior==="while_inside")lines.push(indent+"  ↳ États maintenus tant que la cible reste dans la zone");
      if(effect.statusBehavior==="on_enter")lines.push(indent+"  ↳ États appliqués lors de l'entrée dans la zone");
      if(effect.persistAfterRecall===true)lines.push(indent+"  ↳ Persiste après le rappel de la créature");
      if(effect.maxActivations>1)lines.push(indent+"  ↳ Jusqu'à "+num(effect.maxActivations)+" activations");
      if(effect.radiusGrowthSteps>0)lines.push(indent+"  ↳ Rayon croissant sur "+num(effect.radiusGrowthSteps)+" paliers");
      lines.push(...describeEffect(effect.tickEffect,indent+"  ↳ "));
      return lines;
    }
    default:return [indent+"Effet non encore interprété automatiquement ("+effect.kind+")"];
  }
}
function describeEffects(effects,indent="") {
  return (effects??[]).flatMap(e=>describeEffect(e,indent));
}
function describeLegacy(legacy) {
  const lines=[];
  if(legacy.damage>0)lines.push("Inflige "+num(legacy.damage)+" dégâts de base");
  if(legacy.heal>0)lines.push("Soigne "+num(legacy.heal)+" PV de base");
  if(legacy.stunMs>0)lines.push("Étourdit pendant "+seconds(legacy.stunMs));
  if(legacy.interruptsPreparation)lines.push("Interrompt la préparation ennemie");
  if(legacy.tags?.length)lines.push("Tags techniques : "+legacy.tags.join(", "));
  return lines;
}
function requirements(definition) {
  const list=definition.activationRequirements.conditions;
  const names={
    combat_elapsed_ms:v=>"combat commencé depuis "+seconds(v),
    damage_dealt:v=>num(v)+" dégâts infligés",
    damage_taken:v=>num(v)+" dégâts reçus",
    hp_at_or_below_pct:v=>"PV à "+num(v)+" % ou moins",
    allies_defeated:v=>num(v)+" alliés mis K.O.",
    enemies_defeated:v=>num(v)+" ennemis mis K.O.",
    kills_by_self:v=>num(v)+" K.O. réalisés par l'utilisateur"
  };
  const lines=list.map(c=>names[c.type]?.(c.threshold)??"Condition "+c.type+" : "+num(c.threshold));
  if(definition.markerCost){
    const c=definition.markerCost;
    lines.push("Consommer "+num(c.count)+" charge(s) du marqueur « "+c.markerId+
      " » sur "+(c.source==="target"?"la cible":"l'utilisateur"));
  }
  return lines.length?[
    "Conditions "+(definition.activationRequirements.mode==="any"?"(au moins une)":"(toutes requises)")+" :",
    ...lines.map(v=>"↳ "+v)
  ]:["Aucune condition supplémentaire configurée"];
}
function formSummary(definition) {
  const entries={
    contact:"Une attaque de contact",
    projectile:"Une attaque par projectile",
    beam:"Un rayon d'énergie",
    area:"Un effet de zone",
    self:"Une capacité personnelle",
    aura:"Une aura"
  };
  let text=entries[definition.form]??"Une capacité";
  if(definition.projectileTargeting==="expanding_wave")text+=" en onde expansive";
  if(definition.approachMode==="ground")text+=" avec approche terrestre";
  if(definition.approachMode==="aerial")text+=" avec déplacement aérien";
  if(definition.approachMode==="teleport")text+=" avec téléportation";
  if(definition.approachMode==="burrow")text+=" avec déplacement souterrain";
  return text+".";
}
function targeting(definition) {
  const rel={enemy:"ennemi",ally:"allié",self:"soi-même",any:"n'importe quelle créature"};
  const loc={active:"terrain",reserve:"réserve"};
  const lines=[
    "Cibles : "+definition.targetRelations.map(x=>rel[x]??x).join(" / ")+
      " · "+definition.targetLocations.map(x=>loc[x]??x).join(" / "),
    "Portée : "+definition.allowedDistances.map(x=>distances[x]??x).join(", ")
  ];
  if(definition.hitPresenceStates?.length)lines.push("Touche les cibles : "+
    definition.hitPresenceStates.map(x=>presence[x]??x).join(", "));
  if(definition.hitsIntangible)lines.push("Peut toucher les créatures immatérielles");
  if(definition.dodgeable===false)lines.push("Ne peut pas être esquivée");
  if(definition.projectileTargeting==="fixed_point")lines.push("Projectile dirigé vers un point fixe");
  if(definition.projectileTargeting==="expanding_wave"){
    const wave=definition.expandingWave;
    lines.push("Onde : rayon "+num(wave.startRadiusPct)+" → "+num(wave.endRadiusPct)+
      " % ; épaisseur "+num(wave.thicknessPct)+" %");
  }
  return lines;
}
function reactions(definition) {
  const r=definition.reaction;
  const lines=[];
  if(r.reflectForms.length)lines.push("Renvoie les attaques : "+r.reflectForms.map(x=>forms[x]??x).join(", "));
  if(r.blockForms.length)lines.push("Bloque les attaques : "+r.blockForms.map(x=>forms[x]??x).join(", "));
  if(r.counterForms.length)lines.push("Contre-attaque face à : "+r.counterForms.map(x=>forms[x]??x).join(", "));
  if(r.evadeForms.length)lines.push("Esquive les attaques : "+r.evadeForms.map(x=>forms[x]??x).join(", "));
  if(r.evadeApproaches.length)lines.push("Esquive les approches : "+r.evadeApproaches.join(", "));
  if(r.immuneElements.length)lines.push("Immunité aux éléments : "+r.immuneElements.map(el).join(", "));
  if(definition.evasion.window && definition.evasion.incomingForms.length)lines.push(
    "Fenêtre d'esquive pendant le déplacement : "+definition.evasion.incomingForms.map(x=>forms[x]??x).join(", ")
  );
  if(definition.projectileClash.power>0)lines.push("Puissance de collision des projectiles : "+
    num(definition.projectileClash.power));
  return lines;
}
export function describeCaptureSkillV1(input) {
  const d=normalizeSkillDefinition(input);
  const main=[...describeLegacy(d.effect),...describeEffects(d.effects)];
  if(d.contactHold){
    const hold=d.contactHold;
    main.push("Au contact : maintien avec déclenchement toutes les "+seconds(hold.tickIntervalMs)+
      (hold.maxDurationMs>0?", durée maximale "+seconds(hold.maxDurationMs):
        ", sans durée maximale configurée"));
    main.push(...describeEffects(hold.effects,"  ↳ "));
  }
  if(!main.length)main.push("Aucun effet direct configuré dans cette définition.");
  const meta=[
    d.loadoutSlot==="ultimate"?"Ultime":"Compétence",
    el(d.element)||"Sans élément",
    "Énergie : "+num(d.energyCost),
    "Recharge : "+(d.cooldownMs?seconds(d.cooldownMs):"aucune"),
    ...(d.maxUsesPerCombat!=null?["Utilisations par combat : "+num(d.maxUsesPerCombat)]:[])
  ];
  const sections=[
    {title:"Effets",lines:main},
    {title:"Cibles et portée",lines:targeting(d)},
    {title:"Conditions",lines:requirements(d)},
    {title:"Déroulement",lines:[
      "Préparation : "+seconds(d.preparationMs),
      "Déplacement / trajet : "+seconds(d.travelMs),
      "Récupération : "+seconds(d.recoveryMs),
      ...(d.interruptibleDuringPreparation?[]:["Préparation impossible à interrompre"])
    ]}
  ];
  const reactionLines=reactions(d);
  if(reactionLines.length)sections.push({title:"Interactions",lines:reactionLines});
  return Object.freeze({
    heading:formSummary(d),
    meta:Object.freeze(meta),
    sections:Object.freeze(sections.map(s=>Object.freeze({
      title:s.title,lines:Object.freeze(s.lines.map(String))
    })))
  });
}
