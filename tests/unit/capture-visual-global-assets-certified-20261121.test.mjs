import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const PIN='204564e5f3e0fa5081d23927ef4dfc8b74f9cc90';
const root=path.resolve(process.env.GENSRPG_VISUALS_CHECKOUT||'media-certified');
const abs=p=>path.join(root,p);
test('assets globaux 21 novembre: commit exact et seule source immuable',()=>{
 assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),PIN);
});
test('25 médias du manifeste auteur existent et correspondent au catalogue officiel sans doublons',()=>{
 const author=JSON.parse(fs.readFileSync(abs('assets/library/capture/author-uploads-20261121.manifest.json'),'utf8'));
 const catalog=JSON.parse(fs.readFileSync(abs('data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
 assert.equal(author.schema,'capture-author-media-import-v1');
 assert.equal(author.canonicalBranch,'global-assets');
 assert.equal(author.items.length,25);
 assert.equal(catalog.storage.branch,'global-assets');
 const ids=new Set(),paths=new Set();
 for(const item of author.items){
  assert.ok(!ids.has(item.id),'duplicate assetId '+item.id);ids.add(item.id);
  assert.ok(!paths.has(item.file),'duplicate image path '+item.file);paths.add(item.file);
  assert.match(item.file,/^[a-z0-9][a-z0-9\\/_.-]*\\.webp$/i);
  assert.ok(!item.file.includes('..'),'unsafe path');
  assert.ok(Number.isInteger(item.frameCount)&&item.frameCount>=1);
  const mapped=catalog.assets.filter(asset=>asset.id===item.id);
  assert.equal(mapped.length,1,'one canonical catalog entry '+item.id);
  assert.equal(mapped[0].resource.file,item.file);
  const file=fs.readFileSync(abs('assets/library/'+item.file));
  assert.ok(file.length>64,'empty media '+item.file);
  assert.equal(file.toString('ascii',0,4),'RIFF');
  assert.equal(file.toString('ascii',8,12),'WEBP');
 }
 for(const pattern of ['raiiven/fer-maudit.webp','raiiven/remanence-interdite.webp',
  'cheval-de-feu/animations/movement-player.webp','author-uploads-20261121/meteore.webp'])
  assert.ok([...paths].some(p=>p.endsWith(pattern)),pattern);
});
