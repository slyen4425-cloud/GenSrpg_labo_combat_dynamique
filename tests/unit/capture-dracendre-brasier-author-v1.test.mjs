import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1,
  exportCaptureCreatureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  applyCaptureTransferBatchToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as creatureFiles } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as skillFiles } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeCaptureSkillEditorDraftV1 } from "../../src/contracts/capture-skill-editor-draft-v1.js";
import { canonicalCaptureCreatureRecordsV1 } from "../../src/catalogs/capture-canonical-creature-catalog-v1.js";
import { importMonsterCaptureCreatureRecordV1 } from "../../src/adapters/input/capture/monster-capture-creature-import-v1.js";
import { importMonsterCaptureStatValuesV1 } from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";
import { buildCaptureCreatureHistoricalLoadoutV1 } from "../../src/catalogs/capture-creature-historical-loadout-v1.js";

const cPath="data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json";
const sPath="data/capture/showcase/cap_fire_atk_7.capture-skill-transfer-v1.json";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url));
const sha=b=>createHash("sha256").update(b).digest("hex");
const registry=normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(read("data/capture/monster-capture-progression-rules.v1.json")));
const creature=()=>importCaptureTransferJsonV1(read(cPath).toString("utf8"),{statRegistry:registry});
const skill=()=>importCaptureTransferJsonV1(read(sPath).toString("utf8"));

test("Dracendre and Brasier exports are exact author bytes and registered once",()=>{
 const cb=read(cPath), sb=read(sPath);
 assert.equal(cb.byteLength,4452);
 assert.equal(sb.byteLength,5260);
 assert.equal(sha(cb),"cdc0d760eddc2558ff8542ec975e5b699af1bd7f41c34ef1ca2b0c76a6ed398e");
 assert.equal(sha(sb),"e2669fccbb4d6bcf9eb7c2d1f1eddabb0b5bfeb14e4f44e3f5614d8b9d4a909f");
 assert.equal(creatureFiles.filter(x=>x===cPath).length,1);
 assert.equal(skillFiles.filter(x=>x===sPath).length,1);
 assert.equal(new Set(creatureFiles).size,creatureFiles.length);
 assert.equal(new Set(skillFiles).size,skillFiles.length);
 const c=creature(), s=skill();
 assert.equal(c.kind,"creature");
 assert.equal(s.kind,"skill");
 assert.equal(c.value.draft.id,"crea_dracendre");
 assert.equal(s.value.draft.id,"cap_fire_atk_7");
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(c.value,{statRegistry:registry}),{statRegistry:registry}).value,c.value);
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(s.value.draft)).value,s.value);
});

test("Dracendre preserves stats, two elements, resistances, Braisombre assets, and every equipment slot",()=>{
 const {value:c}=creature();
 assert.equal(c.draft.displayName,"Dracendre");
 assert.equal(c.draft.level,1);
 assert.deepEqual(c.draft.elements,["fire","air"]);
 assert.deepEqual(c.draft.sourceStats,{force:19,agility:13,intelligence:0,spirit:12,endurance:15,initiative:14});
 assert.equal(c.draft.resistances.length,13);
 assert.equal(c.draft.resistances.find(r=>r.kind==="element:fire").value,35);
 assert.equal(c.draft.resistances.find(r=>r.kind==="element:water").value,-50);
 assert.equal(c.draft.resistances.find(r=>r.kind==="element:air").value,35);
 assert.equal(c.draft.combat.maxHp,160);
 assert.equal(c.statValues.values.health,160);
 assert.equal(c.statValues.values.speed,15);
 assert.equal(c.draft.presentation.profileId,"flying");
 assert.deepEqual(c.draft.presentation.viewOverrides.player,{displayScale:1.6,position:{x:0,y:0}});
 assert.deepEqual(c.draft.presentation.viewOverrides.opponent,{displayScale:0.9,position:{x:0,y:30}});
 assert.deepEqual(c.draft.presentation.sockets,[]);
 assert.deepEqual(c.draft.presentation.audio.movement,{assetId:"gensrpg:sound:sanctuary-367a77dd",volume:1});
 assert.equal(c.draft.presentation.visual.front.assetId,"pack:capture:creature-braisombre-opponent-01");
 assert.equal(c.draft.presentation.visual.back.assetId,"pack:capture:creature-braisombre-player-01");
 assert.equal(c.draft.presentation.visual.icon.assetId,"pack:capture:creature-braisombre-icon-01");
 assert.equal(c.draft.capture.evolution.targetId,"crea_volcadrake");
 assert.equal(c.draft.capture.evolution.level,28);
 assert.equal(c.draft.skillIds.length,20);
 assert.ok(c.draft.skillIds.includes("cap_fire_atk_7"));
 assert.deepEqual(c.loadout.slots.map(s=>s.skillId),["lib_heat_wave","fireball","cap_fire_special_2","cap_fire_atk_5","cap_fire_atk_7"]);
});

