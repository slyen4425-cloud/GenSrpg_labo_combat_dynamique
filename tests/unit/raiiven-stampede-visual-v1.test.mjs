import test from "node:test";
import assert from "node:assert/strict";
import {playDomStampedeFxV1,stampedePassWindowV1} from "../../src/adapters/renderer/dom-stampede-fx-v1.js";
import {composeCreatureMovementPoseV1} from "../../src/adapters/renderer/dom-keyframes.js";

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
function harness(targetSlots=["opponent","opponent-b"],{displayedWidth=null,authoredScale=1,
  authoredMovement=null,authoredAttack=null,arenaScale=1}={}){
  const sourceShadow={style:{opacity:"0.42",translate:"",visibility:""},cloneNode(){return {
    style:{opacity:""},dataset:{},removeAttribute(){}
  };}};
  const sourceFighter={style:{getPropertyValue(name){
    return name==="--creature-display-scale"?String(authoredScale):"";
  }},querySelector(selector){return selector===".fighter__shadow"?sourceShadow:null;}};
  const sourceMotion={style:{opacity:"0.87",translate:""},dataset:{},children:[],
    append(element){this.children.push(element);},
    getBoundingClientRect(){return {left:100,top:0,width:40,height:40};},
    closest(selector){return selector===".fighter"?sourceFighter:null;},
    querySelector(selector){return displayedWidth!=null && selector==="[data-demo-image]"
      ? {getBoundingClientRect(){return {width:displayedWidth,height:displayedWidth}}}:null;}
  };
  const {arena,nodes}=dom(),calls=[],sprites=[],frames=[];
  const movement=authoredMovement??{url:"https://assets.example/raiiven-movement-player-7-frames.png",
    frameCount:7,assetId:"pack:capture:creature-raiiven-movement-player-7-v1"};
  const attack=authoredAttack??{url:"https://assets.example/raiiven-attack-player-5-frames.png",
    frameCount:5,assetId:"pack:capture:creature-raiiven-attack-player-5-v1"};
  const animation={currentTime:0,finished:new Promise(()=>{}),cancel(){}};
  const handle=playDomStampedeFxV1({arena,fromSlot:"player",targetSlot:"opponent",
    stampede:config,sourceMotion,sourceVisual:{movement,attack},
    sourceRect:()=>({left:100,top:0,width:40,height:40}),
    targetRect:()=>({left:700,top:100,width:50,height:50}),targetSlots,
    targetCollisionModelFor:()=>({snapshot:frame}),
    onContact:contact=>{calls.push(contact);return {ok:true};},
    animate:()=>animation,requestFrame(fn){frames.push(fn);return frames.length;},
    cancelFrame(){},applySpriteVisual(node,visual){sprites.push(visual.url);return {frameAnimation:null};},
    authorPixels(_arena,value){return (Number(value)||0)*arenaScale;}});
  function step(ms){animation.currentTime=ms;const callback=frames.shift();assert.ok(callback);callback();}
  return {handle,calls,sprites,arena,nodes,sourceMotion,sourceShadow,movement,attack,step};
}

test("3 stampede passes follow the one canonical animation timeline, never repeat in gaps",()=>{
  assert.deepEqual(stampedePassWindowV1(config,900),{index:0,visible:true,progress:0.5});
  assert.equal(stampedePassWindowV1(config,2100).visible,false);
  assert.deepEqual(stampedePassWindowV1(config,3300),{index:1,visible:true,progress:0.5});
  assert.equal(stampedePassWindowV1(config,4500).visible,false);
  assert.equal(stampedePassWindowV1(config,6100).index,2);
  assert.equal(stampedePassWindowV1(config,7000),null);
});

