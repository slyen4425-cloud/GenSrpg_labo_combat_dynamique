import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1,planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";

const root=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const active="data/capture/showcase/cap_poison_special_2.capture-skill-transfer-v1.json";
const archive="data/capture/source-exports/cap_poison_special_2.author-export-2026-10-25.json";
const text=root(active);
const draft=JSON.parse(text).draft;
const skill=draft.definition;
const effect=skill.effects[0];

test("Brouillard toxique: exact author bytes, unique ID and no duplicate Showcase registration",()=>{
  assert.equal(root(active),root(archive));
  assert.equal(Buffer.byteLength(text,"utf8"),3866);
  assert.equal(createHash("sha256").update(text).digest("hex"),
    "3f7389de35573b531bb1103e4cf7fac9c7fb975d9fed2769854c1cb769ac8bcd");
  assert.equal(draft.id,"cap_poison_special_2");
  assert.equal(skill.id,draft.id);
  assert.equal(draft.presentation.subjectId,draft.id);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===active).length,1);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,
    CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
});

test("Brouillard toxique: author settings are preserved EXACTLY even when different from previous discussion",()=>{
  assert.equal(skill.name,"Brouillard toxique");
  assert.equal(draft.requiredLevel,10);
  assert.equal(skill.category,"buff_debuff");
  assert.equal(skill.form,"projectile");
  assert.equal(skill.preparationMs,1500);
  assert.equal(skill.cooldownMs,45000);
  assert.equal(effect.kind,"persistent_zone");
  assert.equal(effect.targetScope,"target");
  assert.equal(effect.radius,"short");
  assert.equal(effect.durationMs,10000);
  assert.equal(effect.tickIntervalMs,1000);
  assert.equal(effect.reactivation,"refresh");
  assert.equal(effect.maxActivations,1);
  assert.equal(effect.radiusGrowthSteps,0);
  assert.equal(effect.tickEffect.kind,"apply_marker");
  assert.equal(effect.tickEffect.targetScope,"target");
  assert.equal(effect.tickEffect.charges,2);
  assert.deepEqual(effect.tickEffect.marker,{
    id:"poison",name:"Poison",polarity:"detrimental",durationMs:25000,
    maxStacks:30,iconAssetId:"pack:capture:icon-skill-poison-01",
    periodic:{kind:"damage",amount:5,intervalMs:5000,damageMode:"combat",channel:"physical"}
  });
  assert.equal(draft.presentation.version,9);
  assert.equal(draft.presentation.visual.icon.assetId,"core:icon-skill-poison-cloud-01");
  assert.equal(draft.presentation.visual.aura.assetId,"pack:capture:sprite-crachat-acide-cast-01");
  assert.equal(draft.presentation.visual.aura.displayScale,1.5);
  assert.equal(draft.presentation.visual.aura.opacity,0.4);
  assert.equal(draft.presentation.visual.aura.attachment,"source");
  assert.equal(draft.presentation.visual.aura.layerByView.player,"behind");
  assert.equal(draft.presentation.audio.aura.assetId,"gensrpg:sound:tower-ccc16d37");
});

test("Brouillard toxique: canonical Capture import and reload retains nested marker and visuals",()=>{
  const transfer=importCaptureTransferJsonV1(text);
  assert.equal(transfer.kind,"skill");
  assert.deepEqual(transfer.value.draft.presentation,draft.presentation);
  assert.deepEqual(transfer.value.draft.definition.effects,skill.effects);
  const configuredSkills=new Map(),configuredCreatures=new Map();
  const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(root("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(root("data/capture/monster-capture-progression-rules.v1.json")));
  const database=buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills});
  const plan=planCaptureTransferImportV1({currentDatabase:database,transfer,mode:"replace"});
  applyCaptureTransferPlanToEditorStateV1({plan,configuredSkills,configuredCreatures,statRegistry,progressionRules});
  assert.equal(configuredSkills.size,1);
  assert.equal(configuredSkills.get(draft.id)?.definition.effects[0].tickEffect.charges,2);
  const reloaded=buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills}).skills;
  assert.equal(reloaded.filter(x=>x.id===draft.id).length,1);
  assert.deepEqual(reloaded.find(x=>x.id===draft.id).presentation,draft.presentation);
});

test("Brouillard toxique: real CombatSession creates source-following zone, exactly two markers for chosen enemy",()=>{
  const teams={a:"players",b:"enemies",c:"enemies"};
  const battleFormat={actors:Object.keys(teams).map(actorId=>({actorId})),
    teamOf(id){return teams[id]??null;}};
  const f=id=>({id,maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10});
  const session=createCombatSession({distance:"long",battleFormat,fighters:["a","b","c"].map(f)});
  const action=session.useSkill({actorId:"a",targetId:"b",skill});
  assert.equal(action.ok,true,JSON.stringify(action));
  session.advanceMs(1500);
  const zone=session.snapshot().persistentZones[0];
  assert.ok(zone,"source zone exists after authored 1500ms preparation");
  assert.equal(zone.sourceActorId,"a");
  assert.equal(zone.durationMs,10000);
  assert.equal(zone.radiusGrowthSteps,0);
  const context={visibleZones:{
    zones:[{zoneId:zone.id,sourceActorId:zone.sourceActorId,radius:zone.radius,
      bounds:{left:0,top:0,width:100,height:100}}],
    actors:[
      {actorId:"a",bounds:{left:20,top:20,width:20,height:20}},
      {actorId:"b",bounds:{left:20,top:20,width:20,height:20}},
      {actorId:"c",bounds:{left:20,top:20,width:20,height:20}}
    ]
  }};
  session.advanceMs(1,{zoneSpatialContext:context});
  const markers=id=>session.snapshot().fighters[id].statusEffects
    .find(x=>x.definition.id==="marker:poison")?.stacks??0;
  assert.equal(markers("b"),2);
  assert.equal(markers("c"),0,"author targetScope target does not mean all enemies");
  session.advanceMs(100,{zoneSpatialContext:context});
  assert.equal(markers("b"),2,"remaining inside does not reapply marker charges");
});
