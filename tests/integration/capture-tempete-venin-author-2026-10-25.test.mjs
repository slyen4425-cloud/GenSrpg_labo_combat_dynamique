import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1,planCaptureTransferImportV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {buildCaptureEditorDatabaseV1,applyCaptureTransferPlanToEditorStateV1} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyImmediateTacticalEffectsV1} from "../../src/core/combat/immediate-tactical-effects-v1.js";
import {applyStatusEffectV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {markerStatusDefinitionV1} from "../../src/contracts/capture-marker-v1.js";

const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const id="cap_poison_atk_6";
const active="data/capture/showcase/cap_poison_atk_6.capture-skill-transfer-v1.json";
const archive="data/capture/source-exports/gensrpg-capture-skill-cap_poison_atk_6-2026-10-25.json";
const newest="data/capture/source-exports/cap_poison_atk_6.author-export-2026-10-25-v2.json";
const source=()=>read(active);
const loaded=()=>importCaptureTransferJsonV1(source()).value.draft;

test("Tempête de venin: source author file archived without mutation; one active ID",()=>{
  assert.equal(createHash("sha256").update(read(archive)).digest("hex"),
    "75cfad7bebef9d6d6bf14e0d32a1d6b8d67d41861cfc5c0d0832b04fe732ae60","old archive intact");
  assert.equal(source(),read(newest),"newest author export is the single active owner");
  assert.equal(Buffer.byteLength(source(),"utf8"),3615);
  assert.equal(createHash("sha256").update(source()).digest("hex"),
    "9941f0e30069fbb3acd39a826987dda52a62bc61ef197706f9ba299225a0f76f");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===active).length,1);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
  assert.equal(loaded().id,id);
});

test("Tempête de venin 25 Oct V2 changes only the author icon, never gameplay",()=>{
  const current=JSON.parse(source()),previous=JSON.parse(read(archive));
  assert.deepEqual({...current,draft:{...current.draft,presentation:{
    ...current.draft.presentation,visual:previous.draft.presentation.visual
  }}},previous);
});

test("Tempête de venin: unchanged editor roundtrip, author parameters, effects and impact",()=>{
  const raw=JSON.parse(source()).draft;
  const draft=loaded();
  assert.deepEqual(draft,raw);
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft,draft);
  assert.equal(draft.requiredLevel,15);
  assert.equal(draft.definition.name,"Tempête de venin");
  assert.equal(draft.definition.element,"poison");
  assert.equal(draft.definition.form,"projectile");
  assert.equal(draft.definition.energyCost,0);
  assert.equal(draft.definition.preparationMs,2000);
  assert.equal(draft.definition.cooldownMs,60000);
  assert.equal(draft.definition.effects.length,1);
  const effect=draft.definition.effects[0];
  assert.equal(effect.kind,"consume_marker");
  assert.equal(effect.targetScope,"target");
  assert.equal(effect.markerId,"*");
  assert.equal(effect.count,"all");
  assert.equal(effect.minimum,1);
  assert.equal(effect.perCharge,true);
  assert.equal(effect.effects[0].status.kind,"stun");
  assert.equal(effect.effects[0].status.durationMs,2000);
  assert.equal(effect.effects[1].amount,5);
  assert.equal(effect.effects[1].channel,"poison");
  assert.equal(draft.presentation.visual.impact.assetId,"pack:capture:sprite-crachat-acide-impact-01");
  assert.equal(draft.presentation.visual.impact.opacity,0.8);
  assert.equal(draft.presentation.visual.icon.assetId,"pack:capture:icon-skill-poison-corrosif-01");
});

test("Tempête de venin: canonical editor configuredSkills imports exactly one replacement or addition",()=>{
  const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(read("data/capture/monster-capture-progression-rules.v1.json")));
  const configuredSkills=new Map(),configuredCreatures=new Map();
  for(const draft of capturePortableNativeSkillDraftsV1()) configuredSkills.set(draft.id,draft);
  for(const draft of captureComplexNativeSkillDraftsV1()) if(!configuredSkills.has(draft.id))configuredSkills.set(draft.id,draft);
  const existing=configuredSkills.has(id);
  const before=configuredSkills.size;
  const transfer=importCaptureTransferJsonV1(source());
  assert.equal(transfer.kind,"skill");
  const plan=planCaptureTransferImportV1({
    currentDatabase:buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills}),
    transfer,mode:"replace"
  });
  assert.equal(plan.action,existing?"replace-skill":"insert-skill");
  applyCaptureTransferPlanToEditorStateV1({plan,configuredCreatures,configuredSkills,statRegistry,progressionRules});
  assert.equal(configuredSkills.size,before+(existing?0:1));
  assert.deepEqual(configuredSkills.get(id),loaded());
  assert.deepEqual(buildCaptureEditorDatabaseV1({statRegistry,progressionRules,configuredCreatures,configuredSkills})
    .skills.find(x=>x.id===id),loaded());
});

test("Tempête de venin: native marker owner consumes ALL types and deals poison damage per charge, plus 2s stun",()=>{
  const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
  let state=createCombatState({fighters:[fighter("a"),fighter("b")]});
  const markers=[
    {id:"venin-static",name:"Venin statique",polarity:"detrimental",permanent:true,maxStacks:20},
    {id:"peste",name:"Peste",polarity:"detrimental",permanent:true,maxStacks:20}
  ];
  for(const marker of [markers[0],markers[0],markers[1]]) {
    state=applyStatusEffectV1({state,sourceActorId:"a",targetActorId:"b",
      sourceSkillId:"seed",status:markerStatusDefinitionV1(marker),atMs:0});
  }
  const result=applyImmediateTacticalEffectsV1({state,actorId:"a",targetId:"b",
    skill:loaded().definition,atMs:0,combatAtMs:0});
  assert.equal(result.state.fighters.b.hp,85,"three charges * five damage, applied as one native hit");
  assert.equal(result.state.fighters.b.statusEffects.filter(x=>x.definition.id.startsWith("marker:")).length,0);
  assert.equal(result.state.fighters.b.statusEffects.some(x=>x.definition.kind==="stun"&&
    x.definition.durationMs===2000),true);
  assert.equal(result.events.filter(x=>x.type==="markers-consumed").reduce((n,x)=>n+x.charges,0),3);
  const empty=applyImmediateTacticalEffectsV1({state:createCombatState({fighters:[fighter("a"),fighter("b")]}),
    actorId:"a",targetId:"b",skill:loaded().definition,atMs:0,combatAtMs:0});
  assert.equal(empty.state.fighters.b.hp,100,"minimum 1 requires real marker charges");
});
