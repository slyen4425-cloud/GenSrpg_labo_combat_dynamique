import {normalizeCaptureMarkerV1,normalizeCaptureMarkerLibraryV1} from "../contracts/capture-marker-v1.js";

// Read-only export projection. Skills own the authored marker definitions used
// at runtime; the author library Map only owns markers not yet linked to skills.
// An open (possibly unsaved) skill is included exactly like "Exporter capacité".
export function captureMarkerExportSnapshotV1({
  markers=[],
  configuredSkills=[],
  currentDraft=null
}={}){
  const merged=new Map();
  const sources=new Map();
  function add(raw,origin){
    const marker=normalizeCaptureMarkerV1(raw);
    const prior=merged.get(marker.id);
    if(prior && JSON.stringify(prior)!==JSON.stringify(marker)){
      throw new RangeError(
        "Conflit de définition du marqueur « "+marker.name+" » ("+marker.id+
        ") entre "+sources.get(marker.id)+" et "+origin+
        ". Harmonise ces définitions avant l'export ; aucun réglage n'a été écrasé."
      );
    }
    if(!prior){merged.set(marker.id,marker);sources.set(marker.id,origin);}
  }
  function readSkill(draft,origin){
    for(const effect of draft?.definition?.effects??[]){
      if(effect.kind==="apply_marker")add(effect.marker,origin);
    }
  }
  const entries=markers instanceof Map ? markers.values() : markers;
  for(const marker of entries)add(marker,"bibliothèque de marqueurs");
  const skills=configuredSkills instanceof Map
    ? configuredSkills.values():configuredSkills;
  for(const draft of skills)readSkill(draft,"capacité enregistrée (« "+(draft.definition?.name??draft.id)+" »)");
  if(currentDraft!==null)readSkill(currentDraft,"capacité actuellement éditée (« "+(currentDraft.definition?.name??currentDraft.id)+" »)");
  return normalizeCaptureMarkerLibraryV1([...merged.values()]);
}
