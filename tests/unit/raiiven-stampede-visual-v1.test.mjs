import test from "node:test";
import assert from "node:assert/strict";
import {playDomStampedeFxV1,stampedePassWindowV1} from "../../src/adapters/renderer/dom-stampede-fx-v1.js";

const config=Object.freeze({passes:3,passDurationMs:1000,gapMs:1800,cloneCount:6});
function dom() {
  const nodes=[];
  const doc={createElement(tag){
    const element={tag,ownerDocument:doc,style:{},dataset:{},className:"",children:[],
      append(...children){this.children.push(...children);},
      remove(){this.removed=true;},
      getBoundingClientRect(){return {left:0,top:0,width:1000,height:400};}};
    nodes.push(element);return element;
  }};
  return {arena:{ownerDocument:doc,append(element){this.node=element;},
    getBoundingClientRect(){return {left:0,top:0,width:1000,height:400};}},nodes};
}
function frame() {
  return {mask:{width:10,height:10,opaque:new Uint8Array(100).fill(1)},
    origin:{x:700,y:100},axisX:{x:800,y:100},axisY:{x:700,y:200}};
}
function harness(targetSlots=["opponent","opponent-b"]){
  const {arena,nodes}=dom(),calls=[],sprites=[],frames=[];
  const animation={currentTime:0,finished:new Promise(()=>{}),cancel(){}};
  const handle=playDomStampedeFxV1({arena,fromSlot:"player",targetSlot:"opponent",
    stampede:config,sourceVisual:{url:"https://assets.example/raiiven-7-frames.png",frameCount:7},
    sourceRect:()=>({left:100,top:0,width:40,height:40}),
    targetRect:()=>({left:700,top:100,width:50,height:50}),targetSlots,
    targetCollisionModelFor:()=>({snapshot:frame}),
    onContact:contact=>{calls.push(contact);return {ok:true};},
    animate:()=>animation,requestFrame(fn){frames.push(fn);return frames.length;},
    cancelFrame(){},applySpriteVisual(node,visual){sprites.push(visual.url);return {frameAnimation:null};}});
  function step(ms){animation.currentTime=ms;const callback=frames.shift();assert.ok(callback);callback();}
  return {handle,calls,sprites,arena,nodes,step};
}

test("3 stampede passes follow the one canonical animation timeline, never repeat in gaps",()=>{
  assert.deepEqual(stampedePassWindowV1(config,500),{index:0,visible:true,progress:0.5});
  assert.equal(stampedePassWindowV1(config,1100).visible,false);
  assert.deepEqual(stampedePassWindowV1(config,3300),{index:1,visible:true,progress:0.5});
  assert.equal(stampedePassWindowV1(config,3900).visible,false);
  assert.equal(stampedePassWindowV1(config,6100).index,2);
  assert.equal(stampedePassWindowV1(config,7000),null);
});

test("six animated shadows reuse ONE canonical sprite URL; only 3 contacts per enemy exist",()=>{
  const g=harness();
  assert.equal(g.sprites.length,6);
  assert.equal(new Set(g.sprites).size,1);
  assert.equal(g.arena.node.children.length,6);
  for(let index=0;index<3;index++){
    g.step(index*2800+500);
    g.step(index*2800+700);
    g.step(index*2800+800);
  }
  assert.equal(g.calls.length,6);
  assert.deepEqual(g.calls.map(x=>x.passIndex),[0,0,1,1,2,2]);
  assert.deepEqual(new Set(g.calls.map(x=>x.targetId)),new Set(["opponent","opponent-b"]));
  assert.ok(g.calls.every(x=>x.waveMultiTarget===true));
  g.handle.stop();
  assert.equal(g.arena.node.removed,true);
});

test("solo stampede reuses the same one-sensor path with only one enemy",()=>{
  const g=harness(["opponent"]);
  for(let index=0;index<3;index++){
    g.step(index*2800+500);g.step(index*2800+700);
  }
  assert.equal(g.calls.length,3);
  assert.deepEqual(g.calls.map(x=>x.passIndex),[0,1,2]);
  g.handle.stop();
});
