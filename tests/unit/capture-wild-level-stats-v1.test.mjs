import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allocateCaptureWildLevelStatsV1 as allocate} from '../../src/adapters/input/capture/capture-wild-level-stats-v1.js';
const registry=JSON.parse(readFileSync(new URL('../../data/capture/monster-capture-stat-registry.v1.json',import.meta.url),'utf8'));
const args={statRegistry:registry,baseStatValues:{health:20,defense:12,speed:8,fire:15,water:1},attackChannels:['fire']};
test('level one has no extra stats; level ten receives exactly 180 official points',()=>{
 assert.deepEqual(allocate({...args,level:1}),{});
 const bonus=allocate({...args,level:10});
 assert.equal(Object.values(bonus).reduce((a,b)=>a+b,0),180);
 assert.ok(bonus.health>0&&bonus.defense>0&&bonus.speed>0&&bonus.fire>0);
 assert.equal(bonus.water,undefined,'unused elements must not receive points');
 assert.deepEqual(allocate({...args,level:10}),bonus,'stable and repeatable');
 assert.equal(Object.isFrozen(bonus),true);
});
test('species strengths change allocation; no mutation of source',()=>{
 const weak=allocate({...args,level:10,baseStatValues:{health:1,defense:1,speed:1,fire:1}});
 const strong=allocate({...args,level:10});
 assert.ok(strong.health>weak.health);
 assert.equal(args.baseStatValues.health,20);
});
test('custom elemental channels work through official registry, no hardcoded element names',()=>{
 const custom={schema:'capture-stat-registry-v1',stats:[
  {id:'health',label:'PV',damageChannel:null,resistanceChannel:null},
  {id:'speed',label:'Vitesse',damageChannel:null,resistanceChannel:null},
  {id:'defense',label:'Défense',damageChannel:null,resistanceChannel:null},
  {id:'frost',label:'Givre',damageChannel:'ice',resistanceChannel:'ice'}]};
 const b=allocate({level:4,statRegistry:custom,attackChannels:['ice']});
 assert.equal(Object.values(b).reduce((a,c)=>a+c,0),60);
 assert.ok(b.frost>0);
});
test('reject invalid level, budget, unknown stat and channel shape',()=>{
 assert.throws(()=>allocate({...args,level:0}),/level/);
 assert.throws(()=>allocate({...args,level:10,pointsPerLevel:-1}),/pointsPerLevel/);
 assert.throws(()=>allocate({...args,level:10,baseStatValues:{unknown:1}}),/unknown/);
 assert.throws(()=>allocate({...args,level:10,attackChannels:[42]}),/attackChannels/);
});
