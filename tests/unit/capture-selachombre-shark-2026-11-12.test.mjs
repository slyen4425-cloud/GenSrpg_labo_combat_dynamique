import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertCaptureNewCreatureStatBudgetV1} from '../../src/contracts/capture-creature-stat-budget-v1.js';
import {describeCaptureSkillV1} from '../../src/ui/capture-skill-explanation-v1.js';
import {normalizeCaptureSkillTransferV1} from '../../src/contracts/capture-skill-transfer-v1.js';
import {normalizeCaptureCreatureTransferV1} from '../../src/contracts/capture-creature-transfer-v1.js';
import {normalizeCaptureStatRegistryV1} from '../../src/contracts/capture-stat-registry-v1.js';
import {importCaptureTransferJsonV1} from '../../src/adapters/input/capture/capture-entity-transfer-v1.js';
import {applyCaptureTransferBatchToEditorStateV1} from '../../src/ui/capture-editor-file-transfer-v1.js';
import {normalizeCaptureProgressionRulesV1} from '../../src/contracts/capture-progression-rules-v1.js';
import {capturePortableNativeSkillDraftsV1} from '../../src/catalogs/capture-portable-native-skill-catalog-v1.js';
import {captureComplexNativeSkillDraftsV1} from '../../src/catalogs/capture-complex-native-skill-catalog-v1.js';
import {canonicalCaptureCreatureRecordsV1} from '../../src/catalogs/capture-canonical-creature-catalog-v1.js';
import {importMonsterCaptureCreatureRecordV1} from '../../src/adapters/input/capture/monster-capture-creature-import-v1.js';
import {importMonsterCaptureStatValuesV1} from '../../src/adapters/input/capture/monster-capture-stat-values-v1.js';
const ids=["selachombre-morsure-ecume","selachombre-aileron-fantome","selachombre-nage-circulaire","selachombre-frenesie-carnassiere","selachombre-abysse-dechainee"];
const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');
const load=async name=>JSON.parse(await read('data/capture/showcase/'+name+'.json'));
test('Sélachombre: 5 native skills, original marker combos, channeling and ultimate',async()=>{
 const skills=[];for(const id of ids)skills.push(normalizeCaptureSkillTransferV1(await load(id+'.capture-skill-transfer-v1')).draft);
 assert.deepEqual(skills.map(s=>s.requiredLevel),[1,5,10,15,20]);
 assert.deepEqual(skills.map(s=>s.definition.energyCost),[3,4,5,1,10]);
 assert.deepEqual(skills.map(s=>s.definition.cooldownMs),[10000,18000,24000,32000,0]);
 assert.equal(skills[0].definition.effects[1].marker.id,'selachombre-traque');
 assert.equal(skills[1].definition.approachMode,'teleport');
 assert.equal(skills[1].definition.effects[1].condition.value,'selachombre-traque');
 assert.equal(skills[2].definition.effects[1].status.kind,'outgoing_damage_modifier');
 assert.equal(skills[2].definition.effects[2].targetScope,'all_enemies');
 assert.equal(skills[3].definition.channeling.maxTicks,3);
 assert.equal(skills[3].definition.channeling.energyCostPerTick,2);
 assert.equal(skills[4].definition.maxUsesPerCombat,1);
 assert.equal(skills[4].definition.effects[0].amount,50);
 assert.equal(skills[4].definition.effects[3].effects[0].amount,15);
 assert.equal(skills[4].definition.effects[1].status.durationMs,3000);
 assert.equal(skills[4].definition.effects[2].amount,4);
 assert.match(skills[4].description,/95 dégâts maximum/);
 assert.equal(skills[4].definition.effects[3].kind,'consume_marker');
 assert.equal(skills[4].definition.effects[3].markerId,'selachombre-traque');
});
test('Sélachombre original shark 3-view media and balanced Ice/Water stats',async()=>{
 const reg=normalizeCaptureStatRegistryV1(JSON.parse(await read('data/capture/monster-capture-stat-registry.v1.json')));
 const c=normalizeCaptureCreatureTransferV1(await load('crea_selachombre.capture-creature-transfer-v1'),reg);
 assert.equal(c.draft.displayName,'Sélachombre');
 assert.deepEqual(c.draft.elements,['water','ice']);
 assert.equal(c.statValues.values.health,170);
 assert.equal(c.draft.combat.maxHp,170);
 assert.equal(c.statValues.values.speed,20);
 assert.equal(c.statValues.values.glace,8);
 assert.equal(c.statValues.values.physical,16);
 assert.equal(c.statValues.values.defense,8);
 assert.equal(c.draft.presentation.viewOverrides.player.displayScale,1.74);
 assert.equal(c.draft.presentation.viewOverrides.player.displayScale/1.45,1.2);
 assert.equal(c.draft.presentation.viewOverrides.opponent.displayScale,1.5);
 assert.equal(c.draft.presentation.viewOverrides.opponent.displayScale/1.25,1.2);
 assert.equal(c.draft.presentation.displayScale,1.15,"Do not enlarge bestiary/edit preview base scale");
 assert.equal(c.draft.presentation.transformOrigin.y,'87%');
 assert.equal(assertCaptureNewCreatureStatBudgetV1({statValues:c.statValues,statRegistry:reg}).spent,100);
 assert.deepEqual(c.draft.skillIds,ids);
 assert.deepEqual(c.loadout.slots.map(s=>s.skillId),ids);
 assert.equal(c.draft.presentation.visual.front.assetId,'pack:capture:creature-requin-opponent-01');
 assert.equal(c.draft.presentation.visual.back.assetId,'pack:capture:creature-requin-player-01');
 assert.equal(c.draft.presentation.visual.icon.assetId,'pack:capture:creature-requin-icon-01');
});
test('Sélachombre canonical batch adds 5 skills and 1 creature without overwriting historical entries',async()=>{
 const reg=normalizeCaptureStatRegistryV1(JSON.parse(await read('data/capture/monster-capture-stat-registry.v1.json')));
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read('data/capture/monster-capture-progression-rules.v1.json')));
 const configuredSkills=new Map();
 for(const d of capturePortableNativeSkillDraftsV1())configuredSkills.set(d.id,d);
 for(const d of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(d.id))configuredSkills.set(d.id,d);
 const configuredCreatures=new Map();
 const original=JSON.parse(await read('data/capture/monster-capture-creatures.v1.json'));
 for(const e of canonicalCaptureCreatureRecordsV1(original.entries)){
   const base=importMonsterCaptureCreatureRecordV1(e);
   configuredCreatures.set(base.draft.id,{draft:base.draft,statValues:importMonsterCaptureStatValuesV1(e,reg),loadout:base.loadout});
 }
 const before= new Map(configuredCreatures); const priorSkills=new Map(configuredSkills);
 const paths=[...ids.map(id=>'data/capture/showcase/'+id+'.capture-skill-transfer-v1.json'),'data/capture/showcase/crea_selachombre.capture-creature-transfer-v1.json'];
 const transfers=[];for(const p of paths)transfers.push(importCaptureTransferJsonV1(await read(p),{statRegistry:reg}));
 const result=applyCaptureTransferBatchToEditorStateV1({transfers,configuredCreatures,configuredSkills,statRegistry:reg,progressionRules,mode:'replace',metadata:{producer:'selachombre-native-batch'}});
 assert.equal(result.actions.length,6);
 assert.equal(configuredCreatures.has('crea_selachombre'),true);
 for(const [id,entry] of before)assert.deepEqual(configuredCreatures.get(id),entry);
 for(const [id,entry] of priorSkills)assert.deepEqual(configuredSkills.get(id),entry);
 for(const id of ids)assert.equal(configuredSkills.has(id),true);
});
test('Sélachombre has exactly one catalog entry per official file',async()=>{
 const a=await read('src/catalogs/capture-showcase-creature-presets-v1.js');
 const b=await read('src/catalogs/capture-showcase-skill-presets-v1.js');
 assert.equal(a.split('crea_selachombre.capture-creature-transfer-v1.json').length-1,1);
 for(const id of ids)assert.equal(b.split(id+'.capture-skill-transfer-v1.json').length-1,1);
});

test('Bestiary names Traque sanglante in channeling and ultimate, never an internal Sélachombre marker slug',async()=>{
 const skills=[];for(const id of ids)skills.push((await load(id+'.capture-skill-transfer-v1')).draft.definition);
 const markerNames=Object.fromEntries(skills.flatMap(skill=>skill.effects
  .filter(effect=>effect.kind==='apply_marker')
  .map(effect=>[effect.marker.id,effect.marker.name])));
 assert.equal(markerNames['selachombre-traque'],'Traque sanglante');
 for(const skill of skills){
  const actual=describeCaptureSkillV1(skill,{markerNames}).sentences.join(' ');
  assert.doesNotMatch(actual,/selachombre[ -]traque/i);
  if(skill.id==='selachombre-frenesie-carnassiere')
   assert.match(actual,/Traque sanglante/);
  if(skill.id==='selachombre-abysse-dechainee'){
   assert.match(actual,/50 dégâts/);
   assert.match(actual,/15 dégâts.*par charge consommée/);
   assert.match(actual,/Traque sanglante/);
  }
 }
});
