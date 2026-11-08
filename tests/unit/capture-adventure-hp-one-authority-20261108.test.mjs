import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  projectCaptureEncounterMaxHpV1,
  applyCaptureEncounterHpMultiplierV1
} from '../src/ui/capture-encounter-combat-source-v1.js';

test('one Combat-owned HP calculation drives both native fighters and read-only Adventure sheets',()=>{
 for(const [raw,ratio,expected] of [
  [140,0.25,35],[187,0.25,47],[140,0.5,70],[140,1,140],
  [1,0.01,1],[0,0.25,0],[141,0.25,36]
 ]) {
  assert.equal(projectCaptureEncounterMaxHpV1(raw,ratio),expected);
  const native=applyCaptureEncounterHpMultiplierV1({
   fighterConfigs:{creature:{maxHp:raw}},
   fighters:[{id:'local-1',maxHp:raw},{id:'opponent-1',maxHp:raw}]
  },ratio);
  assert.equal(native.fighters[0].maxHp,expected);
  assert.equal(native.fighterConfigs.creature.maxHp,expected);
  assert.equal(native.fighters[1].maxHp,expected);
 }
});
test('HP rounding rejects impossible totals/percentages, and the Tester keeps untouched originals',()=>{
 const original={fighterConfigs:{one:{maxHp:140}},
  fighters:[{id:'local-1',maxHp:140}]};
 assert.equal(applyCaptureEncounterHpMultiplierV1(original,1),original);
 for(const amount of [-1,Infinity,NaN])assert.throws(
  ()=>projectCaptureEncounterMaxHpV1(amount,0.25),/HP|PV|finite|non-negative/i);
 for(const ratio of [0,-0.1,1.001,NaN,Infinity])assert.throws(
  ()=>projectCaptureEncounterMaxHpV1(140,ratio),/multiplier|HP/i);
 assert.equal(original.fighters[0].maxHp,140);
});
test('Combat HUD reads session maxHp rather than raw author PV or statValues',()=>{
 const hud=readFileSync(new URL('../src/ui/combat-2v2-test-ui.js',import.meta.url),'utf8');
 assert.match(hud,/refs\.bar\.max\s*=\s*fighter\.maxHp/);
 assert.match(hud,/\$\{Math\.round\(fighter\.hp\)\}\s*\/\s*\$\{Math\.round\(fighter\.maxHp\)\} PV/);
});
