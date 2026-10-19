import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { buildHumanCreatureDraftV3 } from "../../src/ui/capture-editor-human-v2.js";
import { shadowGeometryFromOpaqueMaskV2 } from "../../src/adapters/renderer/dom-ground-shadow-v2.js";
import { creatureMovementAppearanceForViewV1 } from "../../src/ui/demo-app.js";
import { createDomCreatureMovementVisualV1 } from "../../src/adapters/renderer/dom-creature-movement-visual-v1.js";

const sprite=(id)=>({assetId:id,mode:"sprite",displayScale:1,rotationTurns:0,frameCount:12,transitionMs:0});
const present=(version,more={})=>({id:"creature:test",version,subjectType:"creature",subjectId:"test",
 profileId:"biped",displayScale:1,position:{x:0,y:0},transformOrigin:{x:"50%",y:"50%"},
 visual:{front:{assetId:"pack:test:normal"},back:null,icon:null,movement:sprite("pack:test:move"),
   rangedAttack:sprite("pack:test:front"),rangedAttackBack:sprite("pack:test:back"),...more},sockets:[],audio:{}});

test("V8 validates optional per-side scales and independent movement playback, leaves old schemas unchanged",()=>{
 const v8=normalizeCreaturePresentationBinding(present(8,{
  movementScaleByView:{player:1.6,opponent:.7},
  rangedAttackScaleByView:{player:1.4,opponent:.8},
  movementPlayback:{frameMs:55,mode:"hold-last"}
 }));
 assert.equal(v8.version,8);
 assert.deepEqual(v8.visual.movementScaleByView,{player:1.6,opponent:.7});
 assert.equal(v8.visual.movementPlayback.frameMs,55);
 assert.deepEqual(normalizeCreaturePresentationBinding(v8),v8);
 const v7=normalizeCreaturePresentationBinding(present(7));
 assert.equal(v7.visual.movementPlayback,undefined);
 for(const bad of [{frameMs:-1,mode:"loop"},{frameMs:501,mode:"loop"},{frameMs:20,mode:"invalid"}]) {
   assert.throws(()=>normalizeCreaturePresentationBinding(present(8,{movementPlayback:bad})));
 }
 assert.throws(()=>normalizeCreaturePresentationBinding(present(8,{movementScaleByView:{player:1,opponent:0}})));
 assert.throws(()=>normalizeCreaturePresentationBinding(present(7,{movementPlayback:{frameMs:50,mode:"loop"}})));
});
function fields(){
 return {id:"test",displayName:"Test",description:"Test",level:2,
 sourceStats:{force:1,agility:1,intelligence:1,spirit:1,endurance:1,initiative:1},
 elements:[],resistances:{},capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
 combat:{maxHp:100,maxEnergy:10,initialEnergy:0,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0},
 linkedSkillIds:[],profileId:"biped",displayScale:1,sockets:[],audio:{},
 visual:{frontAssetId:"pack:test:normal",backAssetId:"",iconAssetId:"",
  movementAssetId:"pack:test:move",movementMode:"sprite",movementDisplayScale:1,movementFrameCount:12,
  rangedAttackAssetId:"pack:test:front",rangedAttackBackAssetId:"pack:test:back",rangedAttackDisplayScale:1,
  rangedAttackMode:"sprite",rangedAttackFrameCount:12}}
}
test("Editor V8 saves the per-view sizes and frame speed without rewriting combat",()=>{
 const base=buildHumanCreatureDraftV3(fields());
 assert.equal(base.presentation.version,6);
 const a=buildHumanCreatureDraftV3({...fields(),visual:{...fields().visual,
   movementPlayerScale:1.7,movementOpponentScale:.9,movementFrameMs:70,movementPlaybackMode:"once",
   rangedAttackPlayerScale:1.3,rangedAttackOpponentScale:.75
 }});
 assert.equal(a.presentation.version,8);
 assert.equal(a.presentation.visual.movementScaleByView.player,1.7);
 assert.equal(a.presentation.visual.movementScaleByView.opponent,.9);
 assert.equal(a.presentation.visual.rangedAttackScaleByView.player,1.3);
 assert.equal(a.presentation.visual.rangedAttackScaleByView.opponent,.75);
 assert.deepEqual(a.presentation.visual.movementPlayback,{frameMs:70,mode:"once"});
 assert.deepEqual(a.combat,base.combat);
 assert.deepEqual(a.presentation.sockets,base.presentation.sockets);
 assert.deepEqual(normalizeCreaturePresentationBinding(a.presentation),a.presentation);
});
test("Each combat view reads only its own projected movement appearance",()=>{
 const meta={movementFx:{displayScale:1,frameMs:0},movementFxByView:{
 player:{url:"a",displayScale:1.7,frameMs:70,playbackMode:"once"},
 opponent:{url:"a",displayScale:.9,frameMs:70,playbackMode:"once"}}};
 assert.equal(creatureMovementAppearanceForViewV1(meta,"player").displayScale,1.7);
 assert.equal(creatureMovementAppearanceForViewV1(meta,"opponent").displayScale,.9);
 assert.equal(creatureMovementAppearanceForViewV1({movementFx:meta.movementFx},"player").displayScale,1);
});
test("Ground shadow geometry sees the actual feet of a trimmed sprite rather than fixed 8% canvas bottom",()=>{
 const opaque=new Uint8Array(10000);
 for(let y=20;y<=76;y++)for(let x=26;x<=73;x++)opaque[y*100+x]=1;
 const geometry=shadowGeometryFromOpaqueMaskV2({width:100,height:100,opaque});
 assert.ok(geometry.contactYRatio>.74 && geometry.contactYRatio<.79);
 assert.ok((1-geometry.contactYRatio)*100-geometry.heightPct/2>12);
 const empty=shadowGeometryFromOpaqueMaskV2({width:100,height:100,opaque:new Uint8Array(10000)});
 assert.equal(empty.contactYRatio,null);
});
test("Appearance clearly splits movement and attack and keeps larger touch typography",()=>{
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const css=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
 const group=html.split('data-creature-appearance-group="animations"')[1].split("</details>")[0];
 for(const x of ["movement-player-scale","movement-opponent-scale","movement-frame-ms","movement-playback",
  "ranged-attack-player-scale","ranged-attack-opponent-scale"])assert.match(group,new RegExp("data-creature-"+x));
 assert.match(group,/DÉPLACEMENT/);assert.match(group,/ATTAQUE À DISTANCE/);
 assert.match(css,/creature-animation-chapter/);assert.match(css,/font-size: max\(\.92rem,14px\)/);
});
test("movement sprite playback is honored by the sole display-shell renderer",async()=>{
 const doc={createElement(tag){
  if(tag==="canvas")return {width:0,height:0,getContext(){return {drawImage(){}}},toDataURL(){return "data:image/png;base64,AA"}};
  const el={ownerDocument:doc,style:{},dataset:{},naturalWidth:1200,naturalHeight:100,complete:true,children:[],append(x){this.children.push(x)},remove(){this.removed=true},
  animate(f,o){this.anim={f,o};return {finished:Promise.resolve(),cancel(){}}}};
  Object.defineProperty(el,"src",{configurable:true,get(){return this._src??""},set(v){this._src=v;this.onload?.()}});
  return el;
 }};
 const img=doc.createElement("img");img.addEventListener=()=>{};
 const host={ownerDocument:doc,append(el){this.node=el}};
 const visual=createDomCreatureMovementVisualV1({motion:host,image:img,collisionModel:{setPresentationScale(){},clear(){},refreshFromImage(){return true}}});
 const move={url:"https://example.test/atlas.png",mode:"sprite",frameCount:12,frameMs:70,playbackMode:"once",displayScale:1,rotationTurns:0,transitionMs:0};
 img.src="https://example.test/normal.png";visual.prepare(move,img.src);
 const h=visual.play(move,1600,1);
 for(let i=0;i<9;i++)await Promise.resolve();
 assert.equal(host.node.children[0].style.animationDuration,"840ms");
 assert.equal(host.node.children[0].style.animationIterationCount,"1");
 h.cancel();visual.dispose();
});
