import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCreaturePresentationBinding} from "../../src/contracts/creature-presentation-binding.js";
import {adaptCaptureExportToNativeVisualSourceV1} from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import {creatureMovementAppearanceForViewV1, creatureRangedAppearanceForViewV1} from "../../src/ui/demo-app.js";

const root = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const activePath = "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json";
const sourcePath = "data/capture/source-exports/gensrpg-capture-creature-crea-loup-2026-10-21.json";
const authorHash = "d757279d7dcc0ca413dc27fa700ea342aac62dbd12f89af8e2e7f60c869641eb";
const ids = Object.freeze({
  front:"pack:capture:creature-loup-volcanique-opponent-01",
  back:"pack:capture:creature-loup-volcanique-player-01",
  icon:"pack:capture:creature-loup-volcanique-icon-01",
  movement:"pack:capture:creature-loup-volcanique-movement-face-12-v1",
  movementBack:"pack:capture:creature-loup-volcanique-movement-dos-12-v1",
  rangedAttack:"pack:capture:creature-loup-volcanique-attack-face-12-v1",
  rangedAttackBack:"pack:capture:creature-loup-volcanique-attack-dos-12-v1"
});
function imported() {
  const registry = normalizeCaptureStatRegistryV1(JSON.parse(root("data/capture/monster-capture-stat-registry.v1.json")));
  return importCaptureTransferJsonV1(root(activePath), {statRegistry:registry});
}
test("exact uploaded Loup transfer is the one and only active preset; the source remains archived", ()=>{
  const raw=root(activePath);
  assert.equal(raw,root(sourcePath));
  assert.equal(createHash("sha256").update(raw).digest("hex"), authorHash);
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===activePath).length,1);
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.includes(sourcePath),false);
  const payload=JSON.parse(raw);
  assert.equal(payload.draft.id,"crea-loup");
  assert.equal(payload.draft.presentation.version,9);
  assert.equal(payload.statValues.values.acier,0);
  assert.equal(payload.draft.combat.approachTimeModifierPct,0);
  assert.equal(payload.loadout.slots.length,5);
  assert.deepEqual(payload.draft.skillIds,["fireball","claw","lib_flame_bite","lib_fireball","cap_fire_special_1","cap_fire_atk_6"]);
  assert.deepEqual(payload.draft.presentation.sockets[0].back,{x:0.82,y:0.47});
});
test("all four FACE/DOS animations are selected by author and native contracts roundtrip", ()=>{
  const transfer=imported();
  assert.equal(transfer.kind,"creature");
  const v=transfer.value.draft.presentation;
  assert.deepEqual(normalizeCreaturePresentationBinding(JSON.parse(JSON.stringify(v))),v);
  for(const [key,assetId] of Object.entries(ids)) assert.equal(v.visual[key]?.assetId,assetId,key);
  assert.deepEqual(v.visual.movementScaleByView,{player:1.3,opponent:1.2});
  assert.deepEqual(v.visual.rangedAttackScaleByView,{player:1.7,opponent:1.4});
  assert.deepEqual(v.visual.rangedAttackPlacement.back,{x:0,y:-20});
  assert.deepEqual(v.visual.movementPlayback,{frameMs:0,mode:"loop"});
});
test("same native renderer source projects DOS player and FACE opponent, attack and movement",()=>{
  const p=imported().value.draft.presentation;
  const actorCreature={
    id:"crea-loup",displayName:"Loup volcanique",
    combat:{maxHp:150,initialHp:150,maxEnergy:1,initialEnergy:1,
      energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0},
    skillIds:[],presentationId:p.id,metadata:{}
  };
  const exported={
    schema:"capture-combat-export-v1",
    battle:{id:"wolf-test",localActorId:"player"},
    teams:{players:["player"],enemies:["enemy"]},
    actors:[
      {actorId:"player",teamId:"players",creatureId:"crea-loup",displayName:"Wolf",controllerId:"human-local"},
      {actorId:"enemy",teamId:"enemies",creatureId:"crea-loup",displayName:"Wolf",controllerId:"ai-enemy"}
    ],creatures:[actorCreature],skills:[],rosters:[],
    presentation:{creatures:{[p.id]:p}},metadata:{}
  };
  const catalog={assets:Object.values(ids).map(id=>({id,resource:{file:id+".webp",frameCount:12}}))};
  const visual=adaptCaptureExportToNativeVisualSourceV1({
    exported,assetCatalog:catalog,
    profiles:[{id:"quadruped",idle:{},attack:{},hit:{},ko:{}}],
    assetUrlForFile:file=>"https://assets.test/"+file
  }).creatureMetas[0];
  assert.equal(creatureMovementAppearanceForViewV1(visual,"player").assetId,ids.movementBack);
  assert.equal(creatureMovementAppearanceForViewV1(visual,"opponent").assetId,ids.movement);
  assert.equal(creatureRangedAppearanceForViewV1(visual,"player").assetId,ids.rangedAttackBack);
  assert.equal(creatureRangedAppearanceForViewV1(visual,"opponent").assetId,ids.rangedAttack);
  assert.equal(creatureMovementAppearanceForViewV1(visual,"player").displayScale,1.3);
  assert.equal(creatureMovementAppearanceForViewV1(visual,"opponent").displayScale,1.2);
  assert.equal(visual.views.player.endsWith(ids.back+".webp"),true);
  assert.equal(visual.views.opponent.endsWith(ids.front+".webp"),true);
});
