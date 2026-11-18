import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {createDomStatusFxRenderer} from "../../src/adapters/renderer/dom-status-fx.js";

const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const skill=JSON.parse(read("data/capture/showcase/ephemus-chrysalide-fantome.capture-skill-transfer-v1.json")).draft;
function presentation(visual) {
 return normalizeSkillPresentationBinding({
  id:"skill:translucent",subjectType:"skill",subjectId:"translucent",
  version:3,visual:{},audio:{},statusVisuals:{phase:visual}
 });
}
function node(){
 return {dataset:{},style:{setProperty(k,v){this[k]=v},removeProperty(k){delete this[k]}},
  append(){},remove(){},ownerDocument:{createElement(){return node()}}};
}
const state=(...statuses)=>({elapsedMs:0,fighters:{player:{statusEffects:
 statuses.map(id=>({definition:{id,polarity:"beneficial"},sourceSkillId:"translucent"}))}}});

test("optional modelOpacity normalizes only appearance; previous status JSON remains unchanged",()=>{
 assert.equal(presentation({mode:"none",modelOpacity:0.15}).statusVisuals.phase.modelOpacity,0.15);
 assert.equal("modelOpacity" in presentation({mode:"none"}).statusVisuals.phase,false);
 for(const wrong of [-0.01,1.1,Number.POSITIVE_INFINITY])
   assert.throws(()=>presentation({mode:"none",modelOpacity:wrong}),/modelOpacity/);
 const p=presentation({mode:"none",modelOpacity:0});
 assert.equal(p.statusVisuals.phase.modelOpacity,0);
});

test("real skill presentation adapter preserves modelOpacity without requiring sprite or tint",()=>{
 const a=createCaptureSkillPresentationAssetsV2({skillPresentations:{
  translucent:presentation({mode:"none",modelOpacity:0.15})
 },assetForId:()=>null});
 assert.equal(a.statusPresentationFor("phase",{sourceSkillId:"translucent"}).modelOpacity,0.15);
});

test("Status FX applies most transparent live native status then restores model without touching collision or HUD",()=>{
 const motion=node(),image=node(),other=node();
 const renderer=createDomStatusFxRenderer({
  targetFor:()=>({motion,image}),
  statusPresentationFor:id=>id==="phase"?{mode:"none",modelOpacity:0.15}:
   id==="other"?{mode:"none",modelOpacity:0.35}:null
 });
 renderer.sync(state("phase","other"));
 assert.equal(motion.style["--creature-status-model-opacity"],"0.15");
 assert.equal(image.style.opacity,undefined);
 assert.equal(other.style.opacity,undefined);
 renderer.sync(state("other"));
 assert.equal(motion.style["--creature-status-model-opacity"],"0.35");
 renderer.sync(state());
 assert.equal(motion.style["--creature-status-model-opacity"],undefined);
 renderer.sync(state("phase"));
 renderer.dispose();
 assert.equal(motion.style["--creature-status-model-opacity"],undefined);
});

test("Éphémus Chrysalide alone turns original model quasi-transparent for native 10s immaterial status",()=>{
 const status=skill.definition.effects.find(e=>e.kind==="apply_status").status;
 assert.equal(status.kind,"immunity");
 assert.equal(status.intangible,true);
 assert.equal(status.durationMs,10000);
 assert.equal(skill.presentation.statusVisuals[status.id].modelOpacity,0.15);
 assert.equal(skill.presentation.statusVisuals[status.id].mode,"none");
 assert.equal(skill.presentation.visual.cast.assetId,"pack:capture:sprite-skill-ephemus-chrysalide-fantome-v1");
});

test("editor and CSS apply opacity to standing and moving model independently of collision and FX",()=>{
 const ui=read("src/ui/capture-editor-human-v2.js");
 const css=read("examples/dom-demo/demo.css");
 assert.match(ui,/skillStatusModelOpacity/);
 assert.match(ui,/data-skill-status-model-opacity/);
 assert.match(css,/\.fighter__image\s*\{[^}]*opacity:\s*var\(--creature-status-model-opacity, 1\)/s);
 assert.match(css,/\[data-creature-movement-visual\]\s*>\s*\.skill-fx\s*\{[^}]*opacity:\s*var\(--creature-status-model-opacity, 1\)/s);
 assert.doesNotMatch(read("src/contracts/status-effect-v1.js"),/modelOpacity/);
});
