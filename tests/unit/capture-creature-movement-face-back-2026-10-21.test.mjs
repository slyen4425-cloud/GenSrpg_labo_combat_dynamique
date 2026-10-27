import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildHumanCreatureDraftV3, captureEditorAssetMatchesRoleV1 } from "../../src/ui/capture-editor-human-v2.js";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { adaptCaptureExportToNativeVisualSourceV1 } from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import { creatureMovementAppearanceForViewV1 } from "../../src/ui/demo-app.js";

const FRONT = "pack:test:wolf-run-front";
const BACK = "pack:test:wolf-run-back";
function fields() {
  return {
    id:"crea-wolf-test",displayName:"Wolf",description:"Test",level:1,
    sourceStats:{force:0,agility:0,intelligence:0,spirit:0,endurance:0,initiative:0},
    elements:[],resistances:{},capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
    combat:{maxHp:100,maxEnergy:5,initialEnergy:0,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0},
    linkedSkillIds:[],profileId:"quadruped",displayScale:1,
    visual:{frontAssetId:"pack:test:creature-front",backAssetId:"pack:test:creature-back",iconAssetId:""},
    sockets:[],audio:{}
  };
}
function movement(overrides={}) {
  return {...fields(),visual:{...fields().visual,
    movementAssetId:FRONT,movementBackAssetId:BACK,movementMode:"sprite",
    movementDisplayScale:1,movementPlayerScale:1.5,movementOpponentScale:0.85,
    movementFrameCount:12,movementRotationTurns:0,movementFrameMs:90,
    movementPlaybackMode:"loop",movementTransitionMs:80,...overrides
  }};
}
function runtime(presentation) {
  const unit={id:"crea-wolf-test",displayName:"Wolf",combat:{
    maxHp:100,initialHp:100,maxEnergy:1,initialEnergy:1,energyChargeAmount:0,
    energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0
  },skillIds:[],presentationId:"creature:crea-wolf-test",metadata:{}};
  const exported={schema:"capture-combat-export-v1",battle:{id:"test",localActorId:"player"},
    teams:{players:["player"],enemies:["enemy"]},actors:[
      {actorId:"player",teamId:"players",creatureId:unit.id,displayName:"Wolf",controllerId:"human-local"},
      {actorId:"enemy",teamId:"enemies",creatureId:unit.id,displayName:"Wolf",controllerId:"ai-enemy"}
    ],creatures:[unit],skills:[],rosters:[],
    presentation:{creatures:{"creature:crea-wolf-test":presentation}},metadata:{}};
  const assets=["creature-front","creature-back","wolf-run-front","wolf-run-back"]
    .map(id=>({id:"pack:test:"+id,resource:{file:id+".png",frameCount:12}}));
  return adaptCaptureExportToNativeVisualSourceV1({
    exported,assetCatalog:{assets},
    profiles:[{id:"quadruped",idle:{},attack:{},hit:{},ko:{}}],
    assetUrlForFile:file=>"https://assets.test/"+file
  }).creatureMetas[0];
}

test("author UI exposes TWO movement menus both sourced from the existing movement catalog",()=>{
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  assert.match(html,/Sprite de déplacement — FACE \(adversaire\)/);
  assert.match(html,/Sprite de déplacement — DOS \(joueur\)/);
  assert.equal((html.match(/data-creature-movement(?:-back)?-visual data-asset-role="movement"/g)||[]).length,2);
  const tag={category:"creature",assetType:"sprite",mediaType:"image",
    tags:["creature","movement"],resource:{frameCount:12},
    compatibility:{uses:["editor"]}};
  assert.equal(captureEditorAssetMatchesRoleV1(tag,"movement"),true);
  assert.equal(captureEditorAssetMatchesRoleV1({...tag,resource:{frameCount:1}},"movement"),false);
  assert.equal(captureEditorAssetMatchesRoleV1({...tag,resource:undefined},"movement"),false);
  assert.equal(captureEditorAssetMatchesRoleV1({...tag,category:"skill",tags:["skill","projectile"]},"movement"),false);
  const source=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  for(const part of [
    'movementBackAssetId: selectedValue(root, "[data-creature-movement-back-visual]")',
    '["[data-creature-movement-back-visual]", presentation?.visual?.movementBack?.assetId ?? ""]',
    '["[data-creature-movement-back-visual]", ""]'
  ]) assert.ok(source.includes(part),"missing editor read/write/reset "+part);
});

