import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatSession} from '../../src/core/combat/combat-session.js';
import {createRosterSession} from '../../src/core/combat/roster-session.js';
import {normalizeCaptureTrainerDifficultyPolicyV1,applyCaptureTrainerDifficultyPolicyV1,projectCaptureEmbeddedTrainerFightersV1,projectCaptureEmbeddedTrainerSourceV1} from '../../src/adapters/input/capture/capture-trainer-difficulty-policy-v1.js';

const policy={schema:'capture-trainer-difficulty-policy-v1',version:1,levels:[
 {level:1,hpMultiplier:1,outgoingDamagePctBonus:0},
 {level:2,hpMultiplier:1.2,outgoingDamagePctBonus:5},
 {level:3,hpMultiplier:1.5,outgoingDamagePctBonus:10},
 {level:4,hpMultiplier:2,outgoingDamagePctBonus:20}
]};
function source(){
 const teamOf=id=>id==='player'?'player-team':'enemy-team';
 return {battleFormat:{localActorId:'player',actors:[{actorId:'player'},{actorId:'opponent'}],teamOf},
  fighters:[{id:'player',maxHp:100,initialHp:72,maxEnergy:10},
   {id:'opponent',maxHp:50,initialHp:40,maxEnergy:10,outgoingDamagePct:3}],
  roster:{teams:{player:{members:[{id:'p'}]},opponent:{members:[{id:'o'}]}}},
  fighterConfigs:{'crea-shared':{maxHp:50}},skills:{},skillIdsByActor:{}};
}
test('no implicit difficulty: requires four explicitly authored, distinct levels',()=>{
 assert.throws(()=>normalizeCaptureTrainerDifficultyPolicyV1({schema:policy.schema,version:1,levels:[policy.levels[0]]}),/four|4|levels/i);
 assert.throws(()=>normalizeCaptureTrainerDifficultyPolicyV1({...policy,levels:policy.levels.map(x=>({...x,hpMultiplier:1,outgoingDamagePctBonus:0}))}),/measurable|distinct|different/i);
 assert.throws(()=>normalizeCaptureTrainerDifficultyPolicyV1({...policy,levels:[policy.levels[0],policy.levels[1],policy.levels[1],policy.levels[3]]}),/duplicate|levels/i);
 assert.equal(normalizeCaptureTrainerDifficultyPolicyV1(policy).levels.length,4);
});
test('trainer level 3 changes ONLY opponent native fighter HP and damage, never same species/player or input',()=>{
 const original=source(),before=structuredClone(original.fighters);
 const applied=applyCaptureTrainerDifficultyPolicyV1({nativeCombatSource:original,trainerDifficulty:3,policy});
 assert.equal(applied.nativeCombatSource.fighters[0].maxHp,100);
 assert.equal(applied.nativeCombatSource.fighters[0].initialHp,72);
 assert.equal(applied.nativeCombatSource.fighters[1].maxHp,75);
 assert.equal(applied.nativeCombatSource.fighters[1].initialHp,60);
 assert.equal(applied.nativeCombatSource.fighters[1].outgoingDamagePct,13);
 assert.equal(applied.nativeCombatSource.fighterConfigs,original.fighterConfigs);
 assert.deepEqual(original.fighters,before);
 assert.deepEqual(applied.appliedTrainerDifficulty.opponentActorIds,['opponent']);
 assert.equal(applied.appliedTrainerDifficulty.level,3);
});
test('all four authored levels produce different real native opponent fighter configurations',()=>{
 const signatures=policy.levels.map(x=>{
  const result=applyCaptureTrainerDifficultyPolicyV1({nativeCombatSource:source(),trainerDifficulty:x.level,policy});
  return JSON.stringify(result.nativeCombatSource.fighters[1]);
 });
 assert.equal(new Set(signatures).size,4);
});
test('fail closed on missing policy, invalid level, NPC reserves, malformed actors and unsafe numbers',()=>{
 assert.throws(()=>applyCaptureTrainerDifficultyPolicyV1({nativeCombatSource:source(),trainerDifficulty:2}),/policy|object/i);
 assert.throws(()=>applyCaptureTrainerDifficultyPolicyV1({nativeCombatSource:source(),trainerDifficulty:0,policy}),/difficulty|level/i);
 const reserved=source();reserved.roster.teams.opponent.members.push({id:'bench'});
 assert.throws(()=>applyCaptureTrainerDifficultyPolicyV1({nativeCombatSource:reserved,trainerDifficulty:2,policy}),/reserve|roster/i);
 const bad=source();bad.fighters[1].maxHp=Infinity;
 assert.throws(()=>applyCaptureTrainerDifficultyPolicyV1({nativeCombatSource:bad,trainerDifficulty:2,policy}),/maxHp|finite/i);
});

test('the projected opponent stats reach the real native CombatSession, not just a display model',()=>{
 const projection=applyCaptureTrainerDifficultyPolicyV1({nativeCombatSource:source(),trainerDifficulty:4,policy});
 const session=createCombatSession({distance:'medium',fighters:projection.nativeCombatSource.fighters});
 const fighters=session.snapshot().fighters;
 assert.equal(fighters.player.maxHp,100);
 assert.equal(fighters.opponent.maxHp,100);
 assert.equal(fighters.opponent.outgoingDamagePct,23);
 assert.equal(fighters.opponent.hp,80);
});

