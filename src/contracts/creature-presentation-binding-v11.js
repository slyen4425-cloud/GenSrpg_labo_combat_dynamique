import { normalizeCreaturePresentationBindingV10 } from "./creature-presentation-binding-v10.js";

export const CREATURE_IDLE_MODES_V1 = Object.freeze(["engine","gif","both"]);

export function normalizeCreatureIdleVisualV1(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("visual.idle must be an object");
  for (const key of Object.keys(value))
    if (!["mode","frontAssetId","backAssetId","front","back"].includes(key))
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
  const normalizeView=(input,view)=>{
    if(input==null) return undefined; // Keep older V11 files identical until edited.
    if(typeof input!=="object" || Array.isArray(input))
      throw new TypeError("idle."+view+" must be an object");
    for(const key of Object.keys(input))
      if(!["displayScale","offsetX","offsetY","frameSpeedMultiplier"].includes(key))
        throw new TypeError("unknown idle "+view+" field: "+key);
    const finite=(value,label,min,max)=>{
      if(typeof value!=="number" || !Number.isFinite(value) || value<min || value>max)
        throw new RangeError(label+" must be between "+min+" and "+max);
      return value;
    };
    return Object.freeze({
      displayScale:finite(input.displayScale??1,"idle."+view+".displayScale",0.25,8),
      offsetX:finite(input.offsetX??0,"idle."+view+".offsetX",-400,400),
      offsetY:finite(input.offsetY??0,"idle."+view+".offsetY",-400,400),
      frameSpeedMultiplier:finite(input.frameSpeedMultiplier??1,"idle."+view+".frameSpeedMultiplier",0.25,4)
    });
  };
  const front=normalizeView(value.front,"front"),back=normalizeView(value.back,"back");
  return Object.freeze({mode,frontAssetId,backAssetId,
    ...(front===undefined?{}:{front}),...(back===undefined?{}:{back})});
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
