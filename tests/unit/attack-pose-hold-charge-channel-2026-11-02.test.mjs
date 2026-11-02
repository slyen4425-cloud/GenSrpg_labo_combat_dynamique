import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";

const profile = JSON.parse(readFileSync(new URL("../../data/profiles/biped.profile.json", import.meta.url), "utf8"));
const actor = normalizeVisualActor({id:"caster",creatureId:"gorice",asset:"gorice.webp",profile:"biped",view:"player"});
const attackEvent = holdAttackPose => normalizeCombatVisualEvent({
  type:"attack",actorId:actor.id,metadata:{holdAttackPose}
});
const chargedAction = () => ({
  actionType:"skill",actorId:"player",targetId:"opponent",preparationMs:900,
  releaseAtMs:2400,travelMs:300,chargeState:{chargeCount:1},
  skill:{id:"charged-ice",name:"Glace chargée",form:"projectile",approachMode:"none"}
});
const channelAction = () => ({
  actionType:"skill",actorId:"player",targetId:"opponent",preparationMs:500,
  releaseAtMs:500,travelMs:0,
  skill:{id:"ice-pikes",name:"Piques",form:"area",approachMode:"none",channeling:{tickIntervalMs:1000}}
});
function harness(){
  const events=[];const held=new Set();
  const visuals={
    playEventFor(actorSlot,type,options={}){
      events.push({type:"play",actorSlot,eventType:type,options});
      if(options.metadata?.holdAttackPose)held.add(actorSlot);
      return Promise.resolve({status:"finished"});
    },
    cancelFor(actorSlot){events.push({type:"cancel",actorSlot});held.delete(actorSlot);},
    hasHeldAttackPoseFor(actorSlot){return held.has(actorSlot);},
    releaseHeldAttackPoseFor(actorSlot){
      events.push({type:"release-pose",actorSlot});return held.delete(actorSlot);
    }
  };
  const presenter=createCombatResolutionPresenter({visuals});
  return {events,held,presenter};
}
test("Animation Core keeps the strike pose (not recover) only for held attacks",()=>{
  const normal=planAnimation({event:attackEvent(false),actor,profile});
  const held=planAnimation({event:attackEvent(true),actor,profile});
  assert.equal(normal.restoreBaseState,true);
  assert.equal(normal.segments.at(-1).label,"recover");
  assert.equal(held.restoreBaseState,false);
  assert.equal(held.segments.at(-1).label,"strike");
  assert.equal(held.segments.length,2);
});
test("charged skill prepares ONE held creature pose, releases it exactly once before the fired attack",()=>{
  const h=harness();try{
    const action=chargedAction();
    h.presenter.presentPreparation({action});
    assert.deepEqual(h.events.filter(x=>x.eventType==="attack").map(x=>x.options.metadata),[
      {useRangedAppearance:true,holdAttackPose:true}
    ]);
    assert.equal(h.held.has("player"),true);
    h.presenter.presentRelease({action});
    assert.equal(h.held.has("player"),false);
    assert.equal(h.events.filter(x=>x.type==="release-pose").length,1);
    assert.equal(h.events.filter(x=>x.eventType==="attack").length,2);
  }finally{h.presenter.dispose();}
});
test("channel keeps one posed sprite from preparation through release and native pulses, then returns to idle on end",()=>{
  const h=harness();try{
    const action=channelAction();
    h.presenter.presentPreparation({action});
    assert.equal(h.held.has("player"),true);
    h.presenter.presentRelease({action});
    assert.equal(h.held.has("player"),true);
    assert.equal(h.events.filter(x=>x.eventType==="attack").length,1);
    const resolution={ok:true,outcome:"hit",channelingStart:true,events:[]};
    h.presenter.presentOutcome({resolution});
    assert.equal(h.held.has("player"),true);
    h.presenter.endChannelPose({actorSlot:"player"});
    assert.equal(h.held.has("player"),false);
  }finally{h.presenter.dispose();}
});
test("failed channel and interruption clear the same held pose; ordinary skills remain unchanged",()=>{
  const h=harness();try{
    const channel=channelAction();
    h.presenter.presentPreparation({action:channel});
    h.presenter.presentRelease({action:channel});
    h.presenter.presentOutcome({resolution:{ok:true,outcome:"blocked",channelingStart:false,events:[]}});
    assert.equal(h.held.has("player"),false);
    h.presenter.presentPreparation({action:chargedAction()});
    h.presenter.cancelActionPresentation("player");
    assert.equal(h.held.has("player"),false);
    h.events.length=0;
    h.presenter.presentPreparation({action:{...chargedAction(),chargeState:null,skill:{id:"normal",form:"projectile"}}});
    assert.equal(h.events.some(x=>x.options?.metadata?.holdAttackPose),false);
  }finally{h.presenter.dispose();}
});
test("the real visual controller and 1v1/2v2 UIs reuse a single pose owner and wire channel end",()=>{
  const source=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
  const demo=source("src/ui/demo-app.js");
  const one=source("src/ui/combat-test-ui.js");
  const two=source("src/ui/combat-2v2-test-ui.js");
  assert.match(demo,/playbackMode:\s*"hold-last"/);
  assert.match(demo,/releaseHeldAttackPoseFor/);
  assert.match(demo,/hasHeldAttackPoseFor/);
  for(const ui of [one,two])assert.match(ui,/presenter\.endChannelPose\(/);
});
