import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1, exportCaptureCreatureTransferJsonV1, exportCaptureSkillTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferBatchToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { importMonsterCaptureCreatureRecordV1 } from "../../src/adapters/input/capture/monster-capture-creature-import-v1.js";
import { importMonsterCaptureStatValuesV1 } from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import { normalizeCaptureSkillEditorDraftV1 } from "../../src/contracts/capture-skill-editor-draft-v1.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { canonicalCaptureCreatureRecordsV1 } from "../../src/catalogs/capture-canonical-creature-catalog-v1.js";

const creaturePath="data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json";
const skillPath="data/capture/showcase/lib_static_bite.capture-skill-transfer-v1.json";
const load=async path => JSON.parse(await readFile(new URL("../../"+path,import.meta.url),"utf8"));
const registry=normalizeCaptureStatRegistryV1(await load("data/capture/monster-capture-stat-registry.v1.json"));
const progressionRules=normalizeCaptureProgressionRulesV1(await load("data/capture/monster-capture-progression-rules.v1.json"));

test("the author's two transfers are uniquely discoverable in their canonical showcase lists",()=>{
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===creaturePath).length,1);
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===skillPath).length,1);
 assert.equal(new Set(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length);
 assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
});

test("Voltige preserves the full exported creature, stats, sockets and *planned* level-five skill",async()=>{
 const raw=await load(creaturePath);
 const tr=importCaptureTransferJsonV1(JSON.stringify(raw),{statRegistry:registry});
 assert.equal(tr.kind,"creature");
 const record=tr.value;
 assert.equal(record.draft.id,"crea_voltik");
 assert.equal(record.draft.displayName,"Voltige");
 assert.equal(record.draft.level,1);
 assert.equal(record.draft.presentation.profileId,"biped");
 assert.equal(record.draft.presentation.displayScale,1.08);
 assert.equal(record.draft.presentation.viewOverrides.player.displayScale,0.9);
 assert.equal(record.draft.presentation.viewOverrides.opponent.displayScale,0.7);
 assert.equal(record.draft.presentation.viewOverrides.opponent.position.y,60);
 assert.equal(record.draft.combat.approachTimeModifierPct,-40);
 assert.deepEqual(record.draft.sourceStats,raw.draft.sourceStats);
 assert.deepEqual(record.draft.presentation.sockets,raw.draft.presentation.sockets,"front/back coordinates never swapped or rounded");
 assert.deepEqual(record.draft.resistances,raw.draft.resistances);
 assert.deepEqual(record.statValues.values,raw.statValues.values);
 assert.deepEqual(record.loadout.slots,raw.loadout.slots,"Lv5 skill is configured even though Voltige starts at Lv1");
 assert.equal(record.loadout.slots[1].skillId,"lib_static_bite");
 assert.equal(record.draft.capture.evolution.targetId,"crea_fulguro");
 assert.equal(record.draft.presentation.visual.front.assetId,"pack:capture:creature-voltige-opponent-01");
 assert.equal(record.draft.presentation.visual.back.assetId,"pack:capture:creature-voltige-player-01");
 assert.equal(record.draft.presentation.visual.icon.assetId,"pack:capture:creature-voltige-icon-01");
 const round=importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(record,{statRegistry:registry}),{statRegistry:registry});
 assert.deepEqual(round.value,record);
});

