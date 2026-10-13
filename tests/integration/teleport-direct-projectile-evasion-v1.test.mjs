import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";

const fighter = id => ({ id, maxHp:100, initialHp:100, maxEnergy:20, initialEnergy:20,
  energyChargeAmount:0, energyChargeIntervalMs:2000, movementEnergyPerStep:0, chargeTimeModifierPct:0 });
function skill(id, form, approachMode, preparationMs, travelMs, damage, projectileTargeting="direct") {
  return normalizeSkillDefinition({id,name:id,category:"offensive",form,approachMode,
    projectileTargeting,energyCost:0,preparationMs,travelMs,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],targetRelations:["enemy"],
    effect:{damage,heal:0,tags:[]}});
}
function scenario({ approach="teleport", prep=200, travel=1600,
  incomingForm="projectile", incomingTargeting="direct", incomingTravel=900,
  ids=["player","opponent"], target="player", attacker="opponent" }={}) {
  const session=createCombatSession({distance:"medium",fighters:ids.map(fighter)});
  let time=0,pending=null,nextTimer=0;
  const resolutions=[];
  const runtime=createCombatRuntime({session,tickMs:25,now:()=>time,
    setTimer(callback){pending=callback;return ++nextTimer;},
    clearTimer(){pending=null;},
    onResolved(x){resolutions.push(x);}
  });
  runtime.start();
  const dodge=skill("evasive-"+approach,"contact",approach,prep,travel,0);
  assert.equal(dodge.evasion.window,null,"no author-managed dodge profile in this test");
  assert.equal(runtime.startSkill({actorId:target,targetId:attacker,skill:dodge}).ok,true);
  const incoming=skill("incoming-"+incomingTargeting,incomingForm,"none",0,incomingTravel,20,incomingTargeting);
  assert.equal(runtime.startSkill({actorId:attacker,targetId:target,skill:incoming}).ok,true);
  function runTo(ms){
    time=ms;
    const callback=pending;
    pending=null;
    assert.equal(typeof callback,"function");
    callback();
    return resolutions.find(x=>x.skillId==="incoming-"+incomingTargeting);
  }
  return {session,runtime,resolutions,runTo};
}

for (const ids of [["player","opponent"],["player-1","player-2","opponent-1","opponent-2"]]) {
  test("teleport disappearance evades direct Fireball without an evasion preset ("+ids.length+" actors)",()=>{
    const target=ids.length===2?"player":"player-2";
    const attacker=ids.length===2?"opponent":"opponent-1";
    const x=scenario({ids,target,attacker});
    const result=x.runTo(900);
    assert.ok(result);
    assert.equal(result.outcome,"evaded");
    assert.equal(result.evasionReason,"teleport_vanish");
    assert.equal(result.evasionApplied,"evasive-teleport");
    assert.equal(result.events.some(e=>e.type==="hit"),false);
    assert.equal(x.session.snapshot().fighters[target].hp,100);
    for(const id of ids)if(id!==target)assert.equal(x.session.snapshot().fighters[id].hp,100);
    x.runtime.dispose();
  });
}
test("teleport during preparation is still vulnerable to direct projectiles",()=>{
  const x=scenario({prep:1200,travel:1600});
  const result=x.runTo(900);
  assert.equal(result?.outcome,"hit");
  assert.equal(x.session.snapshot().fighters.player.hp,80);
  x.runtime.dispose();
});
test("teleport after its reappearance is vulnerable again",()=>{
  const x=scenario({prep:0,travel:300});
  const result=x.runTo(900);
  assert.equal(result?.outcome,"hit");
  assert.equal(x.session.snapshot().fighters.player.hp,80);
  x.runtime.dispose();
});
test("ground and aerial travel do not become blanket protection from direct Fireballs",()=>{
  for(const approach of ["ground","aerial"]){
    const x=scenario({approach});
    const result=x.runTo(900);
    assert.equal(result?.outcome,"hit",approach);
    assert.equal(x.session.snapshot().fighters.player.hp,80,approach);
    x.runtime.dispose();
  }
});
test("teleport still evades falling fixed-point projectile through existing mobility rule",()=>{
  const x=scenario({incomingTargeting:"fixed_point"});
  const result=x.runTo(900);
  assert.equal(result?.outcome,"evaded");
  assert.equal(result.evasionReason,"moving_target");
  assert.equal(x.session.snapshot().fighters.player.hp,100);
  x.runtime.dispose();
});
test("non-projectile AoE is not silently converted into an invulnerability state",()=>{
  const x=scenario({incomingForm:"area"});
  const result=x.runTo(900);
  assert.equal(result?.outcome,"hit");
  assert.equal(x.session.snapshot().fighters.player.hp,80);
  x.runtime.dispose();
});
