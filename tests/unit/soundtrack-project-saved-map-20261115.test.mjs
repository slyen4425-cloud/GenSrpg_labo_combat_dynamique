import test from 'node:test';
import assert from 'node:assert/strict';
import {SOUNDTRACK_STARTER_CATALOG_V1 as catalog,
 SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1 as starter,
 SOUNDTRACK_STARTER_EXPLORATION_IDS_V1 as exploration
} from '../../src/assets/soundtrack-starter-catalog-v1.js';
import {saveOfficialSoundtrackProjectV1,readOfficialSoundtrackProjectV1,
 SOUNDTRACK_PROJECT_STORE_PREFIX_V1
} from '../../src/contracts/soundtrack-project-local-storage-v1.js';
import {setSoundtrackSceneV1} from '../../src/contracts/soundtrack-project-v1.js';

const store=()=>{const values=new Map();return {
 values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
test('the single SoundtrackProject persists four official Map tracks for Capture/Exploration',()=>{
 const storage=store();
 let edit=setSoundtrackSceneV1(starter,catalog,'capture:exploration:map',{
  music:{tracks:[exploration[2],exploration[0]],order:'sequence',volume:.25,
    fadeMs:0,repeat:false},
  ambience:null
 });
 const result=saveOfficialSoundtrackProjectV1(storage,edit,catalog);
 const restored=readOfficialSoundtrackProjectV1(storage,'capture-demo',catalog);
 assert.deepEqual(restored,result);
 assert.deepEqual(restored.scenes['capture:exploration:map'].music.tracks,[exploration[2],exploration[0]]);
 assert.equal(restored.scenes['capture:combat:normal'].music.tracks.length,6,
  'editing Map never changes the Combat playlist');
 assert.equal(storage.values.size,1);
 assert.equal([...storage.values.keys()][0],SOUNDTRACK_PROJECT_STORE_PREFIX_V1+'capture-demo');
 assert.doesNotMatch([...storage.values.values()][0],/\\.mp3|https?:|blob:/);
});
test('unpublished user MP3s cannot become silently broken persistent Map tracks',()=>{
 const storage=store();
 const user={assetId:'user:music:custom0001',kind:'music',origin:'user',title:'temporaire'};
 const expanded={...catalog,assets:[...catalog.assets,user]};
 const edit=setSoundtrackSceneV1(starter,expanded,'capture:exploration:map',{
  music:{tracks:[user.assetId],order:'sequence',volume:.5,fadeMs:0,repeat:true},
  ambience:null
 });
 assert.throws(()=>saveOfficialSoundtrackProjectV1(storage,edit,expanded),/temporaire/);
 assert.equal(storage.values.size,0,'failed save does not modify stored project');
});
test('corrupted project cannot replace the default or another game',()=>{
 const storage=store();
 storage.setItem(SOUNDTRACK_PROJECT_STORE_PREFIX_V1+'capture-demo','{"broken":true}');
 assert.throws(()=>readOfficialSoundtrackProjectV1(storage,'capture-demo',catalog));
 assert.equal(readOfficialSoundtrackProjectV1(storage,'other-game',catalog),null);
});
