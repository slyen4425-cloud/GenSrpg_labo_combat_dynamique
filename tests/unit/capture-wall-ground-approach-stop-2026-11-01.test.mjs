import test from "node:test";
import assert from "node:assert/strict";
import {watchVisibleModelContact} from "../../src/adapters/renderer/dom-visible-model-contact.js";

const mask={width:4,height:4,opaque:new Uint8Array(16).fill(1)};
const frame=(x,y=50)=>({mask,origin:{x,y},axisX:{x:x+10,y},axisY:{x,y:y+10}});
const wall={entityId:"barrier:hero:ice-wall:hero",rect:{left:60,top:45,width:12,height:22}};
function run({moving=[frame(20),frame(40),frame(58)],rects=[wall]}={}){
 const steps=[...moving];let current=steps[0],nextFrame=null,rafCount=0,cancelCount=0,contacts=[];
 const watch=watchVisibleModelContact({
  sourceModel:{snapshot(){current=steps.shift()??current;return current;}},
  targetModel:{snapshot:()=>frame(155)},
  obstacleRectsFor:()=>rects,
  onContact:detail=>contacts.push(detail),
  requestFrame(fn){nextFrame=fn;rafCount++;return rafCount;},
  cancelFrame(){cancelCount++;}
 });
 for(let i=0;i<steps.length+3&&nextFrame&&contacts.length===0;i++){
  const callback=nextFrame;nextFrame=null;callback();
 }
 watch.cancel();
 return {contacts,rafCount,cancelCount};
}
test("RED: existing live ground-contact watcher intercepts an obstacle before the distant creature body",()=>{
 const r=run();
 assert.equal(r.contacts.length,1,"the same RAF observer must detect the real wall");
 assert.equal(r.contacts[0]?.combatEntityId,wall.entityId,"the exact observed wall ID reaches CombatRuntime");
 assert.ok(r.rafCount<=3,"no second observer or timer loop");
});
test("an offset wall cannot stop ground contact when the moving silhouette passes elsewhere",()=>{
 const r=run({rects:[{entityId:"other",rect:{left:60,top:100,width:12,height:16}}]});
 assert.equal(r.contacts.length,0);
});
test("reverse ground approach intersects a wall before a left-side defender",()=>{
 const reverse=run({moving:[frame(125),frame(90),frame(64)],rects:[{entityId:"left-wall",
  rect:{left:70,top:45,width:12,height:22}}]});
 assert.equal(reverse.contacts.length,1);
 assert.equal(reverse.contacts[0]?.combatEntityId,"left-wall");
});
