import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeCaptureCombatExportV1} from '../../src/contracts/capture-combat-export-v1.js';
import {adaptCaptureCombatExportStackV1} from '../../src/adapters/input/capture/capture-export-adapter-stack-v1.js';
import {normalizeCaptureTrainerDifficultyPolicyV1} from '../../src/adapters/input/capture/capture-trainer-difficulty-policy-v1.js';

// Test values are fixtures only. No author coefficients are published by this test.
const policy={schema:'capture-trainer-difficulty-policy-v1',version:1,levels:[
 {level:1,hpMultiplier:1,outgoingDamagePctBonus:0},
 {level:2,hpMultiplier:1.2,outgoingDamagePctBonus:5},
 {level:3,hpMultiplier:1.5,outgoingDamagePctBonus:10},
 {level:4,hpMultiplier:2,outgoingDamagePctBonus:20}
]};
function baseExport(){
 return {
  schema:'capture-combat-export-v1',
  battle:{id:'trainer-test',localActorId:'player',skillSpeedMultiplier:1},
  teams:{'player-team':['player'],'enemy-team':['opponent']},
  actors:[
   {actorId:'player',teamId:'player-team',creatureId:'same',displayName:'Joueur',controllerId:'human-local'},
   {actorId:'opponent',teamId:'enemy-team',creatureId:'same',displayName:'PNJ',controllerId:'ai-enemy'}
  ],
  creatures:[{id:'same',displayName:'Espèce partagée',combat:{maxHp:50,maxEnergy:10},skillIds:[],elements:[],resistances:[]}],
  skills:[],rosters:[],presentation:{},metadata:{}
 };
}
test('TDD: signed explicit trainer policy survives the official export contract and native adapter',()=>{
 const raw=baseExport();
 const signed={...raw,battle:{...raw.battle,trainerDifficultyPolicy:policy}};
 const normalized=normalizeCaptureCombatExportV1(signed);
 assert.deepEqual(normalized.battle.trainerDifficultyPolicy,normalizeCaptureTrainerDifficultyPolicyV1(policy));
 const native=adaptCaptureCombatExportStackV1(normalized);
 assert.deepEqual(native.trainerDifficultyPolicy,normalizeCaptureTrainerDifficultyPolicyV1(policy));
 assert.equal(native.battleFormat.actors.length,2);
 assert.equal(native.fighters[0].maxHp,50);
 assert.equal(native.fighters[1].maxHp,50,'difficulty is applied only inside native session, not during export');
});
test('wild export has no implicit trainer policy; invalid author policy is refused',()=>{
 const original=baseExport();
 const wild=adaptCaptureCombatExportStackV1(original);
 assert.equal(Object.hasOwn(wild,'trainerDifficultyPolicy'),false);
 assert.equal(Object.hasOwn(normalizeCaptureCombatExportV1(original).battle,'trainerDifficultyPolicy'),false);
 const malformed={...policy,levels:policy.levels.slice(0,3)};
 assert.throws(()=>adaptCaptureCombatExportStackV1({
  ...original,battle:{...original.battle,trainerDifficultyPolicy:malformed}
 }),/four|4|level|policy/i);
});
test('V3 author exporter explicitly accepts and carries only a supplied policy',()=>{
 const file=readFileSync(new URL('../../src/adapters/input/capture/capture-editor-exporter-v3.js',import.meta.url),'utf8');
 assert.match(file,/"trainerDifficultyPolicy"/);
 assert.match(file,/normalizeCaptureTrainerDifficultyPolicyV1/);
 assert.match(file,/battle:\s*\{/);
});
