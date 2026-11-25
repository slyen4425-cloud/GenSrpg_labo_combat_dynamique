import { normalizeCreaturePresentationBindingV10 } from "./creature-presentation-binding-v10.js";

export const CREATURE_IDLE_MODES_V1 = Object.freeze(["engine","gif","both"]);

export function normalizeCreatureIdleVisualV1(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("visual.idle must be an object");
  for (const key of Object.keys(value))
    if (!["mode","frontAssetId","backAssetId"].includes(key))
      throw new TypeError("unknown idle field: "+key);
  const mode=value.mode ?? "engine";
  if (!CREATURE_IDLE_MODES_V1.includes(mode)) throw new RangeError("unknown idle mode: "+mode);
  const assetId=(raw,field)=>{
    if (raw==null || raw==="") return null;
    if(typeof raw!=="string" || !/^[A-Za-z0-9._-]+(?::[A-Za-z0-9._-]+)+$/.test(raw))
      throw new TypeError(field+" must be a stable asset ID");
    return raw;
  };
  const frontAssetId=assetId(value.frontAssetId,"idle.frontAssetId");
  const backAssetId=assetId(value.backAssetId,"idle.backAssetId");
  if(mode!=="engine" && frontAssetId===null && backAssetId===null)
    throw new RangeError("Un GIF idle FACE ou DOS doit être sélectionné.");
  return Object.freeze({mode,frontAssetId,backAssetId});
}

// Compatible upgrade; V10 keeps the authority over every existing setting.
export function normalizeCreaturePresentationBindingV11(input) {
  if(!input || typeof input!=="object" || Array.isArray(input) || input.version!==11)
    throw new TypeError("CreaturePresentationBinding V11 expected");
  const {idle,...priorVisual}=input.visual ?? {};
  const base=normalizeCreaturePresentationBindingV10({...input,version:10,visual:priorVisual});
  return Object.freeze({...base,version:11,visual:Object.freeze({
    ...base.visual,idle:normalizeCreatureIdleVisualV1(idle)
  })});
}
