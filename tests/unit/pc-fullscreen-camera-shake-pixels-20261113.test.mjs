import test from "node:test";
import assert from "node:assert/strict";
import {
  cameraShakeTimelineV1,desktopFullscreenCameraDprV1,createDomCameraFxRenderer
} from "../../src/adapters/renderer/dom-camera-fx.js";

function scene({fullscreen=true,fine=true,dpr=1.25}={}){
  const view={
    devicePixelRatio:dpr,
    matchMedia(query){
      assert.match(query,/min-width: 1100px/);
      assert.match(query,/pointer: fine/);
      return {matches:fine};
    }
  };
  return {ownerDocument:{fullscreenElement:fullscreen?{}:null,defaultView:view}};
}
test("only fullscreen fine-pointer PC selects device-pixel stabilization",()=>{
  assert.equal(desktopFullscreenCameraDprV1(scene()),1.25);
  assert.equal(desktopFullscreenCameraDprV1(scene({fullscreen:false})),0);
  assert.equal(desktopFullscreenCameraDprV1(scene({fine:false})),0);
  assert.equal(desktopFullscreenCameraDprV1({}),0);
});
test("camera shakes keep legacy animation outside fullscreen, snap only physical pixels on PC",()=>{
  const plan={type:"camera-shake",amplitudePx:9,durationMs:210};
  const legacy=cameraShakeTimelineV1(plan);
  const snapped=cameraShakeTimelineV1(plan,{devicePixelRatio:1.25});
  assert.equal(legacy.durationMs,snapped.durationMs);
  assert.equal(legacy.keyframes.length,snapped.keyframes.length);
  assert.equal(legacy.keyframes[1].transform,"translate3d(9px, 3.15px, 0)");
  assert.equal(snapped.keyframes[1].transform,"translate3d(8.8px, 3.2px, 0)");
  const seq={...plan,sequence:[
    {pauseMs:0,amplitudePx:9,durationMs:210},
    {pauseMs:180,amplitudePx:15,durationMs:330}
  ]};
  const base=cameraShakeTimelineV1(seq);
  const pc=cameraShakeTimelineV1(seq,{devicePixelRatio:1.25});
  assert.equal(pc.durationMs,base.durationMs);
  assert.deepEqual(pc.keyframes.map(k=>k.offset),base.keyframes.map(k=>k.offset));
});
test("real renderer uses pixel snapping only in PC fullscreen, not embedded combat",async()=>{
  const frames=[];
  const renderer=createDomCameraFxRenderer({
    element:scene(),
    animate:(element,keyframes,options)=>{
      frames.push({keyframes,options});
      return {finished:Promise.resolve(),cancel(){}};
    }
  });
  const active=renderer.play({type:"camera-shake",amplitudePx:9,durationMs:210});
  assert.equal(active.status,"running");
  assert.equal(frames[0].keyframes[1].transform,"translate3d(8.8px, 3.2px, 0)");
  assert.equal(frames[0].options.duration,210);
  await active.finished;
  renderer.dispose();
});
