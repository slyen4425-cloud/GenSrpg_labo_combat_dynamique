import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {importCaptureTransferJsonV1,exportCaptureCreatureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {adaptCaptureExportToNativeVisualSourceV1} from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import {creatureAerialAppearanceForPhaseV1,creatureMovementAppearanceForApproachV1} from "../../src/ui/demo-app.js";

const active="data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json";
const author="data/capture/source-exports/gensrpg-capture-creature-crea_foudrillon-2026-10-24.json";
const bytes=p=>readFileSync(new URL("../../"+p,import.meta.url));
const read=p=>JSON.parse(bytes(p).toString("utf8"));
const registry=normalizeCaptureStatRegistryV1(read("data/capture/monster-capture-stat-registry.v1.json"));
const source=read(active);
const transfer=importCaptureTransferJsonV1(bytes(active).toString("utf8"),{statRegistry:registry});

test("one stable Freclairions authority retains author's exact uploaded V10 transfer",()=>{
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===active).length,1);
  assert.equal(transfer.kind,"creature");
  assert.equal(source.draft.id,"crea_foudrillon");
  assert.equal(source.draft.displayName,"Freclairions");
  assert.equal(source.draft.presentation.version,10);
  assert.ok(bytes(active).equals(bytes(author)),"author snapshot and active file must be identical bytes");
  assert.equal(bytes(active).length,5992);
  assert.equal(createHash("sha256").update(bytes(active)).digest("hex"),
    "b6dc6a595d1ed1ab965eee8a0dbdd86b3d172258601fb1320e016b492c6e8fc3");
  const round=importCaptureTransferJsonV1(
    exportCaptureCreatureTransferJsonV1(transfer.value,{statRegistry:registry}),
    {statRegistry:registry}
  );
  assert.deepEqual(round.value,transfer.value);
});

test("V10 import keeps 26 learned skills, five slots, stats, player height and shadow without author edits",()=>{
  const {draft,statValues,loadout}=transfer.value;
  assert.equal(draft.skillIds.length,26);
  assert.deepEqual(loadout.slots.map(s=>s.skillId),
    ["lib_paralyze","choc_venin","lib_tailwind","vol_eclaire","Nid_frelon"]);
  assert.equal(draft.presentation.profileId,"flying");
  assert.deepEqual(draft.presentation.shadowOffset,{x:0,y:30});
  assert.deepEqual(draft.presentation.viewOverrides.player.position,{x:0,y:-20});
  assert.deepEqual(draft.presentation.viewOverrides.opponent.position,{x:0,y:0});
  assert.equal(draft.combat.approachTimeModifierPct,-40);
  assert.deepEqual([statValues.values.acier,statValues.values.nature,statValues.values.esprit],[0,0,0]);
  assert.deepEqual(draft.presentation.visual.movementScaleByView,{player:1.5,opponent:1});
  assert.equal(draft.presentation.visual.movementBack.frameCount,1);
  assert.equal(draft.presentation.visual.rangedAttackBack.frameCount,1);
  // No creator-side FACE bindings: no invented atlas, player back is complete.
  assert.equal(draft.presentation.visual.movement,undefined);
  assert.equal(draft.presentation.visual.rangedAttack,undefined);
});

test("native visual adapter resolves real catalog frame metadata for flying player; enemy remains unanimated without FACE",()=>{
  const d=transfer.value.draft;
  const presentationId=d.presentation.id;
  const creature={id:d.id,displayName:d.displayName,combat:{
    maxHp:120,initialHp:120,maxEnergy:10,initialEnergy:10,energyChargeAmount:0,
    energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0
  },skillIds:[],presentationId,metadata:{}};
  const visual=d.presentation.visual;
  const fileById=new Map([
    ["pack:capture:creature-guepe-cybernetique-player-01",{file:"player.webp"}],
    ["pack:capture:creature-guepe-cybernetique-opponent-01",{file:"opponent.webp"}],
    ["pack:capture:creature-guepe-cybernetique-icon-01",{file:"icon.webp"}],
    ["pack:capture:sprite-electric-yellow-beam-impact-01",{file:"dodge.webp",frameCount:8}],
    [visual.movementBack.assetId,{file:"fly-back-12.webp",frameCount:12,frameMs:100}],
    [visual.rangedAttackBack.assetId,{file:"attack-back-12.webp",frameCount:12,frameMs:100}]
  ]);
  const exported={schema:"capture-combat-export-v1",battle:{id:"freclairions-test",localActorId:"player"},
    teams:{players:["player"],enemies:["enemy"]},actors:[
      {actorId:"player",teamId:"players",creatureId:d.id,displayName:d.displayName,controllerId:"human-local"},
      {actorId:"enemy",teamId:"enemies",creatureId:d.id,displayName:d.displayName,controllerId:"ai-enemy"}
    ],creatures:[creature],skills:[],rosters:[],presentation:{creatures:{[presentationId]:d.presentation}},metadata:{}};
  const native=adaptCaptureExportToNativeVisualSourceV1({
    exported,assetCatalog:{assets:[...fileById].map(([id,resource])=>({id,resource}))},
    profiles:[{id:"flying",idle:{},attack:{},hit:{},ko:{}}],
    assetUrlForFile:file=>"https://assets.test/"+file
  });
  const meta=native.creatureMetas.find(x=>x.id===d.id);
  assert.ok(meta);
  assert.equal(meta.movementFxByView.player.frameCount,12);
  assert.equal(meta.rangedAttackBackFx.frameCount,12);
  assert.equal(creatureMovementAppearanceForApproachV1(meta,"player","aerial").assetId,visual.movementBack.assetId);
  assert.equal(creatureAerialAppearanceForPhaseV1(meta,"player","aerial-arc-impact").assetId,visual.rangedAttackBack.assetId);
  assert.equal(meta.movementFxByView.opponent,null);
  assert.equal(meta.rangedAttackFx,null);
  assert.equal(creatureAerialAppearanceForPhaseV1(meta,"opponent","aerial-arc-impact"),null);
});
