import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as catalog} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {importCaptureTransferJsonV1, planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {importMonsterCaptureCreatureRecordV1} from "../../src/adapters/input/capture/monster-capture-creature-import-v1.js";
import {importMonsterCaptureStatValuesV1} from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";

const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const scaraPath="data/capture/showcase/crea_scar_2.capture-creature-transfer-v1.json";
const registryPath="data/capture/monster-capture-stat-registry.v1.json";
const archivePath="data/capture/source-exports/gensrpg-capture-database-creature-crea_scar_2-2026-10-18.json";
const statSource="data/capture/source-exports/gensrpg-capture-database-stat-acier-2026-10-18.json";

test("Acier: sole new authored stat from database; existing 12 IDs kept in order",async()=>{
 const current=JSON.parse(await read(registryPath));
 const ids=current.stats.map(x=>x.id);
 assert.deepEqual(ids,["health","speed","physical","defense","fire","water","earth","air","electric","light","shadow","poison","acier"]);
 const authorStat=JSON.parse(await read(statSource));
 assert.deepEqual(current.stats.find(x=>x.id==="acier"),authorStat);
 assert.equal(authorStat.label,"Acier");
 assert.equal(authorStat.damageChannel,"acier");
 assert.equal(authorStat.resistanceChannel,"acier");
 assert.equal(authorStat.damagePctPerPoint,1);
 assert.equal(authorStat.resistancePctPerPoint,1);
 assert.equal(authorStat.damageReductionPctPerPoint,0);
 assert.equal(new Set(ids).size,13);
 assert.equal(normalizeCaptureStatRegistryV1(current).stats.length,13);
});

test("Scarabacier is the only added author creature preset; extraction is lossless",async()=>{
 assert.equal(catalog.length,10);
 assert.equal(new Set(catalog).size,catalog.length);
 assert.equal(catalog.filter(p=>p===scaraPath).length,1);
 const active=JSON.parse(await read(scaraPath)),archived=JSON.parse(await read(archivePath));
 assert.equal(archived.draft.id,"crea_scar_2"); // immutable prior author extraction
 assert.deepEqual(active.loadout.slots.map(s=>s.skillId),["cisaille","cap_water_atk_1",null,null,null]);
 assert.equal(active.schema,"capture-creature-transfer-v1");
 assert.equal(active.draft.id,"crea_scar_2");
 assert.equal(active.draft.displayName,"Scarabacier");
 assert.equal(active.draft.elements[0],"steel");
 assert.equal(active.draft.level,1);
 assert.equal(active.draft.combat.reaction.type,"defense");
 assert.equal(active.draft.combat.reaction.damageReductionPct,80);
 assert.equal(active.draft.combat.reaction.activeWindowMs,700);
 assert.equal(active.draft.combat.approachTimeModifierPct,25);
 assert.equal(active.statValues.values.health,190);
 assert.equal(active.statValues.values.defense,20);
 assert.equal(active.statValues.values.acier,15);
 assert.equal(active.draft.resistances.find(r=>r.kind==="element:steel").value,35);
 assert.equal(active.draft.presentation.visual.front.assetId,"pack:capture:creature-scarabacier-opponent-01");
 assert.equal(active.draft.presentation.visual.back.assetId,"pack:capture:creature-scarabacier-player-01");
 assert.equal(active.draft.presentation.visual.icon.assetId,"pack:capture:creature-scarabacier-icon-01");
 assert.equal(active.draft.presentation.sockets[0].id,"mouth");
 assert.equal(active.draft.presentation.sockets[0].front.x,0.27319587565407266);

 const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read(registryPath)));
 const imported=importCaptureTransferJsonV1(await read(scaraPath),{statRegistry:registry});
 assert.equal(imported.kind,"creature");
 assert.deepEqual(imported.value.draft,active.draft);
 assert.deepEqual(imported.value.statValues,active.statValues);
 assert.deepEqual(imported.value.loadout,active.loadout);
});

