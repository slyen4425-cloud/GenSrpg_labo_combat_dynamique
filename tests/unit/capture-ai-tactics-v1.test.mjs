import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { buildCaptureDodgeReactionSkillV1 } from "../../src/contracts/capture-game-options-v1.js";

import { createBattleActorAiController, CAPTURE_AI_TACTICS_V1_DEFAULT } from "../../src/core/combat/battle-actor-ai-controller.js";

function harness({abilities, hp = 100, maxHp = 100, targets = ["enemy"], skillsById = null, tactics = { ...CAPTURE_AI_TACTICS_V1_DEFAULT, dodgeChancePct: 100 }, dodge = null } = {}) {
  let state = {elapsedMs: 0, fighters: {
    ai: {id: "ai", hp, maxHp, energy: 50, statusEffects: []},
    enemy: {id: "enemy", hp: 22, maxHp: 100, energy: 50, statusEffects: []}
  }};
  const skills = skillsById ?? Object.fromEntries(abilities.map(s => [s.id, s]));
  const starts = [];
  const activations = [];
  let charges = 1;
  const runtime = {
    hasActiveActionFor: () => false,
    activeActions: [],
    startSkill({actorId,targetId,skill}) { starts.push({actorId,targetId,skillId:skill.id}); return {ok:true}; },
    rechargeableActionAvailability: () => ({charges, maxCharges: 1, nextRechargeMs: 0}),
    rechargeableReactionWindowStatus: () => ({active:false}),
    previewRechargeableReaction: () => ({ok:true}),
    activateRechargeableReaction(skill,{actorId}) { if(charges===0)return {ok:false,outcome:"no_charges"};charges--;activations.push({skill:skill.id,actorId});return {ok:true,window:{remainingMs:250}}; }
  };
  const session = {snapshot:()=>state, previewSkill:()=>({ok:true})};
  const ai = createBattleActorAiController({session,runtime,actorId:"ai",targetIds:targets,skillIds:Object.keys(skills),skillsById:skills,tactics,dodge});
  return {ai,starts,activations,runtime,setState(s){state=s},setCharges(n){charges=n}};
}
test("Tactical AI prioritizes useful heal at critical health instead of blindly following the skill list",()=>{
 const skills=[{id:"small-hit",name:"hit",energyCost:1,effects:[{kind:"damage",amount:6}]},{id:"heal",name:"heal",targetRelations:["self"],energyCost:1,effects:[{kind:"heal",amount:45}]}];
 const h=harness({abilities:skills,hp:18});
 const outcome=h.ai.takeTurn();
 assert.equal(outcome.skillId,"heal");
 assert.equal(h.starts[0].targetId,"ai");
});
test("Tactical AI uses diverse eligible attacks and chooses legal targets; no hard-coded first target",()=>{
 const skills=[{id:"one",name:"one",energyCost:1,effects:[{kind:"damage",amount:12}]},{id:"two",name:"two",energyCost:1,effects:[{kind:"damage",amount:12}]},{id:"three",name:"three",energyCost:1,effects:[{kind:"damage",amount:12}]}];
 const h=harness({abilities:skills});
 for(let i=0;i<9;i++) h.ai.takeTurn();
 assert.ok(new Set(h.starts.map(s=>s.skillId)).size>=2);
 assert.notDeepEqual(h.starts.slice(0,6).map(s=>s.skillId),["one","two","three","one","two","three"]);
});
test("AI cannot dodge unreleased attacks or disabled rules",()=>{
 const a={id:"incoming",actionType:"skill",actorId:"enemy",targetId:"ai",releaseAtMs:100,impactAtMs:700,skill:{form:"projectile",approachMode:"none"}};
 const h=harness({abilities:[{id:"hit",name:"hit",energyCost:0}],dodge:{skill:{id:"capture-game-dodge",reaction:{evadeForms:["projectile"]}},recharge:{actionId:"capture-game-dodge",maxCharges:1,rechargeMs:30000},activeWindowMs:250}});
 assert.notEqual(h.ai.maybeDodge({elapsedMs:450}).status,"dodged");
 h.ai.observeRelease({action:a,elapsedMs:100});
 assert.notEqual(h.ai.maybeDodge({elapsedMs:150}).status,"dodged");
 assert.equal(h.ai.maybeDodge({elapsedMs:540}).status,"dodged");
 assert.equal(h.activations.length,1);
 assert.notEqual(h.ai.maybeDodge({elapsedMs:545}).status,"dodged");
});
test("AI respects disabled dodge and native charges; no guessing a cooldown",()=>{
 const dodge={skill:{id:"capture-game-dodge",reaction:{evadeForms:["projectile"]}},recharge:{actionId:"capture-game-dodge",maxCharges:1,rechargeMs:30000},activeWindowMs:250};
 const action={actionType:"skill",actorId:"enemy",targetId:"ai",releaseAtMs:0,impactAtMs:500,skill:{form:"projectile",approachMode:"none"}};
 const h=harness({abilities:[{id:"hit",name:"hit",energyCost:0}],dodge});
 h.setCharges(0);h.ai.observeRelease({action,elapsedMs:0});
 assert.notEqual(h.ai.maybeDodge({elapsedMs:360}).status,"dodged");
 assert.equal(h.activations.length,0);
 const disabled=harness({abilities:[{id:"hit",name:"hit",energyCost:0}],tactics:{...CAPTURE_AI_TACTICS_V1_DEFAULT,dodgeChancePct:0},dodge});
 disabled.ai.observeRelease({action,elapsedMs:0});
 assert.notEqual(disabled.ai.maybeDodge({elapsedMs:360}).status,"dodged");
 assert.equal(disabled.activations.length,0);
});
test("Real 2v2 test UI hands released visible attacks to AI and runs its reaction from native clock",()=>{
 const code=readFileSync(new URL("../../src/ui/combat-2v2-test-ui.js",import.meta.url),"utf8");
 assert.match(code,/controller\.observeRelease\(/);
 assert.match(code,/controller\.maybeDodge\(/);
 assert.match(code,/CAPTURE_AI_TACTICS_V1_DEFAULT/);
 assert.doesNotMatch(code,/aiDodgeTimeout|aiDodgeInterval|setInterval\([^)]*ai/i);
});

test("Real Combat Runtime: AI dodge after observable release consumes a native charge and evades at impact", () => {
  const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
  const session=createCombatSession({distance:"medium",fighters:[fighter("ai"),fighter("enemy")]});
  const skill=normalizeSkillDefinition({id:"real-incoming",name:"real-incoming",category:"offensive",
    form:"projectile",approachMode:"none",element:null,energyCost:0,preparationMs:0,
    travelMs:700,recoveryMs:0,cooldownMs:0,allowedDistances:["short","medium","long"],
    targetRelations:["enemy"],effect:{damage:20,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}});
  const dodgeSkill=buildCaptureDodgeReactionSkillV1({dodge:{enabled:true,maxCharges:1,rechargeMs:30000,activeWindowMs:250}});
  const recharge={actionId:dodgeSkill.id,maxCharges:1,rechargeMs:30000};
  let clock=0, timer=null, ai=null;
  const outcomes=[], reactions=[];
  const runtime=createCombatRuntime({
    session,now:()=>clock,setTimer(cb){timer=cb;return 1},clearTimer(){},
    onRelease({action}) {ai?.observeRelease({action,elapsedMs:session.snapshot().elapsedMs});},
    onClock(state) {if(ai){const d=ai.maybeDodge({elapsedMs:state.elapsedMs});if(d.status==="dodged")reactions.push(d)}},
    onResolved(result){outcomes.push(result)}
  });
  ai=createBattleActorAiController({
    session,runtime,actorId:"ai",targetIds:["enemy"],skillIds:["real-incoming"],
    skillsById:{"real-incoming":skill},tactics:{...CAPTURE_AI_TACTICS_V1_DEFAULT,dodgeChancePct:100},
    dodge:{skill:dodgeSkill,recharge,activeWindowMs:250}
  });
  runtime.start();
  const began=runtime.startSkill({actorId:"enemy",targetId:"ai",skill});
  assert.equal(began.ok,true);
  clock=300;timer();
  assert.equal(reactions.length,0,"must not dodge far ahead of visible impact");
  clock=550;timer();
  assert.equal(reactions.length,1,"dodge should be activated during the real impact window");
  assert.equal(runtime.rechargeableActionAvailability({actorId:"ai",...recharge}).charges,0);
  clock=700;timer();
  assert.equal(outcomes.length,1);
  assert.equal(outcomes[0].outcome,"evaded");
  assert.equal(session.snapshot().fighters.ai.hp,100);
  runtime.dispose();
});
