import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { buildHumanCreatureDraftV3, captureEditorAssetMatchesRoleV1 } from "../../src/ui/capture-editor-human-v2.js";
import { CREATOR_VISUAL_ROLES_V1 } from "../../src/assets/creator-visual-asset-session-v1.js";
import { createDomCreatureMovementVisualV1 } from "../../src/adapters/renderer/dom-creature-movement-visual-v1.js";
import { adaptCaptureExportToNativeVisualSourceV1 } from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";

function binding() {
  return {
    id:"creature:unit",version:4,subjectType:"creature",subjectId:"unit",
    profileId:"quadruped",displayScale:1,position:{x:0,y:0},
    transformOrigin:{x:"50%",y:"50%"},
    visual:{front:{assetId:"pack:test:front"},back:null,icon:null,
      movement:{assetId:"pack:test:ball",mode:"roll",displayScale:0.8,rotationTurns:4,frameCount:1,transitionMs:80}},
    sockets:[],audio:{}
  };
}
test("movement appearance V4 is optional, validates author parameters and does not change V2/V3",()=>{
  const b = binding();
  assert.deepEqual(normalizeCreaturePresentationBinding(b).visual.movement,b.visual.movement);
  assert.deepEqual(normalizeCreaturePresentationBinding(normalizeCreaturePresentationBinding(b)),normalizeCreaturePresentationBinding(b));
  const legacy = structuredClone(b);legacy.version=2;delete legacy.visual.movement;
  assert.equal(normalizeCreaturePresentationBinding(legacy).version,2);
  assert.equal(normalizeCreaturePresentationBinding(legacy).visual.movement,undefined);
  for(const bad of [{mode:"teleport"}, {frameCount:0}, {frameCount:1.5},{rotationTurns:-1},{displayScale:0},{assetId:"not stable"},{transitionMs:1000}]){
    const invalid = structuredClone(b);invalid.visual.movement={...invalid.visual.movement,...bad};
    assert.throws(()=>normalizeCreaturePresentationBinding(invalid));
  }
});
test("Créature > Apparence uses existing media library and allows optional animated sprite assets",async()=>{
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  for(const selector of ["data-creature-movement-appearance","data-creature-movement-visual","data-creature-movement-mode","data-creature-movement-scale","data-creature-movement-turns","data-creature-movement-frames","data-creature-movement-transition"])assert.match(html,new RegExp(selector));
  assert.ok(CREATOR_VISUAL_ROLES_V1.includes("movement"));
  for(const kind of [{category:"creature",assetType:"portrait"},{category:"movement",assetType:"sprite"},{category:"skill",assetType:"fx"}]){
    assert.equal(captureEditorAssetMatchesRoleV1({ ...kind,mediaType:"image",compatibility:{uses:["editor"]}},"movement"),true);
  }
  assert.equal(captureEditorAssetMatchesRoleV1({assetType:"icon",mediaType:"image",compatibility:{uses:["editor"]}},"movement"),false);
});
test("Human Creature Draft V3 retains optional V4 movement presentation and legacy draft default",()=>{
  const fields={
    id:"unit",displayName:"Unit",description:"Test",level:10,
    sourceStats:{force:1,agility:1,intelligence:1,spirit:1,endurance:1,initiative:1},
    elements:[],resistances:{},capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
    combat:{maxHp:100,maxEnergy:10,initialEnergy:0,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0},
    linkedSkillIds:[],profileId:"quadruped",displayScale:1,
    visual:{frontAssetId:"pack:test:front",backAssetId:"",iconAssetId:""},sockets:[],audio:{}
  };
  const baseline=buildHumanCreatureDraftV3(fields);
  assert.notEqual(baseline.presentation.version,4);
  const changed=buildHumanCreatureDraftV3({...fields,visual:{...fields.visual,
    movementAssetId:"pack:test:ball",movementMode:"roll",movementDisplayScale:0.85,movementRotationTurns:3,
    movementFrameCount:20,movementTransitionMs:80
  }});
  assert.equal(changed.presentation.version,4);
  assert.equal(changed.presentation.visual.movement.assetId,"pack:test:ball");
  assert.equal(changed.presentation.visual.movement.frameCount,20);
  assert.deepEqual(changed.combat,baseline.combat);
  assert.deepEqual(changed.presentation.sockets,baseline.presentation.sockets);
});
function fixture() {
  const listeners=[];
  const document={
    createElement(tag) {
      if(tag==="canvas")return {
        width:0,height:0,
        getContext(){return {drawImage(){}}},
        toDataURL(){return "data:image/png;base64,AAAA"}
      };
      const el={ownerDocument:document,className:"",style:{},dataset:{},naturalWidth:100,naturalHeight:100,complete:true,
        children:[],append(child){this.children.push(child)},remove(){this.removed=true},
        animate(frames,options){this.lastAnimation={frames,options};return {finished:Promise.resolve(),cancel(){}}}
      };
      Object.defineProperty(el,"src",{configurable:true,get(){return this._src||""},set(value){this._src=value;this.onload?.()}});
      return el;
    }
  };
  const image=document.createElement("img");
  image.addEventListener=(type,handler)=>{listeners.push(handler)};
  Object.defineProperty(image,"src",{get(){return this._src||""},set(value){this._src=value;for(const l of listeners.splice(0))l()}});
  const motion={ownerDocument:document,append(el){this.node=el}};
  const collision={scale:1,clears:0,refreshes:0,
    setPresentationScale(v){this.scale=v},clear(){this.clears++},refreshFromImage(){this.refreshes++;return true}};
  return {image,motion,collision,visual:createDomCreatureMovementVisualV1({motion,image,collisionModel:collision})};
}
async function flush(){await Promise.resolve();await Promise.resolve();await Promise.resolve()}
test("real image silhouette replaces collision image during roll, then cancels and restores",async()=>{
 const f=fixture();f.image.src="https://assets.test/normal.png";
 f.visual.prepare({url:"https://assets.test/ball.png",frameCount:1},"https://assets.test/normal.png");
 const h=f.visual.play({url:"https://assets.test/ball.png",mode:"roll",rotationTurns:3,frameCount:1,displayScale:.8,transitionMs:80},900,1);
 await flush();
 assert.equal(f.image.src,"https://assets.test/ball.png");
 assert.equal(f.collision.scale,.8);
 assert.ok(f.collision.refreshes>0);
 assert.equal(f.image.lastAnimation.options.duration,900);
 h.cancel();
 assert.equal(f.image.src,"https://assets.test/normal.png");
 assert.equal(f.collision.scale,1);
 f.visual.dispose();
});
test("animated strip uses frame-one collision silhouette and restores on interruption",async()=>{
 const f=fixture();f.image.src="https://assets.test/normal.png";
 const moving={url:"https://assets.test/atlas.png",mode:"sprite",frameCount:20,displayScale:1.2,rotationTurns:0,transitionMs:0};
 f.visual.prepare(moving,"https://assets.test/normal.png");
 const h=f.visual.play(moving,700,1);
 await flush();
 assert.equal(f.image.src,"data:image/png;base64,AAAA");
 assert.equal(f.collision.scale,1.2);
 assert.equal(f.image.style.opacity,"0");
 assert.equal(f.motion.node.dataset.creatureMovementVisual,"true");
 assert.equal(f.motion.node.children[0].style.animationName,"skill-fx-strip");
 h.cancel();
 assert.equal(f.image.src,"https://assets.test/normal.png");
 assert.equal(f.motion.node.removed,true);
 assert.equal(f.collision.scale,1);
 f.visual.dispose();
});

