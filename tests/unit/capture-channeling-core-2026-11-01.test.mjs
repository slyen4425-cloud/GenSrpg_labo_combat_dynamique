import test from "node:test";
import assert from "node:assert/strict";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
const skill=()=>normalizeSkillDefinition({
  id:"ice-channel-test",name:"Piques de glace",category:"offensive",form:"beam",
  element:"ice",approachMode:"none",energyCost:0,preparationMs:0,travelMs:0,
  recoveryMs:0,cooldownMs:0,targetRelations:["enemy"],targetLocations:["active"],
  effect:{damage:0,heal:0,stunMs:0,interruptsPreparation:false,tags:[]},
  channeling:{tickIntervalMs:1000,maxDurationMs:5000,maxTicks:4,energyCostPerTick:3,
    stopOnDamage:true,effects:[{kind:"damage",targetScope:"target",amount:12}]}
});
const session=()=>createCombatSession({fighters:[
  {id:"hero",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10},
  {id:"enemy",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
]});
test("channeling is a normalized skill contract with strict tick budget and effects",()=>{
 const s=skill();assert.equal(s.channeling.tickIntervalMs,1000);
 assert.equal(s.channeling.energyCostPerTick,3);
 assert.equal(s.channeling.effects[0].kind,"damage");
 assert.throws(()=>normalizeSkillDefinition({...s,channeling:{...s.channeling,tickIntervalMs:0}}),/tickIntervalMs/);
 assert.throws(()=>normalizeSkillDefinition({...s,channeling:{...s.channeling,energyCostPerTick:-1}}),/energyCostPerTick/);
 assert.throws(()=>normalizeSkillDefinition({...s,channeling:{...s.channeling,maxTicks:0}}),/maxTicks/);
});
test("native channel tick spends energy once, applies one effect and never hits on rejected tick",()=>{
 const native=session(),s=skill();
 const first=native.applyChannelingTickV1({actorId:"hero",targetId:"enemy",skill:s,atMs:1000});
 assert.equal(first.ok,true);assert.equal(native.snapshot().fighters.hero.energy,7);
 assert.equal(native.snapshot().fighters.enemy.hp,88);
 const second=native.applyChannelingTickV1({actorId:"hero",targetId:"enemy",skill:s,atMs:2000});
 assert.equal(second.ok,true);assert.equal(native.snapshot().fighters.hero.energy,4);
 const third=native.applyChannelingTickV1({actorId:"hero",targetId:"enemy",skill:s,atMs:3000});
 assert.equal(third.ok,true);assert.equal(native.snapshot().fighters.hero.energy,1);
 const beforeHp=native.snapshot().fighters.enemy.hp;
 const rejected=native.applyChannelingTickV1({actorId:"hero",targetId:"enemy",skill:s,atMs:4000});
 assert.equal(rejected.ok,false);assert.equal(rejected.outcome,"insufficient_energy");
 assert.equal(native.snapshot().fighters.enemy.hp,beforeHp);
 assert.equal(native.snapshot().fighters.hero.energy,1);
});
