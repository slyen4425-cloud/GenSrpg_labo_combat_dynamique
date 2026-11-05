// Ephemeral projection of stat points owned by a real Adventure creature instance.
// Combat's existing registry and V3 exporter remain the ONLY source of stat rules.
// This never edits authored creature transfers, Tester defaults or saved game data.
import {normalizeCaptureStatRegistryV1} from '../../../contracts/capture-stat-registry-v1.js';
import {normalizeCaptureCreatureStatValuesV1} from '../../../contracts/capture-creature-stat-values-v1.js';

function allocations(input){
  if(input===undefined)return null;
  if(!input || typeof input!=='object' || Array.isArray(input) ||
     Object.getPrototypeOf(input)!==Object.prototype)
    throw new TypeError('Owned statAllocations must be a plain object');
  for(const [id,points] of Object.entries(input)){
    if(typeof id!=='string'||!id.trim())
      throw new RangeError('Owned stat allocation stat ID missing');
    if(typeof points!=='number'||!Number.isSafeInteger(points)||points<0)
      throw new RangeError('Owned stat allocation points must be nonnegative safe integers');
  }
  return input;
}

export function projectCaptureEncounterOwnedStatsV1({
  configuredCreatures,statRegistry,speciesId,statAllocations
}={}){
  if(!(configuredCreatures instanceof Map))
    throw new TypeError('Official configuredCreatures Map required');
  if(typeof speciesId!=='string'||!speciesId.trim()||
     !configuredCreatures.has(speciesId))
    throw new RangeError('Owned creature species is not present in official Combat registry');
  const bonus=allocations(statAllocations);
  if(bonus===null||Object.keys(bonus).length===0)
    return configuredCreatures;
  if(statRegistry==null)
    throw new TypeError('Official Combat statRegistry is required for owned stat allocations');
  const registry=normalizeCaptureStatRegistryV1(statRegistry);
  const allowed=new Set(registry.stats.map(entry=>entry.id));
  const record=configuredCreatures.get(speciesId);
  const original=normalizeCaptureCreatureStatValuesV1(record?.statValues,registry);
  if(original.creatureId!==speciesId)
    throw new RangeError('Owned stats species/author creature ID mismatch');
  const values={...original.values};
  for(const [statId,points] of Object.entries(bonus)){
    if(!allowed.has(statId))
      throw new RangeError('Unknown official Combat stat allocation ID: '+statId);
    const sum=(values[statId]??0)+points;
    if(!Number.isFinite(sum)||sum>Number.MAX_SAFE_INTEGER)
      throw new RangeError('Owned stat value exceeds a safe Combat projection');
    values[statId]=sum;
  }
  // Zero-only configurations must still validate their IDs, but never
  // create a new Combat instance or a false per-member difference.
  if(Object.values(bonus).every(points=>points===0))return configuredCreatures;
  const projected=normalizeCaptureCreatureStatValuesV1({
    schema:'capture-creature-stat-values-v1',creatureId:speciesId,values
  },registry);
  const copy=new Map(configuredCreatures);
  copy.set(speciesId,Object.freeze({...record,statValues:projected}));
  return copy;
}
