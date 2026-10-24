import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import {importCaptureTransferJsonV1,planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";

const root=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const active="data/capture/showcase/cap_poison_atk_3.capture-skill-transfer-v1.json";
const original="data/capture/source-exports/cap_poison_atk_3.author-export-2026-10-24.json";
const exported=JSON.parse(root(active));
const authored=exported.draft;
const skill=authored.definition;
const id="cap_poison_atk_3";

test("Jet acide: exact 24 Oct author export stored once and matches byte-for-byte",()=>{
  assert.equal(root(active),root(original));
  assert.equal(createHash("sha256").update(root(active)).digest("hex"),
    "b6c003a3a8a8fa898a4f5c8836e93269b511368c875ddebd0eac403ed68f6d2a");
  assert.equal(authored.id,id);
  assert.equal(skill.id,id);
  assert.equal(authored.presentation.subjectId,id);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===active).length,1);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,
    CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
});
test("Jet acide: preserves EVERY configured gameplay/visual parameter",()=>{
  assert.equal(authored.requiredLevel,5);
  assert.deepEqual(authored.usageScopes,["capture","combat"]);
  assert.equal(skill.name,"Jet acide");
  assert.equal(skill.form,"projectile");
  assert.equal(skill.projectileTargeting,"direct");
  assert.equal(skill.energyCost,4);
  assert.equal(skill.preparationMs,658);
  assert.equal(skill.travelMs,800);
  assert.equal(skill.cooldownMs,30000);
  assert.equal(skill.hitsIntangible,false);
  assert.equal(skill.effects.length,2);
  assert.deepEqual(skill.effects[0],{
    kind:"damage",targetScope:"target",amount:16,channel:"poison",
    ignoreResistancePct:50,ignoreDamageReductionPct:50
  });
  assert.deepEqual(skill.effects[1],{
    kind:"apply_status",targetScope:"target",status:{
      id:"status-2",kind:"stat_modifier",polarity:"detrimental",durationModel:"time_ms",
      durationMs:15000,stacking:"refresh",maxStacks:1,tags:[],
      statId:"defense",modifierMode:"points",deltaPoints:-250
    }
  });
  assert.deepEqual(authored.presentation.visual,{});
  assert.deepEqual(authored.presentation.audio,{});
  assert.equal(authored.presentation.version,3);
  assert.deepEqual(authored.presentation.statusVisuals["status-2"],{
    mode:"sprite",tintBlinkEnabled:false,tintBlinkPeriodMs:600,
    tintColor:"#9b59d0",tintOpacity:0.35,
    sprite:{assetId:"pack:capture:sprite-status-curse-01",displayScale:1,opacity:0.25}
  });
});
test("Jet acide replaces one historical native ID in configuredSkills without touching Venombre slots",()=>{
  const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(root("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(root("data/capture/monster-capture-progression-rules.v1.json")));
  const configuredSkills=new Map();
  for(const draft of capturePortableNativeSkillDraftsV1())configuredSkills.set(draft.id,draft);
  for(const draft of captureComplexNativeSkillDraftsV1())if(!configuredSkills.has(draft.id))configuredSkills.set(draft.id,draft);
  const legacy=configuredSkills.get(id);
  assert.ok(legacy,"historical Jet acide exists");
  const prevSize=configuredSkills.size;
  const configuredCreatures=new Map();
  const transfer=importCaptureTransferJsonV1(root(active));
  assert.equal(transfer.kind,"skill");
  assert.equal(transfer.value.draft.id,id);
  const plan=planCaptureTransferImportV1({
    currentDatabase:buildCaptureEditorDatabaseV1({
      statRegistry,progressionRules,configuredCreatures,configuredSkills
    }),transfer,mode:"replace"
  });
  assert.equal(plan.action,"replace-skill");
  applyCaptureTransferPlanToEditorStateV1({
    plan,configuredCreatures,configuredSkills,statRegistry,progressionRules
  });
  assert.equal(configuredSkills.size,prevSize,"no duplicate skill");
  assert.equal(configuredSkills.get(id).definition.effects[0].amount,16);
  assert.equal(configuredSkills.get(id).definition.effects[1].status.deltaPoints,-250);
  assert.equal(configuredSkills.get(id).requiredLevel,5);
  assert.notDeepEqual(configuredSkills.get(id).definition,legacy.definition);
  const reloaded=buildCaptureEditorDatabaseV1({
    statRegistry,progressionRules,configuredCreatures,configuredSkills
  }).skills.find(x=>x.id===id);
  assert.ok(reloaded);
  assert.equal(reloaded.definition.effects[1].status.durationMs,15000);
  const creature=JSON.parse(root("data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json"));
  assert.equal(creature.loadout.slots.find(x=>x.id==="slot-2").skillId,id);
});
test("Jet acide: real CombatSession deals Poison damage and applies 15s defense debuff",()=>{
  const fighter=id=>({
    id,maxHp:100,initialHp:100,maxEnergy:50,initialEnergy:50,
    energyChargeAmount:0,energyChargeIntervalMs:2000,
    movementEnergyPerStep:0,chargeTimeModifierPct:0
  });
  const session=createCombatSession({fighters:[fighter("player"),fighter("enemy")]});
  const result=session.useSkill({actorId:"player",targetId:"enemy",skill});
  assert.equal(result.ok,true,JSON.stringify(result));
  const after=session.snapshot().fighters.enemy;
  assert.equal(after.hp,84);
  assert.equal(session.snapshot().fighters.player.energy,46);
  assert.equal(after.statusEffects.some(x=>
    x.definition.id==="status-2"&&x.definition.polarity==="detrimental"&&
    x.definition.durationMs===15000&&x.definition.deltaPoints===-250),true);
});
test("Bestiaire reads actual Jet acide mechanics without an invented icon",()=>{
  const sentences=describeCaptureSkillV1(skill).sentences.join(" ");
  assert.match(sentences,/16 dégâts de Poison/);
  assert.match(sentences,/ignore 50 % de la résistance/);
  assert.match(sentences,/ignore 50 % de la réduction des dégâts/);
  assert.match(sentences,/réduit la défense de 250 points.*15 secondes/);
  assert.doesNotMatch(sentences,/Attaque Poison de puissance 5|Portée|Préparation|Trajet/);
});
