import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { normalizeSkillPresentationBinding } from "../../src/contracts/skill-presentation-binding.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createDomStatusFxRenderer } from "../../src/adapters/renderer/dom-status-fx.js";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const source=async path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const skillPath="data/capture/showcase/cap_earth_atk_3.capture-skill-transfer-v1.json";
const creaturePath="data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json";

test("author exports remain byte-exact and replace stable skill/creature IDs",async()=>{
  const skill=await source(skillPath),creature=await source(creaturePath);
  assert.equal(createHash("sha256").update(skill).digest("hex"),"9559205e12ee9f6d9f73028109b9f2b7c3711aa03e655845e1590b5022596856");
  assert.equal(createHash("sha256").update(creature).digest("hex"),"d3ef66ea80fbe0c30be066a1b6dcdeda7cabb4a13202b4a212eaecacbb7e8442");
  const s=importCaptureTransferJsonV1(skill),c=importCaptureTransferJsonV1(creature);
  assert.equal(s.value.draft.id,"cap_earth_atk_3");
  assert.equal(c.value.draft.id,"crea_mossback");
  assert.deepEqual(s.value.draft.definition.targetRelations,["ally","self"]);
  assert.equal(s.value.draft.definition.effects[1].status.kind,"skill_cooldown_rate_modifier");
  assert.equal(s.value.draft.presentation.visual.aura.assetId,"pack:capture:sprite-flowering-meadow-ground-01");
  assert.equal(s.value.draft.presentation.visual.aura.playbackMode,"hold-last");
  assert.equal(c.value.loadout.slots[3].skillId,"cap_earth_atk_3");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(s.value.draft)).value.draft,s.value.draft);
});

const skillBinding=(visual)=>normalizeSkillPresentationBinding({
  id:"skill:test-tint",version:9,subjectType:"skill",subjectId:"test-tint",
  visual:{},audio:{},statusVisuals:{test:visual}
});

test("native status tint contract accepts black, arbitrary hex and pulse configuration without changing legacy",()=>{
  const legacy=skillBinding({mode:"tint",tintColor:"#112233",tintOpacity:0.35});
  assert.equal(legacy.statusVisuals.test.tintColor,"#112233");
  assert.equal(legacy.statusVisuals.test.tintBlinkEnabled,false);
  const updated=skillBinding({mode:"tint",tintColor:"#000000",tintOpacity:0.8,tintBlinkEnabled:true,tintBlinkPeriodMs:300});
  assert.equal(updated.statusVisuals.test.tintColor,"#000000");
  assert.equal(updated.statusVisuals.test.tintBlinkEnabled,true);
  assert.equal(updated.statusVisuals.test.tintBlinkPeriodMs,300);
  for(const tintColor of ["#ff0080","#704214","#ffffff","#09d5f0"]) assert.equal(skillBinding({mode:"tint",tintColor}).statusVisuals.test.tintColor,tintColor);
  for(const tintBlinkPeriodMs of [0,99,10001,Infinity]) assert.throws(()=>skillBinding({mode:"tint",tintBlinkEnabled:true,tintBlinkPeriodMs}),/tintBlinkPeriodMs/);
});

test("resolved tint uses the single status presentation adapter and native DOM animation, not another timer",()=>{
  const bind=skillBinding({mode:"tint",tintColor:"#000000",tintOpacity:0.7,tintBlinkEnabled:true,tintBlinkPeriodMs:280});
  const resolved=createCaptureSkillPresentationAssetsV2({skillPresentations:{s:bind},assetForId:()=>null});
  const visual=resolved.statusPresentationFor("test",{view:"player"});
  assert.equal(visual.tintBlinkEnabled,true);
  assert.equal(visual.tintBlinkPeriodMs,280);
  const animations=[],children=[];
  const doc={createElement:()=>({style:{},dataset:{},remove(){this.removed=true},animate(frames,options){const a={frames,options,cancel(){this.cancelled=true}};animations.push(a);return a;}})};
  const motion={ownerDocument:doc,append(node){children.push(node)}};
  const renderer=createDomStatusFxRenderer({targetFor:()=>({motion,image:{src:"/model.webp"}}),statusPresentationFor:()=>visual});
  const state={elapsedMs:100,fighters:{hero:{statusEffects:[{definition:{id:"test",polarity:"beneficial"}}]}}};
  renderer.sync(state);renderer.sync({...state,elapsedMs:500});
  const tint=children.find(x=>x.dataset.statusFx==="tint");
  assert.equal(tint.style.backgroundColor,"#000000");
  assert.equal(tint.style.maskImage,'url("/model.webp")');
  assert.equal(animations.length,1,"one animation per status, not one per runtime tick");
  assert.equal(animations[0].options.duration,280);
  assert.equal(animations[0].options.iterations,Infinity);
  renderer.sync({fighters:{hero:{statusEffects:[]}}});
  assert.equal(animations[0].cancelled,true);
  assert.equal(tint.removed,true);
  renderer.dispose();
});

test("editor exposes color palette, custom color and blink speed fields in status visual owner",async()=>{
  const sourceCode=await source("src/ui/capture-editor-human-v2.js");
  for(const marker of ["data-skill-status-tint-color","skillStatusTintColorPreset","skillStatusTintBlinkEnabled","skillStatusTintBlinkPeriodMs"])assert.match(sourceCode,new RegExp(marker));
  assert.match(sourceCode,/#000000/);
  assert.match(sourceCode,/tintBlinkPeriodMs/);
});
