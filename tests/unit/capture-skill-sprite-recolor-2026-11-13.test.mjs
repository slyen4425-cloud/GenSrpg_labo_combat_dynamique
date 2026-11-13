import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {applySpriteVisual} from "../../src/adapters/renderer/dom-skill-fx.js";
import {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {skillSpriteRecolorFromFieldsV1} from "../../src/ui/capture-editor-sprite-controls-v1.js";

async function original() {
  const text = await readFile(new URL("../../data/capture/showcase/vyrame-crocs-du-voile.capture-skill-transfer-v1.json", import.meta.url),"utf8");
  return JSON.parse(text).draft;
}
test("V15 recolors a single skill without mutating canonical assets or previous V9",async()=>{
  const draft=await original();
  const old=normalizeSkillPresentationBinding(draft.presentation);
  const colorized={
    ...draft.presentation,version:15,recolorBaseVersion:9,
    visual:{
      ...draft.presentation.visual,
      cast:{...draft.presentation.visual.cast,recolor:{hueRotateDeg:245,saturationPct:165}},
      impact:{...draft.presentation.visual.impact,recolor:{hueRotateDeg:85,saturationPct:70}}
    }
  };
  const v15=normalizeSkillPresentationBinding(colorized);
  assert.equal(v15.version,15);
  assert.equal(v15.recolorBaseVersion,9);
  assert.deepEqual(v15.visual.cast.recolor,{hueRotateDeg:245,saturationPct:165});
  assert.equal(v15.visual.impact.recolor.saturationPct,70);
  assert.equal(old.visual.cast.recolor,undefined);
  assert.deepEqual(v15.visual.cast.assetId,old.visual.cast.assetId);
  assert.equal(draft.presentation.visual.cast.recolor,undefined);
  assert.throws(()=>normalizeSkillPresentationBinding({...draft.presentation,visual:{...draft.presentation.visual,cast:colorized.visual.cast}}),/unknown field/i);
  const resolver=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{[draft.id]:colorized},
    assetForId:(id)=>({url:"/asset/"+id+".png",frameCount:1,frameMs:80})
  });
  const view=resolver.presentationForSkill(draft.id,{view:"player"});
  assert.deepEqual(view.cast.recolor,{hueRotateDeg:245,saturationPct:165});
  assert.deepEqual(view.impact.recolor,{hueRotateDeg:85,saturationPct:70});
  const node={className:"skill-fx",dataset:{},style:{}};
  const applied=applySpriteVisual(node,view.cast,250);
  assert.equal(applied.bound,true);
  assert.match(node.style.filter,/hue-rotate\(245deg\) saturate\(165%\)/);
  assert.ok(!node.style.filter.includes("brightness(0)"));
});
test("V15 rejects invalid ranges and unknown roles",async()=>{
  const d=await original();const slot=d.presentation.visual.cast;
  const mk=(recolor,role="cast")=>normalizeSkillPresentationBinding({
    ...d.presentation,version:15,recolorBaseVersion:9,
    visual:{...d.presentation.visual,[role]:{...slot,recolor}}
  });
  for(const hue of [-1,361,NaN,Infinity]) assert.throws(()=>mk({hueRotateDeg:hue,saturationPct:100}),/hueRotateDeg/);
  for(const saturation of [-1,201,Infinity]) assert.throws(()=>mk({hueRotateDeg:50,saturationPct:saturation}),/saturationPct/);
  assert.throws(()=>mk({hueRotateDeg:60,saturationPct:100,unknown:true}),/unknown field/);
  assert.throws(()=>mk({hueRotateDeg:30},"icon"),/unavailable/);
  assert.throws(()=>normalizeSkillPresentationBinding({...d.presentation,version:15,recolorBaseVersion:15}),/recolorBaseVersion/);
  assert.deepEqual(skillSpriteRecolorFromFieldsV1(0,100),null);
  assert.deepEqual(skillSpriteRecolorFromFieldsV1(360,0),{hueRotateDeg:360,saturationPct:0});
});
test("author editor round-trips V15 colorization across stage controls",async()=>{
  const originalDraft=await original();
  const fields=humanSkillEditorFieldsFromDraftV1(originalDraft);
  fields.presentation.castHueDeg=280;
  fields.presentation.castSaturationPct=160;
  fields.presentation.impactHueDeg=90;
  fields.presentation.impactSaturationPct=90;
  const changed=buildHumanSkillDraftV1(fields);
  assert.equal(changed.presentation.version,15);
  assert.equal(changed.presentation.visual.cast.recolor.hueRotateDeg,280);
  assert.equal(changed.presentation.visual.impact.recolor.saturationPct,90);
  const restored=humanSkillEditorFieldsFromDraftV1(changed);
  assert.equal(restored.presentation.castHueDeg,280);
  assert.equal(restored.presentation.impactHueDeg,90);
  const rebuilt=buildHumanSkillDraftV1(restored);
  assert.deepEqual(rebuilt.presentation.visual.cast.recolor,changed.presentation.visual.cast.recolor);
  assert.equal(rebuilt.presentation.visual.cast.assetId,originalDraft.presentation.visual.cast.assetId);
});
test("editor exposes controls for all four stages",async()=>{
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  for(const stage of ["cast","travel","impact","zone"]){
    assert.ok(html.includes("data-skill-"+stage+"-hue-deg"),stage+" hue");
    assert.ok(html.includes("data-skill-"+stage+"-saturation-pct"),stage+" saturation");
  }
});