test('native embedded mount uses only signed Lab policy to project trainer stats into CombatSession',()=>{
 const base=source();
 const withSavedHp=base.fighters.map(f=>({...f,initialHp:f.id==='player'?72:40}));
 const args={battleFormat:base.battleFormat,fighters:withSavedHp,roster:base.roster,
  trainerDifficultyPolicy:policy,embeddedBattle:{trainerDifficulty:3}};
 const fighters=projectCaptureEmbeddedTrainerFightersV1(args);
 const session=createCombatSession({distance:'medium',fighters});
 const actual=session.snapshot().fighters;
 assert.equal(actual.player.hp,72);
 assert.equal(actual.player.maxHp,100);
 assert.equal(actual.opponent.hp,60);
 assert.equal(actual.opponent.maxHp,75);
 assert.equal(actual.opponent.outgoingDamagePct,13);
 assert.equal(withSavedHp[1].maxHp,50);
 const wild=projectCaptureEmbeddedTrainerFightersV1({...args,embeddedBattle:{initialHpByActor:{player:72,opponent:40}}});
 assert.equal(wild,withSavedHp,'wild remains byte-identical without NPC level');
 assert.throws(()=>projectCaptureEmbeddedTrainerFightersV1({
  ...args,trainerDifficultyPolicy:null,
  embeddedBattle:{trainerDifficulty:3,trainerDifficultyPolicy:policy}
 }),/Signed Combat Lab author/i,'World cannot inject fake modifiers');
});
test('the real native Combat mount wires the authored NPC projection before createCombatSession',async()=>{
 const fs=await import('node:fs');
 const ui=fs.readFileSync(new URL('../../src/ui/combat-2v2-test-ui.js',import.meta.url),'utf8');
 const call=ui.indexOf('const nativeFighters = projectCaptureEmbeddedTrainerFightersV1(');
 const session=ui.indexOf('const session = createCombatSession(');
 assert.ok(call>=0&&session>call,'NPC modifiers must reach the real session, not a display-only view');
 assert.match(ui,/trainerDifficultyPolicy: input\.trainerDifficultyPolicy \?\? null/);
});


test('trainer reserve members inherit the same native Lab policy after a real roster switch, without modifying the player species',()=>{
 const base=source();
 const fighterConfigs={
  'crea-shared':{id:'crea-shared',maxHp:50,initialHp:50,maxEnergy:10},
  'crea-reserve':{id:'crea-reserve',maxHp:30,initialHp:30,maxEnergy:10}
 };
 const roster={teams:{
  player:{slotId:'player',activeMemberId:'p',members:[{id:'p',creatureId:'crea-shared',displayName:'Joueur',fighterConfigId:'crea-shared'}]},
  opponent:{slotId:'opponent',activeMemberId:'o',members:[
   {id:'o',creatureId:'crea-shared',displayName:'PNJ',fighterConfigId:'crea-shared'},
   {id:'o2',creatureId:'crea-reserve',displayName:'Réserve PNJ',fighterConfigId:'crea-reserve'}
  ]}
 }};
 const native=projectCaptureEmbeddedTrainerSourceV1({
  battleFormat:base.battleFormat,fighters:base.fighters,roster,fighterConfigs,
  trainerDifficultyPolicy:policy,embeddedBattle:{trainerDifficulty:3}
 });
 assert.equal(native.fighters[0].maxHp,100);
 assert.equal(native.fighters[1].maxHp,75);
 assert.equal(fighterConfigs['crea-shared'].maxHp,50,'the shared species source remains untouched');
 assert.equal(native.roster.teams.player,roster.teams.player,'local roster must retain original identity');
 const active=native.roster.teams.opponent.members[0];
 const reserve=native.roster.teams.opponent.members[1];
 assert.notEqual(active.fighterConfigId,'crea-shared');
 assert.notEqual(reserve.fighterConfigId,'crea-reserve');
 assert.equal(native.fighterConfigs[active.fighterConfigId].maxHp,75);
 assert.equal(native.fighterConfigs[reserve.fighterConfigId].maxHp,45);
 assert.equal(native.fighterConfigs[reserve.fighterConfigId].outgoingDamagePct,10);
 const session=createCombatSession({distance:'medium',fighters:native.fighters});
 const rosterSession=createRosterSession({
  combatSession:session,roster:native.roster,fighterConfigs:native.fighterConfigs,
  battleFormat:base.battleFormat,recallCooldownMs:45000
 });
 assert.equal(rosterSession.snapshot().opponent.members[1].maxHp,45);
 assert.equal(rosterSession.switchMember('opponent','o2').ok,true);
 assert.equal(session.snapshot().fighters.opponent.maxHp,45);
 assert.equal(session.snapshot().fighters.opponent.outgoingDamagePct,10);
 assert.equal(session.snapshot().fighters.player.maxHp,100);
});

test('trainer reserve refuses missing native configs; wild retains exact native references',()=>{
 const base=source();
 const wild=projectCaptureEmbeddedTrainerSourceV1({
  battleFormat:base.battleFormat,fighters:base.fighters,roster:base.roster,
  fighterConfigs:base.fighterConfigs,embeddedBattle:{}
 });
 assert.equal(wild.fighters,base.fighters);
 assert.equal(wild.roster,base.roster);
 assert.equal(wild.fighterConfigs,base.fighterConfigs);
 const roster={teams:{opponent:{slotId:'opponent',activeMemberId:'o',members:[
  {id:'o',creatureId:'same',displayName:'PNJ',fighterConfigId:'same'},
  {id:'bench',creatureId:'unknown',displayName:'Réserve',fighterConfigId:'unknown'}
 ]}}};
 assert.throws(()=>projectCaptureEmbeddedTrainerSourceV1({
  battleFormat:base.battleFormat,fighters:base.fighters,roster,
  fighterConfigs:base.fighterConfigs,trainerDifficultyPolicy:policy,
  embeddedBattle:{trainerDifficulty:2}
 }),/config|unknown|reserve/i);
});
