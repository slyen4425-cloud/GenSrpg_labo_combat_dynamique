import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { buildHumanCreatureDraftV3, captureEditorAssetMatchesRoleV1 } from "../../src/ui/capture-editor-human-v2.js";
import { adaptCaptureExportToNativeVisualSourceV1 } from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";
import { createDomCreatureMovementVisualV1 } from "../../src/adapters/renderer/dom-creature-movement-visual-v1.js";

const motion = {
  assetId:"pack:test:shoot", mode:"sprite", displayScale:1.25, rotationTurns:0, frameCount:12, transitionMs:80
};
function binding(version=5) {
  return {
    id:"creature:shooter",version,subjectType:"creature",subjectId:"shooter",
    profileId:"quadruped",displayScale:1,position:{x:0,y:0},
    transformOrigin:{x:"50%",y:"50%"},
    visual:{
      front:{assetId:"pack:test:front"},back:null,icon:null,
      movement:{assetId:"pack:test:roll",mode:"roll",displayScale:.8,rotationTurns:3,frameCount:1,transitionMs:80},
      ...(version===5?{rangedAttack:motion}:{})
    },sockets:[],audio:{}
  };
}
test("V5 uses the same validated animation parameters without altering V4 movement",()=>{
  const v5=normalizeCreaturePresentationBinding(binding());
  assert.equal(v5.version,5);
  assert.deepEqual(v5.visual.rangedAttack,motion);
  assert.equal(v5.visual.movement.mode,"roll");
  assert.deepEqual(normalizeCreaturePresentationBinding(v5),v5);
  const v4=normalizeCreaturePresentationBinding(binding(4));
  assert.equal(v4.version,4);
  assert.equal(v4.visual.rangedAttack,undefined);
  for(const invalid of [{assetId:"unstable"},{frameCount:0},{displayScale:0},{mode:"teleport"},{transitionMs:600}]){
    assert.throws(()=>normalizeCreaturePresentationBinding({...binding(),visual:{
      ...binding().visual,rangedAttack:{...motion,...invalid}
    }}));
  }
  assert.throws(()=>normalizeCreaturePresentationBinding({...binding(),visual:{...binding().visual,unknownFx:"x"}}));
});
function creatureFields(){
  return {id:"shooter",displayName:"Tireur",description:"Test",level:10,
    sourceStats:{force:1,agility:1,intelligence:1,spirit:1,endurance:1,initiative:1},
    elements:[],resistances:{},capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
    combat:{maxHp:100,maxEnergy:10,initialEnergy:0,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0},
    linkedSkillIds:[],profileId:"quadruped",displayScale:1,
    visual:{frontAssetId:"pack:test:front",backAssetId:"",iconAssetId:"",
      movementAssetId:"pack:test:roll",movementMode:"roll",movementDisplayScale:.8,movementRotationTurns:3,
      movementFrameCount:1,movementTransitionMs:80},
    sockets:[],audio:{}
  };
}
test("human author draft stores V5 ranged pose and existing movement without touching combat values",()=>{
  const base=buildHumanCreatureDraftV3(creatureFields());
  assert.equal(base.presentation.version,4);
  const changed=buildHumanCreatureDraftV3({...creatureFields(),visual:{...creatureFields().visual,
    rangedAttackAssetId:motion.assetId,rangedAttackMode:"sprite",
    rangedAttackDisplayScale:1.25,rangedAttackRotationTurns:0,
    rangedAttackFrameCount:12,rangedAttackTransitionMs:80}});
  assert.equal(changed.presentation.version,5);
  assert.deepEqual(changed.presentation.visual.rangedAttack,motion);
  assert.deepEqual(changed.presentation.visual.movement,base.presentation.visual.movement);
  assert.deepEqual(changed.combat,base.combat);
  assert.deepEqual(changed.presentation.sockets,base.presentation.sockets);
});
test("Capture adapter connects optional ranged sprites without modifying the projectile definition",()=>{
  const fighter={maxHp:100,initialHp:100,maxEnergy:5,initialEnergy:5,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0};
  const exported={
    schema:"capture-combat-export-v1",battle:{id:"ranged",localActorId:"local"},
    teams:{heroes:["local"],foes:["enemy"]},
    actors:[
      {actorId:"local",teamId:"heroes",creatureId:"shooter",displayName:"Tireur",controllerId:"human-local"},
      {actorId:"enemy",teamId:"foes",creatureId:"old",displayName:"Ancien",controllerId:"ai-enemy"}
    ],
    creatures:[
      {id:"shooter",displayName:"Tireur",combat:fighter,skillIds:[],presentationId:"creature:shooter",metadata:{}},
      {id:"old",displayName:"Ancien",combat:fighter,skillIds:[],presentationId:"creature:old",metadata:{}}
    ],
    skills:[],rosters:[],
    presentation:{creatures:{
      "creature:shooter":binding(),
      "creature:old":{id:"creature:old",version:1,subjectType:"creature",subjectId:"old",profileId:"biped",
        visual:{front:{assetId:"pack:test:front"},back:null,icon:null},sockets:[],audio:{}}
    }},metadata:{}
  };
  const source=adaptCaptureExportToNativeVisualSourceV1({
    exported,
    assetCatalog:{assets:[
      {id:"pack:test:front",resource:{file:"front.png"}},
      {id:"pack:test:roll",resource:{file:"roll.png"}},
      {id:"pack:test:shoot",resource:{file:"shoot.png",frameCount:12}}
    ]},
    profiles:[{id:"quadruped",idle:{},attack:{},hit:{},ko:{}},{id:"biped",idle:{},attack:{},hit:{},ko:{}}],
    assetUrlForFile:file=>"https://example.test/"+file
  });
  const shooter=source.creatureMetas.find(x=>x.id==="shooter");
  const old=source.creatureMetas.find(x=>x.id==="old");
  assert.equal(shooter.movementFx.url,"https://example.test/roll.png");
  assert.equal(shooter.rangedAttackFx.url,"https://example.test/shoot.png");
  assert.equal(shooter.rangedAttackFx.frameCount,12);
  assert.equal(shooter.rangedAttackFx.mode,"sprite");
  assert.equal(old.rangedAttackFx,null);
  assert.equal(old.movementFx,null);
});
test("release starts ranged creature pose for projectile and beam, not melee or support",()=>{
  const captured=[];
  const visuals={playEventFor(slot,type,options){captured.push({slot,type,options});return Promise.resolve({status:"finished"})},
    cancelFor(){},playApproachFor(slot,mode){captured.push({slot,type:"approach",mode});return Promise.resolve({status:"finished"})}};
  const p=createCombatResolutionPresenter({visuals});
  for(const form of ["projectile","beam","area"]){
    p.presentRelease({actorSlot:"opponent",targetSlot:"player",
      action:{actionType:"skill",travelMs:400,skill:{id:"shot",form,approachMode:"none",element:"fire"}}});
    assert.equal(captured.at(-1).options.metadata.useRangedAppearance,true);
  }
  p.presentRelease({actorSlot:"opponent",targetSlot:"player",
    action:{actionType:"skill",travelMs:400,skill:{id:"melee",form:"contact",approachMode:"ground",element:null}}});
  assert.equal(captured.at(-1).type,"approach");
  p.presentRelease({actorSlot:"opponent",targetSlot:"player",
    action:{actionType:"skill",travelMs:0,skill:{id:"buff",form:"self",approachMode:"none",element:null}}});
  assert.equal(captured.at(-1).options.metadata.useRangedAppearance,false);
  p.dispose();
});
test("Appearance has five accessible disclosure chapters, with both motion controls together",()=>{
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const css=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
  const matches=[...html.matchAll(/data-creature-appearance-group="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(matches,["views","defense","animations","imports","position"]);
  for(const marker of ["data-creature-ranged-attack-appearance","data-creature-ranged-attack-visual",
    "data-creature-ranged-attack-mode","data-creature-ranged-attack-frames",
    "data-creature-ranged-attack-turns","data-creature-ranged-attack-transition"]){
    assert.equal((html.match(new RegExp(marker,"g"))??[]).length,1,marker);
  }
  const group=html.split('data-creature-appearance-group="animations"')[1].split("</details>")[0];
  assert.match(group,/data-creature-movement-visual/);
  assert.match(group,/data-creature-ranged-attack-visual/);
  assert.match(css,/creature-appearance-group > summary:focus-visible/);
  assert.equal(captureEditorAssetMatchesRoleV1({mediaType:"image",assetType:"sprite",category:"movement",compatibility:{uses:["editor"]}},"movement"),true);
});
function fixture(){
  const listeners=[];
  const doc={createElement(tag){
    if(tag==="canvas")return {width:0,height:0,getContext(){return {drawImage(){}}},toDataURL(){return "data:image/png;base64,AAAA"}};
    const el={ownerDocument:doc,style:{},dataset:{},naturalWidth:100,naturalHeight:100,complete:true,
      children:[],append(child){this.children.push(child)},remove(){this.removed=true},
      animate(frames,options){this.lastAnimation={frames,options};return {finished:Promise.resolve(),cancel(){}}}};
    Object.defineProperty(el,"src",{configurable:true,get(){return this._src||""},set(value){this._src=value;this.onload?.()}});
    return el;
  }};
  const image=doc.createElement("img");
  image.addEventListener=(_type,fn)=>listeners.push(fn);
  Object.defineProperty(image,"src",{get(){return this._src||""},set(value){this._src=value;for(const l of listeners.splice(0))l()}});
  const motionHost={ownerDocument:doc,append(el){this.node=el}};
  const collisionModel={setPresentationScale(){},clear(){},refreshFromImage(){return true}};
  return {image,motionHost,visual:createDomCreatureMovementVisualV1({motion:motionHost,image,collisionModel})};
}
async function flush(){await Promise.resolve();await Promise.resolve();await Promise.resolve()}
test("the same imported image can use one frame for movement and many frames for ranged attacks",async()=>{
  const f=fixture(),normal="https://example.test/normal.png",url="https://example.test/shared.png";
  f.image.src=normal;
  const roll={url,mode:"roll",rotationTurns:3,frameCount:1,displayScale:1,transitionMs:0};
  const shot={url,mode:"sprite",rotationTurns:0,frameCount:12,displayScale:1,transitionMs:0};
  f.visual.prepare(roll,normal,shot);
  const a=f.visual.play(shot,600,1);
  await flush();
  assert.equal(f.image.src,"data:image/png;base64,AAAA","ranged uses cropped first frame as collision silhouette");
  a.cancel();
  const b=f.visual.play(roll,600,1);
  await flush();
  assert.equal(f.image.src,url,"movement uses the full single PNG when its frame count is one");
  b.cancel();f.visual.dispose();
});

test("one preloaded shell swaps safely between shot sprite and rolling image",async()=>{
  const f=fixture(),normal="https://example.test/normal.png";
  f.image.src=normal;
  const move={url:"https://example.test/ball.png",mode:"roll",rotationTurns:3,frameCount:1,displayScale:.9,transitionMs:80};
  const shot={url:"https://example.test/shoot.png",mode:"sprite",rotationTurns:0,frameCount:12,displayScale:1.1,transitionMs:80};
  f.visual.prepare(move,normal,shot);
  const a=f.visual.play(shot,600,1);
  await flush();
  assert.equal(f.image.src,"data:image/png;base64,AAAA");
  assert.equal(f.motionHost.node.children[0].style.animationName,"skill-fx-strip");
  assert.equal(f.visual.tintTarget().host,f.motionHost.node);
  a.cancel();
  assert.equal(f.image.src,normal);
  const b=f.visual.play(move,900,1);
  await flush();
  assert.equal(f.image.src,move.url);
  b.cancel();
  assert.equal(f.image.src,normal);
  f.visual.dispose();
});
