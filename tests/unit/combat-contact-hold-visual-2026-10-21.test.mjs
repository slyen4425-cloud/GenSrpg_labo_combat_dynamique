import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createDomActorRenderer } from "../../src/adapters/renderer/dom-actor-renderer.js";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
const source=p=>readFileSync(p,"utf8");
const p=JSON.parse(source("data/profiles/biped.profile.json"));
const actor=normalizeVisualActor({id:"held-player",creatureId:"creature",asset:"creature.webp",profile:"biped",view:"player",scale:1.5});
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function animationHarness(){
 const body={style:{}},shadow={style:{}},calls=[];
 const renderer=createDomActorRenderer({element:body,shadowElement:shadow,actor,
  readComputedStyle(element){return {transform: element===body?"translate3d(50px, -20px, 0) scale(1.5)":
    "translate3d(50px, 0px, 0) translateX(-50%) scale(1.5)",transformOrigin:"50% 92%",opacity:"1",filter:"none"};},
  animate(target,keyframes,options){
   const done=deferred();
   const handle={finished:done.promise,ready:Promise.resolve(),startTime:1,
    paused:false,cancelled:false,pause(){this.paused=true;},cancel(){this.cancelled=true;
      const err=new Error("cancelled");err.name="AbortError";done.reject(err);}};
   calls.push({target,keyframes,options,handle,done});
   return handle;
  }
 });
 return {body,shadow,calls,renderer};
}
test("existing Animation Core ground approach pauses BOTH WAAPI tracks at a held contact and returns natively",async()=>{
 const h=animationHarness();
 const plan=planAnimation({actor,profile:p,event:normalizeCombatVisualEvent({type:"ground-attack",
  actorId:actor.id,targetId:"target",metadata:{targetTranslateX:120,targetTranslateY:-60,
  travelMs:700,arenaHeight:500,arenaExitTranslateY:-400}})});
 const original=h.renderer.play(plan);
 assert.equal(h.calls.length,2);
 assert.equal(h.renderer.pauseActive(),true);
 assert.equal(h.calls[0].handle.paused,true);
 assert.equal(h.calls[1].handle.paused,true);
 const back=h.renderer.returnActiveToBaseFromCurrent();
 assert.equal(back.status,"returning");
 assert.equal(h.calls.length,4);
 assert.equal(h.calls[0].handle.cancelled,true);
 assert.equal(h.calls[1].handle.cancelled,true);
 assert.equal(h.calls[2].keyframes[0].transform,"translate3d(50px, -20px, 0) scale(1.5)");
 assert.equal(h.calls[3].keyframes[0].transform,"translate3d(50px, 0px, 0) translateX(-50%) scale(1.5)");
 assert.equal(h.calls[2].options.duration,p.specialMoves.ground.returnMs);
 h.calls[2].done.resolve();h.calls[3].done.resolve();
 assert.equal((await back.finished).status,"finished");
 assert.equal((await original.finished).status,"cancelled");
 h.renderer.dispose();
});
test("presenter and both battle interfaces route opt-in contactHold without creating new timelines",()=>{
 const presenter=source("src/adapters/renderer/combat-resolution-presenter.js");
 const demo=source("src/ui/demo-app.js");
 const one=source("src/ui/combat-test-ui.js");
 const two=source("src/ui/combat-2v2-test-ui.js");
 assert.match(presenter,/holdOnContact: Boolean\(action\.skill\?\.contactHold\)/);
 assert.match(demo,/holdOnContact = false/);
 assert.match(demo,/contactResult\?\.outcome === "contact_held"/);
 assert.match(demo,/slot\.renderer\.pauseActive\(\)/);
 assert.match(demo,/slot\.renderer\.returnActiveToBaseFromCurrent\(\)/);
 assert.match(demo,/releaseHeldApproachFor/);
 for(const ui of [one,two]){
  assert.match(ui,/onContactHoldEnd\(/);
  assert.match(ui,/visuals\.releaseHeldApproachFor\?\.\(actorId\)/);
 }
 assert.doesNotMatch(demo,/new Image\(\)|requestAnimationFrame\(/);
});
