import { adaptCaptureCombatExportStackV1 } from "../adapters/input/capture/capture-export-adapter-stack-v1.js";
import { normalizeBattleFormatDefinition } from "../contracts/battle-format-definition.js";
import { buildCaptureEditorCombatTestV1 } from "./capture-editor-combat-test-v1.js";
import {projectCaptureEncounterOwnedStatsV1} from "../adapters/input/capture/capture-encounter-owned-stats-v1.js";
import {allocateCaptureWildLevelStatsV1} from "../adapters/input/capture/capture-wild-level-stats-v1.js";

function requireParticipant(participant, side) {
  if (typeof participant?.speciesId !== "string" || !participant.speciesId.trim()) {
    throw new TypeError(side + " speciesId is required");
  }
  if (!Number.isSafeInteger(participant.level) || participant.level < 1) {
    throw new RangeError(side + " level must be a positive safe integer");
  }
}

// The official Combat builder owns the sole encounter-only HP projection.
// Authored creature definitions, saved participant HP, skills, levels and
// the historical level-20 Tester remain entirely outside this projection.
// Public read-only scalar: the same official Combat rule is consumed by
// actual fighters AND the GenSRPG game sheet. No duplicated HP arithmetic.
export function projectCaptureEncounterMaxHpV1(authoredMaxHp,multiplier=1){
 if(typeof authoredMaxHp!=='number'||!Number.isFinite(authoredMaxHp)||authoredMaxHp<0)
  throw new RangeError('Authored Combat maxHp must be nonnegative finite');
 if(!Number.isFinite(multiplier)||multiplier<=0||multiplier>1)
  throw new RangeError('Adventure HP multiplier must be in (0, 1]');
 // 100% means the original Combat fighter bytes are unchanged, including fractions.
 if(multiplier===1)return authoredMaxHp;
 return authoredMaxHp===0?0:Math.max(1,Math.ceil(authoredMaxHp*multiplier));
}
const ADVENTURE_HP_PROJECTED_V1 = Symbol("capture-adventure-hp-projected");
export function applyCaptureEncounterHpMultiplierV1(source, multiplier = 1) {
  if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 1)
    throw new RangeError("Adventure HP multiplier must be in (0, 1]");
  if (source?.[ADVENTURE_HP_PROJECTED_V1])
    throw new RangeError("Adventure HP already scaled on this Combat source");
  if (multiplier === 1) return source;
  const scale = amount => projectCaptureEncounterMaxHpV1(amount,multiplier);
  const change = fighter => Object.freeze({
    ...fighter,
    maxHp: scale(fighter.maxHp),
    ...(Object.hasOwn(fighter, "initialHp") ? {initialHp: scale(fighter.initialHp)} : {})
  });
  const fighterConfigs = Object.freeze(Object.fromEntries(
    Object.entries(source.fighterConfigs).map(([id, config]) => [id, change(config)])
  ));
  const fighters = Object.freeze(source.fighters.map(change));
  return Object.freeze({
    ...source, fighterConfigs, fighters,
    [ADVENTURE_HP_PROJECTED_V1]: true
  });
}

// Combat alone turns a WorldArea NPC profile into actual fighter stat effects.
// Only equipped and already-unlocked ability elements influence specialization.
// The authored species, local instance wallet and saved game are never mutated.
function projectCaptureWildOpponentStatsV1({opponent,configuredCreatures,configuredSkills,statRegistry,profile}){
 const record=configuredCreatures.get(opponent.speciesId);
 if(!record)throw new RangeError('Wild opponent absent from official Combat creature registry');
 const attackChannels=[...new Set((record.loadout?.slots??[])
  .map(slot=>configuredSkills.get(slot.skillId))
  .filter(skill=>skill&&skill.requiredLevel<=opponent.level)
  .map(skill=>skill.definition?.element)
  .filter(channel=>typeof channel==='string'&&channel.trim()))];
 const bonus=allocateCaptureWildLevelStatsV1({
  level:opponent.level,statRegistry,
  baseStatValues:record.statValues?.values??{},attackChannels,profile
 });
 if(!Object.keys(bonus).length)return configuredCreatures;
 return projectCaptureEncounterOwnedStatsV1({
  configuredCreatures,statRegistry,speciesId:opponent.speciesId,statAllocations:bonus
 });
}

