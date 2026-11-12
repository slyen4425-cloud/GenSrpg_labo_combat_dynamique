import { adaptCaptureCombatExportStackV1 } from "../adapters/input/capture/capture-export-adapter-stack-v1.js";
import { normalizeBattleFormatDefinition } from "../contracts/battle-format-definition.js";
import { buildCaptureEditorCombatTestV1 } from "./capture-editor-combat-test-v1.js";
import {projectCaptureEncounterOwnedStatsV1} from "../adapters/input/capture/capture-encounter-owned-stats-v1.js";
import {allocateCaptureWildLevelStatsV1} from "../adapters/input/capture/capture-wild-level-stats-v1.js";
import {projectCapturePlannedLoadoutsToCombatV1} from "../adapters/input/capture/capture-planned-loadout-to-combat-v1.js";

function requireParticipant(participant, side) {
  if (typeof participant?.speciesId !== "string" || !participant.speciesId.trim()) {
    throw new TypeError(side + " speciesId is required");
  }
  if (!Number.isSafeInteger(participant.level) || participant.level < 1) {
    throw new RangeError(side + " level must be a positive safe integer");
  }
}

// Read-only labels for the ACTUAL saved encounter participants. Neither the
// fighter stats nor the RosterSession has a second level authority.
export function attachCaptureEncounterDisplayLevelsV1(source,{local,opponent,localReserve=[],opponentReserve=[]}={}){
  requireParticipant(local,"Local");requireParticipant(opponent,"Opponent");
  const localId=source?.battleFormat?.localActorId;
  const enemyId=source?.battleFormat?.teams?.["enemy-team"]?.[0];
  const own=source?.roster?.teams?.[localId]?.members;
  const rival=source?.roster?.teams?.[enemyId]?.members;
  if(!localId||!enemyId||localId===enemyId)
    throw new RangeError("Official battle roster cannot be correlated with encounter levels");
  function levelsByMember(roster, participants) {
    if(!Array.isArray(roster)||roster.length!==participants.length)
      throw new RangeError("Official battle roster cannot be correlated with encounter levels");
    return Object.freeze(Object.fromEntries(roster.map((member,index)=>{
      const participant=participants[index];
      requireParticipant(participant,"Encounter member "+index);
      if(member.creatureId!==participant.speciesId)
        throw new RangeError("Encounter member order/species differs from Combat roster");
      return [member.id,participant.level];
    })));
  }
  const levels={
    [localId]:levelsByMember(own,[local,...localReserve]),
    [enemyId]:levelsByMember(rival,[opponent,...opponentReserve])
  };
  return Object.freeze({...source,displayLevelsByRosterMember:Object.freeze(levels)});
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
function projectCaptureWildOpponentStatsV1({
 opponent,configuredCreatures,configuredSkills,statRegistry,profile,progressionRules
}){
 const record=configuredCreatures.get(opponent.speciesId);
 if(!record)throw new RangeError('Wild opponent absent from official Combat creature registry');
 // Reuse the SAME official progression-aware exporter that decides which
 // loadout slots actually exist at the opponent's encounter level. A locked
 // (though authored) attack must never steal points from usable stat channels.
 const activeLoadout=progressionRules==null?record.loadout:
  projectCapturePlannedLoadoutsToCombatV1({
   progressionRules,
   creatureDrafts:[{...record.draft,level:opponent.level}],
   skillDrafts:[...configuredSkills.values()],
   loadouts:[record.loadout]
  })[0];
 const attackChannels=[...new Set((activeLoadout?.slots??[])
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

// A wild or trainer encounter keeps one visible fighter on each side. Combat
// owns both reserves. GenSRPG keeps the local team's durable identities and HP.
function buildCaptureEncounterRosterSourceV1({local,opponent,localReserve,opponentReserve,hpMultiplier,options}) {
 const players=[local,...localReserve], rivals=[opponent,...opponentReserve];
 if(players.length>6||rivals.length>6)
  throw new RangeError('Adventure Combat roster must have 1 to 6 members on each side');
 const identities=new Set();
 for(const [index,member] of players.entries()){
  requireParticipant(member,'Adventure member '+index);
  const id=member.instanceId;
  if(typeof id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(id))
   throw new RangeError('Adventure roster member instanceId required');
  if(identities.has(id))throw new RangeError('Duplicate Adventure roster instanceId');
  identities.add(id);
  if(member.hp!==undefined&&member.hp!==null&&
   (typeof member.hp!=='number'||!Number.isFinite(member.hp)||member.hp<0))
   throw new RangeError('Invalid saved Adventure member HP');
 }
 for(const [index,member] of rivals.entries()){
  requireParticipant(member,'Opponent member '+index);
  if(member.statAllocations!==undefined)
   throw new RangeError('Opponent statAllocations require an official NPC instance contract');
 }
 if(!options.configuredCreatures||!options.configuredSkills)
  throw new TypeError('Official configured Capture creatures and skills required');

 // The species-keyed export registers every unlocked skill, then the single
 // encounter builder gives each roster member its exact level and loadout.
 const maxLevels=new Map();
 for(const {speciesId,level} of [...players,...rivals])
  maxLevels.set(speciesId,Math.max(level,maxLevels.get(speciesId)??1));
 const fullExport=buildCaptureEditorCombatTestV1({
  ...options,localCreatureIds:players.map(member=>member.speciesId),
  opponentCreatureIds:rivals.map(member=>member.speciesId),activePerTeam:1,
  creatureLevelsById:Object.fromEntries(maxLevels)
 });
 const full=adaptCaptureCombatExportStackV1(fullExport);
 const localId=full.battleFormat.localActorId;
 const enemyId=full.battleFormat.teams['enemy-team'][0];
 const fighterConfigs={...full.fighterConfigs};
 const skills={...full.skills};
 const skillPresentations={...full.skillPresentations};
 const primary=buildCaptureEncounterCombatSourceV1({...options,local,opponent,hpMultiplier:1});

 function projectTeam(actorId, participants, buildMember) {
  const team=full.roster.teams[actorId];
  if(!team||team.members.length!==participants.length)
   throw new RangeError('Official Combat roster does not match the encounter party');
  const memberSkills={};
  let activeFighter;
  const members=team.members.map((member,index)=>{
   const participant=participants[index];
   if(member.creatureId!==participant.speciesId)
    throw new RangeError('Official Combat member order differs from the encounter party');
   const single=index===0?primary:buildMember(participant);
   const fighter=single.fighters.find(entry=>entry.id===actorId);
   if(!fighter)throw new RangeError('Official Combat participant projection missing');
   const configId='roster/'+actorId+'/'+member.id;
   fighterConfigs[configId]=Object.freeze({...fighter,id:participant.speciesId});
   memberSkills[member.id]=single.skillIdsByActor[actorId];
   Object.assign(skills,single.skills);
   Object.assign(skillPresentations,single.skillPresentations);
   if(member.id===team.activeMemberId)activeFighter=fighter;
   return Object.freeze({...member,fighterConfigId:configId});
  });
  const activeMember=members.find(member=>member.id===team.activeMemberId);
  return {
   team:Object.freeze({...team,members:Object.freeze(members)}),activeMember,
   activeFighter,memberSkills:Object.freeze(memberSkills)
  };
 }
 const own=projectTeam(localId,players,member=>buildCaptureEncounterCombatSourceV1({
  ...options,local:member,opponent,hpMultiplier:1
 }));
 const enemy=projectTeam(enemyId,rivals,member=>buildCaptureEncounterCombatSourceV1({
  ...options,local,opponent:member,hpMultiplier:1
 }));
 const teams={[localId]:own,[enemyId]:enemy};
 const output=Object.freeze({
  ...full,exported:fullExport,
  battleFormat:normalizeBattleFormatDefinition({
   ...full.battleFormat,
   actors:full.battleFormat.actors.map(actor=>({
    ...actor,fighterConfigId:teams[actor.actorId].activeMember.fighterConfigId
   }))
  }),
  fighters:Object.freeze(full.fighters.map(fighter=>teams[fighter.id].activeFighter)),
  fighterConfigs:Object.freeze(fighterConfigs),
  roster:Object.freeze({teams:Object.freeze({[localId]:own.team,[enemyId]:enemy.team})}),
  skills:Object.freeze(skills),skillPresentations:Object.freeze(skillPresentations),
  skillIdsByActor:Object.freeze({
   [localId]:own.memberSkills[own.activeMember.id],
   [enemyId]:enemy.memberSkills[enemy.activeMember.id]
  }),
  skillIdsByRosterMember:Object.freeze({[localId]:own.memberSkills,[enemyId]:enemy.memberSkills}),
  localInstanceIdsByMemberId:Object.freeze(Object.fromEntries(own.team.members.map(
   (member,index)=>[member.id,players[index].instanceId]
  )))
 });
 const scaled=applyCaptureEncounterHpMultiplierV1(output,hpMultiplier);
 // A saved reserve KO stays KO. Clamp old saved HP to the native scaled max.
 const configs={...scaled.fighterConfigs};
 for(const [index,member] of own.team.members.entries()){
  const config=configs[member.fighterConfigId],saved=players[index].hp;
  configs[member.fighterConfigId]=Object.freeze({
   ...config,initialHp:saved==null?config.maxHp:Math.min(saved,config.maxHp)
  });
 }
 const nativeFighters=scaled.fighters.map(fighter=>fighter.id===localId
  ?Object.freeze({...fighter,initialHp:configs[own.activeMember.fighterConfigId].initialHp})
  :fighter);
 return attachCaptureEncounterDisplayLevelsV1(Object.freeze({...scaled,
  fighterConfigs:Object.freeze(configs),
  fighters:Object.freeze(nativeFighters)}),{local,opponent,localReserve,opponentReserve});
}

export function buildCaptureEncounterCombatSourceV1({
 local,opponent,localReserve=[],opponentReserve=[],hpMultiplier=1,...options
}={}){
  if(!Array.isArray(localReserve)||!Array.isArray(opponentReserve))
    throw new TypeError('Adventure reserves must be arrays');
  if(localReserve.length||opponentReserve.length)return buildCaptureEncounterRosterSourceV1({
    local,opponent,localReserve,opponentReserve,hpMultiplier,options
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
    profile:options.wildStatProfile,progressionRules:options.progressionRules});
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
    return attachCaptureEncounterDisplayLevelsV1(
      applyCaptureEncounterHpMultiplierV1(Object.freeze({ ...source, exported }), hpMultiplier),
      {local,opponent});
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
  return attachCaptureEncounterDisplayLevelsV1(applyCaptureEncounterHpMultiplierV1(Object.freeze({
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
  }), hpMultiplier),{local,opponent});
}
