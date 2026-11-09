import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(resolve(root,p));
const sha256=b=>createHash('sha256').update(b).digest('hex');
const git=b=>createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');
test('80 approved future Capture icons have unique real 128px WebPs and canonical IDs',()=>{
 const prov=JSON.parse(read('assets/library/capture/icons/skills/capture_future_80_icons_2026_11_09.provenance.json'));
 const cat=JSON.parse(read('data/assets/catalog/global-visual-assets.v1.json'));
 assert.equal(prov.assets.length,80);
 assert.deepEqual(prov.assets.map(a=>a.number),Array.from({length:80},(_,i)=>i+1));
 assert.equal(cat.storage.branch,'global-assets');
 assert.equal(cat.counts.assets,cat.assets.length);
 assert.equal(cat.counts.icons,cat.assets.filter(a=>a.assetType==='icon').length);
 assert.equal(new Set(cat.assets.map(a=>a.id)).size,cat.assets.length);
 assert.equal(new Set(prov.assets.map(a=>a.sha256)).size,80);
 for(const v of prov.assets){
  const matches=cat.assets.filter(a=>a.id===v.assetId);
  assert.equal(matches.length,1,v.assetId);
  const a=matches[0];
  assert.equal(a.label,v.label);assert.equal(a.assetType,'icon');assert.equal(a.category,'skill');
  assert.equal(a.resource.file,v.resource);assert.equal(a.resource.mime,'image/webp');
  assert.ok(a.compatibility.uses.includes('editor'));
  const b=read('assets/library/'+v.resource);
  assert.equal(b.length,v.bytes);assert.equal(sha256(b),v.sha256);assert.equal(git(b),v.gitBlobSHA);
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.equal(b.toString('ascii',12,16),'VP8 ');
  assert.equal(b.readUInt16LE(26)&0x3fff,128);assert.equal(b.readUInt16LE(28)&0x3fff,128);
 }
});