import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatSession} from '../../src/core/combat/combat-session.js';
import {normalizeCaptureTrainerDifficultyPolicyV1,applyCaptureTrainerDifficultyPolicyV1} from '../../src/adapters/input/capture/capture-trainer-difficulty-policy-v1.js';

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
