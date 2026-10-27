import {
  SOUNDTRACK_CATALOG_SCHEMA_V1,
  createEmptySoundtrackProjectV1,
  normalizeSoundtrackCatalogV1,
  normalizeSoundtrackProjectV1,
  setSoundtrackSceneV1
} from "../contracts/soundtrack-project-v1.js";

const EMPTY_CATALOG = Object.freeze({
  schema:SOUNDTRACK_CATALOG_SCHEMA_V1,version:1,assets:Object.freeze([])
});
const ORIGIN = Object.freeze({app:"Application",user:"Ma bibliothèque",project:"Ce projet"});
const CHANNELS = Object.freeze(["music","ambience"]);

export function saveSoundtrackAuthoringSceneV1(project,catalog,sceneId,channel,playlist) {
  if (!CHANNELS.includes(channel)) throw new TypeError("canal audio inconnu");
  if (!sceneId || typeof sceneId !== "string") throw new TypeError("identifiant de scène requis");
  const valid = normalizeSoundtrackProjectV1(project,catalog);
  const existing = valid.scenes[sceneId] ?? {music:null,ambience:null};
  return setSoundtrackSceneV1(valid,catalog,sceneId,{
    ...existing,[channel]:playlist?.tracks?.length ? playlist : null
  });
}

export function soundtrackAuthoringCatalogGroupsV1(rawCatalog,channel) {
  const catalog=normalizeSoundtrackCatalogV1(rawCatalog);
  if (!CHANNELS.includes(channel)) throw new TypeError("canal audio inconnu");
  return Object.freeze(catalog.assets.filter(x=>x.kind===channel)
    .map(x=>Object.freeze({assetId:x.assetId,title:x.title,origin:x.origin,
      label:x.title+" · "+ORIGIN[x.origin]})));
}

