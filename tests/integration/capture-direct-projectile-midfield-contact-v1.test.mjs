import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { adaptCaptureSkillToSkillDefinition } from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";

const raw=readFileSync(new URL("../../data/capture/showcase/fireball.capture-skill-transfer-v1.json",import.meta.url),"utf8");
const draft=importCaptureTransferJsonV1(raw).value.draft;
const fireball=adaptCaptureSkillToSkillDefinition({id:draft.id,definition:draft.definition},draft.presentation);
const rect=(x,y,width=40,height=40)=>({left:x-width/2,top:y-height/2,width,height,right:x+width/2,bottom:y+height/2});
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
function harness({from="opponent",target="player"}={}){
 let clockMs=0, timers=[],lastId=0;
 const clock={
  now:()=>clockMs,
  setTimer(callback,delay){const id=++lastId;timers.push({id,due:clockMs+delay,callback});return id},
  clearTimer(id){timers=timers.filter(t=>t.id!==id)},
  advanceTo(end){let steps=0;while(true){const due=timers.filter(t=>t.due<=end).sort((a,b)=>a.due-b.due||a.id-b.id)[0];if(!due)break;if(++steps>120)throw Error("Runtime timer loop");timers=timers.filter(t=>t!==due);clockMs=due.due;due.callback()}clockMs=end}
 };
 const position={projectileX:from==="opponent"?450:50,projectileY:150,targetX:from==="opponent"?350:350,targetY:150};
 const nodes=[], animations=[], frames=[];
 const makeNode=()=>({
   className:"",dataset:{},style:{},children:[],removed:false,
   append(...children){this.children.push(...children)},
   remove(){this.removed=true},
   setAttribute(){},
   getBoundingClientRect(){return rect(position.projectileX,position.projectileY,10,10)}
 });
 const doc={createElement:makeNode};
 const arena={ownerDocument:doc,append(node){nodes.push(node)},getBoundingClientRect(){return rect(250,150,500,300)}};
 const sourceX=from==="opponent"?450:50;
 const stableTargetX=from==="opponent"?50:450;
 const sources={
  [from]:{getBoundingClientRect:()=>rect(sourceX,150)},
  [target]:{getBoundingClientRect:()=>rect(position.targetX,position.targetY)}
 };
 const resting={
  [from]:{getBoundingClientRect:()=>rect(sourceX,150)},
  [target]:{getBoundingClientRect:()=>rect(stableTargetX,150)}
 };
 const mask=Object.freeze({width:8,height:8,opaque:new Uint8Array(64).fill(1)});
 const collisionModel={snapshot(){
    const {left,top}=rect(position.targetX,position.targetY);
    return {mask,origin:{x:left,y:top},axisX:{x:left+40,y:top},axisY:{x:left,y:top+40}};
 }};
 const session=createCombatSession({fighters:[fighter(from),fighter(target)]});
 let runtime=null, contactCalls=0;
 const visuals={playEventFor:()=>Promise.resolve(),cancelFor(){},playApproachFor:()=>Promise.resolve()};
 const fx=createDomSkillFxRenderer({
   arena,anchors:sources,targetAnchors:resting,
   targetCollisionModelFor(slot){return slot===target?collisionModel:null},
   onProjectileContact(contact){contactCalls++;runtime?.reportActionContact(contact)},
   requestFrame(fn){frames.push(fn);return frames.length},
   cancelFrame(){},
   presentationForSkill(){return {
      travel:null,
      impact:{assetId:"test:fireball-impact",url:"fireball-impact.webp",displayScale:1,opacity:1}
   }},
   animate(node,keyframes,options){
     const record={node,keyframes,options,cancelled:false,
       cancel(){this.cancelled=true},finished:new Promise(()=>{})};
     animations.push(record);return record;
   }
 });
 const presenter=createCombatResolutionPresenter({visuals,fx});
 const resolutions=[];
 runtime=createCombatRuntime({session,now:clock.now,setTimer:clock.setTimer,clearTimer:clock.clearTimer,
   onResolved(resolution){resolutions.push({resolution,clockMs});presenter.presentOutcome({resolution,actorSlot:resolution.actorId,targetSlot:resolution.targetId})}});
 runtime.start();
 function frame(){const fn=frames.shift();assert.ok(fn,"projectile RAF should be scheduled");fn()}
 function launch(){const started=runtime.startSkill({actorId:from,targetId:target,skill:fireball});assert.equal(started.ok,true);clock.advanceTo(fireball.preparationMs);const result=fx.play({type:"projectile",skillId:fireball.id,fromSlot:from,targetSlot:target,durationMs:fireball.travelMs});assert.equal(result.status,"running");return {started,result}}
 return {fx,runtime,session,clock,position,nodes,animations,frames,resolutions,launch,frame,get contactCalls(){return contactCalls},dispose(){runtime.dispose();fx.dispose();presenter.dispose()}};
}
for(const direction of ["player","opponent"]){
 test("Boule de feu "+direction+" hits a ground creature walking into its fixed straight path halfway, not at the resting slot",()=>{
  const target=direction==="player"?"opponent":"player",h=harness({from:direction,target});
  try{
   assert.deepEqual(fireball.hitPresenceStates,["surface"]);
   h.launch();
   const projectile=h.nodes.find(n=>n.dataset.skillFx==="projectile");
   assert.ok(projectile);
   const travel=h.animations.find(a=>a.node===projectile);
   assert.ok(travel);
   // Visual flight remains the resting lane, not a homing shot toward the moving model.
   const finalTransform=travel.keyframes.at(-1).transform;
   assert.match(finalTransform,/translate3d\(/);
   h.clock.advanceTo(fireball.preparationMs+150);
   h.position.projectileX=direction==="player"?150:350;
   h.position.targetX=direction==="player"?340:160;
   h.frame();
   assert.equal(h.contactCalls,0,"ground actor has not yet met the projectile");
   assert.equal(h.resolutions.length,0);
   // Actor charges toward the shot; the first model intersection happens in midfield.
   const midpoint=direction==="player"?245:255;
   h.position.projectileX=midpoint;
   h.position.targetX=direction==="player"?255:245;
   h.clock.advanceTo(fireball.preparationMs+620);
   h.frame();
   assert.equal(h.contactCalls,1);
   assert.equal(h.resolutions.length,1);
   const {resolution,clockMs}=h.resolutions[0];
   assert.equal(resolution.outcome,"hit");
   assert.ok(clockMs<fireball.preparationMs+fireball.travelMs,"hit must resolve before nominal flight end");
   assert.ok(h.session.snapshot().fighters[target].hp<100);
   assert.equal(travel.cancelled,true,"contact must immediately remove the in-flight projectile");
   assert.equal(projectile.removed,true);
   const impact=h.nodes.find(n=>n.dataset.skillFx==="impact");
   assert.ok(impact,"impact FX should be emitted on true physical contact");
   assert.equal(impact.style.left,h.position.targetX+"px","impact follows moving model midpoint rather than resting slot");
   assert.equal(impact.style.top,h.position.targetY+"px");
   h.position.projectileX=direction==="player"?450:50;
   if(h.frames.length)h.frame();
   assert.equal(h.contactCalls,1,"resolved projectile must never damage twice");
   assert.equal(h.resolutions.length,1);
  }finally{h.dispose()}
 });
}
