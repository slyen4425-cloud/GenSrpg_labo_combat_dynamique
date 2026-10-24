import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const bytes=p=>readFileSync(path.join(root,p));
const json=p=>JSON.parse(bytes(p).toString('utf8'));
const sha=p=>createHash('sha256').update(bytes(p)).digest('hex');
const base='assets/library/capture/creatures/guepe_cybernetique/animations/';
const cat=json('data/assets/catalog/global-visual-assets.v1.json');
const zip='_incoming/GUEPE_CYBERNETIQUE_MOUVEMENT_ATTAQUE_12F_NETTOYES.zip';
const zipSha='3912ff41f69f0e999ee47abf834030e19f2a991ec30ede72cad26156515f4923';
test('Approved cleaned ZIP, unique catalogue and original models untouched',()=>{
  assert.equal(sha(zip),zipSha);
  assert.equal(cat.counts.assets,cat.assets.length);
  assert.equal(new Set(cat.assets.map(a=>a.id)).size,cat.assets.length);
  const meta=json('assets/library/capture/creatures/guepe_cybernetique/guepe_cybernetique.meta.json');
  assert.equal(meta.id,'guepe_cybernetique');
  for(const role of ['player','opponent','icon']){
    const id='pack:capture:creature-guepe-cybernetique-'+role+'-01';
    const original=cat.assets.find(a=>a.id===id);
    assert.ok(original);assert.match(original.resource.file,/^capture\/creatures\/guepe_cybernetique\/runtime\//);
    assert.ok(bytes('assets/library/'+original.resource.file).length>1000);
  }
});
for(const [action,mode] of [['movement','loop'],['attack','once']]){
 test('Guêpe cybernétique '+action+' player: 12 original 512x512 PNGs, atlas, 3 previews',()=>{
  const dir=base+action+'/player/';
  const m=json(dir+action+'.manifest.json');
  const id='pack:capture:creature-guepe-cybernetique-'+action+'-player-12-v1';
  const asset=cat.assets.filter(a=>a.id===id);
  assert.equal(asset.length,1);assert.equal(m.assetId,id);
  assert.equal(m.creatureId,'guepe_cybernetique');
  assert.equal(m.view,'player');assert.equal(m.action,action);
  assert.equal(m.frameCount,12);assert.deepEqual(m.frameSize,[512,512]);
  assert.equal(m.frameMs,100);assert.equal(m.playbackMode,mode);
  assert.equal(m.authorApproved,true);assert.equal(m.sourceArchiveSha256,zipSha);
  assert.equal(m.frames.length,12);
  assert.match(m.cleanup,/artifact/i);
  const unique=new Set();
  for(const [i,f] of m.frames.entries()){
    const p=dir+f.file,b=bytes(p);
    assert.equal(f.index,i);
    assert.equal(f.sha256,sha(p));
    assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(b.toString('ascii',12,16),'IHDR');
    assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);
    assert.equal(b[24],8);assert.equal(b[25],6);
    assert.ok(Math.min(...f.marginsLTRB)>=70);
    unique.add(f.sha256);
  }
  assert.equal(unique.size,12);
  assert.equal(asset[0].resource.file,
    'capture/creatures/guepe_cybernetique/animations/'+action+'/player/'+m.atlas.file);
  assert.equal(asset[0].resource.frameCount,12);
  assert.equal(asset[0].resource.frameMs,100);
  assert.equal(asset[0].resource.playbackMode,mode);
  assert.equal(asset[0].resource.format,'sprite-strip');
  const atlas=bytes(dir+m.atlas.file);
  assert.equal(atlas.toString('ascii',0,4),'RIFF');
  assert.equal(atlas.toString('ascii',8,12),'WEBP');
  assert.equal(sha(dir+m.atlas.file),m.atlas.sha256);
  assert.equal(m.atlas.frameWidth,384);assert.equal(m.atlas.frameHeight,384);
  assert.equal(m.atlas.frameCount,12);
  assert.match(bytes(dir+m.previews.gif).toString('ascii',0,6),/^GIF8[79]a$/);
  assert.equal(bytes(dir+m.previews.webp).toString('ascii',0,4),'RIFF');
  assert.equal(bytes(dir+m.previews.planche).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 });
}
test('Cleaning provenance preserved',()=>{
 const p=json(base+'sources/guepe_cybernetique_player12_cleaning_manifest.json');
 assert.match(p.correction,/remove detached glow fragments/);
 for(const fr of ['mouvement','attaque']){
   assert.equal(p.sprites[fr].count,12);
   assert.ok(p.sprites[fr].stats.some(x=>x.removed_nontrivial_pixels>0));
   assert.ok(p.sprites[fr].stats.every(x=>x.color_pixel_changes_within_core===0));
 }
});
