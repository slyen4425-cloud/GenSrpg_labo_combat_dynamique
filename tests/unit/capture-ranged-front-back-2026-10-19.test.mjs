import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { buildHumanCreatureDraftV3 } from "../../src/ui/capture-editor-human-v2.js";
import { adaptCaptureExportToNativeVisualSourceV1 } from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import { creatureRangedAppearanceForViewV1 } from "../../src/ui/demo-app.js";

const front = { assetId:"pack:test:attack-front",mode:"sprite",displayScale:1,rotationTurns:0,frameCount:16,transitionMs:80 };
const back = { ...front,assetId:"pack:test:attack-back",frameCount:20 };
function binding(version=6, visual={rangedAttack:front,rangedAttackBack:back}){
  return {
    id:"creature:unit",version,subjectType:"creature",subjectId:"unit",profileId:"quadruped",
    displayScale:1,position:{x:0,y:0},transformOrigin:{x:"50%",y:"50%"},
    visual:{front:{assetId:"pack:test:normal"},back:null,icon:null,...visual},
    sockets:[],audio:{}
  };
}
function fields(){
  return {id:"unit",displayName:"Unité",description:"Test",level:10,
    sourceStats:{force:1,agility:1,intelligence:1,spirit:1,endurance:1,initiative:1},
    elements:[],resistances:{},capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
    combat:{maxHp:100,maxEnergy:10,initialEnergy:0,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0},
    linkedSkillIds:[],profileId:"quadruped",displayScale:1,
    visual:{frontAssetId:"pack:test:normal",backAssetId:"",iconAssetId:""},sockets:[],audio:{}
  };
}
function exportFixture(presentation) {
  const combat={maxHp:100,initialHp:100,maxEnergy:1,initialEnergy:1,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0};
  return {schema:"capture-combat-export-v1",battle:{id:"dual-shot",localActorId:"player"},
    teams:{players:["player"],enemies:["enemy"]},
    actors:[
      {actorId:"player",teamId:"players",creatureId:"unit",displayName:"Unit",controllerId:"human-local"},
      {actorId:"enemy",teamId:"enemies",creatureId:"old",displayName:"Old",controllerId:"ai-enemy"}
    ],
    creatures:[
      {id:"unit",displayName:"Unit",combat,skillIds:[],presentationId:"creature:unit",metadata:{}},
      {id:"old",displayName:"Old",combat,skillIds:[],presentationId:"creature:old",metadata:{}}
    ],skills:[],rosters:[],
    presentation:{creatures:{
      "creature:unit":presentation,
      "creature:old":{id:"creature:old",version:1,subjectType:"creature",subjectId:"old",profileId:"biped",
        visual:{front:{assetId:"pack:test:normal"},back:null,icon:null},sockets:[],audio:{}}
    }},metadata:{}};
}
function adapter(presentation){
  return adaptCaptureExportToNativeVisualSourceV1({
    exported:exportFixture(presentation),
    assetCatalog:{assets:[
      {id:"pack:test:normal",resource:{file:"normal.png"}},
      {id:front.assetId,resource:{file:"attack-front.png",frameCount:16}},
      {id:back.assetId,resource:{file:"attack-back.png",frameCount:20}}
    ]},
    profiles:[{id:"quadruped",idle:{},attack:{},hit:{},ko:{}},{id:"biped",idle:{},attack:{},hit:{},ko:{}}],
    assetUrlForFile:file=>"https://example.test/"+file
  }).creatureMetas[0];
}
test("V6 accepts independently configured attack front/back and keeps V5 intact",()=>{
  const result=normalizeCreaturePresentationBinding(binding());
  assert.equal(result.version,6);
  assert.deepEqual(result.visual.rangedAttack,front);
  assert.deepEqual(result.visual.rangedAttackBack,back);
  assert.deepEqual(normalizeCreaturePresentationBinding(result),result);
  for(const bad of [{frameCount:0},{assetId:"not-stable"},{displayScale:0},{mode:"teleport"}]){
    assert.throws(()=>normalizeCreaturePresentationBinding(binding(6,{rangedAttack:front,rangedAttackBack:{...back,...bad}})));
  }
  const old=normalizeCreaturePresentationBinding(binding(5,{rangedAttack:front}));
  assert.equal(old.version,5);
  assert.equal(old.visual.rangedAttackBack,undefined);
});
test("author front/back selects persist in drafts; old single-attack drafts remain valid",()=>{
  const b=fields();
  const params={rangedAttackMode:"sprite",rangedAttackDisplayScale:1,rangedAttackRotationTurns:0,
    rangedAttackFrameCount:16,rangedAttackTransitionMs:80};
  const separate=buildHumanCreatureDraftV3({...b,visual:{...b.visual,...params,
    rangedAttackAssetId:front.assetId,rangedAttackBackAssetId:back.assetId}});
  assert.equal(separate.presentation.version,6);
  assert.equal(separate.presentation.visual.rangedAttack.assetId,front.assetId);
  assert.equal(separate.presentation.visual.rangedAttackBack.assetId,back.assetId);
  assert.deepEqual(separate.combat,buildHumanCreatureDraftV3(b).combat);
  const backOnly=buildHumanCreatureDraftV3({...b,visual:{...b.visual,...params,
    rangedAttackAssetId:"",rangedAttackBackAssetId:back.assetId}});
  assert.equal(backOnly.presentation.version,6);
  assert.equal(backOnly.presentation.visual.rangedAttack,undefined);
  assert.equal(backOnly.presentation.visual.rangedAttackBack.assetId,back.assetId);
  const legacy=buildHumanCreatureDraftV3({...b,visual:{...b.visual,...params,rangedAttackAssetId:front.assetId}});
  assert.equal(legacy.presentation.version,5);
});
test("export-to-combat selects back for player and front for opponent, with legacy fallback",()=>{
  const dual=adapter(binding());
  assert.equal(creatureRangedAppearanceForViewV1(dual,"opponent").url,"https://example.test/attack-front.png");
  assert.equal(creatureRangedAppearanceForViewV1(dual,"player").url,"https://example.test/attack-back.png");
  assert.equal(creatureRangedAppearanceForViewV1(dual,"opponent").frameCount,16);
  assert.equal(creatureRangedAppearanceForViewV1(dual,"player").frameCount,20);
  const v5=adapter(binding(5,{rangedAttack:front}));
  assert.equal(creatureRangedAppearanceForViewV1(v5,"player").assetId,front.assetId);
  assert.equal(creatureRangedAppearanceForViewV1(v5,"opponent").assetId,front.assetId);
  const onlyBack=adapter(binding(6,{rangedAttackBack:back}));
  assert.equal(creatureRangedAppearanceForViewV1(onlyBack,"opponent"),null);
  assert.equal(creatureRangedAppearanceForViewV1(onlyBack,"player").assetId,back.assetId);
});
test("two separate attack asset selectors exist inside Animations",()=>{
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const group=html.split('data-creature-appearance-group="animations"')[1].split("</details>")[0];
  assert.match(group,/data-creature-ranged-attack-visual/);
  assert.match(group,/data-creature-ranged-attack-back-visual/);
  assert.match(group,/data-creature-ranged-attack-visual data-asset-role="attack"/);
  assert.match(group,/data-creature-ranged-attack-back-visual data-asset-role="attack"/);
  assert.match(group,/Attaque de face/);
  assert.match(group,/Attaque de dos/);
});