// A wild encounter is still one visible fighter against one wild opponent.
// The existing Combat roster owns every extra saved team member; the
// AdventureSession retains its own durable instance order, HP and XP.
function buildCaptureWildReserveSourceV1({local,opponent,localReserve,hpMultiplier,options}) {
 const members=[local,...localReserve];
 if(members.length>6)throw new RangeError('Adventure Combat roster must have 1 to 6 members');
 const identities=new Set();
 for(const [i,member] of members.entries()){
  requireParticipant(member,'Adventure member '+i);
  const id=member.instanceId;
  if(typeof id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(id))
   throw new RangeError('Adventure roster member instanceId required');
  if(identities.has(id))throw new RangeError('Duplicate Adventure roster instanceId');
  identities.add(id);
  if(member.hp!==undefined&&member.hp!==null&&
   (typeof member.hp!=='number'||!Number.isFinite(member.hp)||member.hp<0))
   throw new RangeError('Invalid saved Adventure member HP');
 }
 requireParticipant(opponent,'Opponent');
 if(opponent.statAllocations!==undefined)
  throw new RangeError('Opponent statAllocations require an official NPC instance contract');
 if(!options.configuredCreatures||!options.configuredSkills)
  throw new TypeError('Official configured Capture creatures and skills required');
 const levelMap=Object.fromEntries([local,...localReserve,opponent]
  .map(member=>[member.speciesId,member.level]).reverse());
 // Preserve the first local species level on duplicate IDs. Exact levels and
 // stat allocations are subsequently projected on EACH instance separately.
 for(const member of members)if(levelMap[member.speciesId]===undefined)
  levelMap[member.speciesId]=member.level;
 levelMap[local.speciesId]=local.level;
 const fullExport=buildCaptureEditorCombatTestV1({
  ...options,configuredCreatures:options.configuredCreatures,
  localCreatureIds:members.map(member=>member.speciesId),
  opponentCreatureIds:[opponent.speciesId],activePerTeam:1,
  creatureLevelsById:levelMap
 });
 const full=adaptCaptureCombatExportStackV1(fullExport);
 const localActorId=full.battleFormat.localActorId;
 const enemyActorId=full.battleFormat.teams['enemy-team'][0];
 const team=full.roster.teams[localActorId],enemyTeam=full.roster.teams[enemyActorId];
 if(!team||team.members.length!==members.length||!enemyTeam)
  throw new RangeError('Official Combat roster does not match the saved Adventure party');
 const fighterConfigs={...full.fighterConfigs};
 const instanceMap={};
 const perMemberSkills={};
 let firstPlayer=null,enemyFighter=null;
 const changedMembers=team.members.map((rosterMember,index)=>{
  const member=members[index];
  if(rosterMember.creatureId!==member.speciesId)
   throw new RangeError('Official Combat member order differs from AdventureSession');
  // No second stats formula: the SAME single-player owner projects each
  // instance independently (including duplicate species and rival mirrors).
  const single=buildCaptureEncounterCombatSourceV1({
   ...options,local:member,opponent,hpMultiplier:1
  });
  const fighter=single.fighters.find(f=>f.id===localActorId);
  const opponentFighter=single.fighters.find(f=>f.id===enemyActorId);
  if(!fighter||!opponentFighter)
   throw new RangeError('Official Combat participant projection missing');
  const configId='roster/'+localActorId+'/'+rosterMember.id;
  fighterConfigs[configId]=Object.freeze({...fighter,id:member.speciesId});
  instanceMap[rosterMember.id]=member.instanceId;
  perMemberSkills[rosterMember.id]=single.skillIdsByActor[localActorId];
  if(index===0){firstPlayer=fighter;enemyFighter=opponentFighter;}
  return Object.freeze({...rosterMember,fighterConfigId:configId});
 });
 const enemyMember=enemyTeam.members.find(m=>m.id===enemyTeam.activeMemberId);
 const enemyConfigId='roster/'+enemyActorId+'/'+enemyMember.id;
 fighterConfigs[enemyConfigId]=Object.freeze({...enemyFighter,id:opponent.speciesId});
 const wrappedEnemyTeam=Object.freeze({...enemyTeam,members:Object.freeze(
  enemyTeam.members.map(m=>Object.freeze({...m,fighterConfigId:enemyConfigId})))});
 const output=Object.freeze({
  ...full,exported:fullExport,
  battleFormat:normalizeBattleFormatDefinition({
   ...full.battleFormat,
   actors:full.battleFormat.actors.map(actor=>
    actor.actorId===localActorId
     ? {...actor,fighterConfigId:changedMembers[0].fighterConfigId}
     : actor.actorId===enemyActorId
      ? {...actor,fighterConfigId:enemyConfigId}
      : actor)
  }),
  fighters:Object.freeze(full.fighters.map(f=>f.id===localActorId?firstPlayer:
   f.id===enemyActorId?enemyFighter:f)),
  fighterConfigs:Object.freeze(fighterConfigs),
  roster:Object.freeze({teams:Object.freeze({
   ...full.roster.teams,
   [localActorId]:Object.freeze({...team,members:Object.freeze(changedMembers)}),
   [enemyActorId]:wrappedEnemyTeam
  })}),
  skillIdsByRosterMember:Object.freeze({[localActorId]:Object.freeze(perMemberSkills)}),
  localInstanceIdsByMemberId:Object.freeze(instanceMap)
 });
 const scaled=applyCaptureEncounterHpMultiplierV1(output,hpMultiplier);
 // The Combat-owned max is the sole HP authority in play. A saved reserve KO
 // remains KO, and older saved HP is bounded without mutating the Core save.
 const initialHp=(saved,config)=>saved===null||saved===undefined?config.maxHp:
  Math.min(saved,config.maxHp);
 const configs={...scaled.fighterConfigs};
 for(const [index,member] of changedMembers.entries()){
  const config=configs[member.fighterConfigId];
  configs[member.fighterConfigId]=Object.freeze({...config,
   initialHp:initialHp(members[index].hp,config)});
 }
 const nativeFighters=scaled.fighters.map(f=>{
  if(f.id!==localActorId)return f;
  return Object.freeze({...f,initialHp:configs[changedMembers[0].fighterConfigId].initialHp});
 });
 return Object.freeze({...scaled,
  fighterConfigs:Object.freeze(configs),
  fighters:Object.freeze(nativeFighters)});
}

