import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const b=p=>readFileSync(path.join(root,p));
const j=p=>JSON.parse(b(p).toString('utf8'));
const sha=p=>createHash('sha256').update(b(p)).digest('hex');
const cat=j('data/assets/catalog/global-visual-assets.v1.json');
const base='assets/library/capture/creatures/maraileron/animations/';
const ZIP='MARAILERON_FACE_2_ANIMATIONS_NAGE_ATTAQUE.zip';
const SHA='96e5c35a577b73bda926dedc29ee4cf16b565e474283e925fc6bc9aa8fc6aa30';
test('Source ZIP unmodified, IDs unique, Maraileron runtime preserved',()=>{
  assert.equal(sha('_incoming/'+ZIP),SHA);
  assert.equal(cat.counts.assets,cat.assets.length);
  assert.equal(new Set(cat.assets.map(a=>a.id)).size,cat.assets.length);
  assert.equal(j('assets/library/capture/creatures/maraileron/maraileron.meta.json').profile,'serpentine');
  for(const side of ['player','opponent','icon']){
    const asset=cat.assets.find(a=>a.id==='pack:capture:creature-maraileron-'+side+'-01');
    assert.ok(asset);
    assert.match(asset.resource.file,/^capture\/creatures\/maraileron\/runtime\//);
    assert.ok(b('assets/library/'+asset.resource.file).length>1024);
  }
  for(const [action,n] of [['movement',6],['attack',12]]){
    const id='pack:capture:creature-maraileron-'+action+'-player-'+n+'-v1';
    const asset=cat.assets.find(a=>a.id===id);
    assert.ok(asset,'Previously published player-side asset '+id);
    assert.ok(b('assets/library/'+asset.resource.file).length>1024);
  }
});
for(const [action,mode] of [['movement','loop'],['attack','once']]){
 test('Maraileron FACE '+action+' has real 12 approved frames, atlas and previews',()=>{
   const dir=base+action+'/opponent/';
   const m=j(dir+action+'.manifest.json');
   const id='pack:capture:creature-maraileron-'+action+'-opponent-12-v1';
   const assets=cat.assets.filter(a=>a.id===id);
   assert.equal(assets.length,1);assert.equal(m.creatureId,'maraileron');
   assert.equal(m.view,'opponent');assert.equal(m.action,action);
   assert.equal(m.assetId,id);assert.equal(m.authorApproved,true);
   assert.equal(m.frameCount,12);assert.deepEqual(m.frameSize,[512,512]);
   assert.equal(m.frameMs,110);assert.equal(m.playbackMode,mode);
   assert.equal(m.sourceArchiveSha256,SHA);assert.equal(m.frames.length,12);
   assert.equal(sha(base+m.sourceSpriteSheet),m.sourceSpriteSheetSha256);
   const hashes=new Set();
   for(const [index,f] of m.frames.entries()){
     const raw=b(dir+f.file);
     assert.equal(f.index,index);
     assert.deepEqual(f.sourceGridCell,[index%4,Math.floor(index/4)]);
     assert.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
     assert.equal(raw.toString('ascii',12,16),'IHDR');
     assert.equal(raw.readUInt32BE(16),512);assert.equal(raw.readUInt32BE(20),512);
     assert.equal(raw[24],8);assert.equal(raw[25],6);
     assert.equal(sha(dir+f.file),f.sha256);
     assert.ok(Math.min(...f.marginsLTRB)>=7);
     hashes.add(f.sha256);
   }
   assert.equal(hashes.size,12,'12 real distinct poses');
   assert.equal(assets[0].resource.frameCount,12);
   assert.equal(assets[0].resource.frameMs,110);
   assert.equal(assets[0].resource.playbackMode,mode);
   assert.equal(assets[0].resource.format,'sprite-strip');
   assert.equal(assets[0].resource.file,'capture/creatures/maraileron/animations/'+action+'/opponent/'+m.atlas.file);
   const atlas=b(dir+m.atlas.file);
   assert.equal(atlas.toString('ascii',0,4),'RIFF');
   assert.equal(atlas.toString('ascii',8,12),'WEBP');
   assert.equal(sha(dir+m.atlas.file),m.atlas.sha256);
   assert.equal(m.atlas.frameCount,12);
   assert.equal(m.atlas.frameWidth,384);
   assert.equal(m.atlas.frameHeight,384);
   assert.match(b(dir+m.previews.gif).toString('ascii',0,6),/^GIF8[79]a$/);
   assert.equal(b(dir+m.previews.webp).toString('ascii',0,4),'RIFF');
   assert.equal(b(dir+m.previews.planche).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 });
}
