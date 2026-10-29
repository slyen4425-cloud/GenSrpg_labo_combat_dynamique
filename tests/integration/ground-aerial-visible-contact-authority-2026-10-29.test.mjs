import test from "node:test";
import assert from "node:assert/strict";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";

const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
const skill=(id,approachMode,travelMs,damage=20)=>normalizeSkillDefinition({
  id,name:id,category:"offensive",form:"contact",approachMode,
  energyCost:0,preparationMs:0,travelMs,recoveryMs:0,cooldownMs:0,
  allowedDistances:["short","medium","long"],targetRelations:["enemy"],
  effect:{damage,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}
});
function harness(){
  let clock=0;const tasks=[];let nextId=0;const resolved=[];
  const session=createCombatSession({distance:"medium",fighters:[fighter("player"),fighter("opponent")]});
  const runtime=createCombatRuntime({session,now:()=>clock,groundContactResolution:"visible",
    setTimer:callback=>{const id=++nextId;tasks.push({id,callback});return id;},
    clearTimer:id=>{const at=tasks.findIndex(t=>t.id===id);if(at>=0)tasks.splice(at,1);},
    onResolved:result=>resolved.push(result)
  });
  runtime.start();
  return {session,runtime,resolved,
    at(ms){clock=ms;},
    tick(ms){clock=ms;const task=tasks.shift();assert.ok(task);task.callback();}
  };
}
test("RED: a ground contact genuinely overlapping an airborne action hits, not an early virtual miss",()=>{
  const h=harness();
  try{
    h.runtime.startSkill({actorId:"player",targetId:"opponent",skill:skill("flight","aerial",2000,10)});
    h.runtime.startSkill({actorId:"opponent",targetId:"player",skill:skill("ground","ground",1000,23)});
    h.at(600);
    const contact=h.runtime.reportActionContact({actorId:"opponent",targetId:"player",skillId:"ground"});
    assert.equal(contact.ok,true);
    assert.equal(contact.resolution.outcome,"hit",
      "real opaque-model overlap must override the coarse airborne phase, not dodge/status");
    assert.equal(h.session.snapshot().fighters.player.hp,77);
  }finally{h.runtime.dispose();}
});
test("RED: ground attack cannot be declared missed before visible outbound travel ends",()=>{
  const h=harness();
  try{
    h.runtime.startSkill({actorId:"player",targetId:"opponent",skill:skill("flight","aerial",2200,5)});
    h.runtime.startSkill({actorId:"opponent",targetId:"player",skill:skill("ground","ground",800,23)});
    h.tick(900);
    assert.equal(h.resolved.some(r=>r.skillId==="ground"),false,
      "nominal timer cannot settle a collision-driven ground action");
    assert.equal(h.runtime.hasActiveActionFor("opponent"),true);
    const end=h.runtime.reportGroundApproachEnd({actorId:"opponent",targetId:"player",skillId:"ground"});
    assert.equal(end.ok,true);
    assert.equal(end.resolution.outcome,"evaded");
    assert.equal(h.session.snapshot().fighters.player.hp,100);
    assert.equal(h.resolved.filter(r=>r.skillId==="ground").length,1);
    assert.equal(h.runtime.hasActiveActionFor("opponent"),false);
  }finally{h.runtime.dispose();}
});
test("RED: ground attack hits the returning enemy if physical contact arrives after nominal timer",()=>{
  const h=harness();
  try{
    h.runtime.startSkill({actorId:"player",targetId:"opponent",skill:skill("flight","aerial",2200,5)});
    h.runtime.startSkill({actorId:"opponent",targetId:"player",skill:skill("ground","ground",800,23)});
    h.tick(825);
    h.at(850);
    const contact=h.runtime.reportActionContact({actorId:"opponent",targetId:"player",skillId:"ground"});
    assert.equal(contact.ok,true);
    assert.equal(contact.resolution.outcome,"hit");
    assert.equal(h.resolved.filter(r=>r.skillId==="ground").length,1);
    assert.equal(h.session.snapshot().fighters.player.hp,77);
    assert.equal(h.runtime.reportGroundApproachEnd({actorId:"opponent",targetId:"player",skillId:"ground"}).ok,false);
  }finally{h.runtime.dispose();}
});
