import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";

const authored=JSON.parse(readFileSync(new URL("../../data/capture/showcase/pique_glace.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft.presentation;
const iceAsset="pack:capture:sprite-pointe-glace-01";
function presentation(travel={}) {
  const binding={...authored,visual:{...authored.visual,travel:{...authored.visual.travel,...travel}}};
  const assets=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{pique_glace:binding},
    assetForId:id=>({assetId:id,url:"https://example.invalid/ice-spike.png"})
  });
  return assets.presentationForSkill("pique_glace",{fxType:"channel-pulse",targetView:"player"});
}
function fakeElement(rect={left:0,top:0,width:20,height:20}) {
  return {style:{},dataset:{},className:"",ownerDocument:null,children:[],
    append(child){this.children.push(child);},
    remove(){},
    // DOMRect exposes bottom/right even when a test only supplies left/top/size.
    getBoundingClientRect(){return {...rect,right:rect.left+rect.width,bottom:rect.top+rect.height};}
  };
}
function pulse(travel) {
  const arena=fakeElement({left:0,top:0,width:400,height:240});
  arena.ownerDocument={createElement(){const el=fakeElement();el.ownerDocument=arena.ownerDocument;return el;}};
  const target=fakeElement({left:210,top:90,width:60,height:90});
  const animations=[];
  const renderer=createDomSkillFxRenderer({
    arena,anchors:{enemy:target},targetAnchors:{enemy:target},
    presentationForSkill(){return {travel,travelLayer:"front"};},
    animate(node,frames,options){animations.push({node,frames,options});
      return {finished:new Promise(()=>{}),cancel(){}};
    },
    requestFrame(){return null;},cancelFrame(){}
  });
  renderer.play({type:"channel-pulse",skillId:"pique_glace",fromSlot:"enemy",targetSlot:"enemy",durationMs:1000});
  return {animations,arena,renderer};
}
test("RED: V14 fixed and offsets survive the real presentation asset adapter",()=>{
  const actual=presentation({groundMotion:"fixed",groundOffsetXPx:9,groundOffsetYPx:15,groundRisePx:80});
  assert.equal(actual.travel.trajectoryMode,"under_target");
  assert.equal(actual.travel.groundMotion,"fixed");
  assert.equal(actual.travel.groundOffsetXPx,9);
  assert.equal(actual.travel.groundOffsetYPx,15);
  assert.equal(actual.travel.groundRisePx,80);
});
test("RED: fixed ground-channel pulse keeps identical keyframes at target feet",()=>{
  const fx=pulse(presentation({groundMotion:"fixed",groundOffsetXPx:9,groundOffsetYPx:15}).travel);
  const pulseNode=fx.arena.children.find(node=>node.dataset.skillFx==="channel-pulse");
  assert.equal(pulseNode.style.left,"249px");
  assert.equal(pulseNode.style.top,"195px");
  const frames=fx.animations.at(-1).frames;
  assert.equal(frames[0].transform,frames.at(-1).transform);
  assert.equal(frames[0].opacity,frames.at(-1).opacity);
  fx.renderer.dispose();
});
test("RED: rising channel pulse still honors its authored rise amount",()=>{
  const fx=pulse(presentation({groundMotion:"rise",groundOffsetYPx:15,groundRisePx:110}).travel);
  const frames=fx.animations.at(-1).frames;
  assert.match(frames[0].transform,/110px/);
  assert.notEqual(frames[0].transform,frames.at(-1).transform);
  fx.renderer.dispose();
});
test("older V10 presentations are not converted to V14 movement",()=>{
  const {sourceVersion:_src,...base}=authored;
  const {groundMotion:_motion,groundOffsetXPx:_x,groundOffsetYPx:_y,groundRisePx:_rise,...oldTravel}=base.visual.travel;
  const original=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{pique_glace:{...base,version:10,visual:{...base.visual,travel:oldTravel}}},
    assetForId:id=>({assetId:id,url:"https://example.invalid/ice-spike.png"})
  });
  assert.equal(original.presentationForSkill("pique_glace").travel.groundMotion,undefined);
});
