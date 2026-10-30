import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCaptureAuthorTabFromUrlV1} from '../../src/ui/capture-editor-deep-link-v1.js';
test('official editor selects its existing native Creature, Skill and Combat tabs by safe URL',()=>{
 const clicked=[];
 const root={querySelector(selector){
  const match=/^\\[data-editor-tab="(creature|skills|combat)"\\]$/.exec(selector);
  return match?{click(){clicked.push(match[1]);}}:null;
 }};
 for(const tab of ['creature','skills','combat']){
  assert.equal(applyCaptureAuthorTabFromUrlV1({root,href:'https://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/examples/dom-demo/capture-editor-v2.html?tab='+tab}),true);
 }
 assert.deepEqual(clicked,['creature','skills','combat']);
});
test('unknown URL tab cannot dispatch arbitrary selectors or mutate an authoring view',()=>{
 const clicked=[];const root={querySelector(selector){clicked.push(selector);return {click(){throw Error('must not click');}};}};
 for(const tab of ['unknown','music','creature%22%5D','__proto__']){
  assert.equal(applyCaptureAuthorTabFromUrlV1({root,href:'https://slyen4425-cloud.github.io/x?tab='+tab}),false);
 }
 assert.equal(applyCaptureAuthorTabFromUrlV1({root,href:'https://slyen4425-cloud.github.io/x'}),false);
 assert.deepEqual(clicked,[]);
});
