import {normalizeCaptureMarkerV1, normalizeCaptureMarkerLibraryV1} from "../contracts/capture-marker-v1.js";
import {captureMarkerExportSnapshotV1} from "./capture-marker-export-v1.js";
import {normalizeCaptureSkillEditorDraftV1} from "../contracts/capture-skill-editor-draft-v1.js";
import {captureMarkerChannelChoicesV1, captureMarkerIconChoicesV1} from "./capture-marker-reference-choices-v1.js";

const sessions = new WeakMap();
const find=(root,key)=>root.querySelector("[data-"+key+"]");
const value=(root,key)=>find(root,key)?.value ?? "";
const selected=(root,key)=>find(root,key);
const say=(root,message,tone="info")=>{
  const node=find(root,"marker-library-state");
  if(node){node.textContent=message;node.dataset.tone=tone;}
};
const elem=(tag,text="")=>{const node=document.createElement(tag);node.textContent=text;return node;};

export function captureMarkerChannelOptionsV1(root,selectedId=""){
  const nativeSelect=root.querySelector("[data-skill-element]");
  const nativeElements=[...(nativeSelect?.options??[])].filter(o=>o.value).map(o=>({id:o.value,label:o.textContent}));
  const statRegistry=sessions.get(root)?.getStatRegistry?.()??null;
  return captureMarkerChannelChoicesV1({nativeElements,statRegistry,selectedId});
}

// Reference-only dropdowns: retain an imported ID as a visible choice if the
// current author registry has not loaded it. Never silently erase author data.
function selectChoices(select,options,emptyLabel=null,chosen=select.value){
  if(!select)return;
  select.textContent="";
  if(emptyLabel!==null){const opt=elem("option",emptyLabel);opt.value="";select.append(opt);}
  for(const entry of options){const option=elem("option",entry.label);option.value=entry.id;select.append(option);}
  select.value=chosen??"";
}
export function captureMarkerRefreshReferenceChoicesV1(root){
  for(const select of root.querySelectorAll("[data-marker-channel-choice]")){
    const current=select.value;
    selectChoices(select,captureMarkerChannelOptionsV1(root,current),
      select.dataset.markerOptional==="true"?(select.dataset.markerOptionalLabel || "Même élément que la capacité"):null,current);
  }
  for(const select of root.querySelectorAll("[data-marker-stat-choice]")){
    const current=select.value;
    selectChoices(select,captureMarkerStatOptionsV1(root,current),"Choisir une caractéristique",current);
  }
  for(const select of root.querySelectorAll("[data-marker-result-tag-choice]")){
    const current=select.value;
    selectChoices(select,captureMarkerStatusTagOptionsV1(root,current),"Tous les statuts",current);
  }
  const iconSelect=find(root,"marker-icon");
  if(iconSelect){
    const current=iconSelect.value;
    const source=root.querySelector("[data-creature-reaction-icon]");
    const options=[...(source?.options??[])].filter(o=>o.value).map(o=>({id:o.value,label:o.textContent}));
    selectChoices(iconSelect,captureMarkerIconChoicesV1({catalogOptions:options,selectedId:current}),
      "Aucune icône personnalisée",current);
  }
}

// Author convenience only: the stored/portable marker ID remains the strict
// immutable CaptureMarkerV1 slug, never a display name or runtime fallback.
export function captureMarkerAuthorSlugV1(value) {
  return String(value ?? "").normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"").slice(0,64).replace(/-+$/g,"");
}
function fill(select,items,placeholder){
  if(!select)return;
  const current=select.value;
  select.textContent="";
  const empty=elem("option",placeholder);empty.value="";select.append(empty);
  for(const entry of items){const opt=elem("option",entry.name+" · "+entry.id);opt.value=entry.id;select.append(opt);}
  if(items.some(entry=>entry.id===current))select.value=current;
}
// The library authors existing native StatusEffectV1 kinds, never a second buff engine.
const ADVANCED_MARKER_STATUS_KINDS_V1 = Object.freeze({
  slow_movement: ["approach_time_modifier", 1],
  boost_movement: ["approach_time_modifier", -1],
  slow_cooldown: ["skill_cooldown_rate_modifier", -1],
  boost_cooldown: ["skill_cooldown_rate_modifier", 1],
  slow_energy: ["energy_regen_modifier", -1],
  boost_energy: ["energy_regen_modifier", 1],
  reduce_damage: ["outgoing_damage_modifier", -1],
  boost_damage: ["outgoing_damage_modifier", 1],
  reduce_stat: ["stat_modifier", -1],
  increase_stat: ["stat_modifier", 1],
  stun: ["stun", 0],
  silence: ["silence", 0],
  immobilize: ["immobilize", 0]
});

