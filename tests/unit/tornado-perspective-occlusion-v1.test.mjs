import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillPresentationBinding } from "../../src/contracts/skill-presentation-binding.js";
import { buildHumanSkillDraftV1, humanSkillEditorFieldsFromDraftV1 } from "../../src/ui/capture-editor-human-v2.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { exportCaptureSkillTransferJsonV1, importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const id = "user:wind-tornado";
const base = {
  id:"tornado-occlusion",name:"Tornade profondeur",description:"Essai animation et calques",requiredLevel:1,usageScopes:["capture","combat"],
  category:"offensive",form:"projectile",element:"air",approachMode:"none",energyCost:2,
  preparationMs:100,travelMs:2500,recoveryMs:0,cooldownMs:0,
  allowedDistances:["short","medium","long"],targetRelations:["enemy"],
  damage:0,heal:0,stunMs:0,effects:[{kind:"damage",targetScope:"target",channel:"air",amount:45}]
};
function draft(extra = {}) { return buildHumanSkillDraftV1({...base,presentation:{
  travelAssetId:id,travelDisplayScale:5,travelPlaybackMode:"loop",
  travelFrameSpeedMultiplier:1.5,travelPerspectiveAmount:0.5,
  travelLayerPlayer:"behind",travelLayerOpponent:"behind",
  ...extra
}}); }
function element(rect={left:0,top:0,width:80,height:80}) {
  return {className:"",style:{},dataset:{},children:[],append(child){this.children.push(child)},remove(){this.removed=true},getBoundingClientRect(){return rect}};
}
function playWithActualPipeline(d,fromSlot="player",targetSlot="opponent") {
  const calls=[],nodes=[];
  const doc={createElement:()=>element()};
  const arena=element({left:0,top:0,width:900,height:500});
  arena.ownerDocument=doc;arena.append=node=>nodes.push(node);
  const anchors={player:element({left:70,top:310,width:80,height:80}),opponent:element({left:720,top:125,width:80,height:80})};
  const projection=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{[d.id]:d.presentation},
    assetForId:()=>({url:"/wind.png",frameCount:8,frameMs:100,coreAnchor:{x:0.5,y:0.5}})
  });
  const renderer=createDomSkillFxRenderer({arena,anchors,targetAnchors:anchors,
    presentationForSkill:(id,context)=>projection.presentationForSkill(id,context),
    animate(node,keyframes,options){const result={node,keyframes,options,finished:new Promise(()=>{}),cancel(){}};calls.push(result);return result;}
  });
  renderer.play({type:"projectile",skillId:d.id,fromSlot,targetSlot,durationMs:d.definition.travelMs});
  return {calls,nodes,renderer,projection};
}

test("V12 validates far size & arrival layer, preserving old V11 limits and other visual slots",()=>{
  const d=draft({travelFarScaleRatio:0.25,travelArrivalLayer:"front"});
  assert.equal(d.presentation.version,12);
  const binding=normalizeSkillPresentationBinding(d.presentation);
  assert.equal(binding.visual.travel.farScaleRatio,0.25);
  assert.equal(binding.visual.travel.arrivalLayer,"front");
  assert.equal(binding.visual.travel.perspectiveAmount,0.5);
  for (const [prop,val] of [["farScaleRatio",0],["farScaleRatio",1.2],["arrivalLayer","center"]]) {
    const raw=JSON.parse(JSON.stringify(d.presentation));raw.visual.travel[prop]=val;
    assert.throws(()=>normalizeSkillPresentationBinding(raw),/farScaleRatio|arrivalLayer/);
  }
  const raw=JSON.parse(JSON.stringify(d.presentation));
  raw.visual.cast={assetId:id,attachment:"source",trigger:"preparation-start",farScaleRatio:0.25};
  assert.throws(()=>normalizeSkillPresentationBinding(raw));
});

test("new settings survive UI draft roundtrip and skill transfer JSON",()=>{
  const d=draft({travelFarScaleRatio:0.25,travelArrivalLayer:"front"});
  const imported=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(d));
  assert.deepEqual(imported.value.draft,d);
  const form=humanSkillEditorFieldsFromDraftV1(d);
  assert.equal(form.presentation.travelFarScaleRatio,0.25);
  assert.equal(form.presentation.travelArrivalLayer,"front");
  assert.deepEqual(buildHumanSkillDraftV1(form),d);
});

test("near -> far projectile shrinks visibly to 25% before hit and crosses in front of target",()=>{
  const f=playWithActualPipeline(draft({travelFarScaleRatio:0.25,travelArrivalLayer:"front"}));
  const flight=f.calls.find(x=>x.node.className.includes("projectile"));
  assert.equal(flight.options.duration,2500);
  assert.equal(flight.keyframes[0].zIndex,"2");
  assert.equal(flight.keyframes.at(-1).zIndex,"7");
  assert.ok(flight.keyframes.some(x=>x.offset===0.38 && x.zIndex==="7"),"layer transition before arrival");
  assert.match(flight.keyframes[0].transform,/scale\(4\.7\)/);
  assert.match(flight.keyframes.at(-1).transform,/scale\(1\.225\)/);
  f.renderer.dispose();
});

test("far -> near projectile grows and uses the same behind-to-front transition",()=>{
  const f=playWithActualPipeline(draft({travelFarScaleRatio:0.25,travelArrivalLayer:"front"}),"opponent","player");
  const flight=f.calls.find(x=>x.node.className.includes("projectile"));
  assert.match(flight.keyframes[0].transform,/scale\(1\.175\)/);
  assert.match(flight.keyframes.at(-1).transform,/scale\(4\.9\)/);
  assert.equal(flight.keyframes.at(-1).zIndex,"7");
  f.renderer.dispose();
});

test("legacy V11 keeps exactly three transform frames and its static behind layer",()=>{
  const d=draft();assert.equal(d.presentation.version,11);
  const f=playWithActualPipeline(d);
  const flight=f.calls.find(x=>x.node.className.includes("projectile"));
  assert.equal(flight.keyframes.length,3);
  assert.equal(flight.keyframes[0].zIndex,undefined);
  assert.equal(flight.keyframes.at(-1).zIndex,undefined);
  assert.equal(f.nodes[0].className.includes("layer-behind"),true);
  f.renderer.dispose();
});

test("Tornado imported showcase is the user's skill with stronger far scale but unchanged damage and audio",async()=>{
  const skillPath="data/capture/showcase/cap_air_atk_4.capture-skill-transfer-v1.json";
  assert.ok(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.includes(skillPath));
  const file=JSON.parse(await readFile(new URL("../../"+skillPath,import.meta.url),"utf8"));
  assert.equal(file.draft.id,"cap_air_atk_4");
  assert.equal(file.draft.definition.effects[0].amount,45);
  assert.equal(file.draft.definition.travelMs,2500);
  assert.equal(file.draft.presentation.visual.travel.farScaleRatio,0.5);
  assert.equal(file.draft.presentation.visual.travel.arrivalLayer,"front");
  assert.equal(file.draft.presentation.visual.travel.frameSpeedMultiplier,1.5);
  assert.equal(file.draft.presentation.visual.cast.opacity,0.7);
  assert.equal(file.draft.presentation.visual.impact.opacity,0.6);
  normalizeSkillPresentationBinding(file.draft.presentation);
});

test("new editor controls exist for depth ratio and arrival layer",async()=>{
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const ui=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  for (const key of ["travel-far-scale","travel-arrival-layer"]) {
    assert.match(html,new RegExp("data-skill-"+key));
    assert.match(ui,new RegExp("data-skill-"+key));
  }
});
