import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as CREATURE_FILES} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as SKILL_FILES} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_USED_ABILITY_CATALOG_V2} from "../../src/catalogs/capture-used-ability-catalog-v2.js";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {captureBestiaryCardsV1,bestiaryElementLabelV1} from "../../src/ui/capture-bestiary-cards-v1.js";

const root=document.querySelector("[data-bestiary]");
if(!root)throw new Error("Bestiaire : conteneur manquant");
const el=(name)=>root.querySelector("[data-bestiary-"+name+"]");
const elements={
  count:el("count"),list:el("list"),search:el("search"),element:el("element"),
  profile:el("profile"),name:el("name"),caption:el("caption"),
  elements:el("elements"),portrait:el("portrait"),description:el("description"),
  facts:el("facts"),attributes:el("attributes"),measures:el("measures"),
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
function pickCard(id){
  selectedId=id;
  if(window.location.hash.slice(1)!==encodeURIComponent(id))
    history.replaceState(null,"","#"+encodeURIComponent(id));
  renderList();
  renderProfile();
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
    stat.append(element("span",null,value.label),element("strong",null,value.value));
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
  renderValues(elements.attributes,card.attributes);
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
  elements.skills.replaceChildren(...(card.skills.length?card.skills.map(skill=>{
    const item=element("div","skill");
    if(skill.icon)item.append(picture(skill.icon,skill.name+" — icône"));
    const content=element("div");
    content.append(element("strong",null,skill.name));
    const sub=[skill.element?bestiaryElementLabelV1(skill.element):null,
      skill.slot==="slot-ultimate"?"Ultime":skill.slot?"Équipée":null,
      skill.requiredLevel!=null?"Niv. "+skill.requiredLevel:null].filter(Boolean).join(" · ");
    if(sub)content.append(element("small",null,sub));
    if(skill.description)content.append(element("p",null,skill.description));
    item.append(content);
    return item;
  }):[element("p","empty","Compétences non encore documentées.")]));
  elements.skillsNote.textContent=card.unavailableSkillCount>0?
    card.unavailableSkillCount+" compétence(s) encore absente(s) du catalogue publié ; aucun nom ni effet inventé.":"";
}
async function start(){
  try{
    const [assetCatalog,statRegistry,creatures,skills]=await Promise.all([
      fetchJson(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl)),
      fetchJson(publishedPath("data/capture/monster-capture-stat-registry.v1.json")),
      loadCollection(CREATURE_FILES),
      loadCollection(SKILL_FILES)
    ]);
    cards=captureBestiaryCardsV1({
      creatureTransfers:creatures.entries,skillTransfers:skills.entries,
      assetCatalog,statRegistry,
      historicalAbilities:CAPTURE_USED_ABILITY_CATALOG_V2.abilities
    });
    populateElementChoices();
    const target=decodeURIComponent(window.location.hash.slice(1));
    selectedId=cards.find(card=>card.id===target)?.id??cards[0]?.id??null;
    if(!selectedId){
      elements.profile.hidden=true;
      setStatus("Aucune créature finalisée publiée avec ses médias.",false);
    }else{
      renderProfile();
      const errors=creatures.failures+skills.failures;
      setStatus(errors? "Catalogue partiellement chargé : "+errors+
        " fichier(s) indisponible(s), données non inventées.":
        cards.length+" créatures finalisées · données publiées",errors>0);
    }
    renderList();
  }catch(error){
    elements.profile.hidden=true;
    elements.count.textContent="Indisponible";
    setStatus("Impossible de charger le Bestiaire : "+(error?.message??String(error)),true);
  }
}
elements.search.addEventListener("input",renderList);
elements.element.addEventListener("change",renderList);
window.addEventListener("hashchange",()=>{
  const hash=decodeURIComponent(window.location.hash.slice(1));
  if(cards.some(card=>card.id===hash)){selectedId=hash;renderList();renderProfile();}
});
start();
