import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {skillSpriteControlsFromFieldsV1,skillSpriteControlFieldsFromVisualsV1,readSkillSpriteControlsV1,writeSkillSpriteControlsV1} from "../../src/ui/capture-editor-sprite-controls-v1.js";
import {humanSkillEditorFieldsFromDraftV1,buildHumanSkillDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";

const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("impact visual opacity is editable 0..100% and roundtrips through native UI",()=>{
 for(const pct of [0,35,100]){
  assert.equal(skillSpriteControlsFromFieldsV1({impactOpacityPct:pct},"impact").opacity,pct/100);
  assert.equal(skillSpriteControlFieldsFromVisualsV1({impact:{opacity:pct/100}}).impactOpacityPct,pct);
 }
 assert.equal(skillSpriteControlsFromFieldsV1({},"impact").opacity,1);
 for(const pct of [-1,101])assert.throws(()=>skillSpriteControlsFromFieldsV1({impactOpacityPct:pct},"impact"),RangeError);
 assert.match(read("examples/dom-demo/capture-editor-v2.html"),/data-skill-impact-opacity-pct/);
 const field={value:"35"},root={dataset:{},querySelector:s=>s==="[data-skill-impact-opacity-pct]"?field:null};
 assert.equal(readSkillSpriteControlsV1(root).impactOpacityPct,35);
 writeSkillSpriteControlsV1(root,{impactOpacityPct:65});
 assert.equal(field.value,"65");
});
test("impact opacity changes only SkillPresentationBinding and real presenter",()=>{
 const path="data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json";
 const old=importCaptureTransferJsonV1(read(path)).value.draft;
 const fields=humanSkillEditorFieldsFromDraftV1(old);
 assert.equal(fields.presentation.impactOpacityPct,100);
 assert.deepEqual(buildHumanSkillDraftV1(fields).presentation,old.presentation);
 fields.presentation.impactOpacityPct=35;
 const next=buildHumanSkillDraftV1(fields);
 assert.deepEqual(next.definition,old.definition);
 assert.equal(next.presentation.visual.impact.opacity,0.35);
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(next)).value.draft,next);
 const p=createCaptureSkillPresentationAssetsV2({skillPresentations:{[next.id]:next.presentation},assetForId:id=>({assetId:id,url:"/asset.webp",frameCount:16,frameMs:75})});
 assert.equal(p.presentationForSkill(next.id,{view:"player"}).impact.opacity,0.35);
});

test("real DOM impact renderer applies 0, 35, 100 percent opacity to sprite animation", async()=>{
 const old=importCaptureTransferJsonV1(read("data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json")).value.draft;
 for(const percent of [0,35,100]){
  const fields=humanSkillEditorFieldsFromDraftV1(old);
  fields.presentation.impactOpacityPct=percent;
  const draft=buildHumanSkillDraftV1(fields);
  const resolved=createCaptureSkillPresentationAssetsV2({
   skillPresentations:{[draft.id]:draft.presentation},
   assetForId:id=>({assetId:id,url:"/asset.webp",frameCount:16,frameMs:75})
  });
  const nodes=[],animations=[];
  const document={createElement(){return {style:{},dataset:{},children:[],className:"",append(node){this.children.push(node);},remove(){this.removed=true;}};}};
  const arena={ownerDocument:document,append(node){nodes.push(node);},getBoundingClientRect(){return {left:0,top:0,width:600,height:300};}};
  const anchors={player:{getBoundingClientRect(){return {left:40,top:100,width:40,height:40};}},opponent:{getBoundingClientRect(){return {left:500,top:100,width:40,height:40};}}};
  const renderer=createDomSkillFxRenderer({arena,anchors,presentationForSkill:(id,context)=>resolved.presentationForSkill(id,context),
   animate(node,keyframes,options){let finish;const finished=new Promise(resolve=>finish=resolve);const a={keyframes,options,finished,cancel(){finish();}};animations.push(a);a.finish=finish;return a;}
  });
  const handle=renderer.play({type:"impact",skillId:draft.id,targetSlot:"opponent",durationMs:420});
  assert.ok(nodes.some(node=>node.dataset?.skillFx==="impact"),"native renderer must mount an impact sprite");
  const impactAnimation=animations.find(a=>a.keyframes.some(f=>typeof f.transform==="string"&&f.transform.includes("scale")));
  assert.ok(impactAnimation);
  assert.equal(impactAnimation.keyframes[1].opacity,percent/100);
  renderer.dispose();
  await handle.finished;
 }
});
