import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(path.join(root,p));
const json=p=>JSON.parse(read(p).toString('utf8'));
const sha=p=>createHash('sha256').update(read(p)).digest('hex');
const c=json('data/assets/catalog/global-visual-assets.v1.json');
const dir='assets/library/capture/creatures/braisombre/animations/';
test('Original GitHub ZIP verified and catalogue IDs unique',()=>{
 assert.equal(sha('_incoming/BRAISOMBRE_DOS_12F_VOL_ATTAQUE_APPROUVE_2026-10-22.zip'),
 'e991b4e403cc40bd56a6b87577062aff3bc8fa3745eae95c04ae1e33473ea6a4');
 assert.equal(c.counts.assets,c.assets.length);
 assert.equal(new Set(c.assets.map(a=>a.id)).size,c.assets.length);
});
for(const [action,ms,mode,motion,src] of [
 ['movement',90,'loop','flight','BRAISOMBRE_DOS_VOL_12F_APPROUVE_2026-10-22.png'],
 ['attack',100,'once','attack','BRAISOMBRE_DOS_ATTAQUE_12F_APPROUVE_2026-10-22.png']]){
 test('Real RGBA + 12 distinct poses + WebP + previews '+action,()=>{
 const base=dir+action+'/dos/';
 const m=json(base+action+'.manifest.json');
 const id='pack:capture:creature-braisombre-'+action+'-dos-12-v1';
 const assets=c.assets.filter(a=>a.id===id);
 assert.equal(assets.length,1);
 assert.equal(m.assetId,id);assert.equal(m.view,'dos');assert.equal(m.frameCount,12);
 assert.deepEqual(m.frameSize,[512,512]);assert.equal(m.frameMs,ms);assert.equal(m.playbackMode,mode);
 assert.equal(m.isolation,'connected-alpha-silhouette');
 assert.equal(m.frames.length,12);
 const hashes=new Set();
 for(const [i,f] of m.frames.entries()){
   const b=read(base+f.file);
   assert.equal(f.index,i);assert.equal(f.sha256,sha(base+f.file));
   assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);
   assert.equal(b[24],8);assert.equal(b[25],6);
   assert.ok(Math.min(...f.marginsLTRB)>=64);
   assert.deepEqual(f.sourceGridCell,[i%4,Math.floor(i/4)]);
   hashes.add(f.sha256);
 }
 assert.equal(hashes.size,12);
 assert.equal(m.sourceSpriteSheet,'sources/'+src);
 assert.equal(sha(dir+'sources/'+src),m.sourceSpriteSheetSha256);
 const atlas=read(base+m.atlas.file);
 assert.equal(atlas.toString('ascii',0,4),'RIFF');
 assert.equal(atlas.toString('ascii',8,12),'WEBP');
 assert.equal(sha(base+m.atlas.file),m.atlas.sha256);
 assert.equal(m.atlas.frameWidth,384);assert.equal(m.atlas.frameHeight,384);
 assert.equal(m.atlas.frameCount,12);
 assert.equal(assets[0].resource.file,'capture/creatures/braisombre/animations/'+action+'/dos/'+m.atlas.file);
 assert.match(read(base+m.previews.gif).toString('ascii',0,6),/^GIF8[79]a$/);
 assert.equal(read(base+m.previews.webp).toString('ascii',0,4),'RIFF');
 assert.equal(read(base+m.previews.planche).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 });
}
test('Face and runtime and other species intact',()=>{
 for(const action of ['movement','attack']){
 const a=c.assets.find(a=>a.id==='pack:capture:creature-braisombre-'+action+'-face-12-v1');
 assert.ok(a);assert.ok(read('assets/library/'+a.resource.file).length>1024);
 }
 for(const side of ['player','opponent','icon']){
 const a=c.assets.find(a=>a.id==='pack:capture:creature-braisombre-'+side+'-01');
 assert.ok(a);assert.match(a.resource.file,/^capture\/creatures\/braisombre\/runtime\//);
 }
 for(const creature of ['golem-moussu','loup-volcanique'])
 for(const action of ['movement','attack'])
 for(const view of ['face','dos']){
 const id='pack:capture:creature-'+creature+'-'+action+'-'+view+'-12-v1';
 const a=c.assets.find(a=>a.id===id);assert.ok(a,id);
 assert.ok(read('assets/library/'+a.resource.file).length>1024);
 }
});