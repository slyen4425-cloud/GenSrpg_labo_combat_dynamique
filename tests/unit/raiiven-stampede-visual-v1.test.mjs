import test from "node:test";
import assert from "node:assert/strict";
import {playDomStampedeFxV1,stampedePassWindowV1} from "../../src/adapters/renderer/dom-stampede-fx-v1.js";

const config=Object.freeze({passes:3,passDurationMs:1800,gapMs:600,cloneCount:5});
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
  const {arena,nodes}=dom(),calls=[],sprites=[],frames=[],sourceMotion={style:{opacity:"0.87"}};
  const animation={currentTime:0,finished:new Promise(()=>{}),cancel(){}};
  const handle=playDomStampedeFxV1({arena,fromSlot:"player",targetSlot:"opponent",
    stampede:config,sourceMotion,sourceVisual:{movement:{url:"https://assets.example/raiiven-movement-player-7-frames.png",frameCount:7,assetId:"pack:capture:creature-raiiven-movement-player-7-v1"}},
    sourceRect:()=>({left:100,top:0,width:40,height:40}),
    targetRect:()=>({left:700,top:100,width:50,height:50}),targetSlots,
    targetCollisionModelFor:()=>({snapshot:frame}),
    onContact:contact=>{calls.push(contact);return {ok:true};},
    animate:()=>animation,requestFrame(fn){frames.push(fn);return frames.length;},
    cancelFrame(){},applySpriteVisual(node,visual){sprites.push(visual.url);return {frameAnimation:null};}});
  function step(ms){animation.currentTime=ms;const callback=frames.shift();assert.ok(callback);callback();}
  return {handle,calls,sprites,arena,nodes,sourceMotion,step};
}

test("3 stampede passes follow the one canonical animation timeline, never repeat in gaps",()=>{
  assert.deepEqual(stampedePassWindowV1(config,900),{index:0,visible:true,progress:0.5});
  assert.equal(stampedePassWindowV1(config,2100).visible,false);
  assert.deepEqual(stampedePassWindowV1(config,3300),{index:1,visible:true,progress:0.5});
  assert.equal(stampedePassWindowV1(config,4500).visible,false);
  assert.equal(stampedePassWindowV1(config,6100).index,2);
  assert.equal(stampedePassWindowV1(config,7000),null);
});

test("five equal movement horses include the true caster, with real source restored after the three waves",()=>{
  const g=harness();
  assert.equal(g.arena.node.dataset.stampedePose,"movement");
  assert.equal(g.sourceMotion.style.opacity,"0","the real horse participates in the herd, not stationary behind it");
  assert.equal(g.arena.node.children.filter(x=>x.dataset.stampedeRole==="caster").length,1);
  assert.equal(new Set(g.arena.node.children.map(x=>x.style.width)).size,1);
  assert.ok(new Set(g.arena.node.children.map(x=>x.style.top)).size>=3,"a staggered herd, not a straight line");
  assert.equal(g.sprites.length,0,"atlas starts with native pass, not a second clock");
  assert.equal(g.arena.node.children.length,5);
  for(let index=0;index<3;index++){
    g.step(index*2400+1550);
    g.step(index*2400+1700);
    g.step(index*2400+1790);
  }
  assert.equal(g.sprites.length,15,"one shared official movement atlas on five horses per pass");
  assert.equal(new Set(g.sprites).size,1,"no source atlas duplication");
  assert.equal(g.calls.length,6);
  assert.deepEqual(g.calls.map(x=>x.passIndex),[0,0,1,1,2,2]);
  assert.deepEqual(new Set(g.calls.map(x=>x.targetId)),new Set(["opponent","opponent-b"]));
  assert.ok(g.calls.every(x=>x.waveMultiTarget===true));
  g.handle.stop();
  assert.equal(g.arena.node.removed,true);
  assert.equal(g.sourceMotion.style.opacity,"0.87","the original real creature must be restored after charge");
});

test("solo stampede reuses the same one-sensor path with only one enemy",()=>{
  const g=harness(["opponent"]);
  for(let index=0;index<3;index++){
    g.step(index*2400+1550);g.step(index*2400+1700);
  }
  assert.equal(g.calls.length,3);
  assert.deepEqual(g.calls.map(x=>x.passIndex),[0,1,2]);
  g.handle.stop();
});
