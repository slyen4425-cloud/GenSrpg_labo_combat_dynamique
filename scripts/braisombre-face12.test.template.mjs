import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const bytes=rel=>readFileSync(path.join(root,rel));
const json=rel=>JSON.parse(bytes(rel).toString('utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const catalog=json('data/assets/catalog/global-visual-assets.v1.json');
const prefix='assets/library/capture/creatures/braisombre/animations';
const zipName='BRAISOMBRE_FACE_12_VOL_ATTAQUE_GITHUB_2026-10-22.zip';
const zipSha='f4755d166a82116d972e5d88ae4b52be348730dcb6a4c0deb186f17c61417424';

test('Braisombre: archive réelle, SHA stable et IDs uniques',()=>{
  assert.equal(hash(bytes('_incoming/'+zipName)),zipSha);
  assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
  assert.equal(catalog.counts.assets,catalog.assets.length);
});
for(const [action,ms,mode] of [['movement',90,'loop'],['attack',100,'once']]){
  test('Braisombre '+action+' face12 : 12 PNG authentiques + atlas + previews',()=>{
    const base=prefix+'/'+action+'/face';
    const manifest=json(base+'/'+action+'.manifest.json');
    const id='pack:capture:creature-braisombre-'+action+'-face-12-v1';
    const assets=catalog.assets.filter(a=>a.id===id);
    assert.equal(assets.length,1);
    const asset=assets[0];
    assert.equal(manifest.creatureId,'braisombre');
    assert.equal(manifest.action,action);
    assert.equal(manifest.view,'face');
    assert.equal(manifest.assetId,id);
    assert.equal(manifest.frameCount,12);
    assert.deepEqual(manifest.frameSize,[512,512]);
    assert.equal(manifest.frameMs,ms);
    assert.equal(manifest.playbackMode,mode);
    assert.equal(manifest.frames.length,12);
    assert.equal(asset.resource.file,
      'capture/creatures/braisombre/animations/'+action+'/face/'+manifest.atlas.file);
    assert.equal(asset.resource.frameCount,12);
    assert.equal(asset.resource.frameMs,ms);
    assert.equal(asset.resource.playbackMode,mode);
    assert.equal(asset.resource.format,'sprite-strip');
    const hashes=new Set();
    manifest.frames.forEach((f,i)=>{
      assert.equal(f.index,i);
      assert.equal(f.file,'frames/braisombre_'+action+'_face_'+String(i+1).padStart(2,'0')+'.png');
      const im=bytes(base+'/'+f.file);
      assert.equal(im.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.equal(im.toString('ascii',12,16),'IHDR');
      assert.equal(im.readUInt32BE(16),512);
      assert.equal(im.readUInt32BE(20),512);
      assert.equal(im[24],8);
      assert.equal(im[25],6);
      assert.equal(hash(im),f.sha256);
      assert.ok(Math.min(...f.marginsLTRB)>=48);
      hashes.add(f.sha256);
    });
    assert.equal(hashes.size,12);
    const atlas=bytes(base+'/'+manifest.atlas.file);
    assert.equal(atlas.toString('ascii',0,4),'RIFF');
    assert.equal(atlas.toString('ascii',8,12),'WEBP');
    assert.equal(hash(atlas),manifest.atlas.sha256);
    assert.equal(manifest.atlas.frameCount,12);
    assert.equal(manifest.atlas.frameWidth,384);
    assert.equal(manifest.atlas.frameHeight,384);
    assert.match(bytes(base+'/'+manifest.previews.gif).toString('ascii',0,6),/^GIF8[79]a$/);
    assert.equal(bytes(base+'/'+manifest.previews.webp).toString('ascii',0,4),'RIFF');
    assert.equal(bytes(base+'/'+manifest.previews.planche).toString('hex',0,8),'89504e470d0a1a0a');
    const source=bytes(prefix+'/'+manifest.sourceSpriteSheet);
    assert.equal(hash(source),manifest.sourceSpriteSheetSha256);
  });
}
test('Braisombre: runtime officiel non remplacé, Golem et Loup présents',()=>{
  for(const side of ['player','opponent','icon']){
    const a=catalog.assets.find(a=>a.id==='pack:capture:creature-braisombre-'+side+'-01');
    assert.ok(a,side);
    assert.match(a.resource.file,/^capture\/creatures\/braisombre\/runtime\//);
    assert.ok(bytes('assets/library/'+a.resource.file).length>1024);
  }
  for(const creature of ['golem-moussu','loup-volcanique'])
    for(const action of ['movement','attack'])
      for(const view of ['face','dos']){
        const id='pack:capture:creature-'+creature+'-'+action+'-'+view+'-12-v1';
        const a=catalog.assets.find(a=>a.id===id);
        assert.ok(a,id);
        assert.ok(bytes('assets/library/'+a.resource.file).length>1024);
      }
});
