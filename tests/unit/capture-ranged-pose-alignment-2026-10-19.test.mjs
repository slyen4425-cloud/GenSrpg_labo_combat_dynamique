import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { buildHumanCreatureDraftV3 } from "../../src/ui/capture-editor-human-v2.js";
import { adaptCaptureExportToNativeVisualSourceV1 } from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import { createDomCreatureMovementVisualV1 } from "../../src/adapters/renderer/dom-creature-movement-visual-v1.js";
import { creatureRangedAppearanceForViewV1 } from "../../src/ui/demo-app.js";

const asset=(id,frames=16)=>({assetId:id,mode:"sprite",displayScale:1,rotationTurns:0,frameCount:frames,transitionMs:0});
function binding(version=7, placement={front:{x:0,y:0},back:{x:-25,y:12}}) {
 return {id:"creature:unit",version,subjectType:"creature",subjectId:"unit",profileId:"quadruped",
 displayScale:1,position:{x:0,y:0},transformOrigin:{x:"50%",y:"50%"},
 visual:{front:{assetId:"pack:test:normal"},back:{assetId:"pack:test:normal"},icon:null,
   rangedAttack:asset("pack:test:front"),rangedAttackBack:asset("pack:test:back"),
   ...(version===7?{rangedAttackPlacement:placement}:{})},sockets:[],audio:{}};
}
function fields() {
 return {id:"unit",displayName:"Unit",description:"Test",level:10,
 sourceStats:{force:1,agility:1,intelligence:1,spirit:1,endurance:1,initiative:1},
 elements:[],resistances:{},capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
 combat:{maxHp:100,maxEnergy:10,initialEnergy:0,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0},
 linkedSkillIds:[],profileId:"quadruped",displayScale:1,
 visual:{frontAssetId:"pack:test:normal",backAssetId:"pack:test:normal",iconAssetId:"",
 rangedAttackAssetId:"pack:test:front",rangedAttackBackAssetId:"pack:test:back",
 rangedAttackMode:"sprite",rangedAttackFrameCount:16},sockets:[],audio:{}};
}
test("V7 independently normalizes front/back visual offsets without modifying V6",()=>{
 const b=normalizeCreaturePresentationBinding(binding());
 assert.equal(b.version,7);
 assert.deepEqual(b.visual.rangedAttackPlacement,{front:{x:0,y:0},back:{x:-25,y:12}});
 assert.deepEqual(normalizeCreaturePresentationBinding(b),b);
 const legacy=normalizeCreaturePresentationBinding(binding(6));
 assert.equal(legacy.version,6);
 assert.equal(legacy.visual.rangedAttackPlacement,undefined);
 for(const bad of [{x:Infinity,y:0},{x:401,y:0},{x:0,y:"foo"},{x:0,y:0,z:10}]) {
  assert.throws(()=>normalizeCreaturePresentationBinding(binding(7,{back:bad})));
 }
});
test("Human editor persists player alignment independently from opponent and retains legacy defaults",()=>{
 const base=buildHumanCreatureDraftV3(fields());
 assert.equal(base.presentation.version,6);
 const changed=buildHumanCreatureDraftV3({...fields(),visual:{...fields().visual,
 rangedAttackFrontOffsetX:0,rangedAttackFrontOffsetY:0,rangedAttackBackOffsetX:-25,rangedAttackBackOffsetY:12}});
 assert.equal(changed.presentation.version,7);
 assert.deepEqual(changed.presentation.visual.rangedAttackPlacement.back,{x:-25,y:12});
 assert.deepEqual(changed.presentation.visual.rangedAttackPlacement.front,{x:0,y:0});
 assert.deepEqual(changed.combat,base.combat);
 assert.deepEqual(changed.presentation.visual.rangedAttackBack,base.presentation.visual.rangedAttackBack);
});
test("Real native export carries only the proper ranged pose X/Y per view",()=>{
 const combat={maxHp:100,initialHp:100,maxEnergy:1,initialEnergy:1,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0};
 const exported={schema:"capture-combat-export-v1",battle:{id:"aligned",localActorId:"a"},
 teams:{p:["a"],e:["b"]},actors:[
 {actorId:"a",teamId:"p",creatureId:"unit",displayName:"Unit",controllerId:"human-local"},
 {actorId:"b",teamId:"e",creatureId:"old",displayName:"Old",controllerId:"ai-enemy"}],
 creatures:[
 {id:"unit",displayName:"Unit",combat,skillIds:[],presentationId:"creature:unit",metadata:{}},
 {id:"old",displayName:"Old",combat,skillIds:[],presentationId:"creature:old",metadata:{}}],
 skills:[],rosters:[],presentation:{creatures:{
 "creature:unit":binding(),
 "creature:old":{id:"creature:old",version:1,subjectType:"creature",subjectId:"old",profileId:"biped",
 visual:{front:{assetId:"pack:test:normal"},back:null,icon:null},sockets:[],audio:{}}}},metadata:{}};
 const r=adaptCaptureExportToNativeVisualSourceV1({exported,assetCatalog:{assets:[
 {id:"pack:test:normal",resource:{file:"normal.png"}},
 {id:"pack:test:front",resource:{file:"front.png",frameCount:16}},
 {id:"pack:test:back",resource:{file:"back.png",frameCount:16}}
 ]},profiles:[{id:"quadruped",idle:{},attack:{},hit:{},ko:{}},{id:"biped",idle:{},attack:{},hit:{},ko:{}}],
 assetUrlForFile:file=>"https://example.test/"+file});
 const unit=r.creatureMetas.find(x=>x.id==="unit");
 const p=creatureRangedAppearanceForViewV1(unit,"player");
 const o=creatureRangedAppearanceForViewV1(unit,"opponent");
 assert.equal(p.offsetX,-25);assert.equal(p.offsetY,12);
 assert.equal(o.offsetX,0);assert.equal(o.offsetY,0);
 assert.equal(unit.movementFx,null);
});
test("Renderer offsets only the transient sprite shell, preserving actor and normal model transforms",async()=>{
 const doc={createElement(tag){
  if(tag==="canvas")return {width:0,height:0,getContext(){return {drawImage(){}}},toDataURL(){return "data:image/png;base64,AAAA"}};
  const el={ownerDocument:doc,style:{},dataset:{},naturalWidth:1600,naturalHeight:100,complete:true,children:[],
    append(n){this.children.push(n)},remove(){this.removed=true},
    animate(frames,options){this.animation={frames,options};return {finished:Promise.resolve(),cancel(){}}}};
  Object.defineProperty(el,"src",{configurable:true,get(){return this._src??""},set(v){this._src=v;this.onload?.()}});
  return el;
 }};
 const image=doc.createElement("img");image.style.transform="scale(0.8)";
 image.addEventListener=(_name,cb)=>{image.loadCallback=cb};
 const motion={ownerDocument:doc,style:{transform:"translate(1px, 0px)"},append(n){this.node=n}};
 const collision={setPresentationScale(){},clear(){},refreshFromImage(){return true}};
 const vis=createDomCreatureMovementVisualV1({motion,image,collisionModel:collision});
 const img="https://example.test/normal.png",ranged="https://example.test/attack.png";
 image.src=img;vis.prepare(null,img,{url:ranged,frameCount:16});
 const pose={url:ranged,mode:"sprite",frameCount:16,displayScale:1,rotationTurns:0,transitionMs:0,offsetX:-25,offsetY:12};
 const active=vis.play(pose,500,1);
 for(let i=0;i<7;i++)await Promise.resolve();
 assert.match(motion.node.style.transform,/translate\(-25px, 12px\)/);
 assert.equal(motion.style.transform,"translate(1px, 0px)");
 active.cancel();
 assert.equal(motion.node.removed,true);
 assert.equal(image.style.transform,"scale(0.8)");
 vis.dispose();
});
test("Appearance UI allows precise per-view X/Y adjustment",()=>{
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const group=html.split('data-creature-appearance-group="animations"')[1].split("</details>")[0];
 for(const key of ["front-offset-x","front-offset-y","back-offset-x","back-offset-y"]){
  assert.match(group,new RegExp("data-creature-ranged-"+key));
 }
});
