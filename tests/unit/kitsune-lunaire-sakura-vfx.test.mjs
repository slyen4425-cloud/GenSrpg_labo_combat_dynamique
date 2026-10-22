import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = resolve(root, 'assets/library/capture/sprites/skills/kitsune_lunaire_sakura');
const catalog = JSON.parse(readFileSync(resolve(root, 'data/assets/catalog/global-visual-assets.v1.json')));
const roles = ['aura', 'cast', 'projectile', 'impact'];
const ids = roles.map(role => 'pack:capture:sprite-kitsune-lunaire-' + role + '-01');
const installed = catalog.assets.filter(item => ids.includes(item.id));

test('Kitsune Sakura VFX: no partial catalog publication, real physical RGBA frames/atlases', t => {
  if (installed.length === 0) return t.skip('Waiting for approved real ZIP upload/import');
  assert.equal(installed.length, 4, 'All four roles must be published together');
  assert.equal(catalog.counts.assets, catalog.assets.length);
  assert.equal(catalog.counts.sprites, catalog.assets.filter(a => a.assetType === 'sprite').length);
  assert.equal(new Set(catalog.assets.map(a => a.id)).size, catalog.assets.length);
  const manifest = JSON.parse(readFileSync(resolve(base, 'sprite_skill_kitsune_lunaire_sequences_01.json')));
  const provenance = JSON.parse(readFileSync(resolve(base, 'provenance.json')));
  assert.deepEqual(manifest.frame_size, [512, 512]);
  assert.equal(manifest.source.cell_spacing_px, 72);
  assert.equal(manifest.source.sha256, '32eb218cb63844791c3d8882c8c803f51ae82162d509e82a1b5bc8c92b2d1d5d');
  for (const role of roles) {
    const seq = manifest.sequences[role];
    const aid = 'pack:capture:sprite-kitsune-lunaire-' + role + '-01';
    const registered = catalog.assets.find(a => a.id === aid);
    assert.ok(registered);
    assert.equal(seq.id, aid);
    assert.equal(seq.frame_count, 20);
    assert.equal(seq.frames.length, 20);
    assert.equal(seq.atlas.frameCount, 20);
    assert.equal(seq.atlas.frameWidth, 384);
    assert.equal(seq.atlas.frameHeight, 384);
    assert.equal(registered.resource.file, 'capture/sprites/skills/kitsune_lunaire_sakura/' + seq.atlas.file);
    assert.equal(registered.resource.frameCount, 20);
    assert.equal(registered.resource.playbackMode, seq.playback_mode);
    assert.equal(seq.playback_mode, role === 'aura' || role === 'projectile' ? 'loop' : 'once');
    assert.equal(new Set(provenance[role].frames_sha256).size, 20);
    for (let i = 0; i < 20; i++) {
      const path = resolve(base, seq.frames[i]);
      assert.ok(existsSync(path), path);
      const b = readFileSync(path);
      assert.equal(b.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(b.readUInt32BE(16), 512);
      assert.equal(b.readUInt32BE(20), 512);
      assert.equal(b[25], 6, 'PNG should be RGBA');
      assert.equal(createHash('sha256').update(b).digest('hex'), provenance[role].frames_sha256[i]);
    }
    const atlas = readFileSync(resolve(base, seq.atlas.file));
    assert.equal(atlas.toString('ascii', 0, 4), 'RIFF');
    assert.equal(atlas.toString('ascii', 8, 12), 'WEBP');
    assert.equal(1 + atlas.readUIntLE(24, 3), 7680);
    assert.equal(1 + atlas.readUIntLE(27, 3), 384);
    assert.equal(createHash('sha256').update(atlas).digest('hex'), provenance[role].atlas_sha256);
  }
});