test("V9 stores distinct FACE and DOS assets, preserving original playback/scales",()=>{
  const draft=buildHumanCreatureDraftV3(movement());
  assert.equal(draft.presentation.version,9);
  const visual=draft.presentation.visual;
  assert.equal(visual.movement.assetId,FRONT);
  assert.equal(visual.movementBack.assetId,BACK);
  assert.equal(visual.movement.frameCount,12);
  assert.equal(visual.movementBack.frameCount,12);
  assert.equal(visual.movementPlayback.frameMs,90);
  assert.equal(visual.movementPlayback.mode,"loop");
  assert.deepEqual(visual.movementScaleByView,{player:1.5,opponent:0.85});
  const parsed=normalizeCreaturePresentationBinding(JSON.parse(JSON.stringify(draft.presentation)));
  assert.deepEqual(parsed,draft.presentation);
  const meta=runtime(parsed);
  const player=creatureMovementAppearanceForViewV1(meta,"player");
  const opponent=creatureMovementAppearanceForViewV1(meta,"opponent");
  assert.equal(player.assetId,BACK);
  assert.equal(player.url,"https://assets.test/wolf-run-back.png");
  assert.equal(player.displayScale,1.5);
  assert.equal(player.frameMs,90);
  assert.equal(opponent.assetId,FRONT);
  assert.equal(opponent.url,"https://assets.test/wolf-run-front.png");
  assert.equal(opponent.displayScale,0.85);
  assert.equal(opponent.frameMs,90);
});

test("V9 may have only DOS movement; FACE remains unchanged instead of showing an invalid asset",()=>{
  const draft=buildHumanCreatureDraftV3(movement({movementAssetId:""}));
  assert.equal(draft.presentation.version,9);
  assert.equal(draft.presentation.visual.movement,undefined);
  assert.equal(draft.presentation.visual.movementBack.assetId,BACK);
  const meta=runtime(draft.presentation);
  assert.equal(creatureMovementAppearanceForViewV1(meta,"player").assetId,BACK);
  assert.equal(creatureMovementAppearanceForViewV1(meta,"opponent"),null);
});

test("old single-sprite V4/V8 users keep the original front asset for both views",()=>{
  const v4=buildHumanCreatureDraftV3(movement({movementBackAssetId:"",
    movementPlayerScale:1,movementOpponentScale:1,movementFrameMs:0})).presentation;
  assert.equal(v4.version,4);
  const m4=runtime(v4);
  assert.equal(creatureMovementAppearanceForViewV1(m4,"player").assetId,FRONT);
  assert.equal(creatureMovementAppearanceForViewV1(m4,"opponent").assetId,FRONT);
  const v8=buildHumanCreatureDraftV3(movement({movementBackAssetId:""})).presentation;
  assert.equal(v8.version,8);
  const m8=runtime(v8);
  assert.equal(creatureMovementAppearanceForViewV1(m8,"player").assetId,FRONT);
  assert.equal(creatureMovementAppearanceForViewV1(m8,"opponent").assetId,FRONT);
  assert.equal(m8.movementFxByView.player.displayScale,1.5);
});

test("V9 rejects invalid back-sprite metadata, not silently falling back",()=>{
  const good=buildHumanCreatureDraftV3(movement()).presentation;
  for(const invalid of [{assetId:"free-form"},{frameCount:0},{mode:"skating"},{transitionMs:-2}]){
    const candidate=structuredClone(good);
    candidate.visual.movementBack={...candidate.visual.movementBack,...invalid};
    assert.throws(()=>normalizeCreaturePresentationBinding(candidate));
  }
});
