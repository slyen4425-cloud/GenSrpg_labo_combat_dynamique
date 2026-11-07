import {normalizeSkillPresentationBinding} from "./skill-presentation-binding.js";
export const SKILL_PRESENTATION_BINDING_VERSION_V14 = 14;
function bounded(value,name,min,max) {
 if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)
   throw new RangeError(name+" must be between "+min+" and "+max);
 return value;
}
/** V14 contributes only under-target visual coordinates and motion.
 * Existing sourceVersion normalizes all gameplay-independent visual fields. */
export function normalizeSkillPresentationBindingV14(input) {
 if(!input||typeof input!=="object"||Array.isArray(input)||input.version!==14)
   throw new TypeError("SkillPresentationBindingV14 requires version 14");
 const {sourceVersion}=input;
 if(!Number.isInteger(sourceVersion)||sourceVersion<10||sourceVersion>13)
   throw new RangeError("V14 sourceVersion must be 10..13");
 const raw=input.visual?.travel;
 if(!raw||raw.trajectoryMode!=="under_target")
   throw new RangeError("V14 needs under_target visual travel");
 const {groundMotion,groundOffsetXPx,groundOffsetYPx,groundRisePx,...legacyTravel}=raw;
 if(!["fixed","rise"].includes(groundMotion))
   throw new RangeError("Invalid visual.travel.groundMotion");
 const x=bounded(groundOffsetXPx??0,"groundOffsetXPx",-400,400);
 const y=bounded(groundOffsetYPx??0,"groundOffsetYPx",-400,400);
 const rise=bounded(groundRisePx??80,"groundRisePx",0,400);
 const {sourceVersion:_ignored,...other}=input;
 const base=normalizeSkillPresentationBinding({...other,version:sourceVersion,
   visual:{...input.visual,travel:legacyTravel}});
 return Object.freeze({...base,version:14,sourceVersion,
   visual:Object.freeze({...base.visual,travel:Object.freeze({
     ...base.visual.travel,groundMotion,groundOffsetXPx:x,groundOffsetYPx:y,groundRisePx:rise
   })})});
}
