import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {normalizeCaptureMarkerV1} from "../../src/contracts/capture-marker-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";

const read=path=>JSON.parse(readFileSync(new URL("../../"+path,import.meta.url),"utf8"));
const skillPath="data/capture/showcase/festin-carnivore.capture-skill-transfer-v1.json";
const creaturePath="data/capture/showcase/crea_crys_2.capture-creature-transfer-v1.json";
const skill=()=>importCaptureTransferJsonV1(JSON.stringify(read(skillPath))).value.draft;

test("RED: Gemmor's single native ultimate deals 50 Nature, drains actual damage and applies existing leech marker",()=>{
 const draft=skill(),def=normalizeSkillDefinition(draft.definition);
 assert.equal(draft.id,"festin-carnivore");
 assert.equal(draft.requiredLevel,20);
 assert.equal(def.loadoutSlot,"ultimate");
 assert.equal(def.form,"beam");
 assert.equal(def.element,"nature");
 assert.equal(def.energyCost,8);
 assert.equal(def.preparationMs,2500);
 assert.equal(def.maxUsesPerCombat,1);
 assert.equal(def.effects.length,4);
 assert.deepEqual(def.effects.slice(0,2).map(e=>e.kind),["life_steal","damage"]);
 assert.equal(def.effects[0].targetScope,"self");
 assert.equal(def.effects[0].percent,100);
 assert.equal(def.effects[1].amount,50);
 assert.equal(def.effects[1].channel,"nature");
 assert.equal(def.effects[2].kind,"apply_status");
 assert.equal(def.effects[2].status.kind,"immobilize");
 assert.equal(def.effects[2].status.durationMs,4000);
 assert.equal(def.effects[3].charges,2);
 const canonical=normalizeCaptureMarkerV1(read("data/capture/showcase/markers.capture-markers-v1.json").markers.find(m=>m.id==="graine-sansue"));
 assert.deepEqual(def.effects[3].marker,canonical,"same canonical Graine sansue, no clone of marker rules");
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===skillPath).length,1);
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft,draft);
});

test("RED: Gemmor uses official level 1/5/10/15/20 skills and an existing ultimate slot",()=>{
 const registry=normalizeCaptureStatRegistryV1(read("data/capture/monster-capture-stat-registry.v1.json"));
 const imported=importCaptureTransferJsonV1(JSON.stringify(read(creaturePath)),{statRegistry:registry});
 const record=imported.value;
 assert.equal(record.draft.id,"crea_crys_2");
 assert.equal(record.draft.displayName,"Gemmor");
 const expected=["coupe_feuille","armure-de-pointe","attaque-sous-terraine","sangsue","festin-carnivore"];
 assert.deepEqual(record.loadout.slots.map(x=>x.skillId),expected);
 for(const id of expected)assert.ok(record.draft.skillIds.includes(id),id+" must be selectable");
 for(const [id,level] of [["coupe_feuille",1],["armure-de-pointe",5],["attaque-sous-terraine",10],["sangsue",15],["festin-carnivore",20]]){
   const filename=id==="festin-carnivore"?skillPath:"data/capture/showcase/"+(id==="armure-de-pointe"?"armure-de-pointe":id)+".capture-skill-transfer-v1.json";
   assert.equal(read(filename).draft.requiredLevel,level,id+" required level");
 }
 assert.equal(record.draft.presentation.visual.front.assetId,"pack:capture:creature-plante-carnivore-opponent-01");
 assert.equal(record.statValues.values.health,170);
});

test("RED: real Combat Session drains ONLY actual HP lost and uses native status/marker runtime",()=>{
 const ultimate=skill().definition;
 const fighter=(id,initialHp)=>({id,maxHp:250,initialHp,maxEnergy:30,initialEnergy:30});
 const session=createCombatSession({fighters:[fighter("gemmor",100),fighter("enemy",200)]});
 const result=session.useSkill({actorId:"gemmor",targetId:"enemy",skill:ultimate});
 assert.equal(result.ok,true);
 assert.equal(result.outcome,"hit");
 const hp=session.snapshot().fighters;
 const dealt=200-hp.enemy.hp;
 assert.equal(dealt,50,"base damage against zero-resistance target");
 assert.equal(hp.gemmor.hp,150,"native 100% lifesteal heals only actual damage");
 const healEvent=result.events.find(e=>e.type==="heal"&&e.lifeSteal===true);
 assert.equal(healEvent?.damageBasis,50);
 assert.equal(healEvent?.applied,50);
 assert.ok(hp.enemy.statusEffects.some(s=>s.definition.kind==="immobilize"&&s.definition.durationMs===4000));
 assert.equal(hp.enemy.statusEffects.find(s=>s.definition.kind==="stack_counter"&&s.definition.id==="marker:graine-sansue")?.stacks,2);
 const second=session.useSkill({actorId:"gemmor",targetId:"enemy",skill:ultimate});
 assert.equal(second.ok,false);
 assert.equal(second.outcome,"usage_limit");
});

test("RED: presentation reuses canonical assets instead of publishing duplicate sprites",()=>{
 const p=skill().presentation.visual;
 assert.equal(p.icon.assetId,"pack:capture:icon-skill-ronce-01");
 assert.equal(p.cast.assetId,"pack:capture:sprite-cast-nature-01");
 assert.equal(p.travel.assetId,"pack:capture:sprite-liane-epineuse-rayon-01");
 assert.equal(p.impact.assetId,"pack:capture:sprite-spores-expansives-projectile-sphere-02");
});
