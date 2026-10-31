// Native Combat Lab input projection, never a second combat engine.
// All four difficulty values must be explicitly authored; there are no
// implicit multipliers or consumer-side gameplay defaults.
export const CAPTURE_TRAINER_DIFFICULTY_POLICY_V1_SCHEMA = 'capture-trainer-difficulty-policy-v1';
const LEVEL_FIELDS = new Set(['level','hpMultiplier','outgoingDamagePctBonus']);
const TOP_FIELDS = new Set(['schema','version','levels']);
const object = (value,field) => {
 if (!value || typeof value !== 'object' || Array.isArray(value))
  throw new TypeError(field+' must be an object');
 return value;
};
const exactFields = (value,allowed,field) => {
 for (const key of Object.keys(value))
  if (!allowed.has(key)) throw new TypeError(field+' unknown field: '+key);
};
const finite = (value,field) => {
 if (typeof value !== 'number' || !Number.isFinite(value))
  throw new RangeError(field+' must be a finite number');
 return value;
};

export function normalizeCaptureTrainerDifficultyPolicyV1(input) {
 const value=object(input,'trainer difficulty policy');
 exactFields(value,TOP_FIELDS,'trainer difficulty policy');
 if (value.schema!==CAPTURE_TRAINER_DIFFICULTY_POLICY_V1_SCHEMA || value.version!==1)
  throw new TypeError('Unsupported Combat Lab trainer difficulty policy schema/version');
 if (!Array.isArray(value.levels) || value.levels.length!==4)
  throw new RangeError('Combat Lab trainer difficulty requires exactly four authored levels');
 const levels=value.levels.map((raw,index)=>{
  const row=object(raw,'trainer difficulty level');
  exactFields(row,LEVEL_FIELDS,'trainer difficulty level');
  if (!Number.isInteger(row.level) || row.level!==index+1)
   throw new RangeError('Trainer difficulty levels must be ordered 1..4 without duplicates');
  const hpMultiplier=finite(row.hpMultiplier,'hpMultiplier');
  const outgoingDamagePctBonus=finite(row.outgoingDamagePctBonus,'outgoingDamagePctBonus');
  if (hpMultiplier<=0 || outgoingDamagePctBonus<0)
   throw new RangeError('Trainer difficulty multipliers must be positive and damage bonuses nonnegative');
  return Object.freeze({level:row.level,hpMultiplier,outgoingDamagePctBonus});
 });
 for (let i=1;i<levels.length;i++) {
  const a=levels[i-1],b=levels[i];
  if (b.hpMultiplier<a.hpMultiplier || b.outgoingDamagePctBonus<a.outgoingDamagePctBonus)
   throw new RangeError('Authored trainer difficulty must not become weaker at a higher level');
  if (b.hpMultiplier===a.hpMultiplier && b.outgoingDamagePctBonus===a.outgoingDamagePctBonus)
   throw new RangeError('Each trainer difficulty level must have a measurable, distinct effect');
 }
 return Object.freeze({schema:value.schema,version:1,levels:Object.freeze(levels)});
}

