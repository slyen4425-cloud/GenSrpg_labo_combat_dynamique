// Présentation seulement : les aides reflètent les champs du Human Editor,
// sans changer la définition canonique d'une stat, d'un Skill ou son export.
import {normalizeCaptureStatRegistryV1} from "../contracts/capture-stat-registry-v1.js";
import {projectCaptureStatDefinitionEffectsV1} from "../core/combat/capture-stat-effects-v1.js";

const decimal = value => new Intl.NumberFormat("fr-FR", {maximumFractionDigits: 2}).format(Number(value) || 0);
const seconds = ms => decimal((Number(ms) || 0) / 1000) + " s";
const pointsLabel = count => decimal(count) + (Number(count) === 1 ? " point" : " points");
const nameFor = raw => ({
  fire:"Feu",water:"Eau",earth:"Terre",air:"Air",electric:"Électricité",
  light:"Lumière",shadow:"Ombre",poison:"Poison",physical:"Physique",
  ice:"Glace",nature:"Nature",steel:"Acier",psy:"Psy",spirit:"Esprit"
}[raw] ?? raw ?? "sans élément");
const scopeFor = scope => ({
  self:"sur soi",target:"sur la cible",all_enemies:"sur tous les ennemis",
  all_allies:"sur tous les alliés",all_except_self:"sur les autres combattants"
}[scope] ?? "sur la cible");

export function explainCaptureStatV1({definition, points = 0}) {
  const normalized = normalizeCaptureStatRegistryV1({
    schema:"capture-stat-registry-v1",stats:[definition]
  }).stats[0];
  const effect = projectCaptureStatDefinitionEffectsV1({definition:normalized,points:Number(points) || 0});
  const parts = [];
  if (normalized.damageChannel) parts.push("+"+decimal(normalized.damagePctPerPoint)+" % dégâts "+nameFor(normalized.damageChannel)+"/point");
  if (normalized.resistanceChannel) parts.push("+"+decimal(normalized.resistancePctPerPoint)+" % résistance "+nameFor(normalized.resistanceChannel)+"/point");
  if (normalized.chargeTimeReductionPctPerPoint) parts.push("-"+decimal(normalized.chargeTimeReductionPctPerPoint)+" % de temps de charge/point");
  if (normalized.maxHpPerPoint) parts.push("+"+decimal(normalized.maxHpPerPoint)+" PV max/point");
  if (normalized.damageReductionPctPerPoint) {
    parts.push(decimal(normalized.damageReductionPctPerPoint)+" % de réduction générale des dégâts/point");
    parts.push(pointsLabel(points)+" = "+decimal(effect.damageReductionPct)+" % de réduction générale");
  }
  return normalized.label+" : "+(parts.join(" · ") || "aucun effet de combat configuré")+
    ". Coefficient personnalisable ; cette stat peut être retirée du jeu.";
}

