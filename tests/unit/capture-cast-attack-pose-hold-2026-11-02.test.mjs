import test from "node:test";
import assert from "node:assert/strict";
import {createCombatResolutionPresenter} from "../../src/adapters/renderer/combat-resolution-presenter.js";

function action(mode) {
  const skill={id:mode+"-test",name:mode,form:"projectile",approachMode:"none"};
  if(mode==="channel") skill.channeling={tickIntervalMs:1000,maxTicks:4};
  if(mode==="charge") skill.chargedAttack={maxCharges:4};
  return {actionType:"skill",actorId:"player",targetId:"opponent",skill,
    preparationMs:500,releaseAtMs:1500,travelMs:200,
    ...(mode==="charge"?{chargeState:{chargeCount:1,sizeMultiplier:1}}:{})};
}
function harness(poseAvailable=true){
  const events=[];
  const visuals={
    playEventFor(actor,type){events.push(["attack-event",actor,type]);return Promise.resolve({status:"finished"});},
    cancelFor(actor){events.push(["cancel-actor",actor]);},
    holdAttackPoseFor(actor){
      events.push(["hold",actor]);
      if(!poseAvailable)return {status:"ignored"};
      return {status:"holding",cancel(){events.push(["release-hold",actor]);}};
    }
  };
  return {events,presenter:createCombatResolutionPresenter({visuals,instantAttackAnticipationMs:0})};
}
test("charged attack pose plays once, holds through preparation and releases without replay on launch",()=>{
  const h=harness(),a=action("charge");
  h.presenter.presentPreparation({action:a,actorSlot:"player"});
  assert.deepEqual(h.events,[["hold","player"]]);
  h.presenter.presentChargeAmplification({actorSlot:"player",sizeMultiplier:1.2,durationMs:900});
  assert.deepEqual(h.events,[["hold","player"]],"repeated charge progress cannot restart pose");
  h.presenter.presentRelease({action:a,actorSlot:"player",targetSlot:"opponent"});
  assert.deepEqual(h.events,[["hold","player"],["release-hold","player"]]);
  h.presenter.dispose();
});
test("channeled pose stays held after release and until native channel end",()=>{
  const h=harness(),a=action("channel");
  h.presenter.presentPreparation({action:a,actorSlot:"player"});
  h.presenter.presentRelease({action:a,actorSlot:"player",targetSlot:"opponent"});
  assert.deepEqual(h.events,[["hold","player"]],"release starts ticks, not pose cancellation");
  assert.equal(h.presenter.finishChannelPresentation("player"),true);
  assert.deepEqual(h.events,[["hold","player"],["release-hold","player"]]);
  assert.equal(h.presenter.finishChannelPresentation("player"),false,"idempotent native end");
  h.presenter.dispose();
});
test("interruption and dispose release held attack without cancelling unrelated fighter channels",()=>{
  const h=harness();
  h.presenter.presentPreparation({action:action("charge"),actorSlot:"player"});
  assert.equal(h.presenter.cancelActionPresentation("player"),true);
  assert.deepEqual(h.events,[["hold","player"],["release-hold","player"]]);
  h.presenter.presentPreparation({action:action("channel"),actorSlot:"player"});
  h.presenter.dispose();
  assert.deepEqual(h.events.slice(-2),[["hold","player"],["release-hold","player"]]);
  assert.ok(!h.events.some(e=>e[0]==="cancel-actor"));
});
test("absence of authored attack sprite preserves normal one-shot attack on release",()=>{
  const h=harness(false),a=action("charge");
  h.presenter.presentPreparation({action:a,actorSlot:"player"});
  h.presenter.presentRelease({action:a,actorSlot:"player",targetSlot:"opponent"});
  assert.deepEqual(h.events,[["hold","player"],["attack-event","player","attack"]]);
  h.presenter.dispose();
});
test("ordinary projectile has no held pose and still uses normal attack animation",()=>{
  const h=harness(),a=action("normal");
  h.presenter.presentPreparation({action:a,actorSlot:"player"});
  h.presenter.presentRelease({action:a,actorSlot:"player",targetSlot:"opponent"});
  assert.deepEqual(h.events,[["attack-event","player","attack"]]);
  h.presenter.dispose();
});
