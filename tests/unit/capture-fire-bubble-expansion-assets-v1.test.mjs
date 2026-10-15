import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = resolve(root, 'assets/library/capture/sprites/skills/fire_bubble_expansion');
const catalog = JSON.parse(readFileSync(resolve(root,'data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
const id = 'pack:capture:sprite-fire-bubble-expansion-01';

function inspectWebp(path) {
  const b = readFileSync(path);
  assert.ok(b.byteLength > 1000, 'non-empty WebP: '+path);
  assert.equal(b.toString('ascii',0,4),'RIFF');
  assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.equal(b.toString('ascii',12,16),'VP8X');
  assert.equal(b[20] & 16,16,'WebP alpha channel required: '+path);
  return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
}

test('Fire bubble: 20 transparent 512x512 frames and mobile atlas',()=>{
  const m=JSON.parse(readFileSync(resolve(base,'sprite_skill_fire_bubble_expansion_sequence.json'),'utf8'));
  assert.equal(m.id,id);
  assert.equal(m.type,'capture_skill_sprite_sequence');
  assert.deepEqual(m.frame_size,[512,512]);
  assert.equal(m.frame_count,20);
  assert.equal(m.frame_ms,80);
  assert.equal(m.playback_mode,'once');
  assert.equal(m.frames.length,20);
  assert.equal(new Set(m.frames).size,20);
  assert.equal(readdirSync(resolve(base,'frames')).filter(f=>f.endsWith('.webp')).length,20);
  for(let i=0;i<20;i++){
    const file='frames/sprite_skill_fire_bubble_expansion_'+String(i+1).padStart(2,'0')+'.webp';
    assert.equal(m.frames[i],file,'sequence order');
    assert.ok(existsSync(resolve(base,file)));
    assert.deepEqual(inspectWebp(resolve(base,file)),[512,512]);
  }
  assert.equal(m.atlas.frameCount,20);
  assert.equal(m.atlas.format,'sprite-strip');
  assert.equal(m.atlas.frameWidth,384);
  assert.equal(m.atlas.frameHeight,384);
  assert.deepEqual(inspectWebp(resolve(base,m.atlas.file)),[7680,384]);
  assert.deepEqual(m.source.pixel_size,[1402,1122]);
  assert.deepEqual(m.source.grid,[5,4]);
  assert.ok(m.source.note.includes('not native 512px'));
});

test('Fire bubble: isolated visual asset, unique catalog ID and correct counts',()=>{
  const found=catalog.assets.filter(asset=>asset.id===id);
  assert.equal(found.length,1);
  const a=found[0];
  assert.equal(a.assetType,'sprite');
  assert.equal(a.category,'skill');
  assert.equal(a.source.packId,'capture');
  assert.equal(a.resource.file,'capture/sprites/skills/fire_bubble_expansion/atlases/sprite_skill_fire_bubble_expansion_atlas_01.webp');
  assert.equal(a.resource.frameCount,20);
  assert.equal(a.resource.frameMs,80);
  assert.equal(a.resource.playbackMode,'once');
  for(const tag of ['fire','expanding','sphere','ground','aerial','capture']) assert.ok(a.tags.includes(tag));
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(catalog.counts.sprites,catalog.assets.filter(asset=>asset.assetType==='sprite').length);
  assert.equal(new Set(catalog.assets.map(asset=>asset.id)).size,catalog.assets.length);
  assert.ok(catalog.counts.assets>=150);
  assert.ok(catalog.counts.sprites>=77);
});