test("Brasier primordial retains author's level, 50 fire damage to all enemies, reserve reach and three meteorite sprites",()=>{
 const d=skill().value.draft;
 assert.equal(d.definition.id,"cap_fire_atk_7");
 assert.equal(d.definition.name,"Brasier primordial");
 assert.equal(d.requiredLevel,20);
 assert.match(d.description,/niveau 46/); // Authored text is intentionally preserved, not silently altered.
 assert.equal(d.definition.loadoutSlot,"ultimate");
 assert.equal(d.definition.element,"fire");
 assert.equal(d.definition.form,"projectile");
 assert.equal(d.definition.energyCost,0);
 assert.equal(d.definition.cooldownMs,0);
 assert.equal(d.definition.projectileTargeting,"fixed_point");
 assert.equal(d.definition.preparationMs,3500);
 assert.equal(d.definition.travelMs,1000);
 assert.deepEqual(d.definition.effects.map(e=>[e.kind,e.targetScope,e.amount,e.channel]),[
  ["damage","all_enemies",50,"fire"],
  ["damage","all_enemy_reserves",50,null]
 ]);
 assert.equal(d.presentation.version,10);
 assert.equal(d.presentation.visual.cast.assetId,"pack:capture:sprite-fluide-meteorite-cast-01");
 assert.equal(d.presentation.visual.travel.assetId,"pack:capture:sprite-fluide-meteorite-projectile-01");
 assert.equal(d.presentation.visual.impact.assetId,"pack:capture:sprite-fluide-meteorite-impact-01");
 assert.equal(d.presentation.visual.travel.trajectoryMode,"skyfall");

 // A reserve-wide effect intentionally requires the roster owner: never
 // silently fall back to a single-target hit when no roster is mounted.
 const f=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
 const session=createCombatSession({distance:"short",fighters:[f("player"),f("target")]});
 const result=session.previewSkill({actorId:"player",targetId:"target",skill:d.definition});
 assert.equal(result.ok,false);
 assert.equal(result.outcome,"reserve_roster_required");
});

test("the existing canonical Transfer batch installs both author models without creating a second owner",()=>{
 const configuredSkills=new Map(JSON.parse(read("data/combat/skills/catalog.v1.json")).entries.map(entry=>{
   const definition=normalizeSkillDefinition(entry.definition);
   const draft=normalizeCaptureSkillEditorDraftV1({
     schema:"capture-skill-editor-draft-v1",id:definition.id,description:"Capacité native du laboratoire.",
     requiredLevel:1,usageScopes:["capture","combat"],definition,presentation:null
   });
   return [draft.id,draft];
 }));
 for(const d of capturePortableNativeSkillDraftsV1())if(!configuredSkills.has(d.id))configuredSkills.set(d.id,d);
 for(const d of captureComplexNativeSkillDraftsV1()) if(!configuredSkills.has(d.id)) configuredSkills.set(d.id,d);
 const configuredCreatures=new Map();
 const existing=JSON.parse(read("data/capture/monster-capture-creatures.v1.json"));
 assert.equal(existing.entries.filter(x=>x.id==="crea_dracendre").length,1);
 assert.equal(existing.entries.filter(x=>x.id==="crea_volcadrake").length,1);
 // The editor first loads the canonical historical roster, including the evolution target.
 const nativeSkillIds=new Set(configuredSkills.keys());
 for(const entry of canonicalCaptureCreatureRecordsV1(existing.entries)){
   const imported=importMonsterCaptureCreatureRecordV1(entry);
   const historical=buildCaptureCreatureHistoricalLoadoutV1({
     creatureId:imported.draft.id,level:imported.draft.level,selectionMode:"planned",
     abilityIds:imported.draft.skillIds,runtimeSkillIds:nativeSkillIds
   });
   configuredCreatures.set(imported.draft.id,{
     draft:imported.draft,loadout:historical.loadout,
     statValues:importMonsterCaptureStatValuesV1(entry,registry)
   });
 }
 assert.ok(configuredCreatures.has("crea_dracendre"));
 assert.ok(configuredCreatures.has("crea_volcadrake"));
 const creatureCountBefore=configuredCreatures.size;
 const sizeBefore=configuredSkills.size;
 const actions=applyCaptureTransferBatchToEditorStateV1({transfers:[skill(),creature()],
  configuredSkills,configuredCreatures,statRegistry:registry,progressionRules,mode:"replace"});
 assert.deepEqual(actions.actions.map(x=>x.id),["cap_fire_atk_7","crea_dracendre"]);
 assert.deepEqual(actions.actions.map(x=>x.action),["replace-skill","replace-creature"]);
 assert.equal(configuredSkills.get("cap_fire_atk_7").definition.effects[0].amount,50);
 assert.equal(configuredCreatures.get("crea_dracendre").draft.presentation.profileId,"flying");
 assert.equal(configuredCreatures.size,creatureCountBefore);
 assert.equal(configuredSkills.size,sizeBefore+(actions.actions[0].action==="insert-skill"?1:0));
 const next=applyCaptureTransferBatchToEditorStateV1({transfers:[skill(),creature()],
  configuredSkills,configuredCreatures,statRegistry:registry,progressionRules,mode:"replace"});
 assert.deepEqual(next.actions.map(x=>x.action),["noop","noop"]);
 assert.equal(configuredCreatures.size,creatureCountBefore);
 assert.deepEqual(configuredCreatures.get("crea_dracendre").loadout.slots.map(x=>x.skillId),["lib_heat_wave","fireball","cap_fire_special_2","cap_fire_atk_5","cap_fire_atk_7"]);
});