export function captureMarkerAdvancedThresholdEffectV1({
  id, kind, amount = 0, durationSeconds = 5, statId = "",
  statMode = "points", maxStacks = 1, repeat = false,
  index = 0, targetScope = "target", channel = "",
  original = null
}) {
  if (kind === "none") return null;
  if (kind === "preserve") {
    if (!original || typeof original !== "object") throw new RangeError("Effet importé original introuvable");
    return original;
  }
  if (!["target", "self"].includes(targetScope)) throw new RangeError("Cible de marqueur invalide");
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) throw new RangeError("Valeur de marqueur invalide");
  if (kind === "knockout") return {kind:"knockout",targetScope};
  if (["damage", "heal", "energy_restore", "energy_drain"].includes(kind)) {
    return {kind,targetScope,amount:n,
      ...(kind === "damage" ? {channel:channel || null} : {})};
  }
  const spec = ADVANCED_MARKER_STATUS_KINDS_V1[kind];
  if (!spec) throw new RangeError("Effet de seuil inconnu : " + kind);
  const duration = Number(durationSeconds) * 1000;
  if (!(duration > 0) || !Number.isFinite(duration)) throw new RangeError("Durée de malus/buff invalide");
  const [statusKind, sign] = spec;
  // Historical simple 'stun' used the value field as seconds; keep exports stable.
  const timedMs = kind === "stun" ? Math.max(100, n * 1000) : Math.round(duration);
  const status = {
    id: kind === "stun" && index === 0 ? "marker-stun-" + id : "marker-effect-" + id + "-" + index,
    kind: statusKind,
    polarity: kind.startsWith("boost_") || kind === "increase_stat" ? "beneficial" : "detrimental",
    durationMs: timedMs,
    stacking: repeat ? "stack" : kind === "stun" ? "replace" : "refresh",
    ...(repeat ? {maxStacks:Number(maxStacks)} : {})
  };
  if (statusKind === "stat_modifier") {
    if (!statId) throw new RangeError("Choisis la caractéristique depuis le registre");
    if (!["points", "percent"].includes(statMode)) throw new RangeError("Mode de caractéristique inconnu");
    status.statId = statId;
    status.modifierMode = statMode;
    if (statMode === "points") status.deltaPoints = sign * n;
    else status.percent = sign * n;
  } else if (sign !== 0) {
    status.modifierPct = sign * n;
  }
  return {kind:"apply_status",targetScope,status};
}

export function captureMarkerStatOptionsV1(root,selectedId="") {
  const registry=sessions.get(root)?.getStatRegistry?.();
  const entries=(registry?.stats??[]).map(stat=>({id:stat.id,label:stat.label}));
  if (selectedId && !entries.some(stat=>stat.id===selectedId))
    entries.push({id:selectedId,label:selectedId+" (référence importée conservée)"});
  return entries;
}

function markerThresholdFieldsForEffectV1(effect) {
  if (!effect) return {kind:"damage",amount:10,durationSeconds:5,statId:"",statMode:"points",targetScope:"target",channel:""};
  if (effect.kind !== "apply_status") return {
    kind:["damage","heal","energy_restore","energy_drain","knockout"].includes(effect.kind) ? effect.kind : "preserve",
    amount:effect.amount??10,durationSeconds:5,statId:"",statMode:"points",
    targetScope:effect.targetScope??"target",channel:effect.channel??"",original:effect
  };
  const st=effect.status??{},pct=Number(st.modifierPct??0);
  const byKind={
    approach_time_modifier: pct < 0 ? "boost_movement":"slow_movement",
    skill_cooldown_rate_modifier: pct < 0 ? "slow_cooldown":"boost_cooldown",
    energy_regen_modifier: pct < 0 ? "slow_energy":"boost_energy",
    outgoing_damage_modifier: pct < 0 ? "reduce_damage":"boost_damage",
    stat_modifier:(Number(st[st.modifierMode==="percent"?"percent":"deltaPoints"])||0) < 0 ? "reduce_stat":"increase_stat",
    stun:"stun", silence:"silence", immobilize:"immobilize"
  };
  const kind=byKind[st.kind]??"preserve";
  const sourceStat=Number(st[st.modifierMode==="percent"?"percent":"deltaPoints"]??0);
  return {
    kind,
    amount:st.kind==="stat_modifier"?Math.abs(sourceStat)
      :st.kind==="stun"?Number(st.durationMs??2000)/1000:Math.abs(pct),
    durationSeconds:Number(st.durationMs??5000)/1000,
    statId:st.statId??"",statMode:st.modifierMode??"points",
    targetScope:effect.targetScope??"target",channel:"",original:effect
  };
}

