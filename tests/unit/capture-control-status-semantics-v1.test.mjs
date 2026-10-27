import test from "node:test";
import assert from "node:assert/strict";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";

function fighter(id) {
  return {id,maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100,
    movementEnergyPerStep:1,energyChargeAmount:0,energyChargeIntervalMs:0};
}
function skill(id,{form="contact",approachMode="ground",prep=0,travel=200,
  effects=[],energyCost=4}={}) {
  return normalizeSkillDefinition({id,name:id,category:"offensive",form,
    element:"physical",approachMode,energyCost,preparationMs:prep,
    travelMs:travel,recoveryMs:0,cooldownMs:1000,
    allowedDistances:["short","medium","long"],
    targetRelations:["enemy"],effect:{damage:2,heal:0,stunMs:0,tags:[]},
    effects});
}
function condition(id,kind) {
  return normalizeSkillDefinition({id,name:id,category:"buff_debuff",form:"self",
    approachMode:"none",element:"physical",energyCost:0,preparationMs:0,
    travelMs:0,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],
    targetRelations:["enemy"],effect:{damage:0,heal:0,stunMs:0,tags:[]},
    effects:[{kind:"apply_status",targetScope:"target",
      status:{id,kind,polarity:"detrimental",durationModel:"time_ms",
        durationMs:5000,stacking:"refresh",maxStacks:1,tags:[]}}]});
}
function affected(kind) {
  const session=createCombatSession({distance:"short",fighters:[fighter("a"),fighter("b")]});
  const applied=session.useSkill({actorId:"a",targetId:"b",skill:condition(kind,kind)});
  assert.equal(applied.ok,true);
  return session;
}

test("Silence restricts ranged forms, not contact; no rejected resource spend",()=>{
  const session=affected("silence");
  const contact=skill("claw",{form:"contact",approachMode:"ground"});
  const melee=session.startSkill({actorId:"b",targetId:"a",skill:contact});
  assert.equal(melee.ok,true,"contact is allowed while silenced");
  const ranged=affected("silence");
  for(const form of ["projectile","beam","area"]) {
    const before=ranged.snapshot().fighters.b.energy;
    const denied=ranged.startSkill({actorId:"b",targetId:"a",
      skill:skill("ranged-"+form,{form,approachMode:"none"})});
    assert.equal(denied.outcome,"silenced");
    assert.equal(denied.ok,false);
    assert.equal(ranged.snapshot().fighters.b.energy,before);
  }
  for (const form of ["self","aura"]) {
    const allowed=affected("silence");
    const cast=allowed.startSkill({actorId:"b",targetId:"a",
      skill:skill("support-"+form,{form,approachMode:"none"})});
    assert.equal(cast.ok,true,"silence must not block stationary "+form+" abilities");
  }
});
test("Immobilization denies approach starts while allowing a stationary spell; stun still wins",()=>{
  const rooted=affected("immobilize");
  assert.equal(rooted.move("b","medium").outcome,"immobilized");
  for(const approachMode of ["ground","aerial","teleport","burrow"]){
    const result=rooted.startSkill({actorId:"b",targetId:"a",skill:skill(approachMode,{approachMode})});
    assert.equal(result.outcome,"immobilized");
    assert.equal(rooted.snapshot().fighters.b.energy,100);
  }
  assert.equal(rooted.startSkill({actorId:"b",targetId:"a",
    skill:skill("stationary",{form:"projectile",approachMode:"none"})}).ok,true);
  assert.equal(affected("stun").startSkill({actorId:"b",targetId:"a",
    skill:skill("claw")}).outcome,"stunned");
});

function runtimeHarness({form="contact",approachMode="ground",prep=0}={}) {
  let clock=0,timer=null,completed=0;
  const events=[];
  const fighterState=(id)=>({id,hp:100,maxHp:100,energy:100,statusEffects:[]});
  const state={distance:"short",elapsedMs:0,fighters:{a:fighterState("a"),b:fighterState("b")}};
  const action=Object.freeze({actionType:"skill",actionId:"moving",actorId:"b",targetId:"a",
    skill:Object.freeze({id:"moving",name:"Moving",form,approachMode}),
    preparationMs:prep,travelMs:1000,recoveryMs:0,releaseAtMs:prep,impactAtMs:prep+1000,
    interruptibleDuringPreparation:true});
  const session={snapshot:()=>state,startSkill:()=>({ok:true,action}),
    advanceMs:(delta)=>{
      state.elapsedMs+=delta;
      if(state.elapsedMs>=120 && state.fighters.b.statusEffects.length===0){
        state.fighters.b.statusEffects=[{definition:{id:"root",kind:"immobilize",durationModel:"time_ms"},
          appliedAtMs:120,expiresAtMs:5000}];
      }
    },
    completeAction:()=>{completed++;return {ok:true,events:[],state}}};
  const runtime=createCombatRuntime({session,now:()=>clock,setTimer:fn=>{timer=fn;return 1},
    clearTimer:()=>{timer=null},onInterrupted:event=>events.push(event)});
  runtime.start();runtime.startSkill({actorId:"b",targetId:"a",skill:action.skill});
  return {runtime,events,step(t){clock=t;timer?.()},get completed(){return completed}};
}

for(const [name,options] of [
  ["preparation",{form:"contact",approachMode:"ground",prep:300}],
  ["travel",{form:"contact",approachMode:"ground",prep:0}],
  ["aerial travel",{form:"contact",approachMode:"aerial",prep:0}]
]){
  test("Live Immobilization halts an ongoing "+name+" and cancels visible action",()=>{
    const h=runtimeHarness(options);h.step(150);
    assert.equal(h.events.length,1);
    assert.equal(h.events[0].reason,"immobilized");
    assert.equal(h.events[0].action.actorId,"b");
    assert.equal(h.runtime.hasActiveActionFor("b"),false);
    h.step(1600);
    assert.equal(h.completed,0,"no delayed melee damage after rooted approach");
    h.runtime.dispose();
  });
}
test("Immobilization does not cancel a non-moving ranged shot in travel",()=>{
  const h=runtimeHarness({form:"projectile",approachMode:"none"});
  h.step(150);assert.equal(h.events.length,0);
  assert.equal(h.runtime.hasActiveActionFor("b"),true);h.runtime.dispose();
});
