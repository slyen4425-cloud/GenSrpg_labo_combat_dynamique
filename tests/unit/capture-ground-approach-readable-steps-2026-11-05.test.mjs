import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeVisualActor} from "../../src/contracts/visual-actor.js";
import {planAnimation} from "../../src/core/animation/plan-animation.js";
import {groundApproachLocomotionFromProfileV1} from "../../src/core/animation/ground-approach-steps-v1.js";

const profile=id=>JSON.parse(readFileSync(new URL("../../data/profiles/"+id+".profile.json",import.meta.url),"utf8"));
const actor=(id,view)=>normalizeVisualActor({id:"actor",creatureId:"example",profile:id,
 asset:"test.webp",view,facing:view==="player"?"right":"left",scale:1});
function plan(id,{travelMs=900,view="player",dx=200,dy=-20}={}){
  return planAnimation({event:{type:"ground-attack",actorId:"actor",targetId:"opponent",
    intensity:1,metadata:{targetTranslateX:dx,targetTranslateY:dy,travelMs,arenaHeight:300}},
    actor:actor(id,view),profile:profile(id)});
}
test("biped has 5 discernible hop/land pairs, quadruped 3; defaults remain artist-editable",()=>{
 for(const [id,steps] of [["biped",5],["quadruped",3]]){
  const data=profile(id);
  assert.equal(data.locomotion.groundApproach.steps,steps);
  const generated=groundApproachLocomotionFromProfileV1(data.locomotion);
  assert.equal(generated.phases.length,steps*2);
  assert.equal(generated.contacts.length,steps);
  assert.equal(data.locomotion.phases.length,id==="biped"?6:4,
    "the existing standalone movement cycle stays unchanged");
  for(let i=0;i<steps;i++){
   assert.equal(generated.phases[2*i].at,(i+0.5)/steps);
   assert.equal(generated.phases[2*i+1].at,(i+1)/steps);
   assert.equal(generated.contacts[i].at,(i+1)/steps);
   assert.ok(generated.phases[2*i].translateY<0,"real lifted silhouette during every step");
   assert.equal(generated.phases[2*i+1].translateY,0,"every step lands on the true baseline");
  }
 }
});
test("contact steps stay synchronized to the ONE real travel duration, even fast, without extra impact delay",()=>{
 for(const [id,steps] of [["biped",5],["quadruped",3]]){
  for(const travelMs of [500,700,1500]){
   const p=plan(id,{travelMs});
   const cues=p.cues.filter(x=>x.type==="footfall");
   assert.equal(cues.length,steps);
   assert.deepEqual(cues.map(x=>x.atMs),Array.from({length:steps},(_,i)=>Math.round((i+1)*travelMs/steps)));
   assert.equal(p.segments.length,2*steps+1);
   assert.equal(p.segments[2*steps-1].label,"ground-approach-impact");
   assert.equal(p.segments[2*steps].label,"ground-home");
   assert.equal(p.segments.slice(0,-1).reduce((n,x)=>n+x.durationMs,0),travelMs);
   const lifts=p.segments.filter(x=>x.label.endsWith("-lift"));
   assert.equal(lifts.length,steps);
   assert.ok(lifts.every(x=>x.transform.translateY<0),"each hop must remain visually lifted");
   assert.ok(p.segments.every(x=>x.durationMs>0));
  }
 }
});
test("real ground trajectory still reaches the target on both views before returning, no extra collision owner",()=>{
 for(const [id,steps] of [["biped",5],["quadruped",3]]){
  for(const [view,dx] of [["player",220],["opponent",-220]]){
   const p=plan(id,{travelMs:900,view,dx});
   const ground=p.segments.slice(0,-1);
   const xAtImpact=ground.at(-1).transform.translateX;
   assert.ok(Math.abs(xAtImpact-dx)<20,id+" must reach actual target rather than telegraphing a fake shorter distance");
   assert.equal(p.segments.at(-1).transform.translateX,0,"return to original fighter slot after true contact");
   assert.equal(p.cues.length,steps);
   assert.ok(ground.every(x=>Math.abs(x.transform.translateX)<300));
  }
 }
});
test("unsupported / exceptional locomotion preserves existing presets and rejects invalid author overrides",()=>{
 for(const id of ["massive","flying","serpentine"]){
  const cfg=profile(id).locomotion;
  assert.equal(groundApproachLocomotionFromProfileV1(cfg),cfg);
 }
 const biped=profile("biped").locomotion;
 for(const invalid of [0,-1,3.5,13,Infinity]){
  assert.throws(()=>groundApproachLocomotionFromProfileV1({...biped,groundApproach:{...biped.groundApproach,steps:invalid}}),RangeError);
 }
 assert.throws(()=>groundApproachLocomotionFromProfileV1({...biped,groundApproach:{...biped.groundApproach,unknown:1}}),TypeError);
});