function thresholdEffect(root,id){
  const pick=find(root,"marker-threshold-effect");
  const repeat=selected(root,"marker-threshold-repeat")?.checked===true;
  return captureMarkerAdvancedThresholdEffectV1({
    id,kind:pick.value,amount:value(root,"marker-threshold-amount"),
    durationSeconds:value(root,"marker-threshold-status-duration"),
    statId:value(root,"marker-threshold-stat"),
    statMode:value(root,"marker-threshold-stat-mode"),
    maxStacks:Number(value(root,"marker-max")),repeat,index:0,
    targetScope:"target",channel:value(root,"marker-threshold-channel"),
    original:pick.dataset.markerOriginal?JSON.parse(pick.dataset.markerOriginal):null
  });
}

function markerIndividualEffectV1(root,id) {
  const pick=find(root,"marker-charge-effect");
  return captureMarkerAdvancedThresholdEffectV1({
    id:"charge-"+id,index:0,kind:pick.value,
    amount:value(root,"marker-charge-amount"),
    durationSeconds:value(root,"marker-charge-status-duration"),
    statId:value(root,"marker-charge-stat"),
    statMode:value(root,"marker-charge-stat-mode"),
    maxStacks:Number(value(root,"marker-max")),repeat:true,
    targetScope:"target",channel:value(root,"marker-charge-channel"),
    original:pick.dataset.markerOriginal?JSON.parse(pick.dataset.markerOriginal):null
  });
}

function appendMarkerThresholdExtraV1(root,existing=null,mode="threshold") {
  const host=find(root,mode==="charge"?"marker-charge-extra-host":"marker-threshold-extra-host");
  if (!host) return null;
  const row=elem("div");row.dataset[mode==="charge"?"markerChargeExtra":"markerThresholdExtra"]="true";
  row.className="skill-status-config__grid";
  const details=markerThresholdFieldsForEffectV1(existing);
  row.dataset.markerOriginal=existing?JSON.stringify(existing):"";
  const labeled=(title,node)=>{const label=elem("label",title);label.append(node);return label;};
  const makeNumber=(key,title,n,minimum=null)=>{
    const input=elem("input");input.type="number";input.step="any";
    if(minimum!==null)input.min=String(minimum);
    input.value=String(n);input.dataset[key]="true";
    row.append(labeled(title,input));return input;
  };
  const makeSelect=(key,title,options,chosen)=>{
    const pick=elem("select");pick.dataset[key]="true";
    for(const [id,label] of options){const option=elem("option",label);option.value=id;pick.append(option);}
    pick.value=chosen;row.append(labeled(title,pick));return pick;
  };
  const template=find(root,mode==="charge"?"marker-charge-effect":"marker-threshold-effect");
  const options=[...template.options].map(o=>[o.value,o.textContent]);
  const kind=makeSelect("markerExtraKind","Type d'effet",options,details.kind);
  makeSelect("markerExtraTarget","Sur",[["target","Porteur des charges"],["self","Lanceur"]],details.targetScope);
  makeNumber("markerExtraAmount","Valeur (points ou %)",details.amount,0);
  makeNumber("markerExtraDuration","Durée du statut (secondes)",details.durationSeconds,0.1);
  makeSelect("markerExtraStatMode","Variation de stat",[["points","Points"],["percent","% de la base"]],details.statMode);
  const statOptions=captureMarkerStatOptionsV1(root,details.statId).map(x=>[x.id,x.label]);
  makeSelect("markerExtraStat","Statistique",[["","Choisir une stat"],...statOptions],details.statId);
  const channel=makeSelect("markerExtraChannel","Élément des dégâts",[
    ["","Canal par défaut du moteur"],
    ...captureMarkerChannelOptionsV1(root,details.channel).map(x=>[x.id,x.label])
  ],details.channel);
  channel.dataset.markerChannelChoice="true";
  channel.dataset.markerOptional="true";
  channel.dataset.markerOptionalLabel="Canal par défaut du moteur";
  const remove=elem("button","Supprimer cet effet");
  remove.type="button";remove.className="small-action";
  remove.addEventListener("click",()=>row.remove());
  row.append(remove);
  const toggle=()=>{
    const current=kind.value;
    row.querySelector("[data-marker-extra-stat]").closest("label").hidden=!["reduce_stat","increase_stat"].includes(current);
    row.querySelector("[data-marker-extra-stat-mode]").closest("label").hidden=!["reduce_stat","increase_stat"].includes(current);
    channel.closest("label").hidden=current!=="damage";
    row.querySelector("[data-marker-extra-duration]").closest("label").hidden=!Object.hasOwn(ADVANCED_MARKER_STATUS_KINDS_V1,current)||current==="stun";
    row.querySelector("[data-marker-extra-amount]").closest("label").hidden=["knockout","silence","immobilize","preserve","none"].includes(current);
  };
  kind.addEventListener("change",toggle);toggle();
  host.append(row);return row;
}

