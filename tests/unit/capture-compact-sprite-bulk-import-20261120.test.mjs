import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareCreatorVisualImportV1,orderCreatorFramesV1} from '../../src/assets/creator-visual-strip-import-v1.js';
import {createCreatorVisualAssetSessionV1} from '../../src/assets/creator-visual-asset-session-v1.js';
import {captureEditorAssetMatchesRoleV1} from '../../src/ui/capture-editor-human-v2.js';

const file=(name,w=64,h=64,type='image/png')=>({name,type,size:100,width:w,height:h});
function mocks(){
 const draws=[],closed=[],canvas={width:0,height:0,
  getContext:()=>({drawImage:(_bmp,x,y)=>draws.push({x,y})}),
  toBlob:done=>done(new Blob(['sprite-pixels'],{type:'image/png'}))};
 return {draws,closed,canvas,
  decode:async f=>({width:f.width,height:f.height,close:()=>closed.push(f.name)}),
  canvasFactory:()=>canvas};
}
test('one still image remains one-frame and a horizontal atlas validates exact cell width',async()=>{
 const mock=mocks();
 const still=await prepareCreatorVisualImportV1({files:[file('statique.webp',200,128,'image/webp')],decode:mock.decode});
 assert.equal(still.frameCount,1);
 assert.equal(still.frameWidth,200);
 assert.equal(still.source,'sheet');
 const sheet=await prepareCreatorVisualImportV1({
  files:[file('mouvement.png',600,96)],stripFrames:12,decode:mock.decode});
 assert.deepEqual([sheet.frameCount,sheet.frameWidth,sheet.frameHeight],[12,50,96]);
 await assert.rejects(prepareCreatorVisualImportV1({
  files:[file('bad.png',601,96)],stripFrames:12,decode:mock.decode
 }),/divisible/);
 assert.equal(mock.closed.length,3);
});
test('bulk frames sort filename 01,02,10 naturally and use a SINGLE RGBA canvas strip',async()=>{
 const mock=mocks();
 const frames=[file('frame_10.png',48,64),file('frame_02.png',48,64),file('frame_01.png',48,64)];
 assert.deepEqual(orderCreatorFramesV1(frames).map(f=>f.name),['frame_01.png','frame_02.png','frame_10.png']);
 const imported=await prepareCreatorVisualImportV1({
  files:frames,decode:mock.decode,canvasFactory:mock.canvasFactory});
 assert.equal(imported.frameCount,3);
 assert.equal(imported.frameWidth,48);
 assert.equal(mock.canvas.width,144);assert.equal(mock.canvas.height,64);
 assert.deepEqual(mock.draws,[{x:0,y:0},{x:48,y:0},{x:96,y:0}]);
 assert.deepEqual(mock.closed,['frame_01.png','frame_02.png','frame_10.png']);
 assert.equal(imported.file.type,'image/png');
 assert.match(imported.file.name,/3f\.png$/);
});
test('partial or hostile creator imports fail before publication, every Bitmap is closed',async()=>{
 const invalid=mocks();
 await assert.rejects(prepareCreatorVisualImportV1({
  files:[file('one.png',64,64),file('two.png',63,64)],
  decode:invalid.decode,canvasFactory:invalid.canvasFactory
 }),/même largeur/);
 assert.equal(invalid.closed.length,2);
 await assert.rejects(prepareCreatorVisualImportV1({
  files:[file('script.svg',64,64,'image/svg+xml')],decode:invalid.decode
 }),/PNG, WebP ou JPEG/);
 await assert.rejects(prepareCreatorVisualImportV1({
  files:[file('many.png')],stripFrames:33,decode:invalid.decode
 }),/Nombre de frames invalide/);
 await assert.rejects(prepareCreatorVisualImportV1({
  files:[file('oversized.png',20000,64)],decode:invalid.decode
 }),/trop grande/);
 assert.equal(invalid.closed.length,4);
});
test('new private AssetDefinition metadata enables the ONE existing animation selector',()=>{
 const user=createCreatorVisualAssetSessionV1({
  createObjectURL:f=>'blob:owner/'+f.name,
  revokeObjectURL:()=>{},
  createId:(()=>{let n=0;return()=>String(++n);})()
 });
 const movement=user.importImage({
  file:file('mouvement.png'),label:'Course',role:'movement',frameCount:12,frameMs:80
 });
 assert.equal(movement.assetType,'sprite');
 assert.equal(movement.resource.frameCount,12);
 assert.equal(movement.resource.frameMs,80);
 assert.equal(captureEditorAssetMatchesRoleV1(movement,'movement'),true);
 assert.equal(captureEditorAssetMatchesRoleV1(movement,'attack'),false);
 const attack=user.importImage({
  file:file('attaque.png'),label:'Frappe',role:'attack',frameCount:8
 });
 assert.equal(captureEditorAssetMatchesRoleV1(attack,'attack'),true);
 const effect=user.importImage({
  file:file('projectile.png'),label:'Rayon',role:'travel',frameCount:16
 });
 assert.equal(captureEditorAssetMatchesRoleV1(effect,'travel'),true);
 assert.equal(user.list().length,3);
 assert.throws(()=>user.importImage({
  file:file('un-frame.png'),role:'movement',frameCount:1
 }),/au moins deux frames/);
 assert.throws(()=>user.importImage({
  file:file('bad-icon.png'),role:'icon',frameCount:10
 }),/une seule image/);
 user.dispose();
});
test('real Capture editor reuses two discreet collapsible import panels, and no ZIP or painting UI',async()=>{
 const html=await readFile(new URL('../../examples/dom-demo/capture-editor-v2.html',import.meta.url),'utf8');
 const js=await readFile(new URL('../../src/ui/capture-editor-human-v2.js',import.meta.url),'utf8');
 const css=await readFile(new URL('../../examples/dom-demo/capture-editor-v2.css',import.meta.url),'utf8');
 assert.equal((html.match(/<details class="creator-visual-import" data-creator-visual-importer/g)??[]).length,2);
 assert.equal((html.match(/<input type="file" accept="image\/png,image\/webp,image\/jpeg" multiple data-creator-visual-file>/g)??[]).length,2);
 assert.equal((html.match(/data-creator-visual-preview-wrap hidden>/g)??[]).length,2);
 assert.equal((html.match(/data-creator-visual-frames>/g)??[]).length,2);
 assert.equal((html.match(/data-creator-visual-frame-ms>/g)??[]).length,2);
 assert.match(js,/prepareCreatorVisualImportV1\(\{files,stripFrames:count\}\)/);
 assert.match(js,/creatorVisualAssets\.importImage\(\{/);
 assert.match(js,/frameCount:candidate\.frameCount,frameMs/);
 assert.match(css,/details\.creator-visual-import\s*\{/);
 assert.doesNotMatch(html,/<details class="creator-visual-import"[^>]*\sopen\b/);
 assert.doesNotMatch(html,/data-creator-visual-zip|data-creator-sprite-painter/);
});
