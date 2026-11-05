import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {importCaptureTransferJsonV1} from '../../src/adapters/input/capture/capture-entity-transfer-v1.js';
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from '../../src/catalogs/capture-showcase-creature-presets-v1.js';
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from '../../src/catalogs/capture-showcase-skill-presets-v1.js';
const root='../..';
const pathFor=id=>'data/capture/showcase/'+id+'.capture-skill-transfer-v1.json';
const read=path=>readFileSync(new URL('../../'+path,import.meta.url));
const ids=['fireball','boule_neige','poing_givrant','mur_de_glace','pique_glace','furie_bestiale'];
const sourceSha={
 'gorice.capture-creature-transfer-v1.json':'cba678896aa490ed2b2d9e0c5d12a84bf8129b50',
 'boule_neige.capture-skill-transfer-v1.json':'7941b82c8a5014e541b1f73522c2a8131f9bed3a',
 'poing_givrant.capture-skill-transfer-v1.json':'d749b92bec01e7775a8941a2f7257524c362bb1e',
 'mur_de_glace.capture-skill-transfer-v1.json':'11ec493e413b57982a2b4b0143a0ef67bb4fbed5',
 'pique_glace.capture-skill-transfer-v1.json':'b029690120d433f9d6760b13c6c2cabb01319948',
 'furie_bestiale.capture-skill-transfer-v1.json':'ff757ebe5682e93072a03a9625efb61f7ae99eaa'
};
const blobHash=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
test('author-approved Gorice V9 uses identical file and one official creature catalog entry',()=>{
 const path='data/capture/showcase/gorice.capture-creature-transfer-v1.json';
 const bytes=read(path),draft=JSON.parse(bytes).draft;
 assert.equal(blobHash(bytes),sourceSha['gorice.capture-creature-transfer-v1.json']);
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===path).length,1);
 assert.equal(draft.id,'gorice');
 assert.deepEqual(draft.skillIds,ids);
 assert.equal(draft.presentation.version,9);
 assert.equal(draft.presentation.viewOverrides.player.displayScale,1.5);
 assert.equal(draft.presentation.viewOverrides.opponent.displayScale,0.8);
 assert.equal(importCaptureTransferJsonV1(bytes.toString()).kind,'creature');
});
test('all six Gorice skills are resolved by one official Combat main catalogue, not a shadow source',()=>{
 const skillFiles=ids.map(pathFor);
 for(const path of skillFiles){
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===path).length,1,
   'missing or duplicate official skill in main: '+path);
  const bytes=read(path);
  const name=path.split('/').at(-1);
  if(sourceSha[name])assert.equal(blobHash(bytes),sourceSha[name],'approved author bytes drift: '+name);
  const imported=importCaptureTransferJsonV1(bytes.toString());
  assert.equal(imported.kind,'skill');
  assert.ok(imported.value?.draft?.definition);
 }
 const wall=JSON.parse(read(pathFor('mur_de_glace'))).draft;
 assert.equal(wall.definition.cooldownMs,45000);
 assert.equal(wall.definition.element,'ice');
 assert.equal(wall.presentation.version,3);
});
test('main does not embed any new asset library or copy the published editor branch',()=>{
 const all=[...CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1,...CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1];
 assert.equal(new Set(all).size,all.length,'published presets must have unique ownership');
 assert.ok(!all.some(path=>path.includes('gh-pages')||path.includes('assets/library')));
});
