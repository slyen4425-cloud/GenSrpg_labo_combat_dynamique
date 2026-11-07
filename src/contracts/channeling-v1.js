import {normalizeSkillEffectV1} from "./skill-effect-v1.js";

// A single source-of-truth contract for authorable channeled pulses.
// Clock ownership is Combat Runtime; state/energy/effects belong to Session.
export function normalizeChannelingV1(value){
  if(!value||typeof value!=="object"||Array.isArray(value))
    throw new TypeError("channeling must be an object");
  const allowed=new Set(["tickIntervalMs","maxDurationMs","maxTicks","energyCostPerTick",
    "stopOnDamage","stopOnStun","stopOnSilence","effects"]);
  for(const k of Object.keys(value))
    if(!allowed.has(k))throw new TypeError("channeling unknown field: "+k);
  const tickIntervalMs=Number(value.tickIntervalMs);
  const maxDurationMs=Number(value.maxDurationMs??0);
  const maxTicks=value.maxTicks==null?null:Number(value.maxTicks);
  const energyCostPerTick=Number(value.energyCostPerTick??0);
  if(!Number.isInteger(tickIntervalMs)||tickIntervalMs<100||tickIntervalMs>60000)
    throw new RangeError("channeling.tickIntervalMs must be 100..60000");
  if(!Number.isInteger(maxDurationMs)||maxDurationMs<0||maxDurationMs>120000)
    throw new RangeError("channeling.maxDurationMs must be 0..120000");
  if(maxTicks!==null&&(!Number.isInteger(maxTicks)||maxTicks<1||maxTicks>500))
    throw new RangeError("channeling.maxTicks must be 1..500");
  if(!Number.isFinite(energyCostPerTick)||energyCostPerTick<0)
    throw new RangeError("channeling.energyCostPerTick must be nonnegative");
  if(maxDurationMs===0&&maxTicks===null&&energyCostPerTick===0)
    throw new RangeError("channeling must end by duration, maxTicks or energy");
  if(!Array.isArray(value.effects)||value.effects.length<1||value.effects.length>12)
    throw new RangeError("channeling.effects requires 1..12 native effects");
  const effects=value.effects.map(normalizeSkillEffectV1);
  for(const effect of effects){
    if(!["damage","heal","apply_status","apply_marker"].includes(effect.kind))
      throw new RangeError("channeling.effects unsupported kind: "+effect.kind);
    if(!["target","self"].includes(effect.targetScope))
      throw new RangeError("channeling.effects targetScope must be target or self");
  }
  for(const k of ["stopOnDamage","stopOnStun","stopOnSilence"])
    if(value[k]!=null&&typeof value[k]!=="boolean")
      throw new TypeError("channeling."+k+" must be boolean");
  return Object.freeze({tickIntervalMs,maxDurationMs,maxTicks,energyCostPerTick,
    stopOnDamage:value.stopOnDamage!==false,
    stopOnStun:value.stopOnStun!==false,stopOnSilence:value.stopOnSilence!==false,
    effects:Object.freeze(effects)});
}
