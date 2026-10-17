import {normalizeCaptureMarkerV1, normalizeCaptureMarkerLibraryV1} from "../contracts/capture-marker-v1.js";
import {normalizeCaptureSkillEditorDraftV1} from "../contracts/capture-skill-editor-draft-v1.js";

const sessions = new WeakMap();
const find=(root,key)=>root.querySelector("[data-"+key+"]");
const value=(root,key)=>find(root,key)?.value ?? "";
const selected=(root,key)=>find(root,key);
const say=(root,message,tone="info")=>{
  const node=find(root,"marker-library-state");
  if(node){node.textContent=message;node.dataset.tone=tone;}
};
const elem=(tag,text="")=>{const node=document.createElement(tag);node.textContent=text;return node;};
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
  if(kind==="knockout")return {kind:"damage",targetScope:"target",amount:1000000};
  if(!Number.isFinite(amount)||amount<0)throw new RangeError("Valeur de seuil invalide");
  return {kind,targetScope:"target",amount,
    ...(kind==="damage"?{channel:value(root,"marker-threshold-channel")||null}:{})};
}
function markerFromFields(root){
  const id=value(root,"marker-id").trim();
  const on=selected(root,"marker-threshold-enabled")?.checked===true;
  const effect=on?thresholdEffect(root,id):null;
  if(on && !effect)throw new RangeError("Choisis un effet de seuil ou désactive le seuil");
  return normalizeCaptureMarkerV1({
    id,name:value(root,"marker-name"),polarity:value(root,"marker-polarity"),
    durationMs:Math.round(Number(value(root,"marker-duration"))*1000),
    maxStacks:Number(value(root,"marker-max")),
    ...(value(root,"marker-icon").trim()?{iconAssetId:value(root,"marker-icon").trim()}:{}),
    ...(effect?{onStackThreshold:{
      count:Number(value(root,"marker-threshold-count")),
      consume:value(root,"marker-threshold-consume"),effects:[effect]}}:{})
  });
}
function loadFields(root,marker){
  const set=(key,content)=>{const node=find(root,key);if(node)node.value=String(content??"");};
  set("marker-id",marker.id);set("marker-name",marker.name);
  set("marker-polarity",marker.polarity);set("marker-duration",marker.durationMs/1000);
  set("marker-max",marker.maxStacks);set("marker-icon",marker.iconAssetId??"");
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
  syncVisibility(root);
}
function syncVisibility(root){
  const on=selected(root,"marker-threshold-enabled")?.checked;
  const field=find(root,"marker-threshold-fields");
  if(field)field.hidden=!on;
  const damage=selected(root,"marker-threshold-channel")?.closest("label");
  if(damage)damage.hidden=value(root,"marker-threshold-effect")!=="damage";
  const amount=selected(root,"marker-threshold-amount")?.closest("label");
  if(amount)amount.hidden=value(root,"marker-threshold-effect")==="knockout";
}
function refresh(root){
  const state=sessions.get(root);
  if(!state)return;
  const items=[...state.markers.values()].sort((a,b)=>a.name.localeCompare(b.name,"fr"));
  fill(find(root,"marker-library-select"),items,"Nouveau marqueur");
  for(const select of root.querySelectorAll("[data-skill-marker-pick]")){
    fill(select,items,"Choisir un marqueur");
  }
  for(const select of root.querySelectorAll("[data-skill-consume-marker-pick]")){
    const current=select.value;
    select.textContent="";
    const all=elem("option","Tous les types de marqueurs");all.value="*";select.append(all);
    for(const marker of items){const option=elem("option",marker.name);option.value=marker.id;select.append(option);}
    select.value=current&&[...select.options].some(o=>o.value===current)?current:"*";
  }
}
export function captureMarkerOptionsV1(root){return [...(sessions.get(root)?.markers.values()??[])];}
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
export function mountCaptureMarkerLibraryV1({root,listen,configuredSkills}){
  const markers=new Map();
  const controller={markers,configuredSkills};
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
    if(marker)loadFields(root,marker);
  });
  listen(find(root,"marker-threshold-enabled"),"change",()=>syncVisibility(root));
  listen(find(root,"marker-threshold-effect"),"change",()=>syncVisibility(root));
  listen(find(root,"marker-new"),"click",()=>{
    const sel=selected(root,"marker-library-select");sel.value="";
    loadFields(root,{id:"",name:"",maxStacks:10,polarity:"neutral",durationMs:10000});
    say(root,"Nouveau marqueur. Donne un identifiant unique en minuscules.","info");
  });
  listen(find(root,"marker-save"),"click",()=>{
    try{
      const marker=markerFromFields(root);
      const linked=propagateMarker(root,marker);
      markers.set(marker.id,marker);
      refresh(root);find(root,"marker-library-select").value=marker.id;
      say(root,"« "+marker.name+" » enregistré. "+linked+" capacité(s) synchronisée(s).","ok");
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
  indexSkills();refresh(root);syncVisibility(root);
  return Object.freeze({
    indexSkills,
    dispose(){sessions.delete(root);}
  });
}
