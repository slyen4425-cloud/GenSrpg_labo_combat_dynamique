import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = rel => readFileSync(path.join(root, rel));
const json = rel => JSON.parse(read(rel).toString('utf8'));
const sha = buf => createHash('sha256').update(buf).digest('hex');
const prefix = 'assets/library/capture/creatures/golem_moussu/animations';
const catalog = json('data/assets/catalog/global-visual-assets.v1.json');
const archiveSHA = 'ad9f4717721346a99a9c6a5a469a7e1ef81e930353204dc7273fda87e615a42c';
test('Golem moussu source and unique catalogue', () => {
  assert.equal(sha(read('_incoming/GOLEM_MOUSSU_FACE_12_COURSE_ATTAQUE_GITHUB.zip')), archiveSHA);
  assert.equal(catalog.counts.assets, catalog.assets.length);
  assert.equal(new Set(catalog.assets.map(a => a.id)).size, catalog.assets.length);
});
for (const [action, ms, mode] of [['movement', 85, 'loop'], ['attack', 100, 'once']]) {
  test('Golem moussu ' + action + ' 12 frames real media', () => {
    const folder = prefix + '/' + action + '/face';
    const m = json(folder + '/' + action + '.manifest.json');
    const id = 'pack:capture:creature-golem-moussu-' + action + '-face-12-v1';
    const assets = catalog.assets.filter(x => x.id === id);
    assert.equal(assets.length, 1);
    const asset = assets[0];
    assert.equal(m.assetId, id);
    assert.equal(m.creatureId, 'golem_moussu');
    assert.equal(m.action, action);
    assert.equal(m.view, 'face');
    assert.equal(m.authorApproved, true);
    assert.equal(m.sourceArchiveSha256, archiveSHA);
    assert.equal(m.frameCount, 12);
    assert.deepEqual(m.frameSize, [512,512]);
    assert.equal(m.frameMs, ms);
    assert.equal(m.playbackMode, mode);
    assert.equal(m.frames.length, 12);
    assert.equal(asset.resource.frameCount, 12);
    assert.equal(asset.resource.frameMs, ms);
    assert.equal(asset.resource.playbackMode, mode);
    assert.equal(asset.resource.format, 'sprite-strip');
    assert.equal(asset.resource.file, 'capture/creatures/golem_moussu/animations/' + action + '/face/' + m.atlas.file);
    const hashes = new Set();
    m.frames.forEach((f, i) => {
      assert.equal(f.index, i);
      assert.equal(f.file, 'frames/golem_moussu_' + action + '_face_' + String(i+1).padStart(2,'0') + '.png');
      const png = read(folder + '/' + f.file);
      assert.equal(png.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(png.toString('ascii',12,16), 'IHDR');
      assert.equal(png.readUInt32BE(16), 512);
      assert.equal(png.readUInt32BE(20), 512);
      assert.equal(png[24], 8);
      assert.equal(png[25], 6);
      assert.equal(sha(png), f.sha256);
      assert.equal(f.marginsLTRB.length, 4);
      assert.ok(Math.min(...f.marginsLTRB) >= 40);
      hashes.add(f.sha256);
    });
    assert.equal(hashes.size, 12);
    const atlas = read(folder + '/' + m.atlas.file);
    assert.equal(atlas.toString('ascii',0,4), 'RIFF');
    assert.equal(atlas.toString('ascii',8,12), 'WEBP');
    assert.equal(m.atlas.format, 'sprite-strip');
    assert.equal(m.atlas.frameCount, 12);
    assert.equal(m.atlas.frameWidth, 384);
    assert.equal(m.atlas.frameHeight, 384);
    assert.equal(sha(atlas), m.atlas.sha256);
    assert.match(read(folder + '/' + m.preview).toString('ascii',0,6), /^GIF8[79]a$/);
    const animWebp = read(folder + '/' + m.previews.webp);
    assert.equal(animWebp.toString('ascii',0,4), 'RIFF');
    assert.equal(animWebp.toString('ascii',8,12), 'WEBP');
  });
}
test('Golem runtime images and existing wolf animations are retained', () => {
  for (const side of ['opponent', 'player', 'icon']) {
    const asset = catalog.assets.find(x => x.id === 'pack:capture:creature-golem-moussu-' + side + '-01');
    assert.ok(asset, side);
    assert.match(asset.resource.file, /^capture\/creatures\/golem_moussu\/runtime\//);
    assert.ok(read('assets/library/' + asset.resource.file).length > 1000);
  }
  for (const action of ['movement','attack']) for (const view of ['face','dos']) {
    const id = 'pack:capture:creature-loup-volcanique-' + action + '-' + view + '-12-v1';
    const asset = catalog.assets.find(x => x.id === id);
    assert.ok(asset, id);
    assert.ok(read('assets/library/' + asset.resource.file).length > 1000);
  }
});
