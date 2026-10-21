import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = rel => readFileSync(path.join(root, rel));
const json = rel => JSON.parse(read(rel).toString('utf8'));
const sha = b => createHash('sha256').update(b).digest('hex');
const prefix = 'assets/library/capture/creatures/golem_moussu/animations';
const catalog = json('data/assets/catalog/global-visual-assets.v1.json');
const sourceName = 'GOLEM_MOUSSU_DOS_12_COURSE_ATTAQUE_PREVIEW.zip';
const sourceSHA = 'e8045798cfaa6c8b1eb73b09687e8fb4792d8536387de407bf8c89fdc6433155';

test('Golem moussu dos12 : source réelle, catalogue unique', () => {
  assert.equal(sha(read('_incoming/' + sourceName)), sourceSHA);
  assert.equal(new Set(catalog.assets.map(x => x.id)).size, catalog.assets.length);
  assert.equal(catalog.counts.assets, catalog.assets.length);
});

for (const [action, ms, playbackMode, approval, status] of [
  ['movement', 90, 'loop', 'approved_for_ingame_trial', 'ingame_trial_pending'],
  ['attack', 110, 'once', 'approved', 'asset_approved']
]) {
  test('Golem moussu dos12 : ' + action + ' média, marges, catalogue et statut', () => {
    const folder = prefix + '/' + action + '/dos';
    const m = json(folder + '/' + action + '.manifest.json');
    const id = 'pack:capture:creature-golem-moussu-' + action + '-dos-12-v1';
    const assets = catalog.assets.filter(x => x.id === id);
    assert.equal(assets.length, 1, 'assetId unique');
    const asset = assets[0];
    assert.equal(m.schema, 'capture-creature-animation-v1');
    assert.equal(m.creatureId, 'golem_moussu');
    assert.equal(m.action, action);
    assert.equal(m.view, 'dos');
    assert.equal(m.assetId, id);
    assert.equal(m.authorApproved, true);
    assert.equal(m.approvalStatus, approval);
    assert.equal(m.status, status);
    assert.equal(m.frameCount, 12);
    assert.deepEqual(m.frameSize, [512,512]);
    assert.equal(m.frameMs, ms);
    assert.equal(m.playbackMode, playbackMode);
    assert.equal(m.frames.length, 12);
    assert.equal(m.sourceArchiveSha256, sourceSHA);
    assert.equal(asset.resource.frameCount, 12);
    assert.equal(asset.resource.frameMs, ms);
    assert.equal(asset.resource.playbackMode, playbackMode);
    assert.equal(asset.resource.format, 'sprite-strip');
    assert.equal(asset.resource.file,
      'capture/creatures/golem_moussu/animations/' + action + '/dos/' + m.atlas.file);

    const frameHashes = new Set();
    m.frames.forEach((f,i) => {
      assert.equal(f.index, i);
      assert.equal(f.file,
        'frames/golem_moussu_' + action + '_dos_' + String(i+1).padStart(2,'0') + '.png');
      const png = read(folder + '/' + f.file);
      assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.equal(png.toString('ascii',12,16),'IHDR');
      assert.equal(png.readUInt32BE(16),512);
      assert.equal(png.readUInt32BE(20),512);
      assert.equal(png[24],8);
      assert.equal(png[25],6);
      assert.equal(sha(png),f.sha256);
      assert.equal(f.marginsLTRB.length,4);
      assert.ok(Math.min(...f.marginsLTRB) >= 40);
      frameHashes.add(f.sha256);
    });
    assert.equal(frameHashes.size,12,'12 frames distinctes');
    const atlas = read(folder + '/' + m.atlas.file);
    assert.equal(atlas.toString('ascii',0,4),'RIFF');
    assert.equal(atlas.toString('ascii',8,12),'WEBP');
    assert.equal(m.atlas.format,'sprite-strip');
    assert.equal(m.atlas.frameCount,12);
    assert.equal(m.atlas.frameWidth,384);
    assert.equal(m.atlas.frameHeight,384);
    assert.equal(sha(atlas),m.atlas.sha256);
    assert.match(read(folder + '/' + m.preview).toString('ascii',0,6), /^GIF8[79]a$/);
    const previewWebp = read(folder + '/' + m.previews.webp);
    assert.equal(previewWebp.toString('ascii',0,4),'RIFF');
    assert.equal(previewWebp.toString('ascii',8,12),'WEBP');
  });
}

test('Golem moussu dos12 : tous les modèles officiels et vues face conservés', () => {
  for (const side of ['opponent','player','icon']) {
    const id = 'pack:capture:creature-golem-moussu-' + side + '-01';
    const item = catalog.assets.find(x => x.id === id);
    assert.ok(item,id);
    assert.match(item.resource.file,/^capture\/creatures\/golem_moussu\/runtime\//);
    assert.ok(read('assets/library/' + item.resource.file).length > 1000);
  }
  for (const action of ['movement','attack']) {
    const id = 'pack:capture:creature-golem-moussu-' + action + '-face-12-v1';
    const asset = catalog.assets.find(x => x.id === id);
    assert.ok(asset,id);
    assert.ok(read('assets/library/' + asset.resource.file).length > 1000);
  }
  for (const action of ['movement','attack']) for (const view of ['face','dos']) {
    const id = 'pack:capture:creature-loup-volcanique-' + action + '-' + view + '-12-v1';
    const asset = catalog.assets.find(x => x.id === id);
    assert.ok(asset,id);
    assert.ok(read('assets/library/' + asset.resource.file).length > 1000);
  }
});
