// Canonical, encounter-scoped NPC opponent overrides. The species, stat rule
// registry and skill definitions remain exclusively in Combat/Capture.
// This contains NO asset bytes, copied creature definition or saved state.
export const CAPTURE_NPC_OPPONENT_INSTANCE_SCHEMA_V1='capture-npc-opponent-instance-v1';
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,129}$/;
const MAX_POINT=100000;
export function normalizeCaptureNpcOpponentInstanceV1(raw){
 if(raw==null)return null;
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    Object.getPrototypeOf(raw)!==Object.prototype||
    raw.schema!==CAPTURE_NPC_OPPONENT_INSTANCE_SCHEMA_V1||
    Object.keys(raw).some(k=>!['schema','displayName','statAllocations','skillIds'].includes(k)))
  throw new RangeError('Contrat d’instance adversaire PNJ invalide');
 const instance={schema:CAPTURE_NPC_OPPONENT_INSTANCE_SCHEMA_V1};
 if(raw.displayName!==undefined){
  if(typeof raw.displayName!=='string'||!raw.displayName.trim()||
     raw.displayName.trim().length>80)
   throw new RangeError('Nom de combattant PNJ invalide');
  instance.displayName=raw.displayName.trim();
 }
 if(raw.statAllocations!==undefined){
  const bonus=raw.statAllocations;
  if(!bonus||typeof bonus!=='object'||Array.isArray(bonus)||
     Object.getPrototypeOf(bonus)!==Object.prototype||Object.keys(bonus).length>32)
   throw new RangeError('Répartition statistique PNJ invalide');
  let sum=0;
  const stats={};
  for(const [id,value] of Object.entries(bonus)){
   if(!ID.test(id)||!Number.isSafeInteger(value)||value<0||value>MAX_POINT)
    throw new RangeError('Bonus de statistique PNJ invalide');
   sum+=value;
   if(sum>1000000)throw new RangeError('Budget total de bonus PNJ trop élevé');
   stats[id]=value;
  }
  instance.statAllocations=Object.freeze(stats);
 }
 if(raw.skillIds!==undefined){
  if(!Array.isArray(raw.skillIds)||raw.skillIds.length<1||raw.skillIds.length>5||
     new Set(raw.skillIds).size!==raw.skillIds.length||
     raw.skillIds.some(id=>typeof id!=='string'||!ID.test(id)))
   throw new RangeError('Compétences PNJ : 1 à 5 références officielles distinctes');
  instance.skillIds=Object.freeze([...raw.skillIds]);
 }
 if(Object.keys(instance).length===1)throw new RangeError('Instance PNJ sans réglage');
 return Object.freeze(instance);
}
// The only allowed skill edits select a subset of the member's ACTUALLY
// unlocked native combat skills. No unearned spell or duplicate skill engine.
export function applyCaptureNpcOpponentSkillSelectionV1(source,opponent){
 const instance=normalizeCaptureNpcOpponentInstanceV1(opponent?.npcInstance);
 if(!instance?.skillIds)return source;
 const enemyId=source?.battleFormat?.teams?.['enemy-team']?.[0];
 const available=source?.skillIdsByActor?.[enemyId];
 if(!enemyId||!Array.isArray(available)||
    instance.skillIds.some(id=>!available.includes(id)))
  throw new RangeError('Compétence PNJ absente des compétences débloquées de cette créature');
 const members=source.roster?.teams?.[enemyId]?.members;
 const active=source.roster?.teams?.[enemyId]?.activeMemberId;
 const perMember=source.skillIdsByRosterMember?.[enemyId];
 return Object.freeze({...source,
  skillIdsByActor:Object.freeze({...source.skillIdsByActor,[enemyId]:instance.skillIds}),
  ...(perMember&&active?{skillIdsByRosterMember:Object.freeze({
    ...source.skillIdsByRosterMember,
    [enemyId]:Object.freeze({...perMember,[active]:instance.skillIds})
  })}:{})
 });
}
