import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createBattleActorAiController,CAPTURE_AI_TACTICS_V1_DEFAULT} from "../../src/core/combat/battle-actor-ai-controller.js";

function makeController({abilities,eligible=()=>true,active=()=>null}){
 let state={elapsedMs:0,fighters:{ai:{id:"ai",hp:100,maxHp:100,energy:80},enemy:{id:"enemy",hp:100,maxHp:100,energy:80}}};
 const starts=[];
 const runtime={hasActiveActionFor:()=>Boolean(active()),activeActionFor:active,
   previewChargedSkillRetrigger:()=>({ok:true,outcome:"charge_ready",chargeCount:1,maxCharges:3}),
   startSkill(input){starts.push(input);return {ok:true,outcome:starts.length===1?"started":"charged"}}};
 const session={snapshot:()=>state,previewSkill:({skill})=>({ok:eligible(skill.id)})};
 const ai=createBattleActorAiController({session,runtime,actorId:"ai",targetIds:["enemy"],skillIds:abilities.map(s=>s.id),
   skillsById:Object.fromEntries(abilities.map(x=>[x.id,x])),tactics:{...CAPTURE_AI_TACTICS_V1_DEFAULT,dodgeChancePct:0}});
 return {ai,starts,runtime,update(s){state={...state,...s,fighters:{...state.fighters,...s.fighters}}}};
}
test("busy AI can re-activate a native charged action without starting another skill",()=>{
 const charged={id:"charged",name:"charged",energyCost:2,chargedAttack:{maxCharges:3}};
 let active={actionType:"skill",actionId:"charged",targetId:"enemy",skill:charged,chargeState:{chargeCount:1}};
 const h=makeController({abilities:[charged],active:()=>active});
 assert.equal(h.ai.pendingCharge(),true);
 const result=h.ai.takeTurn();
 assert.equal(result.status,"charged");
 assert.equal(h.starts.length,1);
 assert.equal(h.starts[0].skill.id,"charged");
 assert.equal(h.starts[0].targetId,"enemy");
});
test("ineffective Sangsue contact is not spammed; ordinary attack is preferred",()=>{
 const hold={id:"sangsue",name:"Sangsue",form:"contact",energyCost:2,contactHold:{tickIntervalMs:1000,effects:[{kind:"damage",amount:6},{kind:"life_steal",percent:100}]},effects:[]};
 const strike={id:"strike",name:"Strike",energyCost:2,effects:[{kind:"damage",amount:8}]};
 let ordinaryAllowed=false;
 const h=makeController({abilities:[hold,strike],eligible:id=>id==="sangsue"||ordinaryAllowed});
 assert.equal(h.ai.takeTurn().skillId,"sangsue");
 h.update({elapsedMs:1800,fighters:{ai:{id:"ai",hp:65,maxHp:100,energy:70},enemy:{id:"enemy",hp:100,maxHp:100,energy:70}}});
 ordinaryAllowed=true;
 assert.equal(h.ai.takeTurn().skillId,"strike");
 assert.equal(h.starts.filter(x=>x.skill.id==="sangsue").length,1);
});
test("without a useful alternative AI waits before retrying an unproductive hold",()=>{
 const hold={id:"sangsue",name:"Sangsue",form:"contact",energyCost:1,contactHold:{effects:[{kind:"damage",amount:6}]},effects:[]};
 const h=makeController({abilities:[hold]});
 assert.equal(h.ai.takeTurn().status,"skill_started");
 h.update({elapsedMs:1300,fighters:{ai:{id:"ai",hp:90,maxHp:100,energy:70},enemy:{id:"enemy",hp:100,maxHp:100,energy:70}}});
 assert.equal(h.ai.takeTurn().status,"waiting");
 assert.equal(h.starts.length,1);
 h.update({elapsedMs:11500});
 assert.equal(h.ai.takeTurn().status,"skill_started");
});
test("combat clock drives native charge decision bypassing ordinary think cooldown",()=>{
 const source=readFileSync(new URL("../../src/ui/combat-2v2-test-ui.js",import.meta.url),"utf8");
 assert.match(source,/controller\.pendingCharge\(\)/);
 assert.match(source,/onClock\(state\)[\s\S]*?queueAiDecisions\(\)/);
});
