import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root));
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

test('Scarabacier roll: 16 real transparent frames, atlas and unique canonical ID', () => {
  const folder = 'assets/library/capture/creatures/scarabacier/animations/roll/';
  const manifest = JSON.parse(read(folder + 'scarabacier_roll.manifest.json'));
  const catalog = JSON.parse(read('data/assets/catalog/global-visual-assets.v1.json'));
  const items = catalog.assets.filter(a => a.id === 'pack:capture:creature-scarabacier-roll-01');
  assert.equal(items.length, 1);
  assert.equal(items[0].resource.file,
    'capture/creatures/scarabacier/animations/roll/atlases/scarabacier_roll_atlas.webp');
  assert.equal(items[0].resource.frameCount, 16);
  assert.equal(items[0].resource.playbackMode, 'loop');
  assert.equal(manifest.frameCount, 16);
  assert.deepEqual(manifest.frameSize, [512,512]);
  assert.equal(manifest.sourceSha256,
    'e082f9da7d8eb5604d2e3b2e1177808ae53f9408cb644ec9e4659e0564c631e4');
  assert.equal(manifest.frames.length, 16);
  const unique = new Set();
  for (let i = 0; i < 16; i++) {
    const frame = manifest.frames[i];
    const name = 'frames/scarabacier_roll_' + String(i+1).padStart(2,'0') + '.png';
    assert.equal(frame.index, i);
    assert.equal(frame.file, name);
    const png = read(folder+name);
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16),512);
    assert.equal(png.readUInt32BE(20),512);
    assert.equal(png[25],6,'PNG must have RGBA color type');
    assert.equal(sha256(png),frame.sha256);
    unique.add(frame.sha256);
  }
  assert.equal(unique.size,16);
  const atlas = read(folder+manifest.atlas.file);
  assert.equal(atlas.toString('ascii',0,4),'RIFF');
  assert.equal(atlas.toString('ascii',8,12),'WEBP');
  assert.equal(atlas.toString('ascii',12,16),'VP8X');
  assert.equal(atlas.readUIntLE(24,3)+1,6144);
  assert.equal(atlas.readUIntLE(27,3)+1,384);
  assert.ok((atlas[20]&0x10)!==0,'WebP alpha channel is required');
  assert.equal(sha256(atlas),manifest.atlas.sha256);
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
  for (const role of ['player','opponent','icon']) {
    const b=read('assets/library/capture/creatures/scarabacier/runtime/scarabacier_'+role+'.webp');
    assert.ok(b.length>5000);
    assert.equal(catalog.assets.filter(x=>x.id==='pack:capture:creature-scarabacier-'+role+'-01').length,1);
  }
});
