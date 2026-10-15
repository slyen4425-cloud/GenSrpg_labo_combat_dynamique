import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1,exportCaptureCreatureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as creatureFiles} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as skillFiles} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
const cPath="data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json";
const sPath="data/capture/showcase/lib_heat_wave.capture-skill-transfer-v1.json";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url));
const sha=x=>createHash("sha256").update(x).digest("hex");
const registry=normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
test("Dracendre and Heat Wave authored exports replace exactly one existing owner",()=>{
 const cb=read(cPath),sb=read(sPath);
 assert.equal(cb.length,4452);
 assert.equal(sb.length,3025);
 assert.equal(sha(cb),"cdc0d760eddc2558ff8542ec975e5b699af1bd7f41c34ef1ca2b0c76a6ed398e");
 assert.equal(sha(sb),"322ff8b9ef8cf05b3f9c8bbd2d5fb4bea45bed24024280c24105ae3b643cb5c2");
 assert.equal(creatureFiles.filter(x=>x===cPath).length,1);
 assert.equal(skillFiles.filter(x=>x===sPath).length,1);
 assert.equal(new Set(creatureFiles).size,creatureFiles.length);
 assert.equal(new Set(skillFiles).size,skillFiles.length);
 const c=importCaptureTransferJsonV1(cb.toString("utf8"),{statRegistry:registry});
 const s=importCaptureTransferJsonV1(sb.toString("utf8"));
 assert.equal(c.kind,"creature");assert.equal(s.kind,"skill");
 assert.equal(c.value.draft.id,"crea_dracendre");
 assert.equal(s.value.draft.id,"lib_heat_wave");
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(c.value,{statRegistry:registry}),{statRegistry:registry}).value,c.value);
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(s.value.draft)).value,s.value);
});
test("Dracendre author's movement audio and newly equipped ultimate survive export",()=>{
 const c=importCaptureTransferJsonV1(read(cPath).toString("utf8"),{statRegistry:registry}).value;
 assert.equal(c.draft.presentation.profileId,"flying");
 assert.deepEqual(c.draft.presentation.audio.movement,{assetId:"gensrpg:sound:sanctuary-367a77dd",volume:1});
 assert.deepEqual(c.loadout.slots.map(x=>x.skillId),["lib_heat_wave","fireball","cap_fire_special_2","cap_fire_atk_5","cap_fire_atk_7"]);
 assert.equal(c.draft.skillIds.length,20);
 assert.equal(c.draft.combat.maxHp,160);
});
test("Heat Wave source has exactly the authored aerial attack, delayed modifier and visuals",()=>{
 const s=importCaptureTransferJsonV1(read(sPath).toString("utf8")).value.draft;
 assert.equal(s.definition.name,"Vague de chaleur");
 assert.equal(s.definition.form,"contact");
 assert.equal(s.definition.approachMode,"aerial");
 assert.equal(s.definition.preparationMs,1000);
 assert.equal(s.definition.travelMs,2100);
 assert.equal(s.definition.cooldownMs,15000);
 assert.equal(s.definition.effects[0].kind,"damage");
 assert.equal(s.definition.effects[0].amount,10);
 const st=s.definition.effects[1];
 assert.equal(st.kind,"apply_status");
 assert.equal(st.status.kind,"stat_modifier");
 assert.equal(st.status.statId,"speed");
 assert.equal(st.status.deltaPoints,20);
 assert.equal(st.status.durationMs,10000);
 assert.equal(s.presentation.statusVisuals["status-1"].sprite.assetId,"pack:capture:sprite-fireball-2-cast-01");
 const audio=JSON.parse(read("data/presentation/audio/private-audio-catalog.v1.json"));
 assert.ok(JSON.stringify(audio).includes("gensrpg:sound:sanctuary-367a77dd"));
});

test("Heat Wave replaces its native draft through the canonical configuredSkills owner and keeps its loadout ID",async()=>{
 const {applyCaptureTransferBatchToEditorStateV1}=await import("../../src/ui/capture-editor-file-transfer-v1.js");
 const {capturePortableNativeSkillDraftsV1}=await import("../../src/catalogs/capture-portable-native-skill-catalog-v1.js");
 const {captureComplexNativeSkillDraftsV1}=await import("../../src/catalogs/capture-complex-native-skill-catalog-v1.js");
 const {normalizeCaptureProgressionRulesV1}=await import("../../src/contracts/capture-progression-rules-v1.js");
 const skills=new Map();
 for(const d of [...capturePortableNativeSkillDraftsV1(),...captureComplexNativeSkillDraftsV1()])skills.set(d.id,d);
 const old=skills.get("lib_heat_wave");
 assert.ok(old,"native author ID must exist");
 const n=skills.size;
 const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(read("data/capture/monster-capture-progression-rules.v1.json")));
 const input=importCaptureTransferJsonV1(read(sPath).toString("utf8"));
 const opts={transfers:[input],configuredCreatures:new Map(),configuredSkills:skills,statRegistry:registry,progressionRules,mode:"replace"};
 const first=applyCaptureTransferBatchToEditorStateV1(opts);
 assert.deepEqual(first.actions.map(a=>a.action),["replace-skill"]);
 assert.equal(skills.size,n);
 assert.notDeepEqual(skills.get("lib_heat_wave"),old);
 assert.deepEqual(skills.get("lib_heat_wave"),input.value.draft);
 const second=applyCaptureTransferBatchToEditorStateV1(opts);
 assert.deepEqual(second.actions.map(a=>a.action),["noop"]);
 assert.equal(skills.size,n);
 const roster=importCaptureTransferJsonV1(read(cPath).toString("utf8"),{statRegistry:registry}).value;
 assert.equal(roster.loadout.slots[0].skillId,"lib_heat_wave");
 const {createCombatSession}=await import("../../src/core/combat/combat-session.js");
 const speedRule=registry.stats.find(s=>s.id==="speed");
 assert.ok(speedRule,"real Capture speed rule must exist");
 const fighter=id=>({
   id,maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100,
   energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0,
   statValuesById:{speed:15},
   statEffectRulesById:{speed:{
     damageChannel:speedRule.damageChannel,
     resistanceChannel:speedRule.resistanceChannel,
     damagePctPerPoint:speedRule.damagePctPerPoint,
     resistancePctPerPoint:speedRule.resistancePctPerPoint,
     chargeTimeReductionPctPerPoint:speedRule.chargeTimeReductionPctPerPoint
   }}
 });
 const session=createCombatSession({distance:"short",fighters:[fighter("player"),fighter("enemy")]});
 const attack=session.useSkill({actorId:"player",targetId:"enemy",skill:input.value.draft.definition});
 assert.equal(attack.ok,true);
 assert.equal(session.snapshot().fighters.enemy.hp,90);
});
