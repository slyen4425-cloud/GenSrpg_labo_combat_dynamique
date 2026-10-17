import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {normalizeCaptureMarkerLibraryV1} from "../../src/contracts/capture-marker-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyImmediateTacticalEffectsV1} from "../../src/core/combat/immediate-tactical-effects-v1.js";
import {advanceStatusEffectsV1} from "../../src/core/combat/status-effect-runtime-v1.js";

const FILE="data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json";
const ARCHIVE="data/capture/source-exports/gensrpg-marqueurs-2026-10-17.json";
const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const fighter=id=>({id,maxHp:120,initialHp:120,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
const start=()=>createCombatState({fighters:[fighter("a"),fighter("b")]});

test("authored Dard static is the one canonical active Capture transfer without editing its raw export",async()=>{
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===FILE).length,1);
  const raw=await read(FILE);
  assert.equal(createHash("sha256").update(raw).digest("hex"),
    "afc60fb2b91d711cc19fe13c728e0268496ac363fd3f31b93a172c764698b48c");
  const transfer=importCaptureTransferJsonV1(raw);
  assert.equal(transfer.kind,"skill");
  const d=transfer.value.draft;
  assert.equal(d.id,"lib_paralyze");
  assert.equal(d.definition.name,"Dard static");
  assert.equal(d.description,"Place marqeur");
  assert.equal(d.requiredLevel,1);
  assert.deepEqual([d.definition.form,d.definition.element,d.definition.approachMode],["contact","electric","ground"]);
  assert.deepEqual([d.definition.energyCost,d.definition.preparationMs,d.definition.travelMs,d.definition.cooldownMs],[3,700,800,8000]);
  assert.equal(d.definition.effects[0].amount,8);
  assert.equal(d.definition.effects[0].channel,"electric");
  assert.equal(d.definition.effects[1].kind,"apply_marker");
  assert.equal(d.definition.effects[1].charges,1);
  const marker=d.definition.effects[1].marker;
  assert.deepEqual([marker.id,marker.name,marker.polarity,marker.permanent,marker.maxStacks],
    ["venin-static","venin static","detrimental",true,20]);
  assert.deepEqual([marker.periodic.kind,marker.periodic.amount,marker.periodic.intervalMs,
    marker.periodic.damageMode,marker.periodic.channel],["damage",2,5000,"combat","electric"]);
  assert.equal(marker.onStackThreshold.count,20);
  assert.equal(marker.onStackThreshold.consume,"reset");
  assert.equal(marker.onStackThreshold.effects[0].kind,"knockout");
  assert.equal(marker.iconAssetId,"pack:capture:icon-skill-toxine-01");
  assert.equal(d.presentation.visual.impact.assetId,"pack:capture:sprite-impact-electric-01");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(d)).value.draft,d);
});

test("empty author marker-library export is archived as-is, not installed as an active rival registry",async()=>{
  const original=await read(ARCHIVE);
  assert.equal(createHash("sha256").update(original).digest("hex"),
    "314e46c1799ae05a33aa5986effa2796282f02c0685670a160bd7229d03e429e");
  assert.deepEqual(JSON.parse(original),{schema:"capture-markers-v1",markers:[]});
  assert.deepEqual(normalizeCaptureMarkerLibraryV1(JSON.parse(original).markers),[]);
});

test("native combat effect places shared Venin permanent and its periodic clock is usable",async()=>{
  const d=importCaptureTransferJsonV1(await read(FILE)).value.draft;
  let state=start();
  const first=applyImmediateTacticalEffectsV1({state,actorId:"a",targetId:"b",skill:d.definition,atMs:0,combatAtMs:0});
  state=first.state;
  const status=state.fighters.b.statusEffects.find(s=>s.definition.id==="marker:venin-static");
  assert.ok(status,"marker installed by author's combat effect");
  assert.equal(status.stacks,1);
  assert.equal(status.expiresAtMs,null);
  assert.equal(status.nextTickAtMs,5000);
  const initialHp=state.fighters.b.hp;
  const tick=advanceStatusEffectsV1({state,deltaMs:5000});
  assert.ok(tick.fighters.b.hp<initialHp,"electric Venin tick dealt native combat damage");
});

test("20 authored marker charges trigger native KO and reset; no special parallel marker owner",async()=>{
  const d=importCaptureTransferJsonV1(await read(FILE)).value.draft;
  let state=start();
  const onlyMarker={id:d.id,effects:[d.definition.effects[1]]};
  for(let i=0;i<20;i++)state=applyImmediateTacticalEffectsV1({
    state,actorId:"a",targetId:"b",skill:onlyMarker,atMs:0,combatAtMs:0
  }).state;
  assert.equal(state.fighters.b.hp,0);
  assert.equal(state.fighters.a.knockoutsTotal,1);
  assert.equal(state.fighters.b.statusEffects.some(s=>s.definition.id==="marker:venin-static"),false);
});