test("five standard-attack horses include real Raiiven and original following shadow restores after three waves",()=>{
  const g=harness();
  assert.equal(g.arena.node.dataset.stampedePose,"standard-attack");
  assert.equal(g.sourceMotion.style.opacity,"1","the actual horse stays visible in the charge");
  assert.equal(g.arena.node.dataset.stampedeNativeCaster,"true");
  assert.equal(g.arena.node.children.length,4,"only four visual copies, fifth is the REAL actor");
  assert.equal(g.arena.node.children.filter(x=>x.dataset.stampedeRole==="caster").length,0,
    "no projected fake caster");
  assert.equal(g.sourceMotion.dataset.stampedeCasterActive,"true","native actor is the moving caster");
  assert.equal(g.sourceMotion.children.length,1,"one official movement layer on native actor");
  assert.equal(g.sourceShadow.style.opacity,"0.42","do not replace the canonical shadow opacity");
  assert.equal(g.sourceShadow.style.visibility,"hidden","no stationary native shadow before the charge begins");
  assert.ok(g.arena.node.children.every(x=>!x.children.some(n=>n.dataset.stampedeHorseShadow)),
    "no unwanted giant cloned ground shadows under Cavalcade");
  assert.equal(new Set(g.arena.node.children.map(x=>x.style.width)).size,1);
  assert.ok(new Set(g.arena.node.children.map(x=>x.style.top)).size>=3,"a staggered herd, not a straight line");
  assert.equal(g.sprites.length,0,"atlas starts with native pass, not a second clock");
  assert.equal(g.arena.node.children.length,4);
  for(let index=0;index<3;index++){
    g.step(index*2400+1550);
    g.step(index*2400+1700);
    g.step(index*2400+1790);
  }
  assert.equal(g.sprites.length,15,"four clones plus real native movement per pass, always five sprites");
  assert.notEqual(g.sourceMotion.style.translate,"","the real actor physically crosses the battlefield");
  assert.equal(g.sourceShadow.style.translate,g.sourceMotion.style.translate,
    "the ONLY existing shadow travels with the native Raiiven model");
  assert.equal(g.sourceShadow.style.visibility,"visible","the real caster shadow is visible on a charge pass");
  assert.deepEqual([...new Set(g.sprites)],[g.attack.url],
    "all five horses play the STANDARD ATTACK atlas, never the movement atlas");
  assert.equal(g.calls.length,6);
  assert.deepEqual(g.calls.map(x=>x.passIndex),[0,0,1,1,2,2]);
  assert.deepEqual(new Set(g.calls.map(x=>x.targetId)),new Set(["opponent","opponent-b"]));
  assert.ok(g.calls.every(x=>x.waveMultiTarget===true));
  g.handle.stop();
  assert.equal(g.arena.node.removed,true);
  assert.equal(g.sourceMotion.style.opacity,"0.87","the original real creature must be restored after charge");
  assert.equal(g.sourceMotion.style.translate,"","native actor returns to its exact starting position");
  assert.equal(g.sourceMotion.dataset.stampedeCasterActive,undefined,"temporary source motion flag cleaned up");
  assert.equal(g.sourceShadow.style.opacity,"0.42","the original ground shadow must also be restored");
  assert.equal(g.sourceShadow.style.translate,"","original shadow returns to its original offset");
  assert.equal(g.sourceShadow.style.visibility,"","original shadow visibility is restored");
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

test("Cavalcade matches the displayed model size, not the unscaled fighter container",()=>{
  const g=harness(["opponent"],{displayedWidth:92,authoredScale:1.6});
  assert.equal(g.arena.node.children.length,4);
  assert.ok(g.arena.node.children.every(x=>x.style.width==="92px"),
    "every herd image must match the actual 92-pixel displayed character, not its 40-pixel slot");
  g.handle.stop();
});
test("When the standing image is hidden, Cavalcade uses the canonical authored model scale",()=>{
  const g=harness(["opponent"],{authoredScale:1.5});
  assert.ok(g.arena.node.children.every(x=>x.style.width==="60px"),
    "source slot 40 pixels x authored creature scale 1.5 = 60 pixels");
  g.handle.stop();
});

test("Cavalcade passes move the genuine actor rather than hiding it behind a false caster",()=>{
  const g=harness(["opponent"]);
  const actual=g.sourceMotion;
  assert.equal(g.arena.node.children.length,4);
  assert.equal(actual.style.translate,"");
  g.step(900);
  assert.ok(actual.style.translate.endsWith("px"),"actual sourceMotion receives the travel coordinate");
  assert.equal(actual.style.opacity,"1","real fighter is NOT hidden as a substitute ghost runs");
  const layer=actual.children[0];
  assert.equal(layer.className,"skill-fx--stampede-caster");
  assert.equal(layer.children.length,1,"actual source carries one authored motion atlas");
  g.handle.stop();
  assert.equal(layer.removed,true,"native combat image restored after charge");
});

test("Cavalcade shares the native attack/movement pose: original and four copies inherit author scale and XY, with only herd lane offsets",()=>{
  const movement={
    url:"https://assets.example/authored-horse-back-movement.webp",
    frameCount:7,displayScale:1.35,offsetX:14,offsetY:-22
  };
  const g=harness(["opponent"],{authoredMovement:{url:"https://assets.example/different-running.webp",frameCount:7},
    authoredAttack:movement,arenaScale:1.5});
  const expected=composeCreatureMovementPoseV1({
    arena:g.arena,visual:movement,authorPixels:(_arena,value)=>Number(value)*1.5
  });
  assert.equal(expected,"translate(21px, -33px) scale(1.35)");
  g.step(900);
  assert.equal(g.sourceMotion.children.length,1);
  const nativeLayer=g.sourceMotion.children[0].children[0];
  assert.equal(nativeLayer.style.transform,expected,
    "real source actor applies exactly the standard authored movement scale/X/Y");
  assert.equal(g.arena.node.children.length,4);
  for(const ghost of g.arena.node.children){
    assert.equal(ghost.children[0].style.transform,expected,
      "all four copies reuse the same standard appearance pose without their own size rules");
  }
  assert.ok(new Set(g.arena.node.children.map(node=>node.style.top)).size>=3,
    "only herd lane staggering differs between copies");
  g.handle.stop();
});
test("Opponent/front movement can have its own native 0.8 scale and positive Y offset",()=>{
  const g=harness(["opponent"],{authoredAttack:{
    url:"https://assets.example/horse-front-attack.webp",frameCount:5,
    displayScale:0.8,offsetX:-5,offsetY:32
  }});
  g.step(900);
  const native=g.sourceMotion.children[0].children[0];
  assert.equal(native.style.transform,"translate(-5px, 32px) scale(0.8)");
  assert.ok(g.arena.node.children.every(ghost=>
    ghost.children[0].style.transform===native.style.transform));
  g.handle.stop();
});

test("Cavalcade native shadow never stays at the departure point or duplicates on ghosts",()=>{
  const g=harness(["opponent"]);
  g.step(900);
  const moved=g.sourceMotion.style.translate;
  assert.notEqual(moved,"");
  assert.equal(g.sourceShadow.style.translate,moved);
  assert.equal(g.sourceShadow.style.visibility,"visible");
  assert.equal(g.arena.node.children.filter(ghost=>ghost.children.some(c=>
    c.dataset?.stampedeHorseShadow)).length,0,"never create ghost ground shadows");
  g.step(2100);
  assert.equal(g.sourceShadow.style.visibility,"hidden","shadow vanishes during the gap");
  g.step(3300);
  assert.equal(g.sourceShadow.style.visibility,"visible","shadow follows the return pass");
  assert.equal(g.sourceShadow.style.translate,g.sourceMotion.style.translate);
  g.handle.stop();
  assert.equal(g.sourceShadow.style.translate,"");
  assert.equal(g.sourceShadow.style.visibility,"");
});
test("Cavalcade never mirrors the official front/back attack atlas based on target travel direction",()=>{
  const g=harness(["opponent"]);
  assert.ok(g.arena.node.children.every(ghost=>ghost.style.transform==="none"));
  g.handle.stop();
});
