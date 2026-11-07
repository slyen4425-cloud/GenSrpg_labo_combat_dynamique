import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCaptureCombatCreatureLevelsV1} from '../../src/ui/capture-editor-combat-test-v1.js';

const args={localCreatureIds:['crea_ally'],opponentCreatureIds:['crea_enemy'],previewLevel:20};
test('legacy Combat Tester stays 20 without real game participant levels',()=>{
 const levels=resolveCaptureCombatCreatureLevelsV1(args);
 assert.deepEqual([...levels.entries()],[['crea_ally',20],['crea_enemy',20]]);
});
test('adventure explicit Level 1 is not silently overwritten by Level 20 preview',()=>{
 const options={...args,creatureLevelsById:{crea_ally:1,crea_enemy:4}};
 const levels=resolveCaptureCombatCreatureLevelsV1(options);
 assert.equal(levels.get('crea_ally'),1);
 assert.equal(levels.get('crea_enemy'),4);
 assert.deepEqual(options.creatureLevelsById,{crea_ally:1,crea_enemy:4});
});
test('real battle requires every participant and rejects other species or invalid levels',()=>{
 const bad=[
  {crea_ally:1},{crea_ally:1,crea_enemy:0},
  {crea_ally:Number.MAX_SAFE_INTEGER+1,crea_enemy:1},{crea_ally:1.5,crea_enemy:1},
  {crea_ally:1,crea_enemy:1,unknown:1},
  {crea_ally:'1',crea_enemy:1},null
 ];
 for(const levels of bad)assert.throws(()=>resolveCaptureCombatCreatureLevelsV1({
  ...args,creatureLevelsById:levels
 }));
});
test('multiple active creatures receive independent author-valid levels',()=>{
 const levels=resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:['ally_one','ally_two'],opponentCreatureIds:['enemy_one','enemy_two'],
  creatureLevelsById:{ally_one:1,ally_two:3,enemy_one:7,enemy_two:1}
 });
 assert.equal(levels.get('ally_one'),1);
 assert.equal(levels.get('ally_two'),3);
 assert.equal(levels.get('enemy_one'),7);
 assert.equal(levels.get('enemy_two'),1);
});
test('an exact shared species uses one definition; same-species different-instance levels are not silently claimed',()=>{
 const levels=resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:['same'],opponentCreatureIds:['same'],
  creatureLevelsById:{same:1}
 });
 assert.equal(levels.size,1);
 assert.equal(levels.get('same'),1);
});
