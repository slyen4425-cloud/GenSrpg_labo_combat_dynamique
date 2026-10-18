import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const base=resolve(root,'assets/library/capture/sprites/skills/light_shield');
const m=JSON.parse(readFileSync(resolve(base,'sprite_skill_light_shield_sequences_01.json'),'utf8'));
const catalog=JSON.parse(readFileSync(resolve(root,'data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
test('Light shield: actual source images, 40 alpha 512x512 PNG frames, 2 atlas, hold frame 20',()=>{
  assert.equal(m.id,'pack:capture:sprite-light-shield-01');
  assert.equal(readdirSync(resolve(base,'frames')).length,40);
  assert.equal(readdirSync(resolve(base,'atlases')).length,2);
  const rows=readFileSync(resolve(base,'provenance.csv'),'utf8').trim().split(/\r?\n/);
  assert.equal(rows.length,41);
  const hashes=new Map(rows.slice(1).map(l=>{const v=l.split(',');return [v[5],v[6]];}));
  for(const kind of ['cast','barrier']){
    const seq=m.sequences[kind];
    assert.equal(seq.frame_count,20);
    assert.equal(seq.playback_mode,'once');
    assert.equal(seq.frames.length,20);
    if(kind==='barrier'){assert.equal(seq.hold_last_frame,true);assert.equal(seq.hold_frame_index,19);}
    for(let i=1;i<=20;i++){
      const f='frames/sprite_skill_light_shield_'+kind+'_'+String(i).padStart(2,'0')+'.png';
      assert.equal(seq.frames[i-1],f);
      const b=readFileSync(resolve(base,f));
      assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);
      assert.equal(b[25],6);
      assert.equal(createHash('sha256').update(b).digest('hex'),hashes.get(f),'real frame checksum');
    }
    const f=resolve(base,seq.atlas.file);assert.ok(existsSync(f));
    const b=readFileSync(f);
    assert.equal(b.toString('ascii',0,4),'RIFF'); assert.equal(b.toString('ascii',8,12),'WEBP');
    assert.equal(b.toString('ascii',12,16),'VP8X'); assert.equal(b[20]&16,16);
    assert.equal(1+b.readUIntLE(24,3),7680);assert.equal(1+b.readUIntLE(27,3),384);
  }
});
test('Light shield: assetIds resolve through the one canonical catalog',()=>{
  assert.equal(catalog.storage.branch,'global-assets');
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(catalog.counts.sprites,catalog.assets.filter(x=>x.assetType==='sprite').length);
  assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
  for(const kind of ['cast','barrier']){
    const id='pack:capture:sprite-light-shield-'+kind+'-01';
    const entries=catalog.assets.filter(x=>x.id===id);
    assert.equal(entries.length,1);
    const a=entries[0];assert.equal(a.assetType,'sprite');
    assert.equal(a.resource.frameCount,20);assert.equal(a.resource.playbackMode,'once');
    if(kind==='barrier')assert.equal(a.resource.holdLastFrame,true);
    assert.ok(a.compatibility.uses.includes('editor'));
    assert.ok(existsSync(resolve(root,catalog.storage.libraryRoot,a.resource.file)));
  }
});
