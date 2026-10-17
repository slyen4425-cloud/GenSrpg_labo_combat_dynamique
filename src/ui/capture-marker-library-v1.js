import {normalizeCaptureMarkerV1, normalizeCaptureMarkerLibraryV1} from "../contracts/capture-marker-v1.js";
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
      select.dataset.markerOptional==="true"?"Même élément que la capacité":null,current);
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
function thresholdEffect(root,id){
  const kind=value(root,"marker-threshold-effect");
  const amount=Number(value(root,"marker-threshold-amount"));
  if(kind==="none")return null;
  if(kind==="stun")return {kind:"apply_status",targetScope:"target",
    status:{id:"marker-stun-"+id,kind:"stun",polarity:"detrimental",
      durationMs:Math.max(100,amount*1000),stacking:"replace"}};
  if(kind==="knockout")return {kind:"knockout",targetScope:"target"};
  if(!Number.isFinite(amount)||amount<0)throw new RangeError("Valeur de seuil invalide");
  return {kind,targetScope:"target",amount,
    ...(kind==="damage"?{channel:value(root,"marker-threshold-channel")||null}:{})};
}
function markerFromFields(root){
  const name=value(root,"marker-name").trim();
  const id=captureMarkerAuthorSlugV1(value(root,"marker-id").trim() || name);
  if (!id) throw new RangeError("Donne un nom au marqueur pour créer son identifiant.");
  const on=selected(root,"marker-threshold-enabled")?.checked===true;
  const effect=on?thresholdEffect(root,id):null;
  if(on && !effect)throw new RangeError("Choisis un effet de seuil ou désactive le seuil");
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
    ...(value(root,"marker-icon").trim()?{iconAssetId:value(root,"marker-icon").trim()}:{}),
    ...(effect?{onStackThreshold:{
      count:Number(value(root,"marker-threshold-count")),
      consume:value(root,"marker-threshold-consume"),effects:[effect]}}:{})
  });
}
function loadFields(root,marker){
  const set=(key,content)=>{
    const node=find(root,key);if(!node)return;
    const chosen=String(content??"");
    if(node.matches("select[data-marker-channel-choice]") ||
       node.matches("select[data-marker-icon]")){
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
  const toggle=selected(root,"marker-threshold-enabled");
  toggle.checked=marker.onStackThreshold!=null;
  set("marker-threshold-count",marker.onStackThreshold?.count??2);
  set("marker-threshold-consume",marker.onStackThreshold?.consume??"reset");
  const effect=marker.onStackThreshold?.effects?.[0];
  if(!effect)set("marker-threshold-effect","damage");
  else if(effect.kind==="apply_status"&&effect.status.kind==="stun"){
    set("marker-threshold-effect","stun");set("marker-threshold-amount",effect.status.durationMs/1000);
  }else{
    set("marker-threshold-effect",effect.kind);
    set("marker-threshold-amount",effect.amount??10);
    set("marker-threshold-channel",effect.channel??"");
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
  const on=selected(root,"marker-threshold-enabled")?.checked;
  const field=find(root,"marker-threshold-fields");
  if(field)field.hidden=!on;
  const damage=selected(root,"marker-threshold-channel")?.closest("label");
  if(damage)damage.hidden=value(root,"marker-threshold-effect")!=="damage";
  const amount=selected(root,"marker-threshold-amount")?.closest("label");
  if(amount)amount.hidden=value(root,"marker-threshold-effect")==="knockout";
}
function refresh(root,newMarkerId=null){
  const state=sessions.get(root);
  if(!state)return;
  const items=[...state.markers.values()].sort((a,b)=>a.name.localeCompare(b.name,"fr"));
  fill(find(root,"marker-library-select"),items,"Nouveau marqueur");
  for(const select of root.querySelectorAll("[data-skill-marker-pick]")){
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
export function mountCaptureMarkerLibraryV1({root,listen,configuredSkills,getStatRegistry=()=>null}){
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
  listen(find(root,"marker-threshold-enabled"),"change",()=>syncVisibility(root));
  listen(find(root,"marker-threshold-effect"),"change",()=>syncVisibility(root));
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
      // The compact form cannot represent complex, imported multi-effect
      // thresholds. Never silently erase advanced author configurations.
      if (existing?.onStackThreshold?.effects?.length > 1) {
        throw new RangeError("Ce marqueur possède plusieurs effets de seuil : édition rapide bloquée pour éviter toute perte. Le JSON exporté reste intact.");
      }
      const linked=propagateMarker(root,marker);
      markers.set(marker.id,marker);
      refresh(root,marker.id);
      find(root,"marker-library-select").value=marker.id;
      selected(root,"marker-id").value=marker.id;
      selected(root,"marker-id").readOnly=true;
      delete selected(root,"marker-id").dataset.manualMarkerId;
      say(root,"« "+marker.name+" » enregistré (ID : "+marker.id+"). Disponible dans les effets des capacités. "+linked+" capacité(s) synchronisée(s).","ok");
    }catch(error){say(root,error.message,"error");}
  });
  listen(find(root,"marker-export"),"click",()=>{
    try{
      const data=JSON.stringify({schema:"capture-markers-v1",markers:normalizeCaptureMarkerLibraryV1([...markers.values()])},null,2);
      const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
      const link=elem("a");link.href=url;link.download="gensrpg-marqueurs.json";link.click();URL.revokeObjectURL(url);
      say(root,"Bibliothèque exportée avec "+markers.size+" marqueur(s).","ok");
    }catch(error){say(root,error.message,"error");}
  });
  listen(find(root,"marker-import"),"change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      if(parsed.schema!=="capture-markers-v1")throw new RangeError("Format de bibliothèque non reconnu");
      const imported=normalizeCaptureMarkerLibraryV1(parsed.markers);
      // Transactional import: do not silently overwrite existing author data.
      for(const marker of imported){
        const old=markers.get(marker.id);
        if(old && JSON.stringify(old)!==JSON.stringify(marker)){
          throw new RangeError("Conflit : « "+marker.id+" » existe déjà avec d'autres réglages");
        }
      }
      for(const marker of imported)markers.set(marker.id,marker);
      refresh(root);
      say(root,imported.length+" marqueur(s) importé(s) sans écraser les existants.","ok");
    }catch(error){say(root,error.message,"error");}
    finally{e.target.value="";}
  });
  indexSkills();refresh(root);captureMarkerRefreshReferenceChoicesV1(root);syncVisibility(root);
  return Object.freeze({
    indexSkills,
    dispose(){sessions.delete(root);}
  });
}