// Project only the opponent's per-ACTOR native fighter configuration. Editing
// fighterConfigs keyed by species would also buff the player's same species.
// Reserve switching is deliberately rejected until the native roster owner
// can apply this policy to each summoned NPC member, not silently left unscaled.
export function applyCaptureTrainerDifficultyPolicyV1({nativeCombatSource,trainerDifficulty,policy}={}) {
 const rules=normalizeCaptureTrainerDifficultyPolicyV1(policy);
 if (!Number.isInteger(trainerDifficulty) || trainerDifficulty<1 || trainerDifficulty>4)
  throw new RangeError('trainerDifficulty must be an authored level 1..4');
 const source=object(nativeCombatSource,'nativeCombatSource');
 const format=object(source.battleFormat,'nativeCombatSource.battleFormat');
 if (!Array.isArray(format.actors) || typeof format.teamOf!=='function' ||
     typeof format.localActorId!=='string' || !Array.isArray(source.fighters))
  throw new TypeError('Native Combat Lab battle format and fighters are required');
 const localTeam=format.teamOf(format.localActorId);
 if (typeof localTeam!=='string' || !localTeam)
  throw new TypeError('Native Combat Lab local team identity is required');
 const opponents=format.actors.filter(actor=>format.teamOf(actor.actorId)!==localTeam);
 if (!opponents.length || opponents.some(actor=>typeof actor.actorId!=='string' || !actor.actorId))
  throw new TypeError('Native Combat Lab opponent actor identity is required');
 const opponentIds=new Set(opponents.map(actor=>actor.actorId));
 const expected=new Set(format.actors.map(actor=>actor.actorId));
 if (expected.size!==format.actors.length || source.fighters.length!==expected.size ||
     new Set(source.fighters.map(f=>f?.id)).size!==expected.size ||
     source.fighters.some(f=>!expected.has(f?.id)))
  throw new TypeError('Native Combat Lab fighters do not match the signed battle actors');
 const rule=rules.levels[trainerDifficulty-1];
 const fighters=Object.freeze(source.fighters.map(fighter=>{
  object(fighter,'native fighter');
  if (!opponentIds.has(fighter.id)) return fighter;
  const baseHp=finite(fighter.maxHp,'native fighter maxHp');
  const baseInitial=finite(fighter.initialHp??baseHp,'native fighter initialHp');
  const baseDamage=finite(fighter.outgoingDamagePct??0,'native fighter outgoingDamagePct');
  if (baseHp<=0 || baseInitial<0 || baseInitial>baseHp)
   throw new RangeError('Native fighter HP must be valid before difficulty projection');
  const maxHp=Math.max(1,Math.round(baseHp*rule.hpMultiplier));
  const initialHp=Math.min(maxHp,Math.max(0,Math.round(baseInitial*rule.hpMultiplier)));
  const outgoingDamagePct=baseDamage+rule.outgoingDamagePctBonus;
  if (!Number.isSafeInteger(maxHp) || !Number.isFinite(outgoingDamagePct))
   throw new RangeError('Native trainer difficulty projection overflow');
  return Object.freeze({...fighter,maxHp,initialHp,outgoingDamagePct});
 }));
 // A reserve member is materialized by the ORIGINAL native roster engine from
 // fighterConfigs on recall/switch/KO. Project the opponent's member configs
 // by actor slot, not by species, or a player sharing the species is buffed.
 let projectedRoster=source.roster;
 let projectedFighterConfigs=source.fighterConfigs;
 const reserveSlots=[...opponentIds].filter(id=>{
  const team=source.roster?.teams?.[id];
  if (!team) return false;
  if (!Array.isArray(team.members))
   throw new TypeError('Native trainer roster members must be declared');
  // One-member legacy fixtures never materialize a bench; only a real
  // reserve requires slot metadata for native per-member projection.
  if (team.members.length<=1) return false;
  if (team.slotId!==id)
   throw new TypeError('Native trainer reserve must identify the opponent slot');
  return true;
 });
 if (reserveSlots.length) {
  const originalConfigs=object(source.fighterConfigs,'native trainer fighterConfigs');
  const teams={...source.roster.teams};
  const configs={...originalConfigs};
  for (const actorId of reserveSlots) {
   const team=teams[actorId];
   const memberIds=new Set();
   if (!team.activeMemberId || !team.members.some(member=>member?.id===team.activeMemberId))
    throw new TypeError('Native trainer roster requires a declared active opponent member');
   const members=team.members.map(member=>{
    const memberId=member?.id;
    if (typeof memberId!=='string' || !memberId || memberIds.has(memberId))
     throw new TypeError('Native trainer roster member IDs must be unique');
    memberIds.add(memberId);
    if (typeof member.fighterConfigId!=='string' || !Object.hasOwn(originalConfigs,member.fighterConfigId))
     throw new TypeError('Native trainer reserve fighter config is missing');
    const original=object(originalConfigs[member.fighterConfigId],'native trainer reserve fighter config');
    const baseHp=finite(original.maxHp,'native trainer reserve maxHp');
    const baseInitial=finite(original.initialHp??baseHp,'native trainer reserve initialHp');
    const baseDamage=finite(original.outgoingDamagePct??0,'native trainer reserve outgoingDamagePct');
    if (baseHp<=0 || baseInitial<0 || baseInitial>baseHp)
     throw new RangeError('Native trainer reserve HP must be valid');
    const maxHp=Math.max(1,Math.round(baseHp*rule.hpMultiplier));
    const initialHp=Math.min(maxHp,Math.max(0,Math.round(baseInitial*rule.hpMultiplier)));
    const outgoingDamagePct=baseDamage+rule.outgoingDamagePctBonus;
    if (!Number.isSafeInteger(maxHp) || !Number.isFinite(outgoingDamagePct))
     throw new RangeError('Native trainer reserve difficulty projection overflow');
    const configId='trainer-difficulty:'+encodeURIComponent(actorId)+':'+encodeURIComponent(memberId);
    if (Object.hasOwn(configs,configId))
     throw new RangeError('Native trainer reserve fighter config collision');
    configs[configId]=Object.freeze({...original,maxHp,initialHp,outgoingDamagePct});
    return Object.freeze({...member,fighterConfigId:configId});
   });
   teams[actorId]=Object.freeze({...team,members:Object.freeze(members)});
  }
  projectedRoster=Object.freeze({...source.roster,teams:Object.freeze(teams)});
  projectedFighterConfigs=Object.freeze(configs);
 }
 return Object.freeze({
  nativeCombatSource:Object.freeze({...source,fighters,roster:projectedRoster,fighterConfigs:projectedFighterConfigs}),
  appliedTrainerDifficulty:Object.freeze({
   schema:rules.schema,version:rules.version,level:trainerDifficulty,
   opponentActorIds:Object.freeze([...opponentIds]),
   hpMultiplier:rule.hpMultiplier,
   outgoingDamagePctBonus:rule.outgoingDamagePctBonus
  })
 });
}

