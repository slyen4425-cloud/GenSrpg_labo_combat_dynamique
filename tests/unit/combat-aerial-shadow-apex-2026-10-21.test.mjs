import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { animationPlanToDomTimeline } from "../../src/adapters/renderer/dom-keyframes.js";

const profile=JSON.parse(readFileSync("data/profiles/flying.profile.json","utf8"));
const actor=(view)=>normalizeVisualActor({id:"flight-"+view,creatureId:"test",profile:"flying",
 view,asset:"test.webp",scale:view==="player"?1.7:0.95});
function plan(a,p=profile){
 return planAnimation({actor:a,profile:p,event:normalizeCombatVisualEvent({
  type:"aerial-attack",actorId:a.id,targetId:"enemy",metadata:{
    travelMs:800,targetTranslateX:100,targetTranslateY:-40,arenaHeight:400,arenaExitTranslateY:-350
  }
 })});
}
test("aerial apex visibly contracts only existing shadow ground scale",()=>{
 for(const view of ["player","opponent"]){
  const a=actor(view);
  const normal=plan(a,{...profile,specialMoves:{...profile.specialMoves,
    aerial:{...profile.specialMoves.aerial,shadowApexScale:1}}});
  const contracted=plan(a);
  assert.equal(contracted.segments.length,normal.segments.length);
  assert.equal(contracted.segments[0].ground.scale,
    normal.segments[0].ground.scale*0.86);
  for(let i=0;i<contracted.segments.length;i++){
   assert.deepEqual(contracted.segments[i].transform,normal.segments[i].transform);
   assert.equal(contracted.segments[i].durationMs,normal.segments[i].durationMs);
   assert.equal(contracted.segments[i].ground.translateX,normal.segments[i].ground.translateX);
   assert.equal(contracted.segments[i].ground.translateY,normal.segments[i].ground.translateY);
  }
  assert.deepEqual(contracted.segments[1].ground,normal.segments[1].ground);
  assert.deepEqual(contracted.segments[2].ground,normal.segments[2].ground);
  const dom=animationPlanToDomTimeline(contracted,a);
  assert.equal(dom.shadowKeyframes.length,dom.keyframes.length);
  assert.equal(dom.shadowKeyframes.at(-1).transform,dom.shadowKeyframes[0].transform);
 }
});
test("apex shadow adjustment has bounded configurable profile preset",()=>{
 const a=actor("player");
 for(const v of [NaN,0.2,1.2]){
  assert.throws(()=>plan(a,{...profile,specialMoves:{...profile.specialMoves,
   aerial:{...profile.specialMoves.aerial,shadowApexScale:v}}}),RangeError);
 }
});
