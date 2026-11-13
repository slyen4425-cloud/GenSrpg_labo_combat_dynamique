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

test("colorization sliders reuse the four original authoring fields and are visual/touch-first", async()=>{
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const css=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
  for (const role of ["cast","travel","impact","zone"]) {
    for (const channel of ["hue-deg","saturation-pct"]) {
      const selector="data-skill-"+role+"-"+channel;
      assert.match(html,new RegExp('<input type="range"[^>]*'+selector));
      assert.equal((html.match(new RegExp(selector,"g"))??[]).length,1,"unique author input "+selector);
    }
    assert.ok(html.includes('data-skill-recolor-reset="'+role+'"'));
    assert.ok(html.includes('data-skill-recolor-swatch="'+role+'"'));
  }
  assert.match(css,/touch-action: pan-y/);
  assert.match(html,/aperçu change immédiatement/i);
  assert.match(html,/Le rendu exact dépend du sprite d’origine/);
});
test("sliders share existing writer/read fields, follow skill load, and reset without duplicate state",async()=>{
  const mod=await import("../../src/ui/capture-editor-sprite-controls-v1.js");
  const values=new Map();
  const nodes=[];
  const make=(selector,value="")=>{
    const node={value:String(value),style:{},textContent:"",handlers:{},dataset:{}};
    values.set(selector,node);nodes.push(node);return node;
  };
  for(const role of ["cast","travel","impact","zone"]){
    make('[data-skill-'+role+'-hue-deg]',"0");
    make('[data-skill-'+role+'-saturation-pct]',"100");
    for(const field of ["hue-output","saturation-output","state","swatch","reset"])
      make('[data-skill-recolor-'+field+'="'+role+'"]');
  }
  const root={dataset:{},querySelector:(q)=>values.get(q)??null};
  mod.mountSkillSpriteRecolorSlidersV1(root,(node,event,fn)=>{node.handlers[event]=fn});
  const hue=values.get('[data-skill-cast-hue-deg]');
  const saturation=values.get('[data-skill-cast-saturation-pct]');
  assert.equal(values.get('[data-skill-recolor-state="cast"]').textContent,"Couleurs d’origine");
  hue.value="245"; hue.handlers.input();
  saturation.value="165"; saturation.handlers.input();
  assert.equal(values.get('[data-skill-recolor-hue-output="cast"]').textContent,"245°");
  assert.equal(values.get('[data-skill-recolor-swatch="cast"]').style.filter,"hue-rotate(245deg) saturate(165%)");
  assert.equal(mod.readSkillSpriteControlsV1(root).castHueDeg,245);
  assert.equal(mod.readSkillSpriteControlsV1(root).castSaturationPct,165);
  mod.writeSkillSpriteControlsV1(root,{castHueDeg:60,castSaturationPct:85,zoneHueDeg:300});
  assert.equal(hue.value,"60");
  assert.equal(values.get('[data-skill-recolor-saturation-output="cast"]').textContent,"85 %");
  assert.equal(values.get('[data-skill-recolor-state="zone"]').textContent,"Couleurs personnalisées");
  values.get('[data-skill-recolor-reset="cast"]').handlers.click();
  assert.equal(mod.readSkillSpriteControlsV1(root).castHueDeg,0);
  assert.equal(mod.readSkillSpriteControlsV1(root).castSaturationPct,100);
  assert.equal(values.get('[data-skill-recolor-state="cast"]').textContent,"Couleurs d’origine");
});
