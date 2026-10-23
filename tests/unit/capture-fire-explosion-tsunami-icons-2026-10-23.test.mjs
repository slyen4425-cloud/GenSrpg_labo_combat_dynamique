import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const catalog=JSON.parse(readFileSync(resolve(root,'data/assets/catalog/global-visual-assets.v1.json'), 'utf8'));
const manifest=JSON.parse(readFileSync(resolve(root,'assets/library/capture/icons/skills/capture_fire_explosion_tsunami_2026_10_23.provenance.json'), 'utf8'));
test('Two genuine approved framed fire and water icons, catalog and file digests',()=>{
 assert.equal(manifest.assets.length,2);
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.icons,catalog.assets.filter(a=>a.assetType==='icon').length);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 for(const item of manifest.assets){
  const a=catalog.assets.find(v=>v.id===item.assetId);
  assert.ok(a,item.assetId);
  assert.equal(a.assetType,'icon'); assert.equal(a.category,'skill');
  assert.ok(a.compatibility.uses.includes('editor'));
  assert.equal(a.resource.file,item.derivedFile);
  assert.equal(a.resource.mime,'image/webp');
  const b=readFileSync(resolve(root,catalog.storage.libraryRoot,a.resource.file));
  assert.equal(b.length,item.bytes);
  assert.equal(createHash('sha256').update(b).digest('hex'),item.derivedSha256);
  assert.equal(createHash('sha1').update(Buffer.from(`blob ${b.length}\\0`)).update(b).digest('hex'),item.gitBlobSHA);
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.equal(b.toString('ascii',12,16),'VP8 ');
  assert.equal(b.readUInt16LE(26)&0x3fff,128);
  assert.equal(b.readUInt16LE(28)&0x3fff,128);
 }
});
