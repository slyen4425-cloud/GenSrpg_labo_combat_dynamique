import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const lib=resolve(root,'assets/library/capture/sprites/skills');
const source=resolve(root,'assets/library/capture/sprites/source/steel_rust_vfx_20261018');
const sm=JSON.parse(readFileSync(resolve(source,'sources.json'),'utf8'));
const catalog=JSON.parse(readFileSync(resolve(root,'data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
const specs=[
 ['steel_carapace','fade','skill','pack:capture:sprite-steel-carapace-fade-01',false],
 ['steel_carapace','hold','skill','pack:capture:sprite-steel-carapace-hold-01',true],
 ['steel_wing_impact','impact','impact','pack:capture:sprite-steel-wing-impact-01',false],
 ['rust_whirlwind','cast','release','pack:capture:sprite-rust-whirlwind-cast-01',false],
 ['steel_wing_projectile','projectile','travel','pack:capture:sprite-steel-wing-projectile-01',false],
];
const digest=b=>createHash('sha256').update(b).digest('hex');
test('five real source sheets with transparent alpha and verified transport checksum',()=>{
 assert.equal(sm.sheets.length,5);assert.equal(sm.sheets[0].key,'steel_carapace_fade');
 for(const row of sm.sheets){
  const b=readFileSync(resolve(source,row.file));
  assert.ok(b.length>200000,'Real VFX sheet required');
  assert.equal(digest(b),row.transportSha256);
  assert.match(row.originalPngSha256,/^[0-9a-f]{64}$/);
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.equal(b.toString('ascii',12,16),'VP8X');assert.equal(b[20]&16,16);
  assert.equal(1+b.readUIntLE(24,3),1402);assert.equal(1+b.readUIntLE(27,3),1122);
 }
});
test('five catalogued sequences: 100 distinct real RGBA PNG 512px frames and five real WebP atlases',()=>{
 assert.equal(catalog.storage.branch,'global-assets');
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.sprites,catalog.assets.filter(a=>a.assetType==='sprite').length);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 assert.equal(catalog.counts.sprites,97);
 assert.equal(catalog.counts.assets,186);
 for(const [folder,role,category,id,hold] of specs){
  const base=resolve(lib,folder);
  const m=JSON.parse(readFileSync(resolve(base,`sprite_skill_${folder}_sequences_01.json`),'utf8'));
  const seq=m.sequences[role];
  assert.ok(seq,'missing '+folder+'/'+role);
  assert.equal(seq.frameCount,20);assert.equal(seq.playbackMode,'once');
  assert.equal(seq.holdLastFrame,hold);assert.equal(seq.holdFrameIndex,hold?19:null);
  assert.deepEqual(seq.frameSize,[512,512]);assert.equal(seq.native512,false);
  assert.equal(seq.frames.length,20);assert.equal(seq.frameSha256.length,20);
  const frameUnique=new Set(seq.frameSha256);assert.equal(frameUnique.size,20);
  const mapped=catalog.assets.filter(a=>a.id===id);
  assert.equal(mapped.length,1,id);const asset=mapped[0];
  assert.equal(asset.assetType,'sprite');assert.equal(asset.category,category);
  assert.equal(asset.resource.frameCount,20);
  assert.equal(asset.resource.holdLastFrame===true,hold);
  assert.deepEqual(asset.compatibility.uses,['combat','capture','editor']);
  for(let n=1;n<=20;n++){
   const rel=`frames/sprite_skill_${folder}_${role}_${String(n).padStart(2,'0')}.png`;
   assert.equal(seq.frames[n-1],rel);
   const b=readFileSync(resolve(base,rel));
   assert.ok(b.length>1000,'No placeholder frame');
   assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);assert.equal(b[25],6);
   assert.equal(digest(b),seq.frameSha256[n-1],'frame SHA mismatch '+rel);
  }
  const atlas=readFileSync(resolve(base,seq.atlas.file));
  assert.ok(atlas.length>20000);assert.equal(atlas.toString('ascii',0,4),'RIFF');
  assert.equal(atlas.toString('ascii',8,12),'WEBP');
  assert.equal(atlas.toString('ascii',12,16),'VP8X');assert.equal(atlas[20]&16,16);
  assert.equal(1+atlas.readUIntLE(24,3),7680);assert.equal(1+atlas.readUIntLE(27,3),384);
  assert.equal(digest(atlas),seq.atlas.sha256);
  assert.equal(asset.resource.file,`capture/sprites/skills/${folder}/${seq.atlas.file}`);
  assert.ok(existsSync(resolve(root,catalog.storage.libraryRoot,asset.resource.file)));
 }
 assert.equal(readdirSync(resolve(lib,'steel_carapace','frames')).length,40);
 for(const folder of ['steel_wing_impact','rust_whirlwind','steel_wing_projectile'])
  assert.equal(readdirSync(resolve(lib,folder,'frames')).length,20);
});