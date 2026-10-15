import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as presetFiles} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  applyCaptureTransferBatchToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";

const path="data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url));
const sourceBytes=()=>read(path);
const transfer=()=>importCaptureTransferJsonV1(sourceBytes().toString("utf8"));
const skill=()=>transfer().value.draft;
const statRegistry=()=>normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const progressionRules=()=>normalizeCaptureProgressionRulesV1(JSON.parse(read("data/capture/monster-capture-progression-rules.v1.json")));
const sha256=b=>createHash("sha256").update(b).digest("hex");

test("Vague incendiaire is the exact uploaded transfer and the only active author preset for this ID",()=>{
 const bytes=sourceBytes();
 assert.equal(bytes.length,2440);
 assert.equal(sha256(bytes),"940b888b237212bbe5235c34c140931a06e2dadbfc4ad29da342009646a21a44");
 assert.equal(presetFiles.filter(p=>p===path).length,1);
 assert.equal(presetFiles.length,28);
 assert.equal(new Set(presetFiles).size,presetFiles.length);
 const t=transfer();
 assert.equal(t.kind,"skill");
 assert.equal(t.value.draft.id,"cap_fire_atk_5");
 assert.deepEqual(
  importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(t.value.draft)).value,
  t.value
 );
});

test("author's Vague incendiaire keeps projectile, damage, DOT, targeting and absent presentation unchanged",()=>{
 const d=skill(),s=d.definition;
 assert.equal(d.requiredLevel,15);
 assert.equal(s.name,"Vague incendiaire");
 assert.equal(s.form,"projectile");
 assert.equal(s.projectileTargeting,"direct");
 assert.equal(s.element,"fire");
 assert.equal(s.energyCost,6);
 assert.equal(s.preparationMs,1700);
 assert.equal(s.travelMs,2500);
 assert.equal(s.cooldownMs,45);
 assert.deepEqual(s.hitPresenceStates,["surface","airborne"]);
 assert.equal(s.hitsIntangible,true);
 assert.equal(d.presentation,null);
 assert.equal(s.effects.length,2);
 assert.deepEqual(
  {kind:s.effects[0].kind,amount:s.effects[0].amount,channel:s.effects[0].channel},
  {kind:"damage",amount:25,channel:"fire"}
 );
 const dot=s.effects[1];
 assert.equal(dot.kind,"apply_status");
 assert.equal(dot.targetScope,"target");
 assert.equal(dot.status.kind,"damage_over_time");
 assert.equal(dot.status.amount,8);
 assert.equal(dot.status.channel,"fire");
 assert.equal(dot.status.durationMs,10000);
 assert.equal(dot.status.tickIntervalMs,2000);
 assert.equal(dot.status.damageMode,"combat");
});

test("showcase preload replaces existing configuredSkills owner without doubling skill or editing Dracendre's loadout",()=>{
 const registry=statRegistry();
 const skills=new Map();
 for(const draft of [...capturePortableNativeSkillDraftsV1(),...captureComplexNativeSkillDraftsV1()]){
  skills.set(draft.id,draft);
 }
 const historic=skills.get("cap_fire_atk_5");
 assert.ok(historic,"historical native skill exists");
 const startSize=skills.size;
 const opts={transfers:[transfer()],configuredCreatures:new Map(),configuredSkills:skills,
  statRegistry:registry,progressionRules:progressionRules(),mode:"replace"};
 const first=applyCaptureTransferBatchToEditorStateV1(opts);
 assert.deepEqual(first.actions.map(x=>x.action),["replace-skill"]);
 assert.equal(skills.size,startSize);
 assert.notDeepEqual(skills.get("cap_fire_atk_5"),historic);
 assert.deepEqual(skills.get("cap_fire_atk_5"),skill());
 const second=applyCaptureTransferBatchToEditorStateV1(opts);
 assert.deepEqual(second.actions.map(x=>x.action),["noop"]);
 assert.equal(skills.size,startSize);
 const dracendre=importCaptureTransferJsonV1(
  read("data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json").toString("utf8"),
  {statRegistry:registry}
 ).value;
 assert.equal(dracendre.loadout.slots[3].skillId,"cap_fire_atk_5");
});

test("real combat executes the author's direct fire damage and applies its timed fire damage status",()=>{
 const f=id=>({id,maxHp:120,initialHp:120,maxEnergy:50,initialEnergy:50,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
 const session=createCombatSession({distance:"short",fighters:[f("player"),f("enemy")]});
 const result=session.useSkill({actorId:"player",targetId:"enemy",skill:skill().definition});
 assert.equal(result.ok,true);
 const enemy=session.snapshot().fighters.enemy;
 assert.equal(enemy.hp,95);
 assert.equal(enemy.statusEffects.length,1);
 const applied=enemy.statusEffects[0];
 assert.equal(applied.definition.kind,"damage_over_time");
 assert.equal(applied.definition.amount,8);
 assert.equal(applied.definition.tickIntervalMs,2000);
 assert.equal(applied.definition.durationMs,10000);
});
