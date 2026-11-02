import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {normalizeSkillPresentationBindingV10} from "../../src/contracts/skill-presentation-binding-v10.js";
import {scheduleSkillEffectV1} from "../../src/core/combat/scheduled-effect-runtime-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {planSkillOutcomeFx} from "../../src/core/fx/skill-fx-plan.js";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("RED: under-target projectile accepted by ONE visual contract, not added damage engine",()=>{
 const saved=JSON.parse(read("data/capture/showcase/boule_neige.capture-skill-transfer-v1.json")).draft.presentation;
 const normal=normalizeSkillPresentationBindingV10({...saved,version:10,
  visual:{...saved.visual,travel:{...saved.visual.travel,trajectoryMode:"under_target"}}});
 assert.equal(normal.visual.travel.trajectoryMode,"under_target");
 const ui=read("examples/dom-demo/capture-editor-v2.html");
 assert.match(ui,/option value="under_target"/);
 assert.match(read("src/adapters/renderer/dom-skill-fx.js"),/underTarget/);
});
test("RED: mine uses native scheduled effect with a presentation-only ground cue",()=>{
 const effect=normalizeSkillEffectV1({kind:"scheduled_effect",targetScope:"target",
  trigger:{type:"after_ms",delayMs:3000},visualCue:"ground_mine",
  effects:[{kind:"damage",targetScope:"target",amount:20,channel:"ice"}]});
 const state=createCombatState({fighters:[
  {id:"hero",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10},
  {id:"enemy",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
 ]});
 const result=scheduleSkillEffectV1({state,sourceActorId:"hero",targetActorId:"enemy",
  sourceSkillId:"ice-mine",effect,atMs:0});
 assert.equal(result.record.dueAtMs,3000);
 assert.equal(result.record.visualCue,"ground_mine");
 assert.equal(result.state.scheduledEffects.length,1);
 assert.match(read("src/adapters/renderer/dom-skill-fx.js"),/function syncScheduledMines\(/);
 assert.match(read("examples/dom-demo/capture-editor-v2.html"),/option value="mine"/);
});
test("only damaging scheduled effects can request a visible mine telegraph",()=>{
 assert.throws(()=>normalizeSkillEffectV1({kind:"scheduled_effect",targetScope:"target",
  trigger:{type:"after_ms",delayMs:3000},visualCue:"ground_mine",
  effects:[{kind:"heal",targetScope:"target",amount:10}]}),/ground_mine/);
});
test("reusable native effect selection only, no second scheduler",()=>{
 const fx=read("src/adapters/renderer/dom-skill-fx.js");
 const runtime=read("src/core/combat/combat-runtime.js");
 assert.match(runtime,/pulseContactHolds/);
 assert.match(fx,/syncScheduledMines/);
 assert.doesNotMatch(fx,/setInterval\(/);
});

test("a mine or channel casts no fake instant hit; native tick/expiry owns visible impact",()=>{
 const start=planSkillOutcomeFx({resolution:{ok:true,outcome:"hit",skillId:"ice-spike",
  channelingStart:true,events:[]},targetSlot:"enemy"});
 assert.deepEqual(start,[]);
 const mine=planSkillOutcomeFx({resolution:{ok:true,outcome:"hit",skillId:"ice-mine",
  events:[{type:"scheduled-effect-created",visualCue:"ground_mine"}]},targetSlot:"enemy"});
 assert.deepEqual(mine,[]);
 const normal=planSkillOutcomeFx({resolution:{ok:true,outcome:"hit",skillId:"ice-spike",
  events:[]},targetSlot:"enemy"});
 assert.equal(normal[0].type,"impact");
});
