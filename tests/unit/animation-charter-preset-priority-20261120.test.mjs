import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const charter=read('docs/LAB_CHARTE.md');
const visual=read('docs/LAB_CAPTURE_CHARTE_MODELES_ANIMATIONS_ICONES_V1.md');
const horse=read('atelier-animations/styles/cheval/README.md');
const manifest=JSON.parse(read('atelier-animations/styles/cheval/references/raiiven/manifest.json'));

test('charte : référence sélectionnée prévaut sur les anciens quotas de frames',()=>{
 assert.match(charter,/priorité de l'Atelier des animations/);
 assert.match(charter,/si le modèle choisi en comporte 6, produire \*\*6 frames/);
 assert.match(charter,/sans standard sélectionné, définir le découpage avec l'auteur/i);
 assert.match(visual,/Même séquence choisie = même nombre exact de frames/);
 assert.match(visual,/Nombre exact de la séquence du standard sélectionné/);
 assert.doesNotMatch(visual,/\| Longueur standard \| \*\*16 à 20 frames\*\*/);
 assert.doesNotMatch(visual,/\[ \] 16–20 frames par vue/);
});

test('le modèle Raiiven prescrit 7/5/6/5 selon action ET vue, sans modifier ses médias',()=>{
 assert.equal(manifest.styleId,'cheval');
 const atlases=manifest.assets.filter(x=>x.kind==='atlas');
 assert.equal(atlases.length,4);
 const key=x=>x.view+':'+x.action;
 const actual=Object.fromEntries(atlases.map(x=>[key(x),x.frameCount]));
 assert.deepEqual(actual,{'dos:course':7,'dos:attaque':5,'face:course':6,'face:attaque':5});
 assert.match(horse,/galop DOS \*\*7\*\*, attaque DOS \*\*5\*\*, galop FACE \*\*6\*\*, attaque FACE \*\*5\*\*/);
 assert.match(horse,/sans ajouter de frames/);
 for(const atlas of atlases){
  assert.equal(atlas.size[0],atlas.frameCount*512);
  assert.equal(atlas.size[1],512);
 }
});

test('les exigences artistiques restent distinctes des références de mouvement',()=>{
 assert.match(charter,/maîtres approuvés de la nouvelle créature/);
 assert.match(charter,/vraie preview animée/);
 assert.match(visual,/Les maîtres FACE\/DOS de \*\*la créature cible\*\* restent obligatoires/);
 assert.match(visual,/validation auteur/);
});
