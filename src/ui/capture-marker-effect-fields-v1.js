import {captureMarkerOptionsV1, captureMarkerDefinitionV1, captureMarkerRegisterFromSkillV1} from "./capture-marker-library-v1.js";

const field=(name)=>{const node=document.createElement("label");node.textContent=name;return node;};
function choice(name,options,value){
  const node=document.createElement("select");
  for(const [id,label] of options){const o=document.createElement("option");o.value=id;o.textContent=label;node.append(o);}
  node.value=value??options[0]?.[0]??"";
  const l=field(name);l.append(node);return [l,node];
}
function numberField(name,value,min=0){
  const node=document.createElement("input");node.type="number";node.step="1";node.min=String(min);node.value=String(value);
  const l=field(name);l.append(node);return [l,node];
}
function read(root,key){return root.querySelector("[data-"+key+"]");}
function markerSelect(root,value,includeAll=false){
  const node=document.createElement("select");
  node.dataset[includeAll?"skillConsumeMarkerPick":"skillMarkerPick"]="true";
  if(includeAll){const all=document.createElement("option");all.value="*";all.textContent="Tous les marqueurs";node.append(all);}
  for(const marker of captureMarkerOptionsV1(root).sort((a,b)=>a.name.localeCompare(b.name,"fr"))){
    const option=document.createElement("option");option.value=marker.id;option.textContent=marker.name;node.append(option);
  }
  if(value!=null)node.value=value;
  return node;
}
function wrapSelect(text,node){const l=field(text);l.append(node);return l;}

function appendConsumeResultV1(host,effect=null){
  const row=document.createElement("div");
  row.dataset.markerConsumeResult="true";row.className="skill-status-config__grid";
  const type=choice("Effet après consommation",[
    ["none","Aucun (retrait seulement)"],
    ["damage","Dégâts"],["heal","Soin"],
    ["energy_restore","Récupérer de l'énergie"],
    ["energy_drain","Drainer de l'énergie"],
    ["apply_status","Appliquer un statut"],["cleanse","Nettoyage"],["dispel","Dissipation"]
  ],effect?.kind??"damage");
  type[1].dataset.markerResultKind="true";
  const scope=choice("Sur", [["target","Porteur des marqueurs"],["self","Lanceur"]],effect?.targetScope??"target");
  scope[1].dataset.markerResultScope="true";
  const amount=numberField("Valeur",effect?.amount??10);
  amount[1].dataset.markerResultAmount="true";
  const channel=field("Élément des dégâts (vide = celui de la capacité)");
  const channelInput=document.createElement("input");channelInput.type="text";
  channelInput.value=effect?.channel??"";channelInput.dataset.markerResultChannel="true";channel.append(channelInput);
  const status=field("Statut à appliquer (copié depuis une compétence)");
  const statusSelect=document.createElement("select");statusSelect.dataset.markerResultStatus="true";
  const known=[
    {id:"stun-marqueur",kind:"stun",polarity:"detrimental",durationMs:2000,stacking:"replace"},
    ...(effect?.kind==="apply_status"&&effect.status?[effect.status]:[])
  ];
  for(const template of known){
    const option=document.createElement("option");option.value=JSON.stringify(template);
    option.textContent=template.kind==="stun"?"Étourdissement 2 s":template.id+" (« "+template.kind+" »)";
    statusSelect.append(option);
  }
  if(effect?.kind==="apply_status")statusSelect.value=JSON.stringify(effect.status);
  status.append(statusSelect);
  const tags=field("Tags du statut (facultatif)");
  const tagInput=document.createElement("input");tagInput.type="text";
  tagInput.dataset.markerResultTags="true";tagInput.value=(effect?.statusTags??[]).join(", ");
  tags.append(tagInput);
  const remove=document.createElement("button");remove.type="button";remove.className="small-action";
  remove.textContent="Supprimer cet effet";remove.addEventListener("click",()=>row.remove());
  row.append(type[0],scope[0],amount[0],channel,status,tags,remove);
  const sync=()=>{
    const kind=type[1].value;
    amount[0].hidden=!["damage","heal","energy_restore","energy_drain"].includes(kind);
    channel.hidden=kind!=="damage";
    status.hidden=kind!=="apply_status";
    tags.hidden=!["cleanse","dispel"].includes(kind);
  };
  type[1].addEventListener("change",sync);sync();host.append(row);
}

