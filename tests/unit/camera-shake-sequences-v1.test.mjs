import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillPresentationBinding } from "../../src/contracts/skill-presentation-binding.js";
import { createDomCameraFxRenderer } from "../../src/adapters/renderer/dom-camera-fx.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { buildHumanSkillDraftV1, humanSkillEditorFieldsFromDraftV1 } from "../../src/ui/capture-editor-human-v2.js";

const sequence = [
  { pauseMs: 0, amplitudePx: 9, durationMs: 210 },
  { pauseMs: 180, amplitudePx: 15, durationMs: 330 },
  { pauseMs: 250, amplitudePx: 5, durationMs: 220 }
];

const binding=(cameraShake,version=9)=>normalizeSkillPresentationBinding({
  id:"skill:quake",version,subjectType:"skill",subjectId:"quake",
  visual:{},audio:{},statusVisuals:{},feedback:{cameraShake}
});

test("camera shake V9/V10 accepts an ordered multi-pulse sequence but legacy remains exact",()=>{
  const legacy=binding({amplitudePx:8,durationMs:140});
  assert.deepEqual(legacy.feedback.cameraShake,{amplitudePx:8,durationMs:140});
  const all=binding({amplitudePx:9,durationMs:210,sequence},10);
  assert.deepEqual(all.feedback.cameraShake.sequence,sequence);
  assert.equal(all.feedback.cameraShake.sequence.length,3);
  assert.ok(Object.isFrozen(all.feedback.cameraShake.sequence));
  for(const bad of [
    {sequence:[]}, {sequence:[{pauseMs:-1,amplitudePx:8,durationMs:100}]},
    {sequence:[{pauseMs:0,amplitudePx:0,durationMs:100}]},
    {sequence:[{pauseMs:0,amplitudePx:8,durationMs:12}]},
    {sequence:[{pauseMs:0,amplitudePx:25,durationMs:120}]},
    {sequence:Array.from({length:9},()=>({pauseMs:0,amplitudePx:8,durationMs:100}))}
  ]) assert.throws(()=>binding({amplitudePx:9,durationMs:210,...bad}),/cameraShake|sequence|amplitudePx|durationMs|pauseMs/);
});

test("native camera renderer plays multiple quake jolts and stationary gaps in ONE animation and cancels cleanly",async()=>{
  const calls=[];
  function animate(element,keyframes,options){
    const handle={cancel(){this.cancelled=true},finished:Promise.resolve()};
    calls.push({element,keyframes,options,handle});return handle;
  }
  const element={};
  const camera=createDomCameraFxRenderer({element,animate});
  const h=camera.play({type:"camera-shake",amplitudePx:9,durationMs:210,sequence});
  assert.equal(h.status,"running");
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.duration,1190);
  const transforms=calls[0].keyframes.map(x=>x.transform);
  assert.ok(transforms.filter(x=>x==="translate3d(0, 0, 0)").length>=6,"rest between jolts");
  assert.ok(transforms.some(x=>x.includes("15px")),"second jolt independent strength");
  for(let i=1;i<calls[0].keyframes.length;i++)assert.ok(calls[0].keyframes[i].offset>=calls[0].keyframes[i-1].offset);
  camera.play({type:"camera-shake",amplitudePx:3,durationMs:80});
  assert.equal(calls[0].handle.cancelled,true,"second effect replaces first owner");
  camera.dispose();assert.equal(calls[1].handle.cancelled,true);
  assert.equal((await h.finished).status,"finished");
});

function fields(presentation={}) {return {
  id:"quake",name:"Séisme",description:"Test",requiredLevel:1,usageScopes:["capture","combat"],
  category:"offensive",form:"aura",element:"earth",approachMode:"none",
  energyCost:2,preparationMs:400,travelMs:0,recoveryMs:0,cooldownMs:4000,
  allowedDistances:["short","medium","long"],targetRelations:["enemy"],
  damage:0,heal:0,stunMs:0,interruptsPreparation:false,
  effects:[{kind:"damage",targetScope:"target",channel:"earth",amount:4}],
  reaction:{blockForms:[],reflectForms:[],immuneElements:[],counterForms:[],evadeForms:[],evadeApproaches:[]},
  projectileClash:{mode:"none"},presentation
};}

test("editor quake shakes round-trip through authored skill presentation without changing gameplay",()=>{
  const first=buildHumanSkillDraftV1(fields({
    impactShakeAmplitudePx:9,impactShakeDurationMs:210,impactShakeSequence:sequence
  }));
  assert.deepEqual(first.presentation.feedback.cameraShake.sequence,sequence);
  const restored=humanSkillEditorFieldsFromDraftV1(JSON.parse(JSON.stringify(first)));
  assert.deepEqual(restored.presentation.impactShakeSequence,sequence);
  const again=buildHumanSkillDraftV1(restored);
  assert.deepEqual(again.presentation,first.presentation);
  assert.deepEqual(again.definition,first.definition);
});

test("editor shows ordered quake shake rows, add/remove, and original single-shake inputs",async()=>{
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const code=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  for(const key of ["data-skill-impact-shake-sequence-host","data-skill-impact-shake-add","data-skill-impact-shake-amplitude","data-skill-impact-shake-duration"])assert.match(html,new RegExp(key));
  for(const name of ["impactShakeSequence","skillImpactShakePulsePause","skillImpactShakePulseAmplitude","skillImpactShakePulseDuration"])assert.match(code,new RegExp(name));
});


test("real skill draft -> status-free impact -> presentation adapter -> skill FX -> camera single-owner sequence",()=>{
  const draft=buildHumanSkillDraftV1(fields({
    impactShakeAmplitudePx:9,impactShakeDurationMs:210,impactShakeSequence:sequence
  }));
  const presentation=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{quake:draft.presentation},assetForId:()=>null
  });
  const calls=[];
  const nativeCamera=createDomCameraFxRenderer({
    element:{},animate:(node,frames,options)=>{
      calls.push({frames,options});
      return {finished:Promise.resolve(),cancel(){}};
    }
  });
  const document={createElement(){return {dataset:{},style:{},append(){},remove(){}}}};
  const arena={
    ownerDocument:document,append(){},
    getBoundingClientRect(){return {left:0,top:0,width:600,height:300}}
  };
  const anchor=left=>({getBoundingClientRect(){return {left,top:100,width:40,height:50}}});
  const renderer=createDomSkillFxRenderer({
    arena,anchors:{player:anchor(80),opponent:anchor(440)},
    presentationForSkill:presentation.presentationForSkill,
    playCameraFx:nativeCamera.play
  });
  renderer.play({type:"impact",skillId:"quake",targetSlot:"opponent",durationMs:420});
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.duration,1190);
  assert.deepEqual(draft.definition.effects,[{kind:"damage",targetScope:"target",amount:4,channel:"earth"}]);
  renderer.dispose();
  nativeCamera.dispose();
});

test("legacy single camera shake keeps its original ease-out movement and cadence",()=>{
  const calls=[];
  const camera=createDomCameraFxRenderer({
    element:{},animate:(element,frames,options)=>{
      calls.push({frames,options});
      return {finished:Promise.resolve(),cancel(){}};
    }
  });
  camera.play({type:"camera-shake",amplitudePx:6,durationMs:140});
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.duration,140);
  assert.equal(calls[0].options.easing,"ease-out");
  assert.equal(calls[0].frames.length,5);
  camera.dispose();
});
