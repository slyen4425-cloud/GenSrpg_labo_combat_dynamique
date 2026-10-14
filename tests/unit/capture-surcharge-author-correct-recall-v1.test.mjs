import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {importCaptureTransferJsonV1, planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {advanceSkillCooldownDeadlinesV1} from "../../src/core/combat/combat-timing.js";

const path="../../data/capture/showcase/cap_electric_special_2.capture-skill-transfer-v1.json";
const read=()=>readFileSync(new URL(path,import.meta.url),"utf8");
const transferred=()=>importCaptureTransferJsonV1(read());
const fighter=id=>({id,maxHp:200,initialHp:200,maxEnergy:50,initialEnergy:50,
 energyChargeAmount:2,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0,
 statEffectRulesById:{electric:{damageChannel:"electric",resistanceChannel:"electric",
 damagePctPerPoint:1,resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0}}});
test("RED: corrected author Surcharge imported byte-compatible except requested values and Recall icon",()=>{
 const draft=transferred().value.draft,def=draft.definition;
 assert.equal(draft.id,"cap_electric_special_2");
 assert.equal(def.id,"cap_electric_special_2");
 assert.equal(def.name,"Surcharge");
 assert.equal(def.loadoutSlot,"ultimate");
 assert.equal(draft.requiredLevel,20);
 assert.equal(def.maxUsesPerCombat,1);
 assert.equal(def.preparationMs,2000);
 assert.equal(def.energyCost,3);
 assert.deepEqual(def.effects.map(e=>e.status.kind),[
  "approach_time_modifier","skill_cooldown_rate_modifier","energy_regen_modifier","stat_modifier","triggered_buff"
 ]);
 assert.deepEqual(def.effects.map(e=>e.status.durationMs),[60000,60000,60000,60000,60000]);
 assert.equal(def.effects[0].status.modifierPct,-50,"-50% time -> movement x2");
 assert.equal(def.effects[1].status.modifierPct,100,"+100% cooldown RATE -> recharge x2");
 assert.equal(def.effects[2].status.modifierPct,50);
 assert.equal(def.effects[3].status.statId,"electric");
 assert.equal(def.effects[3].status.deltaPoints,50);
 assert.equal(def.effects[4].status.onEvent.event,"damage_dealt");
 assert.equal(def.effects[4].status.onEvent.effects[0].amount,10);
 assert.equal(draft.presentation.visual.icon.assetId,"core:icon-skill-recall-01");
 assert.equal(existsSync(new URL("../../assets/library/core/icons/skills/icon_skill_recall_01.webp",import.meta.url)),true);
});
test("Showcase inserts the complex historical Surcharge ID once then replaces on reload",()=>{
 const source=readFileSync(new URL("../../src/catalogs/capture-showcase-skill-presets-v1.js",import.meta.url),"utf8");
 assert.equal((source.match(/cap_electric_special_2\.capture-skill-transfer-v1\.json/g)??[]).length,1);
 const configuredSkills=new Map(capturePortableNativeSkillDraftsV1().map(d=>[d.id,d]));
 assert.equal(configuredSkills.has("cap_electric_special_2"),false,"non-portable historical ability is not an active native draft");
 const configuredCreatures=new Map();
 const registry=normalizeCaptureStatRegistryV1(JSON.parse(readFileSync(new URL("../../data/capture/monster-capture-stat-registry.v1.json",import.meta.url),"utf8")));
 const progression=normalizeCaptureProgressionRulesV1(JSON.parse(readFileSync(new URL("../../data/capture/monster-capture-progression-rules.v1.json",import.meta.url),"utf8")));
 const before=configuredSkills.size;
 const plan=planCaptureTransferImportV1({currentDatabase:buildCaptureEditorDatabaseV1({statRegistry:registry,progressionRules:progression,
 configuredCreatures,configuredSkills,metadata:{producer:"surcharge-regression"}}),transfer:transferred(),mode:"replace"});
 assert.equal(plan.action,"insert-skill");
 assert.equal(plan.id,"cap_electric_special_2");
 applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry:registry,progressionRules:progression});
 assert.equal(configuredSkills.size,before+1);
 assert.equal(configuredSkills.get("cap_electric_special_2").definition.effects[0].status.modifierPct,-50);
 const updatedDb=buildCaptureEditorDatabaseV1({statRegistry:registry,progressionRules:progression,
  configuredCreatures,configuredSkills,metadata:{producer:"surcharge-regression-reload"}});
 const reload=planCaptureTransferImportV1({currentDatabase:updatedDb,transfer:transferred(),mode:"replace"});
 assert.equal(reload.action,"noop","unchanged author ID must reload idempotently without any duplicate");
 applyCaptureTransferPlanToEditorStateV1({plan:reload,configuredCreatures,configuredSkills,statRegistry:registry,progressionRules});
 assert.equal(configuredSkills.size,before+1,"no duplicate from re-import");
});
test("RED: real Session after Surcharge halves mobile skill travel and doubles cooldown speed",()=>{
 const combat=createCombatSession({fighters:[fighter("voltige"),fighter("enemy")]});
 const ultimate=transferred().value.draft.definition;
 const cast=combat.useSkill({actorId:"voltige",targetId:"voltige",skill:ultimate});
 assert.equal(cast.ok,true,JSON.stringify(cast));
 const status=combat.snapshot().fighters.voltige.statusEffects;
 assert.equal(status.length,5);
 const mobile=normalizeSkillDefinition({id:"dash",name:"dash",category:"offensive",form:"contact",element:"electric",
 approachMode:"ground",energyCost:0,preparationMs:400,travelMs:1200,recoveryMs:0,cooldownMs:5000,
 allowedDistances:["short","medium","long"],targetRelations:["enemy"],
 effect:{damage:10,heal:0,stunMs:0,interruptsPreparation:false,tags:[]}});
 const started=combat.startSkill({actorId:"voltige",targetId:"enemy",skill:mobile});
 assert.equal(started.ok,true,JSON.stringify(started));
 assert.equal(started.action.travelMs,600,"real approach must be 2x faster but not instantaneous");
 const deadlines=advanceSkillCooldownDeadlinesV1({cooldowns:{dash:5000},atMs:0,deltaMs:1000,statusEffects:status});
 assert.equal(deadlines.dash,4000,"after 1s, 2s of recharge removed: 3s remaining");
});
