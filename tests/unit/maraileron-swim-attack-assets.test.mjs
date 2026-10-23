import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const bytes=p=>readFileSync(path.join(root,p));
const json=p=>JSON.parse(bytes(p).toString('utf8'));
const sha=p=>createHash('sha256').update(bytes(p)).digest('hex');
const catalog=json('data/assets/catalog/global-visual-assets.v1.json');
const base='assets/library/capture/creatures/maraileron/animations/';
const ZIP_SHA='397e5435260bbb48f0c33591c1a2eb15c51942e4857a552e4e38e70ad018ea2a';
test('Maraileron: real ZIP, stable catalog IDs, original views still present',()=>{
 assert.equal(sha('_incoming/CREATURE_AQUATIQUE_2_ANIMATIONS_NAGE_ATTAQUE.zip'),ZIP_SHA);
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
 assert.equal(json('assets/library/capture/creatures/maraileron/maraileron.meta.json').profile,'serpentine');
 for(const role of ['player','opponent','icon']){
  const asset=catalog.assets.find(x=>x.id==='pack:capture:creature-maraileron-'+role+'-01');
  assert.ok(asset);
  assert.match(asset.resource.file,/^capture\/creatures\/maraileron\/runtime\//);
  assert.ok(bytes('assets/library/'+asset.resource.file).length>1000);
 }
});
for(const [action,n,ms,mode,minMargin] of [['movement',6,90,'loop',90],['attack',12,100,'once',56]]){
 test('Maraileron '+action+': actual images, hashes, margin and animated previews',()=>{
  const dir=base+action+'/player/';
  const m=json(dir+action+'.manifest.json');
  const id='pack:capture:creature-maraileron-'+action+'-player-'+n+'-v1';
  const assets=catalog.assets.filter(x=>x.id===id);
  assert.equal(assets.length,1);
  assert.equal(m.creatureId,'maraileron');
  assert.equal(m.view,'player');
  assert.equal(m.action,action);
  assert.equal(m.assetId,id);
  assert.equal(m.frameCount,n);
  assert.deepEqual(m.frameSize,[512,512]);
  assert.equal(m.frameMs,ms);
  assert.equal(m.playbackMode,mode);
  assert.equal(m.sourceArchiveSha256,ZIP_SHA);
  assert.equal(m.frames.length,n);
  const unique=new Set();
  m.frames.forEach((frame,i)=>{
   const p=dir+frame.file,b=bytes(p);
   assert.equal(frame.index,i);
   assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(b.toString('ascii',12,16),'IHDR');
   assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);
   assert.equal(b[24],8);assert.equal(b[25],6);
   assert.equal(sha(p),frame.sha256);
   assert.ok(Math.min(...frame.marginsLTRB)>=minMargin);
   unique.add(frame.sha256);
  });
  assert.equal(unique.size,n);
  const atlas=bytes(dir+m.atlas.file);
  assert.equal(atlas.toString('ascii',0,4),'RIFF');
  assert.equal(atlas.toString('ascii',8,12),'WEBP');
  assert.equal(m.atlas.frameWidth,384);
  assert.equal(m.atlas.frameHeight,384);
  assert.equal(m.atlas.frameCount,n);
  assert.equal(sha(dir+m.atlas.file),m.atlas.sha256);
  assert.equal(assets[0].resource.file,'capture/creatures/maraileron/animations/'+action+'/player/'+m.atlas.file);
  assert.equal(assets[0].resource.playbackMode,mode);
  assert.match(bytes(dir+m.previews.gif).toString('ascii',0,6),/^GIF8[79]a$/);
  assert.equal(bytes(dir+m.previews.webp).toString('ascii',0,4),'RIFF');
  assert.equal(bytes(dir+m.previews.planche).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 });
}
