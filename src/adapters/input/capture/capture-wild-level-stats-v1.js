// Combat-owned deterministic NPC stat allocation proposal.
// This produces official registry stat IDs, not a second stat-effect engine.
// No encounter, author creature, player wallet or save is mutated.
import {normalizeCaptureStatRegistryV1} from '../../../contracts/capture-stat-registry-v1.js';

export function allocateCaptureWildLevelStatsV1({
 level, pointsPerLevel=20, statRegistry, baseStatValues={}, attackChannels=[]
}={}){
 if(!Number.isSafeInteger(level)||level<1)throw new RangeError('NPC level must be a positive safe integer');
 if(!Number.isSafeInteger(pointsPerLevel)||pointsPerLevel<0)
  throw new RangeError('NPC pointsPerLevel must be a nonnegative safe integer');
 const total=(level-1)*pointsPerLevel;
 if(!Number.isSafeInteger(total))throw new RangeError('NPC stat point budget overflow');
 const registry=normalizeCaptureStatRegistryV1(statRegistry);
 const ids=new Set(registry.stats.map(s=>s.id));
 if(!baseStatValues||typeof baseStatValues!=='object'||Array.isArray(baseStatValues))
  throw new TypeError('NPC baseStatValues must be an object');
 for(const [id,value] of Object.entries(baseStatValues)){
  if(!ids.has(id)||!Number.isFinite(value)||value<0)
   throw new RangeError('Invalid official NPC base stat: '+id);
 }
 if(!Array.isArray(attackChannels)||attackChannels.some(c=>typeof c!=='string'))
  throw new TypeError('NPC attackChannels must be an array of strings');
 const used=new Set(attackChannels);
 const weights=registry.stats.map(stat=>{
  const id=stat.id,base=baseStatValues[id]??0;
  // Universal survival/mobility; authored strengths and actually-used
  // offensive channels receive higher weight. Never award unused elements.
  const core=id==='health'||id==='defense'||id==='speed';
  const offense=stat.damageChannel!=null&&used.has(stat.damageChannel);
  return {id,weight:core||offense?1+base+(offense?2:0):0};
 }).filter(x=>x.weight>0);
 if(total>0&&!weights.length)throw new RangeError('NPC needs official core or used attack stats');
 const sum=weights.reduce((a,b)=>a+b.weight,0);
 if(!Number.isFinite(sum)||sum<=0)throw new RangeError('Invalid NPC stat weights');
 const floors=new Map(['health','defense','speed'].filter(id=>ids.has(id)).map(id=>[id,Math.floor(total*0.15)]));
 const floorTotal=[...floors.values()].reduce((a,b)=>a+b,0);
 const variableTotal=total-floorTotal;
 const shares=weights.map((entry,index)=>{
  const raw=variableTotal*entry.weight/sum;
  return {...entry,index,points:Math.floor(raw)+(floors.get(entry.id)??0),fraction:raw-Math.floor(raw)};
 });
 let remainder=total-shares.reduce((n,s)=>n+s.points,0);
 for(const share of [...shares].sort((a,b)=>b.fraction-a.fraction||a.index-b.index)){
  if(remainder<=0)break;
  share.points++;remainder--;
 }
 return Object.freeze(Object.fromEntries(shares.filter(x=>x.points>0).map(x=>[x.id,x.points])));
}
