import {captureEditorElementChannelChoicesV1} from "./capture-editor-element-channel-select-v1.js";

// A pure, read-only projection of the existing element/stat owners.
// "physical" is the Combat Damage built-in channel (not a parallel author element).
export function captureMarkerChannelChoicesV1({
  nativeElements = [],
  statRegistry = null,
  selectedId = ""
} = {}) {
  return captureEditorElementChannelChoicesV1({
    nativeElements: [{id:"physical",label:"Physique"}, ...nativeElements],
    statRegistry,
    selectedId
  });
}

// The reaction chooser already owns the complete GenSrpG icon + session
// imports listing. Reuse its published options rather than inventing a catalog.
export function captureMarkerIconChoicesV1({catalogOptions = [],selectedId = ""} = {}) {
  const map = new Map();
  for (const choice of catalogOptions) {
    const id = String(choice?.id ?? "").trim();
    if (id && !map.has(id)) map.set(id,Object.freeze({
      id,label:String(choice.label || id)
    }));
  }
  const existing = String(selectedId ?? "").trim();
  if (existing && !map.has(existing)) map.set(existing,
    Object.freeze({id:existing,label:existing+" (référence importée conservée)"}));
  return Object.freeze([...map.values()].sort((a,b)=>a.label.localeCompare(b.label,"fr",{sensitivity:"base"})));
}
