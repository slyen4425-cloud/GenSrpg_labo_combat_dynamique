import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {normalizeCaptureSkillTransferV1} from '../../src/contracts/capture-skill-transfer-v1.js';
import {normalizeCaptureCreatureTransferV1} from '../../src/contracts/capture-creature-transfer-v1.js';
import {normalizeCaptureStatRegistryV1} from '../../src/contracts/capture-stat-registry-v1.js';
const ids=["sylvorne-eclat-racinaire","sylvorne-ecorce-vivante","sylvorne-vrilles-du-sous-bois","sylvorne-seve-ancienne","sylvorne-foret-souveraine"];
const load=async file=>JSON.parse(await readFile(new URL('../../data/capture/showcase/'+file,import.meta.url),'utf8'));
test('Sylvorne five unique canonical skill contracts, five progression levels and 1 ultimate',async()=>{
 const a=[];for(const id of ids)a.push(normalizeCaptureSkillTransferV1(await load(id+'.capture-skill-transfer-v1.json')).draft);
 assert.deepEqual(a.map(x=>x.requiredLevel),[1,5,10,15,20]);assert.equal(new Set(a.map(x=>x.id)).size,5);
 assert.deepEqual(a.map(x=>x.definition.cooldownMs),[12000,32000,23000,42000,0]);
 assert.deepEqual(a.map(x=>x.definition.element),Array(5).fill('nature'));
 assert.equal(a[4].definition.maxUsesPerCombat,1);
 const mark=a[0].definition.effects.find(x=>x.kind==='apply_marker').marker;
 assert.equal(mark.maxStacks,2);assert.equal(mark.onStackThreshold.count,2);
 assert.equal(mark.onStackThreshold.effects[1].status.kind,'immobilize');
 assert.equal(a[1].definition.effects[0].status.deltaPoints,16);
 assert.equal(a[2].definition.effects.find(x=>x.kind==='apply_marker').marker.id,mark.id);
 assert.equal(a[3].definition.effects[0].amount,22);
 assert.equal(a[3].definition.effects[1].status.kind,'heal_over_time');
 assert.equal(a[4].definition.effects.find(x=>x.kind==='consume_marker').markerId,mark.id);
});
test('Sylvorne candidate is a schema-valid slow Nature/Earth tank without fake published media',async()=>{
 const reg=normalizeCaptureStatRegistryV1(JSON.parse(await readFile(new URL('../../data/capture/monster-capture-stat-registry.v1.json',import.meta.url),'utf8')));
 const c=normalizeCaptureCreatureTransferV1(await load('crea_sylvorne.capture-creature-transfer-v1.json'),reg);
 assert.equal(c.draft.displayName,'Sylvorne');assert.deepEqual(c.draft.elements,['nature','earth']);
 assert.equal(c.statValues.values.health,215);assert.equal(c.statValues.values.speed,6);assert.equal(c.statValues.values.defense,24);assert.equal(c.statValues.values.nature,22);
 assert.equal(c.draft.resistances.find(r=>r.kind==='element:fire').value,-50);
 assert.deepEqual(c.draft.skillIds,ids);assert.deepEqual(c.loadout.slots.map(x=>x.skillId),ids);
 assert.equal(c.draft.presentation.visual.front.assetId,'pack:capture:creature-sylvorne-opponent-01');
 assert.equal(c.draft.presentation.visual.back.assetId,'pack:capture:creature-sylvorne-player-01');
 assert.equal(c.draft.presentation.visual.icon.assetId,'pack:capture:creature-sylvorne-icon-01');
});
test('Sylvorne appears exactly once in official skill and creature showcase registries',async()=>{
 const a=await readFile(new URL('../../src/catalogs/capture-showcase-creature-presets-v1.js',import.meta.url),'utf8');
 const b=await readFile(new URL('../../src/catalogs/capture-showcase-skill-presets-v1.js',import.meta.url),'utf8');
 assert.equal(a.split('crea_sylvorne.capture-creature-transfer-v1.json').length-1,1);
 for(const id of ids)assert.equal(b.split(id+'.capture-skill-transfer-v1.json').length-1,1);
});
