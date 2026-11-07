import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCaptureCombatCreatureLevelsV1} from '../../src/ui/capture-editor-combat-test-v1.js';
import {buildCaptureEncounterCombatSourceV1} from '../../src/ui/capture-encounter-combat-source-v1.js';

test('official Combat preview projection has no hard level 100 cap',()=>{
 for(const level of [101,250,1500,1_000_000]){
  const levels=resolveCaptureCombatCreatureLevelsV1({
   localCreatureIds:['lumilo'],opponentCreatureIds:['venombre'],
   creatureLevelsById:{lumilo:level,venombre:1}
  });
  assert.equal(levels.get('lumilo'),level);
  assert.equal(levels.get('venombre'),1);
 }
});
test('explicit Combat preview levels are also not capped at 100',()=>{
 const levels=resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:['lumilo'],opponentCreatureIds:['venombre'],previewLevel:250
 });
 assert.equal(levels.get('lumilo'),250);
});
test('invalid participant levels are rejected safely in the actual native encounter path',()=>{
 const local={speciesId:'lumilo',level:1};
 for(const invalid of [0,-1,2.5,Number.NaN,Number.POSITIVE_INFINITY,Number.MAX_SAFE_INTEGER+1]){
  assert.throws(()=>buildCaptureEncounterCombatSourceV1({local,
   opponent:{speciesId:'venombre',level:invalid}}),/level/i);
 }
});
