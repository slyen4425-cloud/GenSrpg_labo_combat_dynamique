import {normalizeSkillPresentationBinding} from "./skill-presentation-binding.js";

export const SKILL_PRESENTATION_BINDING_VERSION_V13 = 13;
export const BURROW_TERRAIN_STAGES_V13 = Object.freeze(["start","travel","impact"]);

function slot(raw,stage) {
  if(raw==null)return null;
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new TypeError("visual.burrowTerrain."+stage+" must be object or null");
  const allowed=["assetId","scale","offsetX","offsetY","frameMs"];
  for(const k of Object.keys(raw))if(!allowed.includes(k))throw new TypeError("unknown burrow stage field "+k);
  if(typeof raw.assetId!=="string"||raw.assetId.trim()==="")throw new TypeError("burrow stage assetId required");
  const values={scale:raw.scale??1,offsetX:raw.offsetX??0,offsetY:raw.offsetY??0,frameMs:raw.frameMs??70};
  for(const [k,v]of Object.entries(values)){
    if(typeof v!=="number"||!Number.isFinite(v))throw new RangeError("burrow "+stage+" "+k+" must be finite");
  }
  if(values.scale<0.25||values.scale>5)throw new RangeError("burrow scale 0.25..5");
  if(Math.abs(values.offsetX)>400||Math.abs(values.offsetY)>400)throw new RangeError("burrow offset -400..400px");
  if(values.frameMs<20||values.frameMs>500)throw new RangeError("burrow frameMs 20..500");
  return Object.freeze({assetId:raw.assetId.trim(),...values});
}

export function normalizeSkillPresentationBindingV13(input){
  if(!input||typeof input!=="object"||Array.isArray(input)||input.version!==13)throw new TypeError("SkillPresentationBindingV13 requires version 13");
  const baseVersion=input.baseVersion;
  if(!Number.isInteger(baseVersion)||baseVersion<2||baseVersion>12)throw new RangeError("Invalid V13 baseVersion 2..12");
  const raw=input.visual?.burrowTerrain;
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new TypeError("visual.burrowTerrain is required");
  for(const k of Object.keys(raw))if(!BURROW_TERRAIN_STAGES_V13.includes(k))throw new TypeError("unknown burrow stage "+k);
  const {burrowTerrain,...otherVisual}=input.visual;
  const {baseVersion:_base,...rest}=input;
  const normalized=normalizeSkillPresentationBinding({...rest,version:baseVersion,visual:otherVisual});
  return Object.freeze({
    ...normalized,version:13,baseVersion,
    visual:Object.freeze({
      ...normalized.visual,
      burrowTerrain:Object.freeze(Object.fromEntries(BURROW_TERRAIN_STAGES_V13.map(k=>[k,slot(raw[k],k)])))
    })
  });
}