test("Scarabacier replaces the native creature via canonical configuredCreatures, preserving others",async()=>{
 const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(await read(registryPath)));
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
 const native=JSON.parse(await read("data/capture/monster-capture-creatures.v1.json")).entries;
 const scar=native.find(x=>x.id==="crea_scar_2"),other=native.find(x=>x.id==="crea_scar_1");
 assert.ok(scar&&other,"both actual historical Scarab creatures exist");
 const configuredCreatures=new Map([scar,other].map(x=>[x.id,{...importMonsterCaptureCreatureRecordV1(x),statValues:importMonsterCaptureStatValuesV1(x,statRegistry)}]));
 const originalOther=configuredCreatures.get("crea_scar_1");
 const configuredSkills=new Map(capturePortableNativeSkillDraftsV1().map(x=>[x.id,x]));
 for(const skill of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(skill.id))configuredSkills.set(skill.id,skill);
 // This later Scarabacier revision intentionally equips the newly authored Cisaille.
 // Seed the canonical configuredSkills owner before planning the creature update.
 const newAbility=importCaptureTransferJsonV1(await read("data/capture/showcase/cisaille.capture-skill-transfer-v1.json"),{statRegistry});
 const addSkill=planCaptureTransferImportV1({currentDatabase:buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills}),transfer:newAbility,mode:"replace"});
 assert.equal(addSkill.action,"insert-skill");
 applyCaptureTransferPlanToEditorStateV1({plan:addSkill,configuredCreatures,configuredSkills,statRegistry,progressionRules});
 const initialSkillSize=configuredSkills.size;
 const imported=importCaptureTransferJsonV1(await read(scaraPath),{statRegistry});
 const plan=planCaptureTransferImportV1({currentDatabase:buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills}),transfer:imported,mode:"replace"});
 assert.equal(plan.action,"replace-creature");
 applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry,progressionRules});
 assert.equal(configuredCreatures.size,2);
 assert.equal(configuredCreatures.get("crea_scar_1"),originalOther,"Scarabébé unchanged");
 assert.deepEqual(configuredCreatures.get("crea_scar_2").draft,imported.value.draft);
 assert.deepEqual(configuredCreatures.get("crea_scar_2").statValues,imported.value.statValues);
 assert.deepEqual(configuredCreatures.get("crea_scar_2").loadout,imported.value.loadout);
 assert.equal(configuredSkills.size,initialSkillSize,"no imported ability nor auto-equip");
});

test("Latest Scarabacier V8 author transfer keeps two attack poses, movement playback and both team scales",async()=>{
 const active=JSON.parse(await read(scaraPath));
 assert.equal(active.draft.presentation.version,8);
 assert.deepEqual(active.draft.presentation.visual.movementScaleByView,{player:1,opponent:1.2});
 assert.deepEqual(active.draft.presentation.visual.rangedAttackScaleByView,{player:0.8,opponent:1});
 assert.deepEqual(active.draft.presentation.visual.movementPlayback,{frameMs:0,mode:"loop"});
 assert.equal(active.draft.presentation.visual.dodge.assetId,"pack:capture:sprite-steel-carapace-hold-01");
 assert.deepEqual(active.draft.presentation.viewOverrides.player,{displayScale:1.7,position:{x:0,y:10}});
 assert.deepEqual(active.draft.presentation.viewOverrides.opponent,{displayScale:0.95,position:{x:0,y:50}});
 assert.equal(active.draft.presentation.visual.movement.assetId,"pack:capture:creature-scarabacier-roll-01");
 assert.equal(active.draft.presentation.visual.movement.rotationTurns,6);
 assert.equal(active.draft.presentation.visual.rangedAttack.assetId,"pack:capture:creature-scarabacier-attack-face-v5");
 assert.equal(active.draft.presentation.visual.rangedAttackBack.assetId,"pack:capture:creature-scarabacier-attack-dos-v5");
 assert.deepEqual(active.draft.presentation.visual.rangedAttackPlacement.back,{x:-20,y:-20});
 assert.equal(active.draft.presentation.sockets[0].front.x,0.27319587565407266);
 assert.equal(active.draft.presentation.sockets[0].back.x,0.7020618446705927);
 assert.equal(active.statValues.values.acier,15);
 assert.deepEqual(active.draft.skillIds,["cisaille","cap_water_atk_1"]);
 const skills=await Promise.all(["cisaille","cap_water_atk_1"].map(id=>read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json")));
 assert.deepEqual(skills.map(s=>JSON.parse(s).draft.id),["cisaille","cap_water_atk_1"]);
});