export function mountSoundtrackAuthoringV1({root,initialCatalog=EMPTY_CATALOG,initialProject=null}) {
  if (!root?.querySelector) throw new TypeError("audio editor root required");
  const one=key=>{
    const element=root.querySelector("[data-soundtrack-"+key+"]");
    if (!element) throw new Error("champ Musiques manquant : "+key);
    return element;
  };
  const el={
    project:one("project-id"),scene:one("scene-id"),channel:one("channel"),
    asset:one("asset-id"),list:one("track-list"),order:one("order"),
    volume:one("volume"),fade:one("fade"),repeat:one("repeat"),
    status:one("status"),catalogInput:one("catalog-file"),projectInput:one("project-file"),
    add:one("add"),save:one("save"),export:one("export"),reset:one("new-project")
  };
  const listeners=[];
  const on=(node,event,fn)=>{node.addEventListener(event,fn);listeners.push([node,event,fn]);};
  let catalog=normalizeSoundtrackCatalogV1(initialCatalog);
  let project=normalizeSoundtrackProjectV1(
    initialProject??createEmptySoundtrackProjectV1(el.project.value || "capture-demo"),
    catalog
  );
  el.project.value=project.projectId;
  let tracks=[];
  let destroyed=false;

  function state(message,success=true){
    el.status.textContent=message;
    el.status.dataset.tone=success?"success":"error";
  }
  function guard(fn) {
    if(destroyed) return;
    try { fn(); }
    catch(error){state(error?.message??String(error),false);}
  }
  function renderAssets(){
    const previous=el.asset.value;
    el.asset.replaceChildren();
    for(const item of soundtrackAuthoringCatalogGroupsV1(catalog,el.channel.value)){
      const option=root.ownerDocument.createElement("option");
      option.value=item.assetId;
      option.textContent=item.label;
      el.asset.append(option);
    }
    if([...el.asset.options].some(x=>x.value===previous)) el.asset.value=previous;
    el.add.disabled=el.asset.options.length===0;
  }
  function renderTracks(){
    el.list.replaceChildren();
    for(const [index,id] of tracks.entries()){
      const row=root.ownerDocument.createElement("li");
      const label=root.ownerDocument.createElement("span");
      const asset=catalog.assets.find(x=>x.assetId===id);
      label.textContent=asset?.title??id;
      row.append(label);
      const action=(symbol,label,callback,disabled=false)=>{
        const btn=root.ownerDocument.createElement("button");
        btn.type="button";btn.className="secondary-action";
        btn.textContent=symbol;btn.setAttribute("aria-label",label);
        btn.disabled=disabled;
        btn.addEventListener("click",()=>guard(()=>{callback();renderTracks();}));
        row.append(btn);
      };
      action("↑","Monter la piste "+(index+1),()=>{[tracks[index-1],tracks[index]]=[tracks[index],tracks[index-1]];},index===0);
      action("↓","Descendre la piste "+(index+1),()=>{[tracks[index+1],tracks[index]]=[tracks[index],tracks[index+1]];},index===tracks.length-1);
      action("×","Retirer la piste "+(index+1),()=>tracks.splice(index,1));
      el.list.append(row);
    }
    if(!tracks.length){const item=root.ownerDocument.createElement("li");item.textContent="Aucune piste — ce canal restera silencieux.";el.list.append(item);}
  }
  function readControls(){
    return {
      tracks:[...tracks],
      order:el.order.value,
      volume:Number(el.volume.value)/100,
      fadeMs:Math.round(Number(el.fade.value)*1000),
      repeat:el.repeat.checked
    };
  }
  function loadScene(){
    const id=el.scene.value.trim(),channel=el.channel.value;
    const config=project.scenes[id]?.[channel];
    tracks=[...(config?.tracks??[])];
    el.order.value=config?.order??"sequence";
    el.volume.value=String(Math.round((config?.volume??.75)*100));
    el.fade.value=String((config?.fadeMs??700)/1000);
    el.repeat.checked=config?.repeat??true;
    renderAssets();renderTracks();
  }
  function save(){
    const scene=el.scene.value.trim(),projectId=el.project.value.trim();
    if(projectId!==project.projectId) throw new Error("Utilise « Nouveau jeu » avant de changer l’identifiant du jeu.");
    const channel=el.channel.value;
    project=saveSoundtrackAuthoringSceneV1(project,catalog,scene,channel,readControls());
    state("Configuration enregistrée dans l'éditeur. Exporte le JSON pour la conserver.");
  }
  async function loadJsonFromInput(input,accept){
    const file=input.files?.[0];
    if(!file) return;
    try{
      const json=JSON.parse(await file.text());
      if(destroyed) return;
      accept(json);
    }catch(error){if(!destroyed)state("Import refusé : "+(error?.message??String(error)),false);}
    finally{ input.value=""; }
  }
  on(el.channel,"change",()=>guard(loadScene));
  on(el.scene,"change",()=>guard(loadScene));
  on(el.add,"click",()=>guard(()=>{
    if(!el.asset.value) throw new Error("Aucune piste sélectionnée");
    if(tracks.length>=100) throw new Error("Limite de 100 pistes par canal");
    tracks.push(el.asset.value);renderTracks();
  }));
  on(el.save,"click",()=>guard(save));
  on(el.reset,"click",()=>guard(()=>{
    const id=el.project.value.trim();
    project=createEmptySoundtrackProjectV1(id);
    loadScene();state("Nouveau jeu : "+id+" (configuration indépendante).");
  }));
  on(el.export,"click",()=>guard(()=>{
    save();
    const serialized=JSON.stringify(project,null,2);
    const a=root.ownerDocument.createElement("a");
    a.href="data:application/json;charset=utf-8,"+encodeURIComponent(serialized);
    a.download="gensrpg-soundtrack-"+project.projectId+".json";
    root.append(a);a.click();a.remove();
    state("Projet exporté : "+project.projectId);
  }));
  on(el.catalogInput,"change",()=>loadJsonFromInput(el.catalogInput,json=>{
    const nextCatalog=normalizeSoundtrackCatalogV1(json);
    // Atomic validation: never orphan already configured tracks.
    normalizeSoundtrackProjectV1(project,nextCatalog);
    catalog=nextCatalog;
    loadScene();
    state(catalog.assets.length+" médias référencés dans la bibliothèque audio (sans copie de fichier).");
  }));
  on(el.projectInput,"change",()=>loadJsonFromInput(el.projectInput,json=>{
    const next=normalizeSoundtrackProjectV1(json,catalog);
    project=next;el.project.value=project.projectId;
    const first=Object.keys(project.scenes)[0];
    if(first) el.scene.value=first;
    loadScene();
    state("Configuration du jeu « "+project.projectId+" » importée.");
  }));
  loadScene();
  return Object.freeze({
    snapshot:()=>project,
    catalog:()=>catalog,
    dispose(){if(destroyed)return;destroyed=true;
      for(const [node,event,fn] of listeners)node.removeEventListener(event,fn);
      listeners.length=0;
    }
  });
}
