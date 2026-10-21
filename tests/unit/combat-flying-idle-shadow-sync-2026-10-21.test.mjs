import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { animationPlanToDomTimeline, composeDomShadowTransform } from "../../src/adapters/renderer/dom-keyframes.js";
import { createDomActorRenderer } from "../../src/adapters/renderer/dom-actor-renderer.js";

const load = async id => JSON.parse(await readFile("data/profiles/"+id+".profile.json","utf8"));
const flying = await load("flying");
const quadruped = await load("quadruped");
const actor = (profile, view) => normalizeVisualActor({
  id: profile+"-"+view, creatureId: "synthetic", profile, view,
  asset: "sprite.webp", scale: view==="player"?1.7:0.95,
  position: {x:3,y:view==="player"?10:50}
});
const idle = (a,p) => planAnimation({
  event:normalizeCombatVisualEvent({type:"idle",actorId:a.id}),
  actor:a,profile:p
});
const coordinateY = frame => Number(frame.transform.match(/translate3d\([^,]+, (-?[\d.]+)px, 0\)/)?.[1]);

test("flight profile's 8px hover produces one modest synchronized shadow response",()=>{
  for(const view of ["player","opponent"]){
    const a=actor("flying",view),plan=idle(a,flying),dom=animationPlanToDomTimeline(plan,a);
    assert.equal(plan.loop,true);
    assert.equal(dom.options.iterations,Infinity);
    assert.equal(dom.keyframes.length,dom.shadowKeyframes.length);
    assert.equal(dom.keyframes[1].offset,dom.shadowKeyframes[1].offset);
    assert.equal(dom.keyframes[1].easing,dom.shadowKeyframes[1].easing);
    assert.ok(plan.segments[0].transform.translateY < -7.9);
    assert.equal(plan.segments[0].ground.translateY,-1.44);
    assert.equal(plan.segments[0].ground.scale,0.975);
    assert.equal(plan.segments[1].ground.translateY,0);
    assert.equal(plan.segments[1].ground.scale,1);
    assert.ok(Math.abs(coordinateY(dom.shadowKeyframes[1])-coordinateY(dom.shadowKeyframes[0]))<2,
      "shadow moves more subtly than hovering body");
    assert.ok(Math.abs(coordinateY(dom.keyframes[1])-coordinateY(dom.keyframes[0]))>7.9);
    assert.match(dom.shadowKeyframes[1].transform,/scale\(1\.658\)/);
    assert.equal(dom.shadowKeyframes.at(-1).transform,composeDomShadowTransform(a));
    assert.equal(dom.keyframes.at(-1).offset,1);
  }
});

test("grounded quadruped and biped idle keep previous ground transform unchanged",async()=>{
  for(const p of [quadruped,await load("biped")]){
    const a=actor(p.id,"player"),plan=idle(a,p);
    for(const segment of plan.segments){
      assert.equal(segment.ground.translateY,0);
      assert.equal(segment.ground.scale,1);
    }
    const dom=animationPlanToDomTimeline(plan,a);
    assert.ok(dom.shadowKeyframes.every(f=>f.transform===composeDomShadowTransform(a)));
  }
});

test("alternate hover returns home on both intermediate and final ground states",()=>{
  const p={...flying,idle:{...flying.idle,swayMode:"alternate"}};
  const a=actor("flying","opponent"),plan=idle(a,p),dom=animationPlanToDomTimeline(plan,a);
  assert.deepEqual(plan.segments.map(s=>s.ground.scale),[0.975,1,0.975,1]);
  assert.deepEqual(plan.segments.map(s=>s.ground.translateY),[-1.44,0,-1.44,0]);
  assert.equal(dom.shadowKeyframes[2].transform,composeDomShadowTransform(a));
  assert.equal(dom.shadowKeyframes[4].transform,composeDomShadowTransform(a));
});

test("shadow response is disabled without hover and profile tuning is bounded",()=>{
  const a=actor("flying","player");
  assert.ok(idle(a,{...flying,idle:{...flying.idle,bobY:0}})
    .segments.every(s=>s.ground.translateY===0&&s.ground.scale===1));
  assert.throws(()=>idle(a,{...flying,idle:{...flying.idle,
    shadowResponse:{verticalFollowFraction:0.9,apexScale:0.5}}}),RangeError);
});

test("renderer still owns exactly two cancelable WAAPI tracks and no side animation",async()=>{
  const a=actor("flying","player"),record=[];
  const instance=(target,keyframes,options)=>{
    const result={finished:new Promise(()=>{}),ready:Promise.resolve(),startTime:5,cancel(){this.cancelled=true;}};
    record.push({target,keyframes,options,result});
    return result;
  };
  const body={style:{}},shadow={style:{}};
  const renderer=createDomActorRenderer({element:body,shadowElement:shadow,actor:a,animate:instance});
  renderer.play(idle(a,flying));
  assert.equal(record.length,2);
  assert.equal(record[0].target,body);
  assert.equal(record[1].target,shadow);
  assert.equal(record[0].options.duration,record[1].options.duration);
  assert.equal(record[0].options.iterations,Infinity);
  assert.equal(record[1].options.iterations,Infinity);
  renderer.dispose();
  assert.equal(record[0].result.cancelled,true);
  assert.equal(record[1].result.cancelled,true);
  assert.equal(shadow.style.transform,composeDomShadowTransform(a));
  assert.equal(shadow.style.opacity,"1");
});
