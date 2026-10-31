import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=(p)=>readFileSync(resolve(root,p));
const manifest=()=>JSON.parse(read('assets/library/capture/icons/skills/capture_ice_icons_2026_10_31.provenance.json').toString('utf8'));
const catalog=()=>JSON.parse(read('data/assets/catalog/global-visual-assets.v1.json').toString('utf8'));
const sha256=b=>createHash('sha256').update(b).digest('hex');
const blobSha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');
test('Four real Ice skill icons: stable IDs, real 128px WebP bytes, catalog and SHA integrity',()=>{
 const m=manifest(), c=catalog();
 assert.equal(m.assets.length,4);
 assert.deepEqual(m.assets.map(x=>x.slug).sort(),['armure_de_glace','barriere_de_glace','brouillard_givrant','poing_de_givre']);
 assert.equal(c.storage.branch,'global-assets');
 assert.equal(c.counts.assets,c.assets.length);
 assert.equal(c.counts.icons,c.assets.filter(a=>a.assetType==='icon').length);
 assert.equal(new Set(c.assets.map(a=>a.id)).size,c.assets.length);
 for(const item of m.assets) {
  const matching=c.assets.filter(a=>a.id===item.assetId);assert.equal(matching.length,1,item.assetId);
  const asset=matching[0];
  assert.equal(asset.label,item.label);assert.equal(asset.resource.file,item.resource);
  assert.equal(asset.resource.mime,'image/webp'); assert.equal(asset.assetType,'icon');assert.equal(asset.category,'skill');
  assert.ok(asset.tags.includes('ice'));assert.ok(asset.compatibility.uses.includes('editor'));
  const bytes=read('assets/library/'+asset.resource.file);
  assert.equal(bytes.length,item.bytes);
  assert.equal(sha256(bytes),item.webpSha256);assert.equal(blobSha(bytes),item.gitBlobSHA);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.toString('ascii',12,16),'VP8 ');
  assert.equal(bytes.readUInt16LE(26)&0x3fff,128); assert.equal(bytes.readUInt16LE(28)&0x3fff,128);
 }
});