function explainEffect(effect) {
  if (!effect || typeof effect !== "object") return "";
  const where = scopeFor(effect.targetScope);
  const amount = decimal(effect.amount ?? 0);
  switch (effect.kind) {
    case "damage": {
      const penetration = Number(effect.ignoreResistancePct ?? 0);
      const defense = Number(effect.ignoreDamageReductionPct ?? 0);
      return amount+" dégâts de base "+where+
        (effect.channel ? " ("+nameFor(effect.channel)+")" : "")+
        (penetration || defense ? " ; ignore "+decimal(penetration)+" % des résistances du canal et "+decimal(defense)+" % de la Défense générale" : "");
    }
    case "heal": return "Soigne "+amount+" PV "+where;
    case "energy_restore": return "Redonne "+amount+" énergie "+where;
    case "energy_drain": return "Retire "+amount+" énergie "+where;
    case "persistent_zone": {
      const duration=seconds(effect.durationMs);
      const tick=seconds(effect.tickIntervalMs);
      const dmg=decimal(effect.tickEffect?.amount ?? 0);
      const reinforce=effect.reactivation === "reinforce";
      return "Zone "+(effect.radius ?? "short")+" "+where+
        " : "+dmg+" dégâts de base toutes les "+tick+" pendant "+duration+
        (reinforce ? " ; chaque réactivation agrandit la zone (jusqu'à "+decimal(effect.maxActivations ?? 1)+" activations, selon le pas choisi)"
          : " ; chaque réactivation renouvelle la durée sans agrandir le rayon");
    }
    case "apply_status": {
      const status=effect.status ?? {};
      const dur=" pendant "+seconds(status.durationMs);
      if(status.kind === "heal_over_time") return "Soigne "+decimal(status.amount ?? 0)+" PV toutes les "+seconds(status.tickIntervalMs)+dur+" "+where;
      if(status.kind === "damage_over_time") return "Inflige "+decimal(status.amount ?? 0)+" dégâts de base toutes les "+seconds(status.tickIntervalMs)+dur+" "+where;
      if(status.kind === "stat_modifier") return "Modifie la stat "+(status.statId ?? "choisie")+" de "+decimal(status.deltaPoints ?? 0)+" points"+dur+" "+where;
      if(status.kind === "shield") return "Bouclier de "+decimal(status.amount ?? 0)+" points"+dur+" "+where;
      if(status.kind === "damage_reflection") return "Renvoie "+decimal(status.percent ?? 0)+" % des dégâts subis (après boucliers et réductions), sans renvoi en chaîne"+dur+" "+where;
      const kinds={stun:"Étourdit",root:"Immobilise",silence:"Empêche certaines capacités",taunt:"Provoque",immunity:"Protège"};
      return (kinds[status.kind] ?? "Applique un statut ("+(status.kind??"personnalisé")+")")+dur+" "+where;
    }
    case "scheduled_effect":
      return "Déclenche un effet différé après "+seconds(effect.trigger?.delayMs)+" "+where;
    case "cleanse": return "Retire des effets négatifs "+where;
    case "dispel": return "Retire des effets positifs "+where;
    default: return "Effet configuré : "+effect.kind+" "+where;
  }
}

export function summarizeCaptureSkillSettingsV1(input = {}) {
  const parts = [];
  parts.push((String(input.name ?? "").trim() || "Cette capacité")+
    " : disponible au niveau "+decimal(input.requiredLevel ?? 1)+
    ", coûte "+decimal(input.energyCost ?? 0)+" énergie");
  if(input.element) parts.push("Élément : "+nameFor(input.element));
  if(input.preparationMs != null) parts.push("Préparation "+seconds(input.preparationMs));
  if(input.travelMs != null && Number(input.travelMs)>0) parts.push("Trajet "+seconds(input.travelMs));
  if(input.recoveryMs != null && Number(input.recoveryMs)>0) parts.push("Récupération "+seconds(input.recoveryMs));
  if(input.cooldownMs != null) parts.push("Recharge "+seconds(input.cooldownMs));
  if(input.maxUsesPerCombat != null) parts.push(Number(input.maxUsesPerCombat)>0 ?
    decimal(input.maxUsesPerCombat)+" utilisations max par combat" : "Utilisations illimitées");
  const effects=(Array.isArray(input.effects)?input.effects:[]).map(explainEffect).filter(Boolean);
  parts.push(effects.length ? "Effets : "+effects.join(" ; ") : "Aucun effet tactique ajouté");
  return parts.join(". ")+". Les dégâts indiqués sont les valeurs de base avant résistances et Défense.";
}

