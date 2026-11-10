import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {importCaptureTransferJsonV1} from '../../src/adapters/input/capture/capture-entity-transfer-v1.js';
import {normalizeCaptureStatRegistryV1} from '../../src/contracts/capture-stat-registry-v1.js';
import {normalizeCaptureProgressionRulesV1} from '../../src/contracts/capture-progression-rules-v1.js';
import {applyCaptureTransferBatchToEditorStateV1} from '../../src/ui/capture-editor-file-transfer-v1.js';
import {capturePortableNativeSkillDraftsV1} from '../../src/catalogs/capture-portable-native-skill-catalog-v1.js';
import {captureComplexNativeSkillDraftsV1} from '../../src/catalogs/capture-complex-native-skill-catalog-v1.js';
import {canonicalCaptureCreatureRecordsV1} from '../../src/catalogs/capture-canonical-creature-catalog-v1.js';
import {importMonsterCaptureCreatureRecordV1} from '../../src/adapters/input/capture/monster-capture-creature-import-v1.js';
import {importMonsterCaptureStatValuesV1} from '../../src/adapters/input/capture/monster-capture-stat-values-v1.js';
const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');
const ids=['sylvorne-eclat-racinaire','sylvorne-ecorce-vivante','sylvorne-vrilles-du-sous-bois','sylvorne-seve-ancienne','sylvorne-foret-souveraine'];
test('native transfer batch imports 5 Sylvorne skills and its creature into the single owner without changing historical creatures',async()=>{
 const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(await read('data/capture/monster-capture-stat-registry.v1.json')));
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read('data/capture/monster-capture-progression-rules.v1.json')));
 const skills=new Map();
 for(const draft of capturePortableNativeSkillDraftsV1())skills.set(draft.id,draft);
 for(const draft of captureComplexNativeSkillDraftsV1())if(!skills.has(draft.id))skills.set(draft.id,draft);
 const creatures=new Map();
 const source=JSON.parse(await read('data/capture/monster-capture-creatures.v1.json'));
 for(const entry of canonicalCaptureCreatureRecordsV1(source.entries)){
  const base=importMonsterCaptureCreatureRecordV1(entry);
  creatures.set(base.draft.id,{draft:base.draft,statValues:importMonsterCaptureStatValuesV1(entry,statRegistry),loadout:base.loadout});
 }
 assert.equal(creatures.has('crea_sylvorne'),false);
 const prior=creatures.size;
 const paths=[...ids.map(id=>'data/capture/candidates/'+id+'.capture-skill-transfer-v1.json'),'data/capture/candidates/crea_sylvorne.capture-creature-transfer-v1.json'];
 const transfers=[];
 for(const p of paths)transfers.push(importCaptureTransferJsonV1(await read(p),{statRegistry}));
 const result=applyCaptureTransferBatchToEditorStateV1({transfers,configuredCreatures:creatures,configuredSkills:skills,statRegistry,progressionRules,mode:'replace',metadata:{producer:'sylvorne-author-native-batch-test'}});
 assert.equal(creatures.size,prior+1);
 assert.equal(result.actions.filter(a=>a.id==='crea_sylvorne').length,1);
 const creature=creatures.get('crea_sylvorne');
 assert.deepEqual(creature.draft.skillIds,ids);
 assert.equal(creature.draft.presentation,null);
 for(const id of ids){
  assert.equal(skills.has(id),true);
  assert.equal(result.actions.filter(a=>a.id===id).length,1);
 }
});
