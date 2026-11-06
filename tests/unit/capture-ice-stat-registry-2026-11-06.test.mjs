import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeCaptureStatRegistryV1} from '../../src/contracts/capture-stat-registry-v1.js';
import {normalizeCaptureCreatureStatValuesV1} from '../../src/contracts/capture-creature-stat-values-v1.js';

const source=JSON.parse(readFileSync(new URL('../../data/capture/monster-capture-stat-registry.v1.json',import.meta.url),'utf8'));

test('Glace is an author-editable official stat, not a private Gorice/Wall stat',()=>{
 const registry=normalizeCaptureStatRegistryV1(source);
 const ids=registry.stats.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length);
 const ice=registry.stats.find(s=>s.id==='glace');
 assert.ok(ice,'missing Glace from the single official Monster Capture stat registry');
 assert.equal(ice.label,'Glace');
 assert.equal(ice.damageChannel,'ice');
 assert.equal(ice.resistanceChannel,'ice');
 assert.equal(ice.damagePctPerPoint,1);
 assert.equal(ice.resistancePctPerPoint,1);
 assert.equal(ice.maxHpPerPoint,0);
 assert.equal(ice.chargeTimeReductionPctPerPoint,0);
});
test('old saved creature stats remain valid and are not silently rewritten',()=>{
 const registry=normalizeCaptureStatRegistryV1(source);
 const old=normalizeCaptureCreatureStatValuesV1({schema:'capture-creature-stat-values-v1',
  creatureId:'legacy',values:{health:100,speed:5,physical:2}},registry);
 assert.deepEqual(Object.keys(old.values),['health','speed','physical']);
 assert.equal(Object.hasOwn(old.values,'glace'),false);
 const newValue=normalizeCaptureCreatureStatValuesV1({schema:'capture-creature-stat-values-v1',
  creatureId:'gorice',values:{health:100,glace:25}},registry);
 assert.equal(newValue.values.glace,25);
 assert.throws(()=>normalizeCaptureCreatureStatValuesV1({schema:'capture-creature-stat-values-v1',
  creatureId:'invalid',values:{not_existing:1}},registry),/unknown stat id/);
});
test('adding the ice stat never deletes, renames or reorders the 15 prior official statistics',()=>{
 const previous=['health','speed','physical','defense','fire','water','earth','air',
  'electric','light','shadow','poison','acier','nature','esprit'];
 assert.deepEqual(source.stats.slice(0,previous.length).map(s=>s.id),previous);
 assert.equal(source.stats.length,previous.length+1);
 assert.equal(source.stats.at(-1).id,'glace');
});