export function buildCaptureEncounterCombatSourceV1({ local, opponent, localReserve = [], hpMultiplier = 1, ...options } = {}) {
  if(!Array.isArray(localReserve))throw new TypeError('Adventure localReserve must be an array');
  if(localReserve.length)return buildCaptureWildReserveSourceV1({
    local,opponent,localReserve,hpMultiplier,options
  });
  requireParticipant(local, "Local");
  requireParticipant(opponent, "Opponent");
  // Only Combat projects stat allocations. GenSRPG owns the saved wallet,
  // and Exploration transports the optional, scoped instance-only values.
  // Explicit enemy allocations need a separate certified NPC contract.
  if (opponent.statAllocations !== undefined)
    throw new RangeError('Opponent statAllocations require an official NPC instance contract');
  const authoredCreatures=options.configuredCreatures;
  const npcCreatures=options.wildStatProfile===undefined?authoredCreatures:
   projectCaptureWildOpponentStatsV1({opponent,configuredCreatures:authoredCreatures,
    configuredSkills:options.configuredSkills,statRegistry:options.statRegistry,
    profile:options.wildStatProfile});
  const hasNpcOverride=npcCreatures!==authoredCreatures;
  const ownedCreatures=projectCaptureEncounterOwnedStatsV1({
    configuredCreatures:authoredCreatures,statRegistry:options.statRegistry,
    speciesId:local.speciesId,statAllocations:local.statAllocations
  });
  const hasOwnedStatOverride=ownedCreatures!==authoredCreatures;
  const mirror = local.speciesId === opponent.speciesId;
  const combinedCreatures=(!mirror&&hasNpcOverride)
   ?new Map([...ownedCreatures,[opponent.speciesId,npcCreatures.get(opponent.speciesId)]])
   :ownedCreatures;
  const build = (creatureLevelsById, configuredCreatures=ownedCreatures) => buildCaptureEditorCombatTestV1({
    ...options,configuredCreatures,
    localCreatureIds: [local.speciesId],
    opponentCreatureIds: [opponent.speciesId],
    activePerTeam: 1,
    creatureLevelsById
  });
  const exported = build(mirror
    ? { [local.speciesId]: local.level }
    : { [local.speciesId]: local.level, [opponent.speciesId]: opponent.level },combinedCreatures);
  const source = adaptCaptureCombatExportStackV1(exported);
  if (!mirror || (local.level === opponent.level && !hasOwnedStatOverride && !hasNpcOverride)) {
    return applyCaptureEncounterHpMultiplierV1(Object.freeze({ ...source, exported }), hpMultiplier);
  }

  // The author export is keyed by species. Project the opponent separately
  // through the same exporter, then bind its config to the existing roster slot.
  const rival = adaptCaptureCombatExportStackV1(build({ [opponent.speciesId]: opponent.level }, npcCreatures));
  const actorId = source.battleFormat.teams["enemy-team"][0];
  const team = source.roster.teams[actorId];
  const memberId = team.activeMemberId;
  const configId = "roster/" + actorId + "/" + memberId;
  const rivalFighter = rival.fighters.find(fighter => fighter.id === actorId);
  const rivalSkills = rival.skillIdsByActor[actorId];
  return applyCaptureEncounterHpMultiplierV1(Object.freeze({
    ...source,
    exported,
    battleFormat: normalizeBattleFormatDefinition({
      ...source.battleFormat,
      actors: source.battleFormat.actors.map(actor =>
        actor.actorId === actorId ? { ...actor, fighterConfigId: configId } : actor)
    }),
    fighters: Object.freeze(source.fighters.map(fighter =>
      fighter.id === actorId ? rivalFighter : fighter)),
    fighterConfigs: Object.freeze({
      ...source.fighterConfigs, [configId]: rival.fighterConfigs[opponent.speciesId]
    }),
    roster: Object.freeze({
      teams: Object.freeze({
        ...source.roster.teams,
        [actorId]: Object.freeze({
          ...team,
          members: Object.freeze(team.members.map(member => Object.freeze({
            ...member, fighterConfigId: configId
          })))
        })
      })
    }),
    skillIdsByActor: Object.freeze({ ...source.skillIdsByActor, [actorId]: rivalSkills }),
    skillIdsByRosterMember: Object.freeze({
      [actorId]: Object.freeze({ [memberId]: rivalSkills })
    }),
    skills: Object.freeze({ ...source.skills, ...rival.skills }),
    skillPresentations: Object.freeze({ ...source.skillPresentations, ...rival.skillPresentations })
  }), hpMultiplier);
}
