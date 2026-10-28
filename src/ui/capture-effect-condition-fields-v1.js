// Author controls only. Status and marker IDs always come from the existing
// registries passed by the Human Editor; this module does not own any catalog.
const field=(caption,input)=>{
  const label=document.createElement("label");
  const title=document.createElement("small");
  title.textContent=caption;
  label.append(title,input);
  return label;
};
const option=(select,value,label)=>{
  const o=document.createElement("option");
  o.value=value;o.textContent=label;select.append(o);
};
export function appendCaptureEffectConditionFieldsV1({
  root,row,effect,statusKinds,statusLabel,markerOptions
}){
  const panel=document.createElement("details");
  panel.dataset.skillEffectConditionPanel="true";
  panel.className="skill-status-config";
  const summary=document.createElement("summary");
  summary.textContent="Condition de cet effet (facultatif)";
  const mode=document.createElement("select");
  mode.dataset.skillEffectConditionMode="true";
  option(mode,"always","Toujours — aucune condition");
  option(mode,"sleep","Si la cible est endormie");
  option(mode,"status_kind","Selon le type de statut de la cible");
  option(mode,"marker","Selon un marqueur de la cible");
  const status=document.createElement("select");
  status.dataset.skillEffectConditionStatus="true";
  for(const kind of statusKinds)option(status,kind,statusLabel(kind));
  const marker=document.createElement("select");
  marker.dataset.skillEffectConditionMarker="true";
  const markerSelection=()=>effect?.condition?.type==="marker"?effect.condition.value:marker.value;
  const populateMarkers=()=>{
    const selected=markerSelection();
    marker.textContent="";
    option(marker,"","Choisir un marqueur");
    for(const item of markerOptions(root))option(marker,item.id,item.name);
    if(selected && ![...marker.options].some(o=>o.value===selected)){
      option(marker,selected,"Marqueur importé : "+selected);
    }
    if(selected)marker.value=selected;
  };
  populateMarkers();
  marker.addEventListener("focus",populateMarkers);
  const min=document.createElement("input");
  min.type="number";min.min="1";min.max="99";min.step="1";
  min.dataset.skillEffectConditionMinimum="true";
  min.value=String(effect?.condition?.minimum??1);
  const invert=document.createElement("input");
  invert.type="checkbox";
  invert.dataset.skillEffectConditionInvert="true";
  invert.checked=effect?.condition?.invert===true;
  const grid=document.createElement("div");
  grid.className="skill-status-config__grid";
  const statusField=field("Type de statut",status);
  const markerField=field("Marqueur (liste de la bibliothèque)",marker);
  const minField=field("Au moins X charges",min);
  const invertField=field("Si absent / inverse la condition",invert);
  grid.append(field("Quand appliquer cet effet ?",mode),
    statusField,markerField,minField,invertField);
  const note=document.createElement("small");
  note.className="note";
  note.textContent="La condition est évaluée sur chaque cible au moment de l’impact. Sommeil reste reconnu même si l’attaque réveille la cible en lui faisant perdre des PV.";
  panel.append(summary,grid,note);
  row.append(panel);
  mode.value=effect?.condition?.type??"always";
  if(effect?.condition?.type==="status_kind")status.value=effect.condition.value;
  panel.open=mode.value!=="always";
  const sync=()=>{
    const kind=row.querySelector("[data-skill-effect-kind]")?.value;
    const scope=row.querySelector("[data-skill-effect-scope]")?.value;
    const allowed=!["life_steal","scheduled_effect","persistent_zone"].includes(kind) &&
      !["all_enemy_reserves","all_ally_reserves"].includes(scope);
    panel.hidden=!allowed;
    if(!allowed)mode.value="always";
    statusField.hidden=mode.value!=="status_kind";
    markerField.hidden=mode.value!=="marker";
    minField.hidden=mode.value==="always" || mode.value==="sleep";
    invertField.hidden=mode.value==="always";
  };
  mode.addEventListener("change",sync);
  row.querySelector("[data-skill-effect-kind]")?.addEventListener("change",sync);
  row.querySelector("[data-skill-effect-scope]")?.addEventListener("change",sync);
  sync();
  return panel;
}
export function readCaptureEffectConditionV1(row){
  const mode=row.querySelector("[data-skill-effect-condition-mode]")?.value??"always";
  if(mode==="always")return null;
  const selected=mode==="status_kind"
    ? row.querySelector("[data-skill-effect-condition-status]")?.value
    : mode==="marker"
      ? row.querySelector("[data-skill-effect-condition-marker]")?.value
      : null;
  if(mode!=="sleep" && !selected)throw new RangeError("Choisis un statut ou un marqueur dans la liste");
  const input=row.querySelector("[data-skill-effect-condition-minimum]");
  const minimum=mode==="sleep"?1:Number(input?.value??1);
  if(!Number.isInteger(minimum)||minimum<1||minimum>99)
    throw new RangeError("Nombre minimal de charges : de 1 à 99");
  return {type:mode,...(selected===null?{}:{value:selected}),minimum,
    ...(row.querySelector("[data-skill-effect-condition-invert]")?.checked?{invert:true}:{})};
}
