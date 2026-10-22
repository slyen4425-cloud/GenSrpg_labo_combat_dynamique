import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dir=resolve(root,'assets/library/capture/sprites/skills/kitsune_spirit_shield');
const cat=JSON.parse(readFileSync(resolve(root,'data/assets/catalog/global-visual-assets.v1.json')));
const id='pack:capture:sprite-kitsune-lunaire-spirit-shield-01';
const asset=cat.assets.find(x=>x.id===id);

test('Kitsune spiritual sphere: physical 20 RGBA frames, transparent WEBP atlas and provenance',t=>{
  if(!asset){
    assert.ok(!existsSync(dir),'No orphan media may exist without a catalog ID');
    return t.skip('Source approved but real PNG not yet received');
  }
  assert.equal(cat.counts.assets,cat.assets.length);
  assert.equal(cat.counts.sprites,cat.assets.filter(x=>x.assetType==='sprite').length);
  assert.equal(new Set(cat.assets.map(x=>x.id)).size,cat.assets.length);
  assert.equal(asset.category,'skill');
  assert.equal(asset.resource.frameCount,20);
  assert.equal(asset.resource.playbackMode,'once');
  assert.equal(asset.resource.frameMs,80);
  assert.ok(asset.compatibility.uses.includes('editor'));
  const manifest=JSON.parse(readFileSync(resolve(dir,'sprite_skill_kitsune_spirit_shield_sequence.json')));
  const prov=JSON.parse(readFileSync(resolve(dir,'provenance.json')));
  assert.equal(manifest.id,id);
  assert.deepEqual(manifest.frame_size,[512,512]);
  assert.deepEqual(manifest.source.pixel_size,[1491,1055]);
  assert.deepEqual(manifest.source.grid,[5,4]);
  assert.equal(manifest.hold_last_frame,true);
  assert.equal(manifest.hold_frame_index,19);
  assert.equal(manifest.frames.length,20);
  assert.equal(readdirSync(resolve(dir,'frames')).length,20);
  assert.equal(readdirSync(resolve(dir,'atlases')).length,1);
  assert.equal(new Set(prov.frames.map(x=>x.sha256)).size,20);
  for(let i=0;i<20;i++){
    const rel=manifest.frames[i],row=prov.frames[i],buf=readFileSync(resolve(dir,rel));
    assert.equal(row.file,rel);
    assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(buf.readUInt32BE(16),512);assert.equal(buf.readUInt32BE(20),512);
    assert.equal(buf[25],6,'actual RGBA color mode');
    assert.equal(createHash('sha256').update(buf).digest('hex'),row.sha256);
  }
  const atlas=readFileSync(resolve(dir,manifest.atlas.file));
  assert.equal(atlas.toString('ascii',0,4),'RIFF');
  assert.equal(atlas.toString('ascii',8,12),'WEBP');
  assert.equal(createHash('sha256').update(atlas).digest('hex'),prov.atlas_sha256);
  assert.equal(asset.resource.file,'capture/sprites/skills/kitsune_spirit_shield/'+manifest.atlas.file);
});