export function captureMarkerEffectFieldsV1(root,effect){
  if(effect?.kind==="apply_marker"&&effect.marker){
    captureMarkerRegisterFromSkillV1(root,effect.marker);
  }
  const apply=document.createElement("div");
  apply.className="skill-status-config";apply.dataset.skillEffectConfigKind="apply_marker";
  const selected=markerSelect(root,effect?.marker?.id??null);
  const charges=numberField("Charges posées",effect?.charges??1,1);
  charges[1].dataset.skillMarkerCharges="true";
  apply.append(wrapSelect("Marqueur à poser",selected),charges[0]);
  const applyNote=document.createElement("small");applyNote.className="note";
  applyNote.textContent="Une définition partagée : une même charge peut être posée par plusieurs capacités. Configure les marqueurs dans la bibliothèque au-dessus.";
  apply.append(applyNote);

  const consume=document.createElement("div");
  consume.className="skill-status-config";consume.dataset.skillEffectConfigKind="consume_marker";
  const pick=markerSelect(root,effect?.markerId??"*",true);
  const count=choice("Quantité à retirer",[["all","Toutes les charges"],["number","Nombre maximal fixé"]],typeof effect?.count==="number"?"number":"all");
  count[1].dataset.markerConsumeMode="true";
  const max=numberField("Nombre maximal à retirer",typeof effect?.count==="number"?effect.count:1,1);
  max[1].dataset.markerConsumeCount="true";
  const minimum=numberField("Charges nécessaires pour activer l'effet",effect?.minimum??1,1);
  minimum[1].dataset.markerConsumeMinimum="true";
  const results=document.createElement("div");results.dataset.markerConsumeResults="true";
  if(effect?.effects?.length){for(const child of effect.effects)appendConsumeResultV1(results,child);}
  else appendConsumeResultV1(results);
  const add=document.createElement("button");add.type="button";add.className="secondary-action";
  add.textContent="+ Ajouter un effet";add.addEventListener("click",()=>appendConsumeResultV1(results));
  const sync=()=>{max[0].hidden=count[1].value!=="number";};
  count[1].addEventListener("change",sync);sync();
  consume.append(wrapSelect("Quels marqueurs consommer ?",pick),count[0],max[0],minimum[0],results,add);
  const note=document.createElement("small");note.className="note";
  note.textContent="Sans charges suffisantes : rien n'est retiré ni déclenché. Retirer des marqueurs ne déclenche pas leur propre seuil. La portée « Toutes les créatures en jeu » vise les acteurs actifs, pas les réserves.";
  consume.append(note);
  return {applyBox:apply,consumeBox:consume};
}

export function readCaptureMarkerEffectFieldsV1(root,row,kind,targetScope){
  if(kind==="apply_marker"){
    const markerId=read(row,"skill-marker-pick")?.value;
    return {kind,targetScope,marker:captureMarkerDefinitionV1(root,markerId),
      charges:Number(read(row,"skill-marker-charges")?.value)};
  }
  const all=read(row,"marker-consume-mode")?.value==="all";
  const results=[...row.querySelectorAll("[data-marker-consume-result]")].flatMap(item=>{
    const childKind=read(item,"marker-result-kind").value;
    if(childKind==="none")return [];
    const target=read(item,"marker-result-scope").value;
    if(childKind==="apply_status")return [{kind:"apply_status",targetScope:target,
      status:JSON.parse(read(item,"marker-result-status").value)}];
    if(["cleanse","dispel"].includes(childKind))return [{kind:childKind,targetScope:target,
      statusTags:read(item,"marker-result-tags").value.split(",").map(s=>s.trim()).filter(Boolean)}];
    const output={kind:childKind,targetScope:target,amount:Number(read(item,"marker-result-amount").value)};
    if(childKind==="damage")output.channel=read(item,"marker-result-channel").value.trim()||null;
    return [output];
  });
  return {kind:"consume_marker",targetScope,markerId:read(row,"skill-consume-marker-pick").value,
    count:all?"all":Number(read(row,"marker-consume-count").value),
    minimum:Number(read(row,"marker-consume-minimum").value),effects:results};
}
