import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = resolve(root, 'assets/library/capture/sprites/skills/fluide_meteorite');
const catalog=JSON.parse(readFileSync(resolve(root,'data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
const manifest=JSON.parse(readFileSync(resolve(assetRoot,'sprite_skill_fluide_meteorite_sequences_01.json'),'utf8'));
const cases=[
 ['cast','release',70],
 ['projectile','travel',70],
 ['impact','impact',55]
];
function checkPng(p){
 const b=readFileSync(p);
 assert.ok(b.length>1024);
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(b.toString('ascii',12,16),'IHDR');
 assert.equal(b.readUInt32BE(16),512);
 assert.equal(b.readUInt32BE(20),512);
 assert.equal(b[24],8,'8 bit per channel');
 assert.equal(b[25],6,'PNG RGBA required');
 return b;
}
function checkAtlas(p){
 const b=readFileSync(p);
 assert.ok(b.length>1024);
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.equal(b.toString('ascii',12,16),'VP8X');
 assert.equal(b[20]&16,16,'WebP alpha');
 assert.equal(1+b.readUIntLE(24,3),7680);
 assert.equal(1+b.readUIntLE(27,3),384);
}
test('Fluide météorite — 60 vrais fichiers PNG RGBA, manifestes et atlas',()=>{
 assert.equal(manifest.id,'pack:capture:sprite-fluide-meteorite-01');
 assert.deepEqual(manifest.frame_size,[512,512]);
 assert.equal(readdirSync(resolve(assetRoot,'frames')).length,60);
 assert.equal(readdirSync(resolve(assetRoot,'atlases')).length,3);
 const csv=readFileSync(resolve(assetRoot,'provenance.csv'),'utf8').trim().split(/\\r?\\n/);
 assert.equal(csv.length,61,'header + 60 provenance rows');
 const lines=csv.slice(1).map(line=>line.split(','));
 const byFrame=new Map(lines.map(v=>[v[6],v[7]]));
 assert.equal(byFrame.size,60);
 for(const [part,category,ms] of cases){
  const seq=manifest.sequences[part];
  assert.equal(seq.frame_count,20);
  assert.equal(seq.frame_ms,ms);
  assert.equal(seq.category,part==='cast'?'cast':category);
  assert.equal(seq.playback_mode,'once');
  assert.equal(seq.frames.length,20);
  assert.equal(new Set(seq.frames).size,20);
  for(let i=0;i<20;i++){
   const name='frames/sprite_skill_fluide_meteorite_'+part+'_'+String(i+1).padStart(2,'0')+'.png';
   assert.equal(seq.frames[i],name);
   const p=resolve(assetRoot,name);
   assert.ok(existsSync(p));
   const file=checkPng(p);
   assert.equal(createHash('sha256').update(file).digest('hex'),byFrame.get(name),'authentic original byte check');
  }
  assert.equal(seq.atlas.frameCount,20);
  assert.equal(seq.atlas.frameWidth,384);
  assert.equal(seq.atlas.frameHeight,384);
  checkAtlas(resolve(assetRoot,seq.atlas.file));
 }
});
test('Fluide météorite — catalogue unique et 3 entrées consommables par le moteur',()=>{
 assert.equal(catalog.storage.branch,'global-assets');
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(x=>x.assetType==='sprite').length);
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
 for(const [part,category,ms] of cases){
  const id='pack:capture:sprite-fluide-meteorite-'+part+'-01';
  const entries=catalog.assets.filter(x=>x.id===id);
  assert.equal(entries.length,1);
  const a=entries[0];
  assert.equal(a.assetType,'sprite');
  assert.equal(a.category,category);
  assert.equal(a.source.packId,'capture');
  assert.equal(a.resource.file,'capture/sprites/skills/fluide_meteorite/'+manifest.sequences[part].atlas.file);
  assert.equal(a.resource.frameCount,20);
  assert.equal(a.resource.frameMs,ms);
  assert.equal(a.resource.playbackMode,'once');
  assert.ok(a.compatibility.uses.includes('editor'));
  assert.ok(existsSync(resolve(root,catalog.storage.libraryRoot,a.resource.file)));
 }
});
