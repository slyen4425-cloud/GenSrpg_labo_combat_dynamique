import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = path => readFileSync(resolve(root, path));
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
const git = buffer => createHash('sha1').update(Buffer.from('blob ' + buffer.length + String.fromCharCode(0))).update(buffer).digest('hex');
const provenanceFile = 'assets/library/capture/icons/skills/capture_nature_icons_2026_10_29.provenance.json';

test('three Nature skill icons have real verified WebP bytes and canonical editor IDs', () => {
  const manifest = JSON.parse(load(provenanceFile).toString('utf8'));
  const catalog = JSON.parse(load('data/assets/catalog/global-visual-assets.v1.json').toString('utf8'));
  assert.equal(manifest.items.length, 3);
  assert.deepEqual(manifest.items.map(i => i.slug).sort(), ['graine_de_vie','ronce','spore_soporifique']);
  assert.equal(catalog.storage.branch, 'global-assets');
  assert.equal(catalog.counts.assets, catalog.assets.length);
  assert.equal(catalog.counts.icons, catalog.assets.filter(a => a.assetType === 'icon').length);
  assert.equal(new Set(catalog.assets.map(a => a.id)).size, catalog.assets.length);
  for (const item of manifest.items) {
    const matching = catalog.assets.filter(a => a.id === item.assetId);
    assert.equal(matching.length, 1, item.assetId);
    const asset = matching[0];
    assert.equal(asset.label, item.label);
    assert.equal(asset.resource.file, item.catalogResource);
    assert.equal(asset.resource.mime, 'image/webp');
    assert.equal(asset.assetType, 'icon');
    assert.equal(asset.category, 'skill');
    assert.ok(asset.tags.includes('nature'));
    assert.ok(asset.compatibility.uses.includes('editor'));
    const buffer = load('assets/library/' + asset.resource.file);
    assert.equal(buffer.length, item.webpBytes);
    assert.equal(sha(buffer), item.webpSHA256);
    assert.equal(git(buffer), item.gitBlobSHA);
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
    assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
    assert.equal(buffer.toString('ascii', 12, 16), 'VP8 ');
    assert.equal(buffer.readUInt16LE(26) & 0x3fff, 128);
    assert.equal(buffer.readUInt16LE(28) & 0x3fff, 128);
  }
});