/**
 * Native embedded-session seam. The consumer may select the NPC's difficulty
 * level, but the four actual modifiers come ONLY from the signed Lab combat
 * source. No consumer-supplied policy, second session, or implicit defaults.
 * Called after the original saved-HP snapshot is validated and attached, so
 * enemy HP and damage are projected into the real CombatSession fighters.
 */
export function projectCaptureEmbeddedTrainerSourceV1({
 battleFormat,fighters,roster,fighterConfigs,trainerDifficultyPolicy,embeddedBattle
}={}) {
 if (embeddedBattle==null ||
     !Object.prototype.hasOwnProperty.call(embeddedBattle,'trainerDifficulty'))
  return Object.freeze({fighters,roster,fighterConfigs});
 if (!trainerDifficultyPolicy)
  throw new TypeError('Signed Combat Lab author trainer difficulty policy is required');
 const projected=applyCaptureTrainerDifficultyPolicyV1({
  nativeCombatSource:{battleFormat,fighters,roster,fighterConfigs},
  trainerDifficulty:embeddedBattle.trainerDifficulty,
  policy:trainerDifficultyPolicy
 }).nativeCombatSource;
 return Object.freeze({
  fighters:projected.fighters,
  roster:projected.roster,
  fighterConfigs:projected.fighterConfigs
 });
}

// Compatibility for native callers without roster changes. Reserve-capable
// consumers MUST use the complete source projection, never fighters alone.
export function projectCaptureEmbeddedTrainerFightersV1(args={}) {
 return projectCaptureEmbeddedTrainerSourceV1(args).fighters;
}
