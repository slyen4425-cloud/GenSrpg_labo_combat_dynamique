import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => readFileSync(path.join(root, relative));
const json = (relative) => JSON.parse(read(relative).toString('utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const prefix = 'assets/library/capture/creatures/loup_volcanique/animations';
const catalog = json('data/assets/catalog/global-visual-assets.v1.json');

test('Loup volcanique dos12 : source ZIP d’origine conservée', () => {
  const archive = read('_incoming/LOUP_VOLCANIQUE_DOS_12_COURSE_ATTAQUE_PREVIEW.zip');
  assert.equal(sha256(archive), 'bebd0e3735eccc6e33e510b1daf9657682081f7997e4b1304f42b3376c47eafe');
});

for (const [action, frameMs, playbackMode] of [
  ['movement', 80, 'loop'],
  ['attack', 100, 'once'],
]) {
  test('Loup volcanique : ' + action + ' dos, 12 vraies frames, atlas et catalogue', () => {
    const folder = `${prefix}/${action}/dos`;
    const manifest = json(`${folder}/${action}.manifest.json`);
    const assetId = `pack:capture:creature-loup-volcanique-${action}-dos-12-v1`;
    const assets = catalog.assets.filter(item => item.id === assetId);
    assert.equal(assets.length, 1, 'assetId stable présent une seule fois');
    const asset = assets[0];
    assert.equal(manifest.schema, 'capture-creature-animation-v1');
    assert.equal(manifest.creatureId, 'loup_volcanique');
    assert.equal(manifest.action, action);
    assert.equal(manifest.view, 'dos');
    assert.equal(manifest.assetId, assetId);
    assert.equal(manifest.authorApproved, true);
    assert.equal(manifest.approvalStatus, action === 'movement' ? 'approved_for_ingame_trial' : 'approved');
    assert.equal(manifest.status, action === 'movement' ? 'ingame_trial_pending' : 'asset_approved');
    assert.equal(manifest.sourceArchiveSha256, 'bebd0e3735eccc6e33e510b1daf9657682081f7997e4b1304f42b3376c47eafe');
    assert.equal(manifest.frameCount, 12);
    assert.deepEqual(manifest.frameSize, [512, 512]);
    assert.equal(manifest.frameMs, frameMs);
    assert.equal(manifest.playbackMode, playbackMode);
    assert.equal(manifest.frames.length, 12);
    assert.equal(asset.assetType, 'sprite');
    assert.equal(asset.resource.file, `capture/creatures/loup_volcanique/animations/${action}/dos/${manifest.atlas.file}`);
    assert.equal(asset.resource.frameCount, 12);
    assert.equal(asset.resource.frameMs, frameMs);
    assert.equal(asset.resource.playbackMode, playbackMode);
    assert.equal(asset.resource.format, 'sprite-strip');

    const hashes = new Set();
    for (const [i, frame] of manifest.frames.entries()) {
      assert.equal(frame.index, i);
      assert.equal(frame.file, `frames/loup_volcanique_${action}_dos_${String(i+1).padStart(2,'0')}.png`);
      const data = read(`${folder}/${frame.file}`);
      assert.equal(data.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(data.toString('ascii',12,16), 'IHDR');
      assert.equal(data.readUInt32BE(16), 512);
      assert.equal(data.readUInt32BE(20), 512);
      assert.equal(data[24], 8);
      assert.equal(data[25], 6, 'RGBA 8-bit obligatoire');
      assert.equal(sha256(data), frame.sha256, 'PNG identique à la source approuvée');
      assert.ok(Array.isArray(frame.marginsLTRB) && frame.marginsLTRB.length === 4);
      assert.ok(frame.marginsLTRB.every(x => x >= 40), 'marges alpha préservées');
      hashes.add(frame.sha256);
    }
    assert.equal(hashes.size, 12, 'les 12 frames doivent être distinctes');

    const atlas = read(`${folder}/${manifest.atlas.file}`);
    assert.equal(atlas.toString('ascii',0,4), 'RIFF');
    assert.equal(atlas.toString('ascii',8,12), 'WEBP');
    assert.equal(sha256(atlas), manifest.atlas.sha256);
    assert.equal(manifest.atlas.frameCount, 12);
    assert.equal(manifest.atlas.frameWidth, 384);
    assert.equal(manifest.atlas.frameHeight, 384);
    const imageSize = (atlas.indexOf(Buffer.from('VP8X')) >= 0) ? true : atlas.length > 1000;
    assert.ok(imageSize);
    const gif = read(`${folder}/${manifest.preview}`);
    assert.match(gif.toString('ascii',0,6), /^GIF8[79]a$/);
  });
}

test('Loup volcanique : catalogue et vues existantes non remplacées', () => {
  assert.equal(new Set(catalog.assets.map(x => x.id)).size, catalog.assets.length);
  assert.equal(catalog.counts.assets, catalog.assets.length);
  for (const side of ['opponent','player','icon']) {
    const item = catalog.assets.find(x => x.id === `pack:capture:creature-loup-volcanique-${side}-01`);
    assert.ok(item, side);
    assert.match(item.resource.file, /^capture\/creatures\/loup_volcanique\/runtime\//);
    assert.ok(read('assets/library/' + item.resource.file).length > 1024);
  }
});
