import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSoundtrackLocalMediaV1} from '../../src/assets/soundtrack-local-media-v1.js';
import {SOUNDTRACK_STARTER_CATALOG_V1 as starter} from '../../src/assets/soundtrack-starter-catalog-v1.js';
import {saveSoundtrackAuthoringSceneV1} from '../../src/ui/soundtrack-editor-v1.js';
import {createEmptySoundtrackProjectV1,normalizeSoundtrackCatalogV1,normalizeSoundtrackProjectV1}
 from '../../src/contracts/soundtrack-project-v1.js';
const mp3=name=>({name,size:4567,type:'audio/mpeg'});

test('a creator imports arbitrary MP3 into the ONE existing music catalog and can choose it in all four scenes',()=>{
 const revoked=[];
 let sequence=0;
 const media=createSoundtrackLocalMediaV1({catalog:starter,allowCustom:true,
  createId:()=> 'uuid'+String(++sequence).padStart(8,'0'),
  createObjectURL:file=>'blob:creator/'+file.name,
  revokeObjectURL:url=>revoked.push(url)
 });
 const first=media.importFiles([mp3('Mon générique.mp3')]);
 assert.equal(first.newAssets.length,1);
 assert.equal(first.imported.length,1);
 const userAsset=first.newAssets[0];
 assert.equal(userAsset.origin,'user');
 assert.equal(userAsset.title,'Mon générique');
 assert.ok(userAsset.assetId.startsWith('user:music:'));
 const again=media.importFiles([mp3('Mon générique.mp3')]);
 assert.equal(again.newAssets.length,0,'same filename replaces, not duplicates');
 assert.equal(again.imported[0],userAsset.assetId);
 assert.equal(media.customAssets().length,1);
 assert.equal(media.status().ready,1);
 assert.equal(revoked.length,1,'previous object URL revoked');
 const catalog=normalizeSoundtrackCatalogV1({...starter,assets:[...starter.assets,...first.newAssets]});
 let project=createEmptySoundtrackProjectV1('test-game');
 const scenes=['capture:combat:victory','capture:combat:defeat','capture:combat:normal','capture:exploration:map'];
 for(const scene of scenes) project=saveSoundtrackAuthoringSceneV1(project,catalog,scene,'music',
   {tracks:[userAsset.assetId],order:'sequence',volume:.7,fadeMs:500,repeat:false});
 const saved=normalizeSoundtrackProjectV1(JSON.parse(JSON.stringify(project)),catalog);
 for(const scene of scenes) assert.deepEqual(saved.scenes[scene].music.tracks,[userAsset.assetId]);
 assert.ok(media.runtimeAsset(userAsset.assetId).url.startsWith('blob:creator/'));
 media.dispose();
 assert.equal(revoked.length,2,'the current object URL is also cleaned up');
});

test('import is atomic on unknown formats, empty files and duplicate batch names',()=>{
 const media=createSoundtrackLocalMediaV1({catalog:starter,allowCustom:true,
  createId:()=> 'uuid123456789',
  createObjectURL:file=>'blob:'+file.name,
  revokeObjectURL(){}});
 assert.throws(()=>media.importFiles([{name:'bad.pdf',size:100,type:'application/pdf'}]),/MP3/);
 assert.throws(()=>media.importFiles([{name:'vide.mp3',size:0,type:'audio/mpeg'}]),/vide/);
 assert.throws(()=>media.importFiles([mp3('son.mp3'),mp3('son.mp3')]),/double/);
 assert.equal(media.status().ready,0);
 assert.equal(media.customAssets().length,0);
 media.dispose();
});

test('one visible music import, exactly four context tabs, and advanced JSON options',()=>{
 const html=readFileSync(new URL('../../examples/dom-demo/capture-editor-v2.html',import.meta.url),'utf8');
 const root=html.slice(html.indexOf('data-editor-panel="music"'),html.indexOf('data-editor-panel="creature"'));
 const tabs=[...root.matchAll(/data-soundtrack-quick-scene="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(tabs,['capture:combat:victory','capture:combat:defeat',
  'capture:combat:normal','capture:exploration:map']);
 assert.equal((root.match(/data-soundtrack-local-files/g)||[]).length,1);
 assert.match(root,/soundtrack-advanced/);
 assert.match(root,/type="hidden" data-soundtrack-scene-id/,'no manual scene IDs');
 assert.match(root,/role="tablist"/);
 const author=readFileSync(new URL('../../src/ui/soundtrack-editor-v1.js',import.meta.url),'utf8');
 const boot=readFileSync(new URL('../../examples/dom-demo/capture-editor-v2.js',import.meta.url),'utf8');
 assert.match(author,/commitScene\(\);\s*el\.scene\.value=quick\.dataset\.soundtrackQuickScene/);
 assert.match(author,/addImportedAssets/);
 assert.match(boot,/soundtrackEditor\.addImportedAssets\(imported\)/);
 assert.doesNotMatch(root,/Importer un son personnel|Remplacer temporairement les MP3/);
});