test("Crocs statiques retains exported real stack threshold, stun, sound and authored icon without substitution",async()=>{
 const raw=await load(skillPath);
 const tr=importCaptureTransferJsonV1(JSON.stringify(raw));
 assert.equal(tr.kind,"skill");
 const s=tr.value.draft;
 assert.equal(s.id,"lib_static_bite");
 assert.equal(s.definition.name,"Crocs statiques");
 assert.equal(s.requiredLevel,5);
 assert.equal(s.definition.form,"contact");
 assert.equal(s.definition.energyCost,3);
 assert.equal(s.definition.cooldownMs,6000);
 assert.equal(s.definition.effects[0].amount,8);
 assert.equal(s.definition.effects[0].channel,"electric");
 const status=s.definition.effects[1].status;
 assert.equal(status.kind,"stack_counter");
 assert.equal(status.maxStacks,3);
 assert.equal(status.onStackThreshold.count,3);
 assert.equal(status.onStackThreshold.effects[0].status.kind,"stun");
 assert.equal(status.onStackThreshold.effects[0].status.durationMs,3000);
 assert.equal(s.presentation.visual.icon.assetId,"pack:capture:icon-skill-croc-electrique-01");
 assert.equal(s.presentation.visual.impact.assetId,"pack:capture:sprite-impact-electric-01");
 assert.equal(s.presentation.audio.impact.assetId,"gensrpg:sound:genrpg-pack2-af938ec6");
 const round=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(s));
 assert.deepEqual(round.value,tr.value);
});

test("canonical startup maps replace both pre-existing ids and keep the other 102+ historical entries",async()=>{
 const [catalog,skillsNative]=await Promise.all([load("data/capture/monster-capture-creatures.v1.json"),load("data/combat/skills/catalog.v1.json")]);
 const originals=canonicalCaptureCreatureRecordsV1(catalog.entries);
 const configuredCreatures=new Map(originals.map(o=>{
  const rec=importMonsterCaptureCreatureRecordV1(o);
  return [rec.draft.id,{...rec,statValues:importMonsterCaptureStatValuesV1(o,registry)}];
 }));
 const originalSize=configuredCreatures.size;
 const before=configuredCreatures.get("crea_voltik");
 assert.ok(before,"Voltige native record exists before author replacement");
 const configuredSkills=new Map();
 for(const v of skillsNative.entries){const definition=normalizeSkillDefinition(v.definition);configuredSkills.set(definition.id,normalizeCaptureSkillEditorDraftV1({schema:"capture-skill-editor-draft-v1",id:definition.id,description:"Native",requiredLevel:1,usageScopes:["capture","combat"],definition,presentation:null}));}
 for(const s of capturePortableNativeSkillDraftsV1())if(!configuredSkills.has(s.id))configuredSkills.set(s.id,s);
 for(const s of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(s.id))configuredSkills.set(s.id,s);
 const oldSkill=configuredSkills.get("lib_static_bite");
 assert.ok(oldSkill,"historical Crocs statiques is known");
 const originalSkillSize=configuredSkills.size;
 const skill=importCaptureTransferJsonV1(JSON.stringify(await load(skillPath)));
 const creature=importCaptureTransferJsonV1(JSON.stringify(await load(creaturePath)),{statRegistry:registry});
 const result=applyCaptureTransferBatchToEditorStateV1({transfers:[skill,creature],configuredCreatures,configuredSkills,statRegistry:registry,progressionRules,mode:"replace"});
 assert.deepEqual(result.actions.map(x=>x.action),["replace-skill","replace-creature"]);
 assert.equal(configuredCreatures.size,originalSize);
 assert.equal(configuredSkills.size,originalSkillSize);
 assert.equal(configuredCreatures.get("crea_voltik").statValues.values.health,120);
 assert.equal(configuredCreatures.get("crea_voltik").draft.presentation.profileId,"biped");
 assert.equal(configuredSkills.get("lib_static_bite").definition.effects[1].status.onStackThreshold.count,3);
 assert.notDeepEqual(configuredCreatures.get("crea_voltik"),before);
 assert.notDeepEqual(configuredSkills.get("lib_static_bite"),oldSkill);
 assert.ok(configuredCreatures.has("crea_ailevent"));
 assert.ok(configuredSkills.has("lib_chain_lightning"));
 const db=buildCaptureEditorDatabaseV1({configuredCreatures,configuredSkills,statRegistry:registry,progressionRules});
 assert.equal(db.creatures.filter(x=>x.draft.id==="crea_voltik").length,1);
 assert.equal(db.skills.filter(x=>x.id==="lib_static_bite").length,1);
});
