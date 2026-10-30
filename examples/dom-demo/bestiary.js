import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as CREATURE_FILES} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as SKILL_FILES} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {captureBestiaryCardsV1,bestiaryElementLabelV1} from "../../src/ui/capture-bestiary-cards-v1.js?v=reserve-switch-prose-20261030";

const root=document.querySelector("[data-bestiary]");
if(!root)throw new Error("Bestiaire : conteneur manquant");
const el=(name)=>root.querySelector("[data-bestiary-"+name+"]");
const elements={
  count:el("count"),list:el("list"),search:el("search"),element:el("element"),
  profile:el("profile"),name:el("name"),caption:el("caption"),
  elements:el("elements"),portrait:el("portrait"),description:el("description"),
  facts:el("facts"),measures:el("measures"),return:el("return"),
  resistances:el("resistances"),skills:el("skills"),skillsNote:el("skills-note"),
  status:el("status")
};
let cards=[];
let selectedId=null;
const element=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);
  return node;
};
function setStatus(message,error=false){
  elements.status.textContent=message;
  elements.status.dataset.error=String(error);
}
async function fetchJson(url){
  const response=await fetch(url,{cache:"no-store"});
  if(!response.ok)throw new Error("Ressource non disponible ("+response.status+"): "+url.pathname);
  return response.json();
}
function publishedPath(file) {
  return new URL("../../"+file,import.meta.url);
}
async function loadCollection(paths){
  const results=await Promise.allSettled(paths.map(path=>fetchJson(publishedPath(path))));
  return {entries:results.filter(r=>r.status==="fulfilled").map(r=>r.value),
    failures:results.filter(r=>r.status==="rejected").length};
}
function picture(resource,alt,className){
  const img=element("img",className);
  img.alt=alt;
  img.src=globalVisualAssetUrl(resource.file);
  img.loading="lazy";
  img.decoding="async";
  return img;
}
function populateElementChoices(){
  const values=[...new Set(cards.flatMap(card=>card.elements))].sort((a,b)=>
    bestiaryElementLabelV1(a).localeCompare(bestiaryElementLabelV1(b),"fr"));
  elements.element.replaceChildren(element("option",null,"Tous les éléments"));
  elements.element.firstElementChild.value="";
  for(const value of values){
    const option=element("option",null,bestiaryElementLabelV1(value));
    option.value=value;
    elements.element.append(option);
  }
}
function filteredCards(){
  const query=elements.search.value.trim().toLocaleLowerCase("fr");
  const type=elements.element.value;
  return cards.filter(card=>
    (!type||card.elements.includes(type)) &&
    (!query||card.name.toLocaleLowerCase("fr").includes(query)||
      card.elements.some(v=>bestiaryElementLabelV1(v).toLocaleLowerCase("fr").includes(query)))
  );
}
// The URL is the only navigation authority. One route = one focused creature page.
function routeId(){
  try{return decodeURIComponent(window.location.hash.slice(1));}
  catch{return "";}
}
function renderRoute(){
  const card=cards.find(c=>c.id===routeId());
  selectedId=card?.id??null;
  root.dataset.bestiaryView=card?"detail":"catalog";
  if(card)renderProfile();
  else elements.profile.hidden=true;
  renderList();
}
function pickCard(id){
  if(!cards.some(card=>card.id===id))return;
  if(routeId()!==id)history.pushState(null,"","#"+encodeURIComponent(id));
  renderRoute();
  window.scrollTo({top:0,behavior:"instant"});
}
function backToCatalog(){
  history.pushState(null,"",window.location.pathname+window.location.search);
  renderRoute();
  window.scrollTo({top:0,behavior:"instant"});
}
function renderList(){
  const displayed=filteredCards();
  elements.count.textContent=displayed.length+" / "+cards.length;
  const children=displayed.map(card=>{
    const button=element("button","creature-choice");
    button.type="button";
    button.setAttribute("aria-pressed",String(selectedId===card.id));
    button.append(picture(card.icon,card.name+" — icône"));
    button.append(element("strong",null,card.name));
    button.append(element("small",null,card.elements.map(bestiaryElementLabelV1).join(" · ")));
    button.addEventListener("click",()=>pickCard(card.id));
    return button;
  });
  elements.list.replaceChildren(...(children.length?children:[element("p","empty","Aucune créature correspondante.")]));
}
function renderValues(host,values){
  host.replaceChildren(...(values.length?values.map(value=>{
    const stat=element("div","stat");
    const line=element("div","stat__line");
    line.append(element("span",null,value.label),element("strong",null,value.value));
    stat.append(line);
    if(value.effectSummary){
      stat.append(element("small","stat__effect",value.effectSummary));
    }
    return stat;
  }):[element("p","empty","Aucune valeur renseignée.")]));
}
function renderProfile(){
  const card=cards.find(c=>c.id===selectedId);
  if(!card){elements.profile.hidden=true;return;}
  elements.profile.hidden=false;
  elements.caption.textContent="Fiche créature · niveau "+(card.level??"—");
  elements.name.textContent=card.name;
  elements.elements.replaceChildren(...card.elements.map(key=>
    element("span","element-pill",bestiaryElementLabelV1(key))));
  // Only front portrait is rendered. The registered rear image is never read here.
  const img=picture(card.portrait,"Vue de face de "+card.name);
  img.loading="eager";
  img.addEventListener("error",()=>{
    elements.portrait.replaceChildren(element("p","empty","Portrait momentanément indisponible."));
    setStatus("Image de face indisponible pour "+card.name+". Vérifie le média publié.",true);
  },{once:true});
  elements.portrait.replaceChildren(img);
  elements.description.textContent=card.description||"Description non renseignée.";
  const facts=[];
  if(card.capturable&&card.captureRate!==null)facts.push("Taux de capture : "+card.captureRate+" %");
  if(card.evolution)facts.push("Évolution au niveau "+card.evolution.level);
  elements.facts.replaceChildren(...facts.map(text=>element("span",null,text)));
  // Keep the measured registry's own labels and values; do not invent missing stats.
  renderValues(elements.measures,card.measures);
  elements.resistances.replaceChildren(...(card.resistances.length?
    card.resistances.map(item=>{
      const tag=element("span","resistance");
      tag.dataset.weak=String(item.amount<0);
      tag.append(element("span",null,bestiaryElementLabelV1(item.element)),
        element("strong",null,(item.amount>0?"+":"")+item.amount+" %"));
      return tag;
    }):[element("p","empty","Aucune résistance ou faiblesse particulière renseignée.")]));
  const slotLabel=(slot)=>slot==="slot-ultimate"?"Ultime":
    "Compétence "+slot.slice("slot-".length);
  elements.skills.replaceChildren(...card.skills.map(skill=>{
    const item=element("div","skill");
    item.dataset.state=skill.state;
    if(skill.state!=="ready"){
      const line=element("div","skill__toggle skill__inactive");
      line.append(element("span","skill__icon-empty","—"));
      const label=element("div","skill__title");
      label.append(element("small",null,slotLabel(skill.slot)),
        element("strong",null,skill.state==="empty"?"Emplacement libre":"Compétence non publiée"));
      line.append(label);
      item.append(line);
      return item;
    }
    const toggle=element("button","skill__toggle");
    toggle.type="button";
    toggle.setAttribute("aria-expanded","false");
    const detailId="skill-detail-"+card.id.replace(/[^a-z0-9_-]/gi,"-")+"-"+skill.slot;
    toggle.setAttribute("aria-controls",detailId);
    if(skill.icon)toggle.append(picture(skill.icon,skill.name+" — icône","skill__icon"));
    else {
      const missingIcon=element("span","skill__icon-empty","—");
      missingIcon.setAttribute("aria-label","Icône non publiée");
      missingIcon.title="Icône non publiée pour cette capacité";
      toggle.append(missingIcon);
    }
    const label=element("span","skill__title");
    label.append(element("small",null,slotLabel(skill.slot)),element("strong",null,skill.name));
    const sub=[skill.element?bestiaryElementLabelV1(skill.element):null,
      skill.requiredLevel!=null?"Niv. "+skill.requiredLevel:null].filter(Boolean).join(" · ");
    if(sub)label.append(element("small",null,sub));
    toggle.append(label,element("span","skill__chevron","⌄"));
    const details=element("div","skill__details");
    details.id=detailId;
    details.hidden=true;
    if(skill.explanation){
      const prose=element("div","skill__prose");
      for(const sentence of skill.explanation.sentences)
        prose.append(element("p",null,sentence));
      details.append(prose);
    }else details.append(element("p",null,"Description de compétence indisponible."));
    toggle.addEventListener("click",()=>{
      const shouldOpen=details.hidden;
      for(const open of elements.skills.querySelectorAll(".skill__details"))open.hidden=true;
      for(const button of elements.skills.querySelectorAll(".skill__toggle[aria-expanded]"))
        button.setAttribute("aria-expanded","false");
      if(shouldOpen){details.hidden=false;toggle.setAttribute("aria-expanded","true");}
    });
    item.append(toggle,details);
    return item;
  }));
  const missing=card.skills.filter(skill=>skill.state==="unpublished").length;
  elements.skillsNote.textContent=missing>0?
    missing+" compétence(s) équipée(s) dont la définition n'est pas encore publiée.":"";
}
async function start(){
  try{
    const [assetCatalog,statRegistry,creatures,skills,nativeCatalog]=await Promise.all([
      fetchJson(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl)),
      fetchJson(publishedPath("data/capture/monster-capture-stat-registry.v1.json")),
      loadCollection(CREATURE_FILES),
      loadCollection(SKILL_FILES),
      fetchJson(publishedPath("data/combat/skills/catalog.v1.json"))
    ]);
    cards=captureBestiaryCardsV1({
      creatureTransfers:creatures.entries,skillTransfers:skills.entries,
      assetCatalog,statRegistry,
      nativeSkills:nativeCatalog.entries ?? []
    });
    populateElementChoices();
    renderRoute();
    if(!cards.length){
      setStatus("Aucune créature finalisée publiée avec ses médias.",false);
    }else{
      const errors=creatures.failures+skills.failures;
      setStatus(errors? "Catalogue partiellement chargé : "+errors+
        " fichier(s) indisponible(s), données non inventées.":
        cards.length+" créatures finalisées · données publiées",errors>0);
    }
  }catch(error){
    elements.profile.hidden=true;
    elements.count.textContent="Indisponible";
    setStatus("Impossible de charger le Bestiaire : "+(error?.message??String(error)),true);
  }
}
elements.search.addEventListener("input",renderList);
elements.element.addEventListener("change",renderList);
elements.return.addEventListener("click",backToCatalog);
window.addEventListener("hashchange",renderRoute);
window.addEventListener("popstate",renderRoute);
start();
