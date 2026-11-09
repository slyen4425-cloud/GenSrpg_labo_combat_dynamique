import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {applyCaptureTransferBatchToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";

const read=relative=>readFile(new URL("../../"+relative,import.meta.url),"utf8");
test("real official Showcase transfer batch imports Krakenor from canonical configured skills and creature owner",async()=>{
 const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
 const skills=new Map();
 for(const draft of capturePortableNativeSkillDraftsV1())skills.set(draft.id,draft);
 for(const draft of captureComplexNativeSkillDraftsV1())if(!skills.has(draft.id))skills.set(draft.id,draft);
 const creatures=new Map();
 const paths=[...CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1,...CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1];
 const transfers=[];
 for(const p of paths)transfers.push(importCaptureTransferJsonV1(await read(p),{statRegistry}));
 const result=applyCaptureTransferBatchToEditorStateV1({transfers,configuredCreatures:creatures,configuredSkills:skills,statRegistry,progressionRules,mode:"replace",metadata:{producer:"krakenor-2026-11-09-batch-test"}});
 const ids=["krakenor-perle-pression","krakenor-etau-tentaculaire","krakenor-voile-encre","krakenor-bulle-implosion","krakenor-abysse-huit-bras"];
 assert.equal(creatures.has("crea_mer_3"),true);
 assert.equal(result.actions.filter(x=>x.id==="crea_mer_3").length,1);
 const c=creatures.get("crea_mer_3");
 assert.deepEqual(c.draft.skillIds,ids);
 for(const id of ids){assert.equal(skills.has(id),true);assert.equal(result.actions.filter(x=>x.id===id).length,1);}
 assert.equal(c.draft.presentation.visual.front.assetId,"pack:capture:creature-pieuvre-opponent-01");
});
