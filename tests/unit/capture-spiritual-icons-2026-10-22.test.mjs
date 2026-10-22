import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const library = resolve(root, 'assets/library');
const manifest = JSON.parse(readFileSync(resolve(library, 'capture/icons/skills/capture_spiritual_icons_2026_10_22.provenance.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(resolve(root, 'data/assets/catalog/global-visual-assets.v1.json'), 'utf8'));

test('Five real spiritual icons: exact binary content, dimensions and Git provenance', () => {
 assert.equal(manifest.owner, 'global-assets');
 assert.equal(manifest.assets.length, 5);
 assert.deepEqual(manifest.runtimeDimensions,[128,128]);
 const ids = new Set();
 for (const entry of manifest.assets) {
  assert.ok(!ids.has(entry.assetId), 'Repeated logical asset');
  ids.add(entry.assetId);
  const media=resolve(library,entry.derivedFile);
  assert.ok(existsSync(media), 'Missing WebP media '+media);
  const b=readFileSync(media);
  assert.equal(b.byteLength,entry.bytes);
  assert.ok(b.length>=1500, 'Placeholder or corrupt binary '+media);
  assert.equal(b.toString('ascii',0,4),'RIFF');
  assert.equal(b.readUInt32LE(4)+8,b.length,'RIFF length');
  assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.equal(b.toString('ascii',12,16),'VP8 ');
  assert.deepEqual([b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff],[128,128]);
  assert.equal(createHash('sha256').update(b).digest('hex'),entry.derivedSha256);
  assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),entry.gitBlobSHA);
 }
});
test('Five stable catalog assets with no collisions; previous assets protected',()=>{
 assert.equal(catalog.storage.branch,'global-assets');
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 assert.equal(catalog.assets.length,catalog.counts.assets);
 assert.equal(catalog.assets.filter(a=>a.assetType==='icon').length,catalog.counts.icons);
 for (const item of manifest.assets) {
  const entries = catalog.assets.filter(a=>a.id===item.assetId);
  assert.equal(entries.length,1,item.assetId);
  const a=entries[0];
  assert.equal(a.assetType,'icon');
  assert.equal(a.category,'skill');
  assert.equal(a.resource.file,item.derivedFile);
  assert.equal(a.resource.mime,'image/webp');
  assert.equal(a.source.packId,'capture');
  for(const use of ['capture','combat','editor'])assert.ok(a.compatibility.uses.includes(use));
  assert.ok(existsSync(resolve(library,a.resource.file)));
 }
 assert.ok(catalog.assets.some(a=>a.id==='pack:capture:icon-skill-miroir-magique-01'));
 assert.ok(catalog.assets.some(a=>a.id==='pack:capture:icon-skill-drain-de-vie-01'));
});
