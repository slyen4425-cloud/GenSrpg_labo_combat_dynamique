import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = resolve(root,'assets/library/capture/icons/skills/capture_simple_icons_2026_10_17.provenance.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const catalog = JSON.parse(readFileSync(resolve(root,'data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
const expected = ['poison','toxine','dard_electrique','fleuraison','brulure','gel','paralysie','bulle_de_feu'];

test('Capture simplified icon originals: real 8 transparent WebP files, exact provenance and 128px dimensions',()=>{
 assert.equal(manifest.owner,'global-assets');
 assert.equal(manifest.assets.length,8);
 assert.deepEqual(manifest.runtimeDimensions,[128,128]);
 for (const [index,item] of manifest.assets.entries()){
  assert.equal(item.derivedFile,'capture/icons/skills/icon_skill_'+expected[index]+'_01.webp');
  const p=resolve(root,'assets/library',item.derivedFile);
  assert.ok(existsSync(p),'Missing actual media '+p);
  const b=readFileSync(p);
  assert.equal(b.byteLength,item.bytes);
  assert.ok(b.byteLength>2000,'Not a placeholder '+p);
  assert.equal(b.toString('ascii',0,4),'RIFF');
  assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.equal(b.toString('ascii',12,16),'VP8X');
  assert.equal(b[20]&16,16,'WebP alpha required');
  assert.deepEqual([1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)],[128,128]);
  assert.equal(createHash('sha256').update(b).digest('hex'),item.derivedSha256);
  const h=createHash('sha1').update('blob '+b.length+'\\0').update(b).digest('hex');
  assert.equal(h,item.gitBlobSHA,'Verify REAL bytes against expected Git blob SHA');
 }
 assert.equal(new Set(manifest.assets.map(a=>a.assetId)).size,8);
});
test('Capture simplified icons: eight canonically catalogued stable assetIds, no duplicate owner',()=>{
 assert.equal(catalog.storage.branch,'global-assets');
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(catalog.counts.icons,catalog.assets.filter(a=>a.assetType==='icon').length);
 assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
 for(const item of manifest.assets){
  const entries=catalog.assets.filter(x=>x.id===item.assetId);
  assert.equal(entries.length,1);
  const a=entries[0];
  assert.equal(a.assetType,'icon');
  assert.equal(a.category,'skill');
  assert.equal(a.source.packId,'capture');
  assert.equal(a.resource.mime,'image/webp');
  assert.equal(a.resource.file,item.derivedFile);
  for (const use of ['combat','capture','editor']) assert.ok(a.compatibility.uses.includes(use));
  assert.ok(existsSync(resolve(root,'assets/library',a.resource.file)));
 }
 assert.ok(catalog.assets.some(x=>x.id==='pack:capture:icon-skill-energy-blossom-01'),'Do not remove Fleuraison énergie');
});
