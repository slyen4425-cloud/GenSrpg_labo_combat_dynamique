import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 validateCaptureCreatorSpriteMetadataV1,MAX_CREATOR_SPRITE_BYTES_V1,
 createCaptureCreatorSpriteStoreV1
} from '../../src/assets/capture-creator-sprite-persistent-store-v1.js';
import {
 createCaptureCreatorSpriteRoomManifestV1,
 validateCaptureCreatorSpriteRoomManifestV1,
 CAPTURE_CREATOR_SPRITE_ROOM_MANIFEST_V1
} from '../../src/assets/capture-creator-sprite-room-manifest-v1.js';
import {createCreatorVisualAssetSessionV1} from '../../src/assets/creator-visual-asset-session-v1.js';
import {captureEditorAssetMatchesRoleV1} from '../../src/ui/capture-editor-human-v2.js';
const room='22222222-2222-4222-8222-222222222222';
const alice='11111111-1111-4111-8111-111111111111';
const bob='33333333-3333-4333-8333-333333333333';
const digest='a'.repeat(64);
const sprite={scopeId:'unv_example1234',id:'user:abc123',assetId:'user:abc123',
 label:'Course personnalisée',role:'movement',mime:'image/png',
 bytes:4096,frameCount:12,frameMs:80,sha256:digest};
test('durable record validates scope, 24MiB/file, 32 frames and disallows executable media',()=>{
 assert.equal(validateCaptureCreatorSpriteMetadataV1(sprite).role,'movement');
 assert.throws(()=>validateCaptureCreatorSpriteMetadataV1({...sprite,scopeId:''}),/univers/);
 assert.throws(()=>validateCaptureCreatorSpriteMetadataV1({...sprite,assetId:'pack:official'}),/personnel/);
 assert.throws(()=>validateCaptureCreatorSpriteMetadataV1({...sprite,mime:'image/svg+xml'}),/interdit/);
 assert.throws(()=>validateCaptureCreatorSpriteMetadataV1({...sprite,bytes:MAX_CREATOR_SPRITE_BYTES_V1+1}),/24 Mio/);
 assert.throws(()=>validateCaptureCreatorSpriteMetadataV1({...sprite,frameCount:33}),/32 frames/);
 assert.throws(()=>validateCaptureCreatorSpriteMetadataV1({...sprite,role:'creature'}),/fixe/);
 assert.throws(()=>createCaptureCreatorSpriteStoreV1({indexedDBFactory:null}),/IndexedDB/);
});
test('room manifest has only tiny metadata, requires explicit consent and exact room/member identity',()=>{
 assert.throws(()=>createCaptureCreatorSpriteRoomManifestV1({
  roomId:room,authorUserId:alice,records:[sprite]}),/confirmation explicite/);
 const shared=createCaptureCreatorSpriteRoomManifestV1({
  roomId:room,authorUserId:alice,confirmed:true,records:[sprite]});
 assert.equal(shared.schema,CAPTURE_CREATOR_SPRITE_ROOM_MANIFEST_V1);
 assert.equal(shared.assets.length,1);
 assert.equal(shared.assets[0].sha256,digest);
 assert.deepEqual(Object.keys(shared.assets[0]).sort(),
  ['assetId','bytes','frameCount','frameMs','mime','role','sha256'].sort());
 assert.doesNotMatch(JSON.stringify(shared),/blob:|data:image|storage_path|scopeId|file|originalName|url/);
 assert.deepEqual(validateCaptureCreatorSpriteRoomManifestV1(shared,{
  expectedRoomId:room,expectedAuthorUserId:alice}),shared);
 assert.throws(()=>validateCaptureCreatorSpriteRoomManifestV1(shared,{
  expectedRoomId:room,expectedAuthorUserId:bob}),/autre salon ou joueur/);
 assert.throws(()=>validateCaptureCreatorSpriteRoomManifestV1(shared,{
  expectedRoomId:alice,expectedAuthorUserId:alice}),/autre salon ou joueur/);
 assert.throws(()=>validateCaptureCreatorSpriteRoomManifestV1({
  ...shared,assets:[{...shared.assets[0],url:'https://public/evil.png'}]},{
  expectedRoomId:room,expectedAuthorUserId:alice
 }),/Métadonnées de sprite inconnues/);
 assert.throws(()=>createCaptureCreatorSpriteRoomManifestV1({
  roomId:room,authorUserId:alice,confirmed:true,records:[sprite,sprite]
 }),/plusieurs fois/);
});
test('runtime restores the SAME generated user assetId and never persists the ephemeral blob URL',()=>{
 const created=[],revoked=[];
 const session=createCreatorVisualAssetSessionV1({
  createObjectURL:(file)=>{const url='blob:runtime/'+created.length;created.push(url);return url;},
  revokeObjectURL:url=>revoked.push(url),createId:()=> 'fresh-generated'
 });
 const source={name:'run.png',type:'image/png',size:120};
 const current=session.importImage({
  file:source,label:'Course',role:'movement',frameCount:12,frameMs:100
 });
 const id=current.id;
 assert.equal(id,'user:fresh-generated');
 session.discardSessionImage(id);
 assert.equal(session.asset(id),null);
 const restored=session.restoreImage({
  id,file:source,label:'Course',role:'movement',frameCount:12,frameMs:100
 });
 assert.equal(restored.id,id);
 assert.equal(restored.resource.frameCount,12);
 assert.equal(restored.resource.frameMs,100);
 assert.equal(captureEditorAssetMatchesRoleV1(restored,'movement'),true);
 assert.throws(()=>session.restoreImage({id,file:source,label:'Duplicate',role:'movement',frameCount:12}),/déjà chargé/);
 assert.throws(()=>session.restoreImage({id:'pack:unauthorized',file:source,label:'X',role:'movement'}),/user:/);
 session.dispose();
 assert.deepEqual(revoked,created,'all preview blob URLs are freed without deleting stored file');
});
test('native editor opts in to IndexedDB; saved images are hydrated before native catalog and skill preview keeps frames',async()=>{
 const entry=await readFile(new URL('../../examples/dom-demo/capture-editor-v2.js',import.meta.url),'utf8');
 const ui=await readFile(new URL('../../src/ui/capture-editor-human-v2.js',import.meta.url),'utf8');
 const session=await readFile(new URL('../../src/assets/creator-visual-asset-session-v1.js',import.meta.url),'utf8');
 assert.equal((entry.match(/createCaptureCreatorSpriteStoreV1\(\)/g)??[]).length,1);
 assert.match(entry,/creatorSpriteStore\.list\(creatorSpriteScopeId\)/);
 assert.match(ui,/void creatorSpritesReady\.then\(\(\)=>/);
 assert.doesNotMatch(ui,/if\(creatorSpritesReady\)await creatorSpritesReady/);
 assert.match(entry,/creatorVisualAssets\.restoreImage\(\{/);
 assert.match(entry,/creatorSpriteScopeId=universeId\?\?'capture-local-preview'/);
 assert.match(entry,/saveCreatorVisualAsset:async\(/);
 assert.match(entry,/frameCount: creatorAsset\.resource\.frameCount\?\?1/);
 assert.match(ui,/await saveCreatorVisualAsset\(\{/);
 assert.match(ui,/creatorVisualAssets\.discardSessionImage\?\.\(asset\.id\)/);
 assert.match(session,/restoreImage,/);
 assert.doesNotMatch(entry,/localStorage\.setItem\(.+sprite|sessionStorage\.setItem\(.+sprite/);
});
