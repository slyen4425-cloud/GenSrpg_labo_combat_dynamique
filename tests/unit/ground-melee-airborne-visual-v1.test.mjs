import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {restingTargetCenterForApproachV1} from "../../src/ui/demo-app.js";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");

test("ground melee uses stable target-slot center, not an airborne model's live transform",()=>{
 const container={offsetWidth:200,getBoundingClientRect(){return {left:100,top:200,width:100,height:100};}};
 const slot={container,actor:{position:{x:20,y:-10}},
  motion:{getBoundingClientRect(){return {left:200,top:-1000,width:65,height:65};}}};
 const point=restingTargetCenterForApproachV1(slot);
 assert.deepEqual(point,{x:160,y:245});
 assert.notEqual(point.y,slot.motion.getBoundingClientRect().top);
});

test("ground aim honors user positioning offsets and responsive distance scale",()=>{
 const container={offsetWidth:100,getBoundingClientRect(){return {left:0,top:40,width:200,height:200};}};
 const actor={position:{x:-15,y:24}};
 const before={...actor.position};
 assert.deepEqual(restingTargetCenterForApproachV1({container,actor}),{x:70,y:188});
 assert.deepEqual(actor.position,before);
});

test("one shared visual owner separates grounded aim from live visible silhouette contact in 1v1/2v2",()=>{
 const source=read("src/ui/demo-app.js");
 assert.match(source,/function playApproachFor[\s\S]*?activeApproachBySlot\.get\(targetSlot\)\?\.approachMode === "aerial"/);
 assert.match(source,/const targetAim = airborneTarget[\s\S]*?restingTargetCenterForApproachV1\(target\)/);
 assert.match(source,/const approachRecord = Object\.freeze\(\{[\s\S]*?approachMode/);
 assert.match(source,/watchVisibleModelContact\(\{[\s\S]*?sourceModel: slot\.collisionModel,[\s\S]*?targetModel: target\.collisionModel/);
 assert.match(source,/container: slotContainer/);
 for(const p of ["src/ui/combat-test-ui.js","src/ui/combat-2v2-test-ui.js"]){
  const client=read(p);
  assert.match(client,/createCombatResolutionPresenter/);
  assert.match(client,/reportActionContact/);
 }
});
