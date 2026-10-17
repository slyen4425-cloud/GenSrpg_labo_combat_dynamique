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
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";

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
 assert.equal(bytes.length,3352);
 assert.equal(sha256(bytes),"9e940251a53f66fd2d04e40c1bf4fb09d5abcbfdce074f47e674e29a382ee3c3");
 assert.equal(presetFiles.filter(p=>p===path).length,1);
 assert.equal(presetFiles.length,35);
 assert.equal(new Set(presetFiles).size,presetFiles.length);
 const t=transfer();
 assert.equal(t.kind,"skill");
 assert.equal(t.value.draft.id,"cap_fire_atk_5");
 assert.deepEqual(
  importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(t.value.draft)).value,
  t.value
 );
});

test("author's Vague incendiaire keeps expanding wave, damage, DOT and exact sprite unchanged",()=>{
 const d=skill(),s=d.definition;
 assert.equal(d.requiredLevel,15);
 assert.equal(s.name,"Vague incendiaire");
 assert.equal(s.form,"projectile");
 assert.equal(s.projectileTargeting,"expanding_wave");
 assert.deepEqual(s.expandingWave,{startRadiusPct:8,endRadiusPct:65,thicknessPct:8});
 assert.equal(s.projectileClash.power,4);
 assert.equal(s.element,"fire");
 assert.equal(s.energyCost,6);
 assert.equal(s.preparationMs,1700);
 assert.equal(s.travelMs,2500);
 assert.equal(s.cooldownMs,45000);
 assert.deepEqual(s.hitPresenceStates,["surface","airborne"]);
 assert.equal(s.hitsIntangible,false);
 assert.equal(d.presentation.visual.travel.assetId,"pack:capture:sprite-fire-bubble-expansion-01");
 assert.equal(d.presentation.visual.travel.opacity,1);
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

test("the author's wave requires real Runtime contact before fire damage and status",()=>{
 const f=id=>({id,maxHp:120,initialHp:120,maxEnergy:50,initialEnergy:50,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
 const session=createCombatSession({distance:"short",fighters:[f("player"),f("enemy")]});
 const skillDefinition=skill().definition;
 assert.equal(skillDefinition.projectileTargeting,"expanding_wave");
 assert.equal(skillDefinition.effects.length,2);
 const clock={now:0,seq:0,timers:new Map()};
 const runtime=createCombatRuntime({session,now:()=>clock.now,
  setTimer:cb=>{const id=++clock.seq;clock.timers.set(id,cb);return id;},
  clearTimer:id=>clock.timers.delete(id)});
 runtime.start();
 assert.equal(runtime.startSkill({actorId:"player",targetId:"enemy",skill:skillDefinition}).ok,true);
 assert.equal(session.snapshot().fighters.enemy.hp,120);
 // The same Runtime release and collision path used by animated wave skills.
 clock.now=1700;
 const tick=clock.timers.entries().next().value;
 assert.ok(tick);
 clock.timers.delete(tick[0]);tick[1]();
 assert.equal(session.snapshot().fighters.enemy.hp,120);
 clock.now=1900;
 const contacted=runtime.reportActionContact({actorId:"player",targetId:"enemy",skillId:"cap_fire_atk_5"});
 assert.equal(contacted.ok,true);
 assert.equal(session.snapshot().fighters.enemy.hp,95);
 const applied=session.snapshot().fighters.enemy.statusEffects[0];
 assert.equal(applied.definition.kind,"damage_over_time");
 assert.equal(applied.definition.amount,8);
 assert.equal(applied.definition.tickIntervalMs,2000);
 assert.equal(applied.definition.durationMs,10000);
 runtime.dispose();
});

