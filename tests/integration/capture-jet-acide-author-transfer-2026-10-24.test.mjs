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
const refreshed="data/capture/source-exports/cap_poison_atk_3.author-export-2026-10-25.json";
const newest="data/capture/source-exports/cap_poison_atk_3.author-export-2026-10-25-v2.json";
const exported=JSON.parse(root(active));
const authored=exported.draft;
const skill=authored.definition;
const id="cap_poison_atk_3";

test("Jet acide: previous author exports are preserved and latest export is unique active owner",()=>{
  assert.equal(createHash("sha256").update(root(original)).digest("hex"),
    "b6c003a3a8a8fa898a4f5c8836e93269b511368c875ddebd0eac403ed68f6d2a");
  assert.equal(createHash("sha256").update(root(refreshed)).digest("hex"),
    "b029cb91c199e1578f2903eb01642cbe1f94f545adcb79883a80a6b39a827061");
  assert.equal(root(active),root(newest),"live owner must be exact author's newest file");
  assert.notEqual(root(active),root(original),"prior provenance is archive-only");
  assert.equal(Buffer.byteLength(root(active),"utf8"),4654);
  assert.equal(createHash("sha256").update(root(active)).digest("hex"),
    "d997dd64f63bf185f6f989dba52642ca6e65e5abcdff96cbf0bf57a8ed89461d");
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
  assert.deepEqual(authored.definition,JSON.parse(root(original)).draft.definition,"mechanics are author-identical to prior release");
  const visuals=authored.presentation.visual;
  assert.deepEqual(Object.keys(visuals).sort(),["cast","icon","impact","travel"]);
  assert.equal(visuals.icon.assetId,"pack:capture:icon-skill-morsure-venimeuse-01");
  assert.equal(visuals.cast.assetId,"pack:capture:sprite-crachat-acide-cast-01");
  assert.equal(visuals.cast.anchor,"mouth");
  assert.equal(visuals.cast.opacity,0.5);
  assert.equal(visuals.cast.displayScale,0.7);
  assert.equal(visuals.cast.offsetX,40);
  assert.equal(visuals.cast.offsetY,15);
  assert.equal(visuals.cast.playbackMode,"loop");
  assert.equal(visuals.travel.assetId,"pack:capture:sprite-crachat-acide-projectile-01");
  assert.equal(visuals.travel.displayScale,1.5);
  assert.equal(visuals.travel.attachment,"trajectory");
  assert.equal(visuals.impact.assetId,"pack:capture:sprite-crachat-acide-impact-01");
  assert.equal(visuals.impact.playbackMode,"once");
  assert.equal(visuals.impact.trigger,"impact");
  assert.deepEqual(authored.presentation.audio,{});
  assert.equal(authored.presentation.version,3);
  assert.deepEqual(authored.presentation.statusVisuals["status-2"],{
    mode:"sprite",tintBlinkEnabled:false,tintBlinkPeriodMs:600,
    tintColor:"#9b59d0",tintOpacity:0.35,
    sprite:{assetId:"pack:capture:sprite-crachat-acide-aura-01",displayScale:1,opacity:0.35}
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
  assert.deepEqual(transfer.value.draft.presentation,authored.presentation,"importer preserves all FX settings");
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
  // A real Capture combatant carries the registry's defense projection.
  // The old test-only fighter omitted this, triggering unsupported_status_stat.
  const defenseRule=JSON.parse(root("data/capture/monster-capture-stat-registry.v1.json"))
    .stats.find(x=>x.id==="defense");
  assert.ok(defenseRule);
  const fighter=id=>({
    id,maxHp:100,initialHp:100,maxEnergy:50,initialEnergy:50,
    energyChargeAmount:0,energyChargeIntervalMs:2000,
    movementEnergyPerStep:0,chargeTimeModifierPct:0,
    statValuesById:{defense:10},
    statEffectRulesById:{defense:{
      damageChannel:defenseRule.damageChannel,
      resistanceChannel:defenseRule.resistanceChannel,
      damagePctPerPoint:defenseRule.damagePctPerPoint,
      resistancePctPerPoint:defenseRule.resistancePctPerPoint,
      chargeTimeReductionPctPerPoint:defenseRule.chargeTimeReductionPctPerPoint,
      damageReductionPctPerPoint:defenseRule.damageReductionPctPerPoint
    }}
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
  assert.match(sentences,/Réduit la défense de 250 points.*15 secondes/);
  assert.doesNotMatch(sentences,/Attaque Poison de puissance 5|Portée|Préparation|Trajet/);
});
