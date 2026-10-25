import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const b=p=>readFileSync(path.join(root,p));const j=p=>JSON.parse(b(p).toString('utf8'));
const sha=p=>createHash('sha256').update(b(p)).digest('hex');
const catalog=j('data/assets/catalog/global-visual-assets.v1.json');
const dir='assets/library/capture/creatures/guepe_cybernetique/animations/';
const sh='082eb38273f46f306fef3076bfac287985a3bc38d057e00c8e5e51a04a48b4fa';
test('Source and original models untouched',()=>{
 assert.equal(sha('_incoming/GUEPE_CYBERNETIQUE_FACE_MOUVEMENT_ATTAQUE_12F_NETTOYES.zip'),sh);
 assert.equal(catalog.counts.assets,catalog.assets.length);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
 for(const role of ['player','opponent','icon']){
  const x=catalog.assets.find(a=>a.id==='pack:capture:creature-guepe-cybernetique-'+role+'-01');
  assert.ok(x);assert.ok(b('assets/library/'+x.resource.file).length>1000);
 }
 for(const action of ['movement','attack']){
  const x=catalog.assets.find(a=>a.id==='pack:capture:creature-guepe-cybernetique-'+action+'-player-12-v1');
  assert.ok(x);assert.ok(b('assets/library/'+x.resource.file).length>1000);
 }
});
for(const [action,mode] of [['movement','loop'],['attack','once']]){
 test('Guêpe face '+action+' actual 12 RGBA sprites atlas and previews',()=>{
 const root=dir+action+'/opponent/',m=j(root+action+'.manifest.json');
 const id='pack:capture:creature-guepe-cybernetique-'+action+'-opponent-12-v1';
 const arr=catalog.assets.filter(x=>x.id===id);assert.equal(arr.length,1);
 assert.equal(m.assetId,id);assert.equal(m.view,'opponent');assert.equal(m.frameCount,12);
 assert.deepEqual(m.frameSize,[512,512]);assert.equal(m.frameMs,100);assert.equal(m.playbackMode,mode);
 assert.equal(m.sourceArchiveSha256,sh);assert.equal(m.frames.length,12);
 const uniq=new Set();
 m.frames.forEach((f,i)=>{const p=root+f.file,raw=b(p);assert.equal(f.index,i);
 assert.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(raw.readUInt32BE(16),512);assert.equal(raw.readUInt32BE(20),512);
 assert.equal(raw[24],8);assert.equal(raw[25],6);
 assert.equal(sha(p),f.sha256);assert.ok(Math.min(...f.marginsLTRB)>=65);uniq.add(f.sha256)});
 assert.equal(uniq.size,12);
 const atlas=b(root+m.atlas.file);
 assert.equal(atlas.toString('ascii',0,4),'RIFF');assert.equal(atlas.toString('ascii',8,12),'WEBP');
 assert.equal(sha(root+m.atlas.file),m.atlas.sha256);
 assert.equal(m.atlas.frameWidth,384);assert.equal(m.atlas.frameHeight,384);
 assert.equal(arr[0].resource.frameCount,12);
 assert.equal(arr[0].resource.file,'capture/creatures/guepe_cybernetique/animations/'+action+'/opponent/'+m.atlas.file);
 assert.match(b(root+m.previews.gif).toString('ascii',0,6),/^GIF8[79]a$/);
 assert.equal(b(root+m.previews.webp).toString('ascii',0,4),'RIFF');
 assert.equal(b(root+m.previews.planche).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 });
}