test("V4 presentation survives the real Capture export-to-native visual source and preserves legacy actor",()=>{
 const b=binding();
 const baseCombat={maxHp:100,initialHp:100,maxEnergy:1,initialEnergy:1,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0};
 const exported={
  schema:"capture-combat-export-v1",battle:{id:"roll-preview",localActorId:"player"},
  teams:{players:["player"],enemies:["enemy"]},
  actors:[
   {actorId:"player",teamId:"players",creatureId:"unit",displayName:"Roller",controllerId:"human-local"},
   {actorId:"enemy",teamId:"enemies",creatureId:"ordinary",displayName:"Legacy",controllerId:"ai-enemy"}
  ],
  creatures:[
   {id:"unit",displayName:"Roller",combat:baseCombat,skillIds:[],presentationId:"creature:unit",metadata:{}},
   {id:"ordinary",displayName:"Legacy",combat:baseCombat,skillIds:[],presentationId:"creature:ordinary",metadata:{}}
  ],skills:[],rosters:[],
  presentation:{creatures:{
   "creature:unit":b,
   "creature:ordinary":{
     id:"creature:ordinary",version:1,subjectType:"creature",subjectId:"ordinary",profileId:"biped",
     visual:{front:{assetId:"pack:test:front"},back:null,icon:null},sockets:[],audio:{}
   }
  }},metadata:{}
 };
 const catalog={assets:[
  {id:"pack:test:front",resource:{file:"front.png"}},
  {id:"pack:test:ball",resource:{file:"ball.png",frameCount:20}}
 ]};
 const result=adaptCaptureExportToNativeVisualSourceV1({
  exported,assetCatalog:catalog,
  profiles:[{id:"quadruped",idle:{},attack:{},hit:{},ko:{}},{id:"biped",idle:{},attack:{},hit:{},ko:{}}],
  assetUrlForFile:file=>"https://example.test/"+file
 });
 const roller=result.creatureMetas.find(x=>x.id==="unit");
 const normal=result.creatureMetas.find(x=>x.id==="ordinary");
 assert.equal(roller.movementFx.assetId,"pack:test:ball");
 assert.equal(roller.movementFx.url,"https://example.test/ball.png");
 assert.equal(roller.movementFx.frameCount,20);
 assert.equal(roller.movementFx.mode,"roll");
 assert.equal(normal.movementFx,null);
 assert.equal(roller.runtimePreview.player,"https://example.test/front.png");
});