function thresholdExtraEffectV1(root,row,id,index,perCharge=false) {
  const get=key=>row.querySelector("[data-"+key+"]")?.value??"";
  return captureMarkerAdvancedThresholdEffectV1({
    id,index,kind:get("marker-extra-kind"),amount:get("marker-extra-amount"),
    durationSeconds:get("marker-extra-duration"),
    statId:get("marker-extra-stat"),statMode:get("marker-extra-stat-mode"),
    targetScope:get("marker-extra-target"),channel:get("marker-extra-channel"),
    repeat:perCharge||selected(root,"marker-threshold-repeat")?.checked===true,
    maxStacks:Number(value(root,"marker-max")),
    original:row.dataset.markerOriginal?JSON.parse(row.dataset.markerOriginal):null
  });
}

function markerFromFields(root){
  const name=value(root,"marker-name").trim();
  const id=captureMarkerAuthorSlugV1(value(root,"marker-id").trim() || name);
  if (!id) throw new RangeError("Donne un nom au marqueur pour créer son identifiant.");
  const on=selected(root,"marker-threshold-enabled")?.checked===true;
  const repeat=selected(root,"marker-threshold-repeat")?.checked===true;
  const consume=value(root,"marker-threshold-consume");
  if(on && repeat && consume!=="keep") throw new RangeError("Pour répéter à chaque charge, conserve les charges après le seuil.");
  const effects=on?[
    thresholdEffect(root,id),
    ...[...(find(root,"marker-threshold-extra-host")?.querySelectorAll("[data-marker-threshold-extra]")??[])]
      .map((row,index)=>thresholdExtraEffectV1(root,row,id,index+1))
  ].filter(Boolean):[];
  if(on && !effects.length)throw new RangeError("Choisis au moins un effet de seuil");
  if(effects.length>12)throw new RangeError("12 effets maximum par seuil (contrat existant)");
  const chargeOn=selected(root,"marker-charge-enabled")?.checked===true;
  const chargeEffects=chargeOn?[
    markerIndividualEffectV1(root,id),
    ...[...(find(root,"marker-charge-extra-host")?.querySelectorAll("[data-marker-charge-extra]")??[])]
      .map((row,index)=>thresholdExtraEffectV1(root,row,"charge-"+id,index+1,true))
  ].filter(Boolean):[];
  if(chargeOn&&!chargeEffects.length)throw new RangeError("Choisis au moins un effet individuel");
  if(chargeEffects.length>12)throw new RangeError("12 effets maximum par charge");
  const periodicOn=selected(root,"marker-periodic-enabled")?.checked===true;
  const periodic=periodicOn ? {
    kind:value(root,"marker-periodic-kind"),
    amount:Number(value(root,"marker-periodic-amount")),
    intervalMs:Math.round(Number(value(root,"marker-periodic-seconds"))*1000),
    ...(value(root,"marker-periodic-kind")==="damage" ? {
      damageMode:value(root,"marker-periodic-mode"),
      channel:value(root,"marker-periodic-channel").trim()||"physical"
    } : {})
  } : null;
  const permanent=selected(root,"marker-permanent")?.checked===true;
  return normalizeCaptureMarkerV1({
    id,name:value(root,"marker-name"),polarity:value(root,"marker-polarity"),
    ...(permanent ? {permanent:true}
      : {durationMs:Math.round(Number(value(root,"marker-duration"))*1000)}),
    maxStacks:Number(value(root,"marker-max")),
    ...(periodic == null ? {} : {periodic}),
    ...(chargeEffects.length?{onStackAdded:{effects:chargeEffects}}:{}),
    ...(value(root,"marker-icon").trim()?{iconAssetId:value(root,"marker-icon").trim()}:{}),
    ...(effects.length?{onStackThreshold:{
      count:Number(value(root,"marker-threshold-count")),
      consume,
      ...(repeat?{repeat:"each_addition"}:{}),
      effects}}:{})
  });
}
function loadFields(root,marker){
  const set=(key,content)=>{
    const node=find(root,key);if(!node)return;
    const chosen=String(content??"");
    if(node.matches("select[data-marker-channel-choice]") ||
       node.matches("select[data-marker-icon]") ||
       node.matches("select[data-marker-stat-choice]")){
      if(chosen && ![...node.options].some(o=>o.value===chosen)){
        const fallback=elem("option",chosen+" (référence importée conservée)");
        fallback.value=chosen;node.append(fallback);
      }
    }
    node.value=chosen;
  };
  set("marker-id",marker.id);set("marker-name",marker.name);
  set("marker-polarity",marker.polarity);
  selected(root,"marker-permanent").checked=marker.permanent===true;
  set("marker-duration",(marker.durationMs??10000)/1000);
  set("marker-max",marker.maxStacks);set("marker-icon",marker.iconAssetId??"");
  selected(root,"marker-periodic-enabled").checked=marker.periodic!=null;
  set("marker-periodic-kind",marker.periodic?.kind??"damage");
  set("marker-periodic-amount",marker.periodic?.amount??5);
  set("marker-periodic-seconds",(marker.periodic?.intervalMs??5000)/1000);
  set("marker-periodic-mode",marker.periodic?.damageMode??"fixed");
  set("marker-periodic-channel",marker.periodic?.channel??"physical");
  const chargeEffects=marker.onStackAdded?.effects??[];
  selected(root,"marker-charge-enabled").checked=chargeEffects.length>0;
  const firstCharge=markerThresholdFieldsForEffectV1(chargeEffects[0]);
  const chargePick=find(root,"marker-charge-effect");
  chargePick.dataset.markerOriginal=chargeEffects[0]?JSON.stringify(chargeEffects[0]):"";
  set("marker-charge-effect",firstCharge.kind);
  set("marker-charge-amount",firstCharge.amount);
  set("marker-charge-channel",firstCharge.channel);
  set("marker-charge-status-duration",firstCharge.durationSeconds);
  set("marker-charge-stat",firstCharge.statId);
  set("marker-charge-stat-mode",firstCharge.statMode);
  const chargeHost=find(root,"marker-charge-extra-host");
  if(chargeHost){
    chargeHost.replaceChildren();
    for(const effect of chargeEffects.slice(1))appendMarkerThresholdExtraV1(root,effect,"charge");
  }
  const toggle=selected(root,"marker-threshold-enabled");
  toggle.checked=marker.onStackThreshold!=null;
  set("marker-threshold-count",marker.onStackThreshold?.count??2);
  set("marker-threshold-consume",marker.onStackThreshold?.consume??"reset");
  const effects=marker.onStackThreshold?.effects??[];
  const first=markerThresholdFieldsForEffectV1(effects[0]);
  const choose=find(root,"marker-threshold-effect");
  choose.dataset.markerOriginal=effects[0]?JSON.stringify(effects[0]):"";
  set("marker-threshold-effect",first.kind);
  set("marker-threshold-amount",first.amount);
  set("marker-threshold-channel",first.channel);
  set("marker-threshold-status-duration",first.durationSeconds);
  set("marker-threshold-stat",first.statId);
  set("marker-threshold-stat-mode",first.statMode);
  selected(root,"marker-threshold-repeat").checked=
    marker.onStackThreshold?.repeat==="each_addition";
  const extraHost=find(root,"marker-threshold-extra-host");
  if(extraHost){
    extraHost.replaceChildren();
    for(const effect of effects.slice(1)) appendMarkerThresholdExtraV1(root,effect);
  }
  captureMarkerRefreshReferenceChoicesV1(root);
  syncVisibility(root);
}
function syncVisibility(root){
  const permanent=selected(root,"marker-permanent")?.checked===true;
  const duration=selected(root,"marker-duration");
  if(duration)duration.disabled=permanent;
  const periodic=selected(root,"marker-periodic-enabled")?.checked===true;
  const periodicFields=find(root,"marker-periodic-fields");
  if(periodicFields)periodicFields.hidden=!periodic;
  const showDamage=value(root,"marker-periodic-kind")==="damage";
  const mode=selected(root,"marker-periodic-damage-setting");
  const channel=selected(root,"marker-periodic-channel-setting");
  if(mode)mode.hidden=!showDamage;
  if(channel)channel.hidden=!showDamage||value(root,"marker-periodic-mode")!=="combat";
  const chargeOn=selected(root,"marker-charge-enabled")?.checked===true;
  const chargeBox=find(root,"marker-charge-fields");
  if(chargeBox)chargeBox.hidden=!chargeOn;
  const chargeKind=value(root,"marker-charge-effect");
  const chargeChannel=selected(root,"marker-charge-channel-setting");
  if(chargeChannel)chargeChannel.hidden=chargeKind!=="damage";
  const chargeAmount=selected(root,"marker-charge-amount")?.closest("label");
  if(chargeAmount)chargeAmount.hidden=["knockout","silence","immobilize","preserve","none"].includes(chargeKind);
  const chargeStat=["reduce_stat","increase_stat"].includes(chargeKind);
  const chargeStatField=selected(root,"marker-charge-stat-setting");
  const chargeStatMode=selected(root,"marker-charge-stat-mode-setting");
  if(chargeStatField)chargeStatField.hidden=!chargeStat;
  if(chargeStatMode)chargeStatMode.hidden=!chargeStat;
  const chargeDuration=selected(root,"marker-charge-duration-setting");
  if(chargeDuration)chargeDuration.hidden=!Object.hasOwn(ADVANCED_MARKER_STATUS_KINDS_V1,chargeKind)||chargeKind==="stun";
  const on=selected(root,"marker-threshold-enabled")?.checked;
  const field=find(root,"marker-threshold-fields");
  if(field)field.hidden=!on;
  const kind=value(root,"marker-threshold-effect");
  const damage=selected(root,"marker-threshold-channel")?.closest("label");
  if(damage)damage.hidden=kind!=="damage";
  const amount=selected(root,"marker-threshold-amount")?.closest("label");
  if(amount)amount.hidden=["knockout","silence","immobilize","preserve","none"].includes(kind);
  const stat=selected(root,"marker-threshold-stat-setting");
  const statMode=selected(root,"marker-threshold-stat-mode-setting");
  const usesStat=["reduce_stat","increase_stat"].includes(kind);
  if(stat)stat.hidden=!usesStat;
  if(statMode)statMode.hidden=!usesStat;
  const statusDuration=selected(root,"marker-threshold-status-duration-setting");
  if(statusDuration)statusDuration.hidden=!Object.hasOwn(ADVANCED_MARKER_STATUS_KINDS_V1,kind)||kind==="stun";
  const repeat=selected(root,"marker-threshold-repeat");
  if(repeat && repeat.checked && value(root,"marker-threshold-consume")!=="keep"){
    repeat.checked=false;
  }
}
function refresh(root,newMarkerId=null){
  const state=sessions.get(root);
  if(!state)return;
  const items=[...state.markers.values()].sort((a,b)=>a.name.localeCompare(b.name,"fr"));
  fill(find(root,"marker-library-select"),items,"Nouveau marqueur");
  for(const select of root.querySelectorAll("[data-skill-marker-pick], [data-skill-zone-marker-pick]")){
    const before=select.value;
    fill(select,items,"Choisir un marqueur");
    // Only fill an empty author selector after the first successful save.
    // Never change an existing choice belonging to another skill.
    if(newMarkerId && !before)select.value=newMarkerId;
  }
  for(const select of root.querySelectorAll("[data-skill-marker-cost-id]")){
    const before=select.value;
    fill(select,items,"Choisir un marqueur");
    if(newMarkerId && !before)select.value=newMarkerId;
    // Do not silently erase an imported skill's cost if its marker library is missing.
    if(before && !items.some(marker=>marker.id===before)){
      const missing=elem("option","Marqueur manquant : "+before);
      missing.value=before;select.append(missing);select.value=before;
    }
  }
  for(const select of root.querySelectorAll("[data-skill-consume-marker-pick]")){
    const current=select.value;
    select.textContent="";
    const all=elem("option","Tous les types de marqueurs");all.value="*";select.append(all);
    for(const marker of items){const option=elem("option",marker.name);option.value=marker.id;select.append(option);}
    select.value=current&&[...select.options].some(o=>o.value===current)?current:"*";
  }
  captureMarkerRefreshReferenceChoicesV1(root);
}
export function captureMarkerOptionsV1(root){return [...(sessions.get(root)?.markers.values()??[])];}
export function captureMarkerStatusTemplatesV1(root){
  const configuredSkills=sessions.get(root)?.configuredSkills;
  const choices=new Map();
  if(!configuredSkills)return [];
  for(const skill of configuredSkills.values()){
    const effects=skill?.definition?.effects??[];
    for(const effect of effects){
      const status=effect.kind==="apply_status" ? effect.status
        : effect.kind==="persistent_zone" && effect.tickEffect?.kind==="apply_status"
          ? effect.tickEffect.status : null;
      if(!status)continue;
      const id=JSON.stringify(status);
      if(choices.has(id))continue;
      choices.set(id,{status,label:(skill.definition?.name??skill.id)+" · "+status.id+" ("+status.kind+")"});
    }
  }
  return [...choices.values()].sort((a,b)=>a.label.localeCompare(b.label,"fr"));
}
export function captureMarkerStatusTagOptionsV1(root,selectedTag=""){
  const choices=new Map();
  const add=(tag,label)=>{
    if(typeof tag==="string" && tag.trim() && !choices.has(tag.trim()))
      choices.set(tag.trim(),{id:tag.trim(),label:label || tag.trim()});
  };
  for(const entry of captureMarkerStatusTemplatesV1(root)){
    for(const tag of entry.status.tags??[])add(tag,tag);
  }
  for(const marker of captureMarkerOptionsV1(root)){
    add("marker:"+marker.id,"Marqueur : "+marker.name);
  }
  if(captureMarkerOptionsV1(root).length) add("gensrpg:marker:v1","Tous les marqueurs");
  if(selectedTag) add(selectedTag,selectedTag+" (référence importée conservée)");
  return [...choices.values()].sort((a,b)=>a.label.localeCompare(b.label,"fr"));
}
export function captureMarkerDefinitionV1(root,id){
  const definition=sessions.get(root)?.markers.get(id);
  if(!definition)throw new RangeError("Marqueur introuvable : "+id);
  return definition;
}
export function captureMarkerRegisterFromSkillV1(root,definition){
  const session=sessions.get(root);if(!session)return;
  const marker=normalizeCaptureMarkerV1(definition);
  const existing=session.markers.get(marker.id);
  if(existing && JSON.stringify(existing)!==JSON.stringify(marker)){
    say(root,"Conflit de définition du marqueur « "+marker.id+" » : corrige les capacités avant le test.","error");
    return;
  }
  if(!existing){session.markers.set(marker.id,marker);refresh(root);}
}
// Load authored presets into the unique library Map; reject divergent skill-owned markers.
export function captureMarkerSeedLibraryV1(markers,incoming){
  const normalized=normalizeCaptureMarkerLibraryV1(incoming);
  for(const marker of normalized){
    const old=markers.get(marker.id);
    if(old && JSON.stringify(normalizeCaptureMarkerV1(old))!==JSON.stringify(marker))
      throw new RangeError("Conflit de définition du marqueur « "+marker.id+" » avec une capacité.");
  }
  let added=0;
  for(const marker of normalized)if(!markers.has(marker.id)){
    markers.set(marker.id,marker);added++;
  }
  return added;
}
function markerPeriodicSaveSummaryV1(marker){
  const periodic=marker.periodic;
  if(!periodic)return "Aucun effet périodique.";
  const seconds=(Math.round(periodic.intervalMs/100)/10).toLocaleString("fr-FR");
  return periodic.amount+" "+(periodic.kind==="damage"?"dégâts":"PV soignés")+
    " par charge toutes les "+seconds+" s"+
    (periodic.damageMode==="combat"?" (avant défenses)":"")+".";
}
function propagateMarker(root,definition){
  const state=sessions.get(root);
  // Explicit save updates every *configured* skill referencing this shared ID.
  // Normalize drafts through their existing authoritative contract.
  const updates=[];
  for(const [id,draft] of state.configuredSkills){
    if(!draft?.definition?.effects?.some(x=>x.kind==="apply_marker"&&x.marker.id===definition.id))continue;
    const effects=draft.definition.effects.map(effect=>
      effect.kind==="apply_marker"&&effect.marker.id===definition.id
        ? {...effect,marker:definition}:effect);
    updates.push([id,normalizeCaptureSkillEditorDraftV1({
      ...draft,definition:{...draft.definition,effects}
    })]);
  }
  for(const [id,draft] of updates)state.configuredSkills.set(id,draft);
  return updates.length;
}
export function mountCaptureMarkerLibraryV1({root,listen,configuredSkills,getStatRegistry=()=>null,getCurrentSkillDraft=()=>null}){
  const markers=new Map();
  const controller={markers,configuredSkills,getStatRegistry};
  sessions.set(root,controller);
  function indexSkills(){
    for(const draft of configuredSkills.values()){
      for(const effect of draft?.definition?.effects??[]){
        if(effect.kind==="apply_marker")captureMarkerRegisterFromSkillV1(root,effect.marker);
      }
    }
  }
  listen(find(root,"marker-library-select"),"change",()=>{
    const marker=markers.get(value(root,"marker-library-select"));
    if(marker){
      loadFields(root,marker);
      selected(root,"marker-id").readOnly=true;
    }
  });
  listen(find(root,"marker-name"),"input",()=>{
    const id=selected(root,"marker-id");
    if(value(root,"marker-library-select")==="" && !id.dataset.manualMarkerId) {
      id.value=captureMarkerAuthorSlugV1(value(root,"marker-name"));
    }
  });
  for(const key of ["marker-permanent","marker-periodic-enabled","marker-periodic-kind","marker-periodic-mode"]) {
    listen(find(root,key),"change",()=>syncVisibility(root));
  }
  listen(find(root,"marker-charge-enabled"),"change",()=>syncVisibility(root));
  listen(find(root,"marker-charge-effect"),"change",()=>syncVisibility(root));
  listen(find(root,"marker-charge-add-effect"),"click",()=>{
    const count=find(root,"marker-charge-extra-host")?.querySelectorAll("[data-marker-charge-extra]").length??0;
    if(count>=11){say(root,"Maximum 12 effets par charge.","warning");return;}
    appendMarkerThresholdExtraV1(root,null,"charge");
    captureMarkerRefreshReferenceChoicesV1(root);
  });
  listen(find(root,"marker-threshold-enabled"),"change",()=>syncVisibility(root));
  listen(find(root,"marker-threshold-effect"),"change",()=>syncVisibility(root));
  listen(find(root,"marker-threshold-consume"),"change",()=>syncVisibility(root));
  listen(find(root,"marker-threshold-repeat"),"change",()=>{
    if(selected(root,"marker-threshold-repeat").checked){
      find(root,"marker-threshold-consume").value="keep";
    }
    syncVisibility(root);
  });
  listen(find(root,"marker-threshold-add-effect"),"click",()=>{
    const count=find(root,"marker-threshold-extra-host")?.querySelectorAll("[data-marker-threshold-extra]").length??0;
    if(count>=11){say(root,"Maximum 12 effets au même seuil.","warning");return;}
    appendMarkerThresholdExtraV1(root);
    captureMarkerRefreshReferenceChoicesV1(root);
  });
  listen(find(root,"marker-new"),"click",()=>{
    const sel=selected(root,"marker-library-select");sel.value="";
    loadFields(root,{id:"",name:"",maxStacks:10,polarity:"neutral",durationMs:10000});
    const input=selected(root,"marker-id");
    input.readOnly=true;
    delete input.dataset.manualMarkerId;
    selected(root,"marker-name").focus();
    say(root,"Nouveau marqueur : saisis simplement un nom. L'identifiant sera créé automatiquement.","info");
  });
  listen(find(root,"marker-save"),"click",()=>{
    try{
      const marker=markerFromFields(root);
      const existing=markers.get(marker.id);
      const chosen=value(root,"marker-library-select");
      if(existing && chosen!==marker.id){
        throw new RangeError("Ce nom correspond au marqueur déjà enregistré « "+existing.name+" ». Sélectionne-le dans la liste pour le modifier, ou choisis un autre nom.");
      }
      const linked=propagateMarker(root,marker);
      markers.set(marker.id,marker);
      refresh(root,marker.id);
      find(root,"marker-library-select").value=marker.id;
      selected(root,"marker-id").value=marker.id;
      selected(root,"marker-id").readOnly=true;
      delete selected(root,"marker-id").dataset.manualMarkerId;
      say(root,"« "+marker.name+" » enregistré (ID : "+marker.id+"). "+markerPeriodicSaveSummaryV1(marker)+" Disponible dans les effets des capacités. "+linked+" capacité(s) synchronisée(s).","ok");
    }catch(error){say(root,error.message,"error");}
  });
  listen(find(root,"marker-export"),"click",()=>{
    try{
      const entries=captureMarkerExportSnapshotV1({
        markers,configuredSkills,currentDraft:getCurrentSkillDraft()
      });
      if(entries.length===0){
        say(root,"Aucun marqueur à exporter. Enregistre un marqueur ou configure une capacité qui en pose un. Aucun fichier vide n'a été créé.","warning");
        return;
      }
      const data=JSON.stringify({schema:"capture-markers-v1",markers:entries},null,2);
      const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
      const link=elem("a");link.href=url;link.download="gensrpg-marqueurs.json";link.click();URL.revokeObjectURL(url);
      say(root,"Bibliothèque exportée avec "+entries.length+" marqueur(s), y compris ceux des capacités configurées ou en cours d'édition.","ok");
    }catch(error){say(root,error.message,"error");}
  });
  listen(find(root,"marker-import"),"change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      if(parsed.schema!=="capture-markers-v1")throw new RangeError("Format de bibliothèque non reconnu");
      const imported=normalizeCaptureMarkerLibraryV1(parsed.markers);
      captureMarkerSeedLibraryV1(markers,imported);
      refresh(root);
      say(root,imported.length+" marqueur(s) importé(s) sans écraser les existants.","ok");
    }catch(error){say(root,error.message,"error");}
    finally{e.target.value="";}
  });
  indexSkills();refresh(root);captureMarkerRefreshReferenceChoicesV1(root);syncVisibility(root);
  return Object.freeze({
    indexSkills,
    seedMarkers(incoming){
      const added=captureMarkerSeedLibraryV1(markers,incoming);
      refresh(root);
      return added;
    },
    dispose(){sessions.delete(root);}
  });
}
