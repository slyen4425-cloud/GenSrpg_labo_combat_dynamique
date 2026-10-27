import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {importCaptureTransferJsonV1,exportCaptureCreatureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";

const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const currentPath="data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json";
const sourcePath="data/capture/source-exports/gensrpg-capture-creature-crea_maraileron-2026-10-24.json";
const registry=normalizeCaptureStatRegistryV1(read("data/capture/monster-capture-stat-registry.v1.json"));

test("Maraileron active Showcase transfer matches the archived author export without replacing its owner",()=>{
  const current=read(currentPath);
  const author=read(sourcePath);
  assert.deepEqual(current,author);
  assert.equal(current.draft.id,"crea_maraileron");
  assert.equal(current.draft.presentation.version,9);
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===currentPath).length,1);
  assert.deepEqual(current.loadout.slots.map(s=>s.skillId),
    ["cap_water_atk_1","cap_water_atk_2","cap_water_atk_3","lib_aqua_heal","cap_water_special_2"]);
  assert.deepEqual(Object.keys(current.statValues.values).slice(-3),["acier","nature","esprit"]);
  assert.equal(current.draft.combat.approachTimeModifierPct,-20);
  assert.equal(current.draft.combat.maxHp,140);
  assert.deepEqual(current.draft.resistances.filter(r=>r.value),[
    {kind:"element:fire",value:35},
    {kind:"element:water",value:35},
    {kind:"element:electric",value:-50}
  ]);
});

test("Maraileron authored movement and attack bindings survive the canonical Capture import/export",()=>{
  const json=readFileSync(new URL("../../"+currentPath,import.meta.url),"utf8");
  const transfer=importCaptureTransferJsonV1(json,{statRegistry:registry});
  assert.equal(transfer.kind,"creature");
  const d=transfer.value.draft;
  const v=d.presentation.visual;
  assert.equal(d.presentation.version,9);
  for(const [key,id,rotation] of [
    ["movement","pack:capture:creature-maraileron-movement-opponent-12-v1",3],
    ["movementBack","pack:capture:creature-maraileron-movement-player-6-v1",3],
    ["rangedAttack","pack:capture:creature-maraileron-attack-opponent-12-v1",0],
    ["rangedAttackBack","pack:capture:creature-maraileron-attack-player-12-v1",0]
  ]){
    assert.equal(v[key].assetId,id,key);
    assert.equal(v[key].mode,"sprite",key);
    assert.equal(v[key].displayScale,1,key);
    assert.equal(v[key].rotationTurns,rotation,key);
    assert.equal(v[key].frameCount,1,key);
    assert.equal(v[key].transitionMs,80,key);
  }
  assert.deepEqual(v.movementScaleByView,{player:1,opponent:1});
  assert.deepEqual(v.rangedAttackScaleByView,{player:1.3,opponent:1});
  assert.deepEqual(v.movementPlayback,{frameMs:0,mode:"loop"});
  assert.deepEqual(d.presentation.sockets.map(x=>x.id),["mouth","head","left-hand","right-hand","tail"]);
  const roundTrip=importCaptureTransferJsonV1(
    exportCaptureCreatureTransferJsonV1(transfer.value,{statRegistry:registry}),
    {statRegistry:registry}
  );
  assert.deepEqual(roundTrip.value,transfer.value);
});
