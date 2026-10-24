import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const load=p=>readFileSync(resolve(root,p));
const hash=b=>createHash('sha256').update(b).digest('hex');
const git=b=>createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');
const prov=JSON.parse(load('assets/library/capture/creatures/venombre/venombre_visual_refresh_2026_10_24.provenance.json'));
const cat=JSON.parse(load('data/assets/catalog/global-visual-assets.v1.json'));
const meta=JSON.parse(load('assets/library/capture/creatures/venombre/venombre.meta.json'));
test('Venombre approved front and corrected rear real transparent WebP files preserve canonical bindings',()=>{
 assert.equal(prov.assets.length,2); assert.equal(new Set(cat.assets.map(a=>a.id)).size,cat.assets.length);
 assert.equal(cat.counts.assets,cat.assets.length);
 for(const it of prov.assets){
  const matches=cat.assets.filter(a=>a.id===it.id); assert.equal(matches.length,1,it.id);
  const def=matches[0]; assert.equal(def.resource.file,it.file); assert.equal(def.resource.mime,'image/webp');
  assert.equal(meta.assetIds[it.role],it.id);assert.equal(meta.views[it.role],'runtime/venombre_'+it.role+'.webp');
  const b=load('assets/library/'+it.file);assert.equal(b.length,it.bytes);
  assert.equal(hash(b),it.sha256);assert.equal(git(b),it.gitBlobSHA);assert.notEqual(git(b),it.previousGitBlobSHA);
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.equal(b.toString('ascii',12,16),'VP8X');assert.ok(b[20]&16,'alpha flag required');
  const w=(b[24]|b[25]<<8|b[26]<<16)+1, h=(b[27]|b[28]<<8|b[29]<<16)+1;
  assert.equal(w,1024);assert.equal(h,1024);
 }
 assert.equal(git(load('assets/library/capture/creatures/venombre/runtime/venombre_icon.webp')),prov.protectedGitBlobs['assets/library/capture/creatures/venombre/runtime/venombre_icon.webp']);
 assert.equal(git(load('assets/library/capture/creatures/venombre/venombre.meta.json')),prov.protectedGitBlobs['assets/library/capture/creatures/venombre/venombre.meta.json']);
 assert.equal(meta.assetIds.icon,'pack:capture:creature-venombre-icon-01');
});
