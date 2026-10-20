import test from "node:test";
import assert from "node:assert/strict";
import { animationPlanToDomTimeline } from "../../src/adapters/renderer/dom-keyframes.js";
import { createDomActorRenderer } from "../../src/adapters/renderer/dom-actor-renderer.js";

const actor = {
  id:"actor-1",position:{x:0,y:10},scale:1.7,
  transformOrigin:{x:"50%",y:"50%"}
};
const plan = {
  actorId:"actor-1",transformOrigin:{x:"50%",y:"92%"},
  segments:[{label:"idle",durationMs:400,easing:"linear",
    transform:{scaleY:1.007},ground:{translateY:0}}],loop:true
};

test("same plan origin on actor and single shadow for every idle and travel keyframe",()=>{
 const timeline=animationPlanToDomTimeline(plan,actor);
 assert.equal(timeline.keyframes.length,timeline.shadowKeyframes.length);
 for(let i=0;i<timeline.keyframes.length;i++){
   assert.equal(timeline.keyframes[i].transformOrigin,"50% 92%");
   assert.equal(timeline.shadowKeyframes[i].transformOrigin,"50% 92%");
 }
 const neutral=animationPlanToDomTimeline({...plan,transformOrigin:null,loop:false},actor);
 for (const frame of neutral.shadowKeyframes)
   assert.equal(Object.hasOwn(frame,"transformOrigin"),false);
});

test("actual DOM renderer sets matching baseline origins and restores them on cancellation",async()=>{
 const body={style:{}},shadow={style:{}};
 const frames=[];
 const animate=(el,keyframes,options)=>{
   frames.push({el,keyframes,options});
   return {ready:Promise.resolve(),finished:new Promise(()=>{}),startTime:0,cancel(){}};
 };
 const renderer=createDomActorRenderer({
   element:body,shadowElement:shadow,actor,animate,
   readComputedStyle:el=>({
     transform:el.style.transform,
     opacity:el.style.opacity,
     filter:el.style.filter,
     transformOrigin:el.style.transformOrigin
   })
 });
 assert.equal(body.style.transformOrigin,"50% 50%");
 assert.equal(shadow.style.transformOrigin,"50% 50%");
 renderer.play(plan);
 assert.equal(frames.length,2);
 assert.equal(frames[0].keyframes[0].transformOrigin,"50% 92%");
 assert.equal(frames[1].keyframes[0].transformOrigin,"50% 92%");
 renderer.cancel();
 assert.equal(body.style.transformOrigin,shadow.style.transformOrigin);
 assert.equal(shadow.style.transformOrigin,"50% 50%");
 renderer.dispose();
});