function readField(root,selector,fallback="") {return root.querySelector(selector)?.value ?? fallback;}
function numberField(root,selector,fallback=0) {
  const input=root.querySelector(selector);
  return input && input.value !== "" && Number.isFinite(Number(input.value))
    ? Number(input.value) : fallback;
}
function liveSkill(root) {
  const effects=[...root.querySelectorAll("[data-skill-effect-row]")].map(row=>{
    const kind=readField(row,"[data-skill-effect-kind]","damage");
    const targetScope=readField(row,"[data-skill-effect-scope]","target");
    if(kind==="persistent_zone") return {
      kind,targetScope,radius:readField(row,"[data-skill-zone-radius]","short"),
      durationMs:numberField(row,"[data-skill-zone-duration-seconds]",0)*1000,
      tickIntervalMs:numberField(row,"[data-skill-zone-tick-seconds]",0)*1000,
      reactivation:readField(row,"[data-skill-zone-reactivation]","refresh"),
      maxActivations:numberField(row,"[data-skill-zone-max-activations]",1),
      tickEffect:{amount:numberField(row,"[data-skill-zone-tick-damage]",0)}
    };
    if(kind==="apply_status") {
      const statusKind=readField(row,"[data-skill-status-kind]","stat_modifier");
      const status={
        kind:statusKind,
        statId:readField(row,"[data-skill-status-stat-id]"),
        deltaPoints:numberField(row,"[data-skill-status-delta-points]",0),
        percent:numberField(row,"[data-skill-status-reflection-percent]",0),
        durationMs:numberField(row,"[data-skill-status-duration-seconds]",0)*1000,
        amount:numberField(row, statusKind==="heal_over_time" ? "[data-skill-status-hot-amount]" : statusKind==="shield" ? "[data-skill-status-shield-amount]" : "[data-skill-status-amount]",0),
        tickIntervalMs:numberField(row,statusKind==="heal_over_time" ? "[data-skill-status-hot-tick-seconds]" : "[data-skill-status-tick-seconds]",0)*1000
      };
      return {kind,targetScope,status};
    }
    if(kind==="scheduled_effect")return {kind,targetScope,trigger:{delayMs:numberField(row,"[data-skill-scheduled-delay-seconds]",0)*1000}};
    return {kind,targetScope,amount:numberField(row,"[data-skill-effect-amount]",0),
      channel:readField(row,"[data-skill-effect-channel]"),
      ignoreResistancePct:numberField(row,"[data-skill-effect-ignore-resistance-pct]",0),
      ignoreDamageReductionPct:numberField(row,"[data-skill-effect-ignore-damage-reduction-pct]",0)};
  });
  return {name:readField(root,"[data-skill-name]"),element:readField(root,"[data-skill-element]"),
    energyCost:numberField(root,"[data-skill-energy-cost]"),
    requiredLevel:numberField(root,"[data-skill-required-level]",1),
    preparationMs:numberField(root,"[data-skill-preparation]"),
    travelMs:numberField(root,"[data-skill-travel-time]"),
    recoveryMs:numberField(root,"[data-skill-recovery]"),
    cooldownMs:numberField(root,"[data-skill-cooldown]"),
    maxUsesPerCombat:numberField(root,"[data-skill-max-uses-per-combat]"),
    effects};
}

export function mountCaptureContextualHelpV1({root,listen,getStatRegistry}) {
  if(!root || typeof root.querySelector!=="function" || typeof listen!=="function" ||
    typeof getStatRegistry!=="function")throw new TypeError("Aide éditeur : paramètres invalides");
  function sync() {
    const skill=root.querySelector("[data-context-skill-summary]");
    if(skill)skill.textContent=summarizeCaptureSkillSettingsV1(liveSkill(root));
    const stat=root.querySelector("[data-context-stat-summary]");
    if(!stat)return;
    const registry=getStatRegistry();
    if(!registry){stat.textContent="Chargement des statistiques…";return;}
    const def=registry.stats.find(x=>x.id==="defense");
    if(!def){stat.textContent="Cette partie ne contient pas de Défense générale : le créateur l'a retirée. Les autres statistiques restent personnalisables.";return;}
    const row=[...root.querySelectorAll("[data-stat-definition]")].find(x=>x.dataset.statDefinition==="defense");
    const currentRate=Number(row?.querySelector("[data-stat-definition-damage-reduction-rate]")?.value ?? def.damageReductionPctPerPoint);
    const definition=Number.isFinite(currentRate) && currentRate>=0 ? {...def,damageReductionPctPerPoint:currentRate} : def;
    const points=numberField(root,'[data-stat-value="defense"]',0);
    stat.textContent=explainCaptureStatV1({definition,points})+
      " Les résistances aux éléments s'appliquent séparément. Le bouton « Retirer » supprime la statistique ; « Appliquer » confirme le coefficient édité.";
  }
  listen(root,"input",sync);
  listen(root,"change",sync);
  listen(root,"click",sync);
  sync();
  return {sync};
}
