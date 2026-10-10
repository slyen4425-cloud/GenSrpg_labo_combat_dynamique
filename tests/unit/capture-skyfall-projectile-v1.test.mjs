import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillPresentationBinding } from "../../src/contracts/skill-presentation-binding.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";

const assetId = "user:rockfall-projectile";
const binding = (mode = "skyfall") => ({
  id:"skill:rockfall", version:10, subjectType:"skill",subjectId:"rockfall",
  visual:{travel:{
    assetId,attachment:"trajectory",trigger:"travel-start",
    displayScale:1.5,playbackMode:"loop",layerByView:{player:"front",opponent:"behind"},
    trajectoryMode:mode,fallHeightPx:440,fallOffsetXPx:50
  }},audio:{}
});

test("V10 skyfall normalizes and roundtrips authored trajectory data, rejecting invalid ranges",()=>{
  const normalized=normalizeSkillPresentationBinding(binding());
  assert.equal(normalized.version,10);
  assert.deepEqual({
    mode:normalized.visual.travel.trajectoryMode,
    height:normalized.visual.travel.fallHeightPx,
    drift:normalized.visual.travel.fallOffsetXPx
  },{mode:"skyfall",height:440,drift:50});
  assert.equal(normalizeSkillPresentationBinding(JSON.parse(JSON.stringify(normalized))).visual.travel.fallHeightPx,440);
  for(const bad of [{fallHeightPx:-1},{fallHeightPx:10000},{fallOffsetXPx:900},{trajectoryMode:"homing"}]){
    const input=binding();Object.assign(input.visual.travel,bad);
    assert.throws(()=>normalizeSkillPresentationBinding(input));
  }
  const incorrect=binding();incorrect.visual.cast={assetId,attachment:"source",trigger:"preparation-start",fallHeightPx:200};
  assert.throws(()=>normalizeSkillPresentationBinding(incorrect),"only the travel slot owns fall geometry");
});

test("presentation resolver passes skyfall geometry alongside sprite asset and legacy route defaults",()=>{
  const presentation=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{rockfall:binding()},
    assetForId:()=>({url:"data:image/png;base64,AA==",frameCount:1,coreAnchor:{x:0.5,y:0.5}})
  }).presentationForSkill("rockfall",{sourceView:"player",targetView:"opponent",fxType:"projectile"});
  assert.equal(presentation.travel.trajectoryMode,"skyfall");
  assert.equal(presentation.travel.fallHeightPx,440);
  assert.equal(presentation.travel.fallOffsetXPx,50);
  assert.equal(presentation.travel.displayScale,1.5);
  assert.equal(presentation.travel.playbackMode,"loop");
});

function node(rect={left:0,top:0,width:80,height:80}){
  return {
    style:{},dataset:{},className:"",children:[],
    append(child){this.children.push(child);},
    remove(){this.removed=true;},
    getBoundingClientRect(){return rect;}
  };
}
function flight(visual){
  const animations=[],nodes=[];
  const arena=node({left:0,top:0,width:900,height:600});
  arena.ownerDocument={createElement(){return node();}};
  arena.append=function(n){nodes.push(n)};
  const anchors={
    player:node({left:60,top:370,width:80,height:80}),
    opponent:node({left:620,top:280,width:80,height:80})
  };
  const renderer=createDomSkillFxRenderer({
    arena,anchors,targetAnchors:anchors,
    presentationForSkill:()=>({travel:visual,travelLayer:"front"}),
    animate(_el,keyframes,options){animations.push({keyframes,options});return {finished:new Promise(()=>{}),cancel(){}}}
  });
  const result=renderer.play({type:"projectile",skillId:"rockfall",fromSlot:"player",targetSlot:"opponent",durationMs:850});
  return {animations,nodes,result,renderer};
}

test("skyfall starts above target, lands at target, no caster-origin movement or extra timer",()=>{
  const f=flight({assetId,url:"data:image/png;base64,AA==",frameCount:1,displayScale:1.5,coreAnchor:{x:0.5,y:0.5},trajectoryMode:"skyfall",fallHeightPx:440,fallOffsetXPx:50});
  assert.equal(f.nodes.length,1);
  assert.equal(f.nodes[0].style.left,"710px");
  assert.equal(f.nodes[0].style.top,"-120px");
  const animation=f.animations[0];
  assert.equal(animation.options.duration,850);
  assert.match(animation.keyframes.at(-1).transform,/translate3d\(-50px, 440px, 0\)/);
  assert.equal(f.result.status,"running");
  f.renderer.dispose();
});

test("legacy linear projectile retains caster origin and standard trajectory",()=>{
  const f=flight({assetId,url:"data:image/png;base64,AA==",frameCount:1,displayScale:1.5,coreAnchor:{x:0.5,y:0.5}});
  assert.equal(f.nodes[0].style.left,"100px");
  assert.equal(f.nodes[0].style.top,"410px");
  assert.match(f.animations[0].keyframes.at(-1).transform,/translate3d\(560px, -90px, 0\)/);
  f.renderer.dispose();
});

test("Capture editor exposes skyfall controls with preservation in load/new/save/export paths",async()=>{
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const ui=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  for(const key of ["trajectory-mode","fall-height","fall-offset-x"]){
    assert.match(html,new RegExp("data-skill-"+key));
    assert.match(ui,new RegExp("data-skill-"+key));
  }
  assert.match(ui,/travelTrajectoryMode:\s*travel\?\.trajectoryMode/);
  assert.match(ui,/travel\.trajectoryMode\s*=\s*"skyfall"/);
  assert.match(ui,/presentation\.travelTrajectoryMode/);
  assert.match(ui,/presentation\.fallHeightPx/);
  assert.match(ui,/presentation\.fallOffsetXPx/);
});
