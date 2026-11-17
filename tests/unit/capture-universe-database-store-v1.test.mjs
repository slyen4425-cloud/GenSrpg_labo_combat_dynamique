import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureUniverseDatabaseStoreV1,CAPTURE_UNIVERSE_DATABASE_PREFIX_V1}
 from '../../src/contracts/capture-universe-database-store-v1.js';
function storage(){
 const rows=new Map([['gensrpg.combat.capture.legacy','preserved']]);
 return {getItem:k=>rows.get(k)??null,setItem:(k,v)=>rows.set(k,String(v)),
  entries:()=>[...rows.entries()]};
}
const database=()=>({
 schema:'capture-database-v1',version:1,
 statRegistry:{schema:'capture-stat-registry-v1',stats:[
  {id:'physical',label:'Force',damageChannel:'physical',resistanceChannel:null,
   damagePctPerPoint:2,resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0},
  {id:'defense',label:'Défense',damageChannel:null,resistanceChannel:null,
   damagePctPerPoint:0,resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0,
   damageReductionPctPerPoint:1}
 ]},
 progressionRules:{schema:'capture-progression-rules-v1',maxActiveSkills:4,
  slotUnlockSchedule:[{level:1,slots:2},{level:5,slots:3},{level:10,slots:4}]},
 creatures:[],skills:[],metadata:{producer:'universe-test'}
});
const a='unv_00000001',b='unv_00000002';
test('native Combat project stores separate validated databases, old library untouched',()=>{
 const s=storage(),lib=createCaptureUniverseDatabaseStoreV1({storage:s});
 assert.equal(lib.load(a),null);
 const A=lib.create(a,database());
 assert.equal(A.revision,1);assert.equal(A.database.creatures.length,0);
 assert.equal(lib.load(b),null);
 const B=lib.create(b,database());
 assert.equal(B.revision,1);
 const result=lib.save(a,database(),{expectedRevision:1});
 assert.equal(result.revision,2);assert.equal(lib.load(b).revision,1);
 assert.equal(s.getItem('gensrpg.combat.capture.legacy'),'preserved');
 assert.ok(s.getItem(CAPTURE_UNIVERSE_DATABASE_PREFIX_V1+a));
 assert.notEqual(s.getItem(CAPTURE_UNIVERSE_DATABASE_PREFIX_V1+a),
  s.getItem(CAPTURE_UNIVERSE_DATABASE_PREFIX_V1+b));
});
test('native Combat refuses stale writes, collisions, implicit projects and corruption',()=>{
 const s=storage(),lib=createCaptureUniverseDatabaseStoreV1({storage:s});
 assert.throws(()=>lib.save(a,database(),{expectedRevision:1}),/introuvable/);
 lib.create(a,database());
 assert.throws(()=>lib.create(a,database()),/déjà présent/);
 assert.throws(()=>lib.save(a,database(),{expectedRevision:0}),/Conflit/);
 const bytes=s.getItem(CAPTURE_UNIVERSE_DATABASE_PREFIX_V1+a);
 assert.throws(()=>lib.create('manual_bad',database()),/généré/);
 assert.equal(s.getItem(CAPTURE_UNIVERSE_DATABASE_PREFIX_V1+a),bytes);
 s.setItem(CAPTURE_UNIVERSE_DATABASE_PREFIX_V1+a,'invalid json');
 assert.throws(()=>lib.load(a),/corrompu/);
 assert.equal(s.getItem(CAPTURE_UNIVERSE_DATABASE_PREFIX_V1+a),'invalid json');
});
test('explicit copy uses normalized official Combat database, never shares save slots',()=>{
 const s=storage(),lib=createCaptureUniverseDatabaseStoreV1({storage:s});
 lib.create(a,database());
 assert.throws(()=>lib.copy({fromId:a,toId:b}),/confirmation/);
 const B=lib.copy({fromId:a,toId:b,confirmed:true});
 assert.equal(B.projectId,b);assert.equal(B.revision,1);
 lib.save(b,database(),{expectedRevision:1});
 assert.equal(lib.load(a).revision,1);
 assert.equal(lib.load(b).revision,2);
});

test('browser adapter never falls back to global Combat library for another universe',async()=>{
 const {createCaptureUniverseEditorBrowserV1}=await import('../../src/ui/capture-universe-editor-browser-v1.js');
 const storageRef=storage();
 const legacy=createCaptureUniverseEditorBrowserV1({search:'?tab=creature',storage:storageRef});
 assert.equal(legacy.universeId,null);
 assert.equal(legacy.universeStore,null);
 assert.throws(()=>createCaptureUniverseEditorBrowserV1({search:'?universe=unv_00000001',storage:storageRef}),/absente/);
 const owner=createCaptureUniverseDatabaseStoreV1({storage:storageRef});
 owner.create('unv_00000001',database());
 const selected=createCaptureUniverseEditorBrowserV1({search:'?universe=unv_00000001',storage:storageRef});
 assert.equal(selected.universeId,'unv_00000001');
 assert.equal(selected.universeSnapshot.revision,1);
 assert.equal(selected.universeSnapshot.database.creatures.length,0);
 assert.throws(()=>createCaptureUniverseEditorBrowserV1({search:'?universe=invalid',storage:storageRef}),/généré/);
});
test('authoring preview page never accesses browser storage directly',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../../examples/dom-demo/capture-editor-v2.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/localStorage|sessionStorage/);
 assert.match(source,/createCaptureUniverseEditorBrowserV1/);
});
