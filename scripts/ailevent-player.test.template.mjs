import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const b=p=>readFileSync(path.join(root,p)),j=p=>JSON.parse(b(p).toString('utf8')),sha=p=>createHash('sha256').update(b(p)).digest('hex');
const c=j('data/assets/catalog/global-visual-assets.v1.json');
test('Original upload and approved player replacement',()=>{
 assert.equal(sha('_incoming/AILEVENT_DOS_2_ANIMATIONS_PLUS_MODELE_JOUEUR.zip'),'5a72b3644c8bc99ffe7f00c39f51551398824ca0d2651f9f6d7bea4f4cd25ee8');
 assert.equal(sha('assets/library/capture/creatures/ailevent/sources/ailevent_player_approved_2026-10-25.png'),'ab45843596adba23fd2b20a8383deb938ae7baed254e3205c853f761f7af9324');
 const v=b('assets/library/capture/creatures/ailevent/runtime/ailevent_player.webp');
 assert.equal(v.toString('ascii',0,4),'RIFF');assert.equal(v.toString('ascii',8,12),'WEBP');
 assert.equal(c.counts.assets,c.assets.length);
 assert.equal(new Set(c.assets.map(x=>x.id)).size,c.assets.length);
 for(const side of ['opponent','icon']){assert.ok(b('assets/library/capture/creatures/ailevent/runtime/ailevent_'+side+'.webp').length>1000)}
});
for(const [act,n,mode] of [['movement',10,'loop'],['attack',12,'once']]){
 test('Real '+n+' Ailevent '+act+' player animation PNG, atlas and previews',()=>{
 const root='assets/library/capture/creatures/ailevent/animations/'+act+'/player/';
 const m=j(root+act+'.manifest.json');
 const id='pack:capture:creature-ailevent-'+act+'-player-'+n+'-v1',a=c.assets.filter(x=>x.id===id);
 assert.equal(a.length,1);assert.equal(m.frameCount,n);assert.equal(m.playbackMode,mode);assert.equal(m.view,'player');
 assert.deepEqual(m.frameSize,[512,512]);assert.equal(m.frames.length,n);
 for(const [i,f] of m.frames.entries()){
   const q=root+f.file,p=b(q);assert.equal(f.index,i);
   assert.equal(p.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(p.readUInt32BE(16),512);assert.equal(p.readUInt32BE(20),512);
   assert.equal(p[25],6);assert.equal(sha(q),f.sha256);
 }
 assert.equal(a[0].resource.file,'capture/creatures/ailevent/animations/'+act+'/player/'+m.atlas.file);
 assert.equal(sha(root+m.atlas.file),m.atlas.sha256);
 assert.equal(b(root+m.previews.webp).toString('ascii',0,4),'RIFF');
 assert.match(b(root+m.previews.gif).toString('ascii',0,6),/^GIF8/);
 });
}