// Combat-owned deterministic NPC stat allocation proposal.
// This produces official registry stat IDs, not a second stat-effect engine.
// No encounter, author creature, player wallet or save is mutated.
import {normalizeCaptureStatRegistryV1} from '../../../contracts/capture-stat-registry-v1.js';

export function allocateCaptureWildLevelStatsV1({
 level, pointsPerLevel=20, statRegistry, baseStatValues={}, attackChannels=[], profile={}
}={}){
 if(!Number.isSafeInteger(level)||level<1)throw new RangeError('NPC level must be a positive safe integer');
 if(!Number.isSafeInteger(pointsPerLevel)||pointsPerLevel<0)
  throw new RangeError('NPC pointsPerLevel must be a nonnegative safe integer');
 const effectivePointsPerLevel=profile?.pointsPerLevel??pointsPerLevel;
 if(!Number.isSafeInteger(effectivePointsPerLevel)||effectivePointsPerLevel<0||effectivePointsPerLevel>1000)
  throw new RangeError('NPC profile pointsPerLevel must be between 0 and 1000');
 const total=(level-1)*effectivePointsPerLevel;
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
 if(!profile||typeof profile!=='object'||Array.isArray(profile)||Object.getPrototypeOf(profile)!==Object.prototype)
  throw new TypeError('NPC profile must be a plain object');
 const permitted=new Set(['healthMinimumPct','defenseMinimumPct','speedMinimumPct','specialtyMultiplier','pointsPerLevel']);
 for(const key of Object.keys(profile))if(!permitted.has(key))
  throw new RangeError('Unknown NPC profile setting: '+key);
 const pct=(key)=>{const value=profile[key]??15;
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100)
   throw new RangeError('Invalid NPC profile percentage: '+key);
  return value;
 };
 const healthMinimumPct=pct('healthMinimumPct');
 const defenseMinimumPct=pct('defenseMinimumPct');
 const speedMinimumPct=pct('speedMinimumPct');
 const specialtyMultiplier=profile.specialtyMultiplier??1;
 if(typeof specialtyMultiplier!=='number'||!Number.isFinite(specialtyMultiplier)||
   specialtyMultiplier<0||specialtyMultiplier>10)
  throw new RangeError('Invalid NPC specialtyMultiplier');
 if(healthMinimumPct+defenseMinimumPct+speedMinimumPct>100)
  throw new RangeError('NPC profile minimum percentages exceed 100');
 const used=new Set(attackChannels);
 const weights=registry.stats.map(stat=>{
  const id=stat.id,base=baseStatValues[id]??0;
  // Universal survival/mobility; authored strengths and actually-used
  // offensive channels receive higher weight. Never award unused elements.
  const core=id==='health'||id==='defense'||id==='speed';
  const offense=stat.damageChannel!=null&&used.has(stat.damageChannel);
  return {id,weight:core||offense?(1+base+(offense?2:0))*(offense?specialtyMultiplier:1):0};
 }).filter(x=>x.weight>0);
 if(total>0&&!weights.length)throw new RangeError('NPC needs official core or used attack stats');
 const sum=weights.reduce((a,b)=>a+b.weight,0);
 if(!Number.isFinite(sum)||sum<=0)throw new RangeError('Invalid NPC stat weights');
 const percentages={health:healthMinimumPct,defense:defenseMinimumPct,speed:speedMinimumPct};
 const floors=new Map(['health','defense','speed'].filter(id=>ids.has(id)).map(id=>[id,Math.floor(total*percentages[id]/100)]));
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
