import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('../../', import.meta.url);
const read = p => readFileSync(new URL(p,root));
const catalog = JSON.parse(read('data/assets/catalog/global-visual-assets.v1.json'));
for(const name of ['requin','scarabacier','venombre']){
  test(name+' : trois visuels réels et références uniques',()=>{
    const meta=JSON.parse(read('assets/library/capture/creatures/'+name+'/'+name+'.meta.json'));
    for(const role of ['player','opponent','icon']){
      const id='pack:capture:creature-'+name+'-'+role+'-01';
      const hit=catalog.assets.filter(a=>a.id===id);
      assert.equal(hit.length,1);
      const resource=hit[0].resource.file;
      assert.equal(resource,'capture/creatures/'+name+'/runtime/'+name+'_'+role+'.webp');
      assert.equal(meta.assetIds[role],id);
      const binary=read('assets/library/'+resource);
      assert.ok(binary.length>3000,'real image bytes');
      assert.equal(binary.toString('ascii',0,4),'RIFF');
      assert.equal(binary.toString('ascii',8,12),'WEBP');
      assert.equal(binary.toString('ascii',12,16),'VP8X');
      const width=1+binary.readUIntLE(24,3);
      const height=1+binary.readUIntLE(27,3);
      const size=role==='icon'?384:1024;
      assert.equal(width,size);
      assert.equal(height,size);
      assert.ok((binary[20]&0x10)!==0,'alpha channel in VP8X');
    }
  });
}
