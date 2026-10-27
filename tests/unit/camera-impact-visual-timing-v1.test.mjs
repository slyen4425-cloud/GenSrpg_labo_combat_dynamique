import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillPresentationBinding } from "../../src/contracts/skill-presentation-binding.js";
import { createDomSkillFxRenderer, impactVisualDelayForCameraShakeV1 } from "../../src/adapters/renderer/dom-skill-fx.js";
import { buildHumanSkillDraftV1, humanSkillEditorFieldsFromDraftV1 } from "../../src/ui/capture-editor-human-v2.js";

const seq=[{pauseMs:0,amplitudePx:7,durationMs:200},{pauseMs:120,amplitudePx:13,durationMs:300},{pauseMs:180,amplitudePx:6,durationMs:200}];
const bind=shake=>normalizeSkillPresentationBinding({id:"skill:quake",version:9,subjectType:"skill",subjectId:"quake",visual:{},audio:{},statusVisuals:{},feedback:{cameraShake:shake}});
test("shake impact visual timing is optional, strict and backward compatible",()=>{
  assert.deepEqual(bind({amplitudePx:6,durationMs:150}).feedback.cameraShake,{amplitudePx:6,durationMs:150});
  for(const timing of ["during","after"])assert.equal(bind({amplitudePx:7,durationMs:200,sequence:seq,impactVisualTiming:timing}).feedback.cameraShake.impactVisualTiming,timing);
  assert.throws(()=>bind({amplitudePx:6,durationMs:150,impactVisualTiming:"before"}),/impactVisualTiming/);
  assert.equal(impactVisualDelayForCameraShakeV1({amplitudePx:7,durationMs:200,sequence:seq,impactVisualTiming:"during"}),500);
  assert.equal(impactVisualDelayForCameraShakeV1({amplitudePx:7,durationMs:200,sequence:seq,impactVisualTiming:"after"}),1000);
  assert.equal(impactVisualDelayForCameraShakeV1({amplitudePx:6,durationMs:150}),0);
});
function fields(presentation){return {
  id:"quake-test",name:"Séisme",description:"Séisme visuel",requiredLevel:20,usageScopes:["capture","combat"],
  category:"offensive",form:"aura",element:"earth",approachMode:"none",
  energyCost:6,preparationMs:3500,travelMs:0,recoveryMs:0,cooldownMs:0,
  allowedDistances:["short","medium","long"],targetRelations:["enemy"],damage:0,heal:0,stunMs:0,interruptsPreparation:false,
  effects:[{kind:"damage",targetScope:"all_enemies",amount:100,channel:"earth"}],
  reaction:{blockForms:[],reflectForms:[],immuneElements:[],counterForms:[],evadeForms:[],evadeApproaches:[]},
  presentation
};}
test("editor roundtrip stores impact timing in existing feedback.cameraShake, not gameplay",()=>{
  const draft=buildHumanSkillDraftV1(fields({impactShakeAmplitudePx:9,impactShakeDurationMs:200,impactShakeSequence:seq,impactVisualTiming:"after"}));
  assert.equal(draft.presentation.feedback.cameraShake.impactVisualTiming,"after");
  const restored=humanSkillEditorFieldsFromDraftV1(JSON.parse(JSON.stringify(draft)));
  assert.equal(restored.presentation.impactVisualTiming,"after");
  const next=buildHumanSkillDraftV1(restored);
  assert.deepEqual(next.presentation,draft.presentation);
  assert.deepEqual(next.definition,draft.definition);
});
test("camera starts immediately but native sprite and flash wait for authored time, without extra JS scheduler",()=>{
  const animated=[], added=[], cam=[];
  const doc={createElement(){return {ownerDocument:doc,dataset:{},style:{},append(){},remove(){this.removed=true}}}};
  const arena={ownerDocument:doc,append(node){added.push(node)},getBoundingClientRect(){return {left:0,top:0,width:600,height:300}}};
  const target={getBoundingClientRect(){return {left:400,top:100,width:80,height:90}}};
  const fx=createDomSkillFxRenderer({
    arena,anchors:{player:target,opponent:target},
    presentationForSkill:()=>({
      impact:{assetId:"pack:test:impact",url:"/impact.webp",displayScale:1,opacity:1,frameCount:5,frameMs:60},
      feedback:{cameraShake:{amplitudePx:9,durationMs:200,sequence:seq,impactVisualTiming:"after"},impactFlash:{color:"#ffffff",opacity:1,durationMs:220,scale:2}}
    }),
    playCameraFx:plan=>{cam.push(plan);return {status:"running",finished:Promise.resolve()};},
    animate:(node,frames,options)=>{const a={node,frames,options,finished:Promise.resolve(),cancel(){this.cancelled=true}};animated.push(a);return a;}
  });
  fx.play({type:"impact",skillId:"quake-test",targetSlot:"opponent",durationMs:420});
  assert.equal(cam.length,1);
  const flash=added.find(x=>x.dataset.skillFx==="impact-flash");
  const impact=added.find(x=>x.dataset.skillFx==="impact");
  assert.ok(flash);
  assert.ok(impact);
  assert.equal(animated.find(x=>x.node===flash)?.options.delay,1000);
  assert.equal(animated.find(x=>x.node===impact)?.options.delay,1000);
  assert.equal(impact.style.animationDelay,"1000ms");
  fx.dispose();
});
test("editor offers impact visual timing and one-click prefilled quake sequence",async()=>{
 const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const code=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(html,/data-skill-impact-visual-timing/);
 assert.match(html,/data-skill-impact-shake-preset/);
 assert.match(code,/impactVisualTiming/);
 assert.match(code,/data-skill-impact-shake-preset/);
});
