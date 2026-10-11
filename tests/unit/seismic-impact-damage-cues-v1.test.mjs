import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCombatImpactHealthCueSyncV1 } from "../../src/adapters/renderer/combat-impact-health-cue-v1.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { createDomDamageFeedbackRenderer } from "../../src/adapters/renderer/dom-damage-feedback.js";

const shake={amplitudePx:7,durationMs:200,sequence:[
  {pauseMs:0,amplitudePx:4,durationMs:180},
  {pauseMs:90,amplitudePx:9,durationMs:220},
  {pauseMs:120,amplitudePx:16,durationMs:320},
  {pauseMs:130,amplitudePx:7,durationMs:210}
],impactVisualTiming:"after"};
const total=1270;
const hit=(actorId,before,after,skillId="cap_earth_atk_7")=>({type:"hit",actorId,skillId,hpBefore:before,hpAfter:after,appliedDamage:before-after});
const resolution=(events,skillId="cap_earth_atk_7")=>({ok:true,actionType:"skill",outcome:"hit",skillId,actorId:"caster",targetId:"enemy",events});
const delta=(actorId,before,after)=>({kind:"damage",actorId,hpBefore:before,hpAfter:after,amount:before-after});

test("direct seismic hit defers only its matching visual damage and uses existing impact shake delay",()=>{
  const cue=createCombatImpactHealthCueSyncV1({presentationForSkill:()=>({feedback:{cameraShake:shake}})});
  cue.register(resolution([hit("enemy",100,60)]));
  assert.equal(cue.delayFor(delta("enemy",100,60)),total);
  assert.equal(cue.delayFor(delta("enemy",100,60)),0,"cue is consumed exactly once");
  cue.register(resolution([hit("enemy",60,40)]));
  assert.equal(cue.delayFor(delta("enemy",60,38)),0,"no delay if a zone tick changes the actual HP delta");
  cue.clear();
  assert.equal(cue.delayFor(delta("enemy",60,40)),0);
});

test("multi-target quake gets one visual delay per hit actor; DoT, heal, legacy and reflected hit stay immediate",()=>{
  const cue=createCombatImpactHealthCueSyncV1({presentationForSkill:()=>({feedback:{cameraShake:shake}})});
  cue.register(resolution([hit("left",100,70),hit("right",80,30)]));
  assert.equal(cue.delayFor(delta("right",80,30)),total);
  assert.equal(cue.delayFor({kind:"heal",actorId:"left",amount:30,hpBefore:70,hpAfter:100}),0);
  assert.equal(cue.delayFor(delta("left",100,70)),total);
  assert.equal(cue.delayFor(delta("other",90,60)),0);
  cue.register(resolution([hit("enemy",100,90,"other")],"other"));
  assert.equal(cue.delayFor(delta("enemy",100,90)),total);
  cue.register(resolution([hit("enemy",90,80)]));
  cue.clear();
  assert.equal(cue.delayFor(delta("enemy",90,80)),0);
  const legacy=createCombatImpactHealthCueSyncV1({presentationForSkill:()=>({feedback:{cameraShake:{amplitudePx:8,durationMs:140}}})});
  legacy.register(resolution([hit("enemy",100,80)]));
  assert.equal(legacy.delayFor(delta("enemy",100,80)),0);
  const reflected=createCombatImpactHealthCueSyncV1({presentationForSkill:()=>({feedback:{cameraShake:shake}})});
  reflected.register(resolution([{...hit("caster",100,80),reflected:true}]));
  assert.equal(reflected.delayFor(delta("caster",100,80)),0);
});

function node(rect={left:20,top:30,width:50,height:80}) {
  return {dataset:{},style:{},children:[],ownerDocument:null,append(x){this.children.push(x)},remove(){this.removed=true},getBoundingClientRect(){return rect}};
}
test("floating number stays hidden before native animation delay; hit flash starts at same authored offset",()=>{
 const arena=node({left:0,top:0,width:600,height:320}),target=node();
 const animations=[];const doc={createElement:()=>{let n=node();n.ownerDocument=doc;n.animate=(frames,options)=>{let a={frames,options,finished:Promise.resolve(),cancel(){this.cancelled=true}};animations.push({n,a});return a;};return n}};
 arena.ownerDocument=doc;target.ownerDocument=doc;target.animate=(frames,options)=>{let a={frames,options,finished:Promise.resolve(),cancel(){this.cancelled=true}};animations.push({n:target,a});return a;};
 const renderer=createDomSkillFxRenderer({arena,anchors:{enemy:target},targetAnchors:{enemy:target},animate:(n,f,o)=>n.animate(f,o),requestFrame:()=>null,cancelFrame:()=>{}});
 const flash=createDomDamageFeedbackRenderer({targetFor:()=>({image:target})});
 renderer.play({type:"damage",targetSlot:"enemy",amount:40,durationMs:700,delayMs:total});
 flash.flash("enemy",{delayMs:total});
 const damage=arena.children.find(x=>x.dataset.skillFx==="damage");
 assert.equal(damage.style.opacity,"0");
 assert.equal(animations.find(x=>x.n===damage).a.options.delay,total);
 assert.equal(animations.find(x=>x.n===target).a.options.delay,total);
 renderer.dispose();flash.dispose();
});
test("1v1 and 2v2 wire the same state-owned cue correlation before health feedback, with no gameplay mutation",async()=>{
 for(const path of ["src/ui/combat-test-ui.js","src/ui/combat-2v2-test-ui.js"]){
  const src=await readFile(new URL("../../"+path,import.meta.url),"utf8");
  assert.match(src,/createCombatImpactHealthCueSyncV1/);
  assert.match(src,/impactHealthCue\.register\(resolution\)/);
  assert.match(src,/impactHealthCue\.delayFor\(feedback\)/);
  assert.match(src,/impactHealthCue\.clear\(\)/);
  assert.match(src,/damageFeedback\?\.flash\(feedback\.actorId,\s*\{\s*delayMs\s*\}\)/);
 }
});
