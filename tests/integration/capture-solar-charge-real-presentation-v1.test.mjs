import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";

const file = new URL("../../data/capture/showcase/cap_light_atk_3.capture-skill-transfer-v1.json", import.meta.url);
const solar = async () => importCaptureTransferJsonV1(await readFile(file,"utf8")).value.draft.definition;
function presentation() {
  const approaches=[],poses=[];
  const visuals={
    cancelFor() {},
    playEventFor(actorId,type) { poses.push([actorId,type]); return Promise.resolve({status:"finished"}); },
    playApproachFor(actorId,mode,options) {
      approaches.push([actorId,mode,options.targetSlot,options.travelMs]);
      return Promise.resolve({status:"finished"});
    }
  };
  return {approaches,poses,presenter:createCombatResolutionPresenter({visuals})};
}
const action=(skill,actorId,targetId)=>({actionType:"skill",actorId,targetId,skill,
  preparationMs:skill.preparationMs,releaseAtMs:skill.preparationMs,travelMs:skill.travelMs,
  impactAtMs:skill.preparationMs+skill.travelMs,recoveryMs:skill.recoveryMs});

test("RED: real Charge solaire must never move its model into itself for instant self buff",async()=>{
  const skill=await solar();
  assert.equal(skill.category,"offensive","the exact user-exported author category remains intact");
  assert.equal(skill.approachMode,"ground");
  assert.equal(skill.travelMs,0);
  assert.deepEqual(skill.effects.map(e=>e.kind),["apply_status","apply_status","apply_status"]);
  const {approaches,presenter}=presentation();
  presenter.presentRelease({action:action(skill,"local-1","local-1"),actorSlot:"local-1",targetSlot:"local-1"});
  assert.deepEqual(approaches,[],"an instant ally/self buff must not start same-model melee collision animation");
  presenter.dispose();
});
test("RED: real Charge solaire must not ground-charge into a friendly ally for status buffs",async()=>{
  const skill=await solar();
  const {approaches,presenter}=presentation();
  presenter.presentRelease({action:action(skill,"local-1","local-2"),actorSlot:"local-1",targetSlot:"local-2"});
  assert.deepEqual(approaches,[],"buff-only Charge solaire must keep combat visuals without melee collision");
  presenter.dispose();
});
test("Hostile physical contact attack still uses native approach and contact watcher",()=>{
  const skill=normalizeSkillDefinition({id:"hostile-contact",name:"Hostile",category:"offensive",
    form:"contact",approachMode:"ground",travelMs:700,preparationMs:0,recoveryMs:0,cooldownMs:0,
    targetRelations:["enemy"],energyCost:0,effect:{damage:20,heal:0}});
  const {approaches,presenter}=presentation();
  presenter.presentRelease({action:action(skill,"local-1","opponent-1"),actorSlot:"local-1",targetSlot:"opponent-1"});
  assert.equal(approaches.length,1);
  assert.equal(approaches[0][2],"opponent-1");
  presenter.dispose();
});
test("Real zero-time native Runtime completes Charge solaire and permits a following hostile attack",async()=>{
  const skill=await solar();
  const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:30,initialEnergy:30,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
  const format={teamOf:id=>id==="enemy"?"opposing":"local"};
  const session=createCombatSession({distance:"medium",fighters:["player","ally","enemy"].map(fighter),battleFormat:format});
  const {approaches,presenter}=presentation();
  let clock=1000;let pending=()=>{};const results=[];
  const runtime=createCombatRuntime({session,tickMs:25,now:()=>clock,
    setTimer:f=>{pending=f;return 1;},clearTimer:()=>{pending=()=>{};},
    onRelease({action}){presenter.presentRelease({action,actorSlot:action.actorId,targetSlot:action.targetId});},
    onResolved(result){results.push(result);}
  });
  try {
    runtime.start();
    assert.equal(runtime.startSkill({actorId:"player",targetId:"ally",skill}).ok,true);
    assert.equal(runtime.hasActiveAction,false,"no permanent action/recovery after zero-time buff");
    assert.equal(approaches.length,0,"visual cannot start contact movement for beneficent buff");
    assert.equal(results.length,1);
    assert.equal(session.snapshot().fighters.ally.statusEffects.some(e=>e.definition.kind==="outgoing_damage_modifier"),true);
    const strike=normalizeSkillDefinition({id:"normal-strike",name:"Normal strike",category:"offensive",
      form:"projectile",targetRelations:["enemy"],energyCost:0,preparationMs:0,travelMs:500,
      cooldownMs:0,effect:{damage:10,heal:0}});
    assert.equal(runtime.startSkill({actorId:"player",targetId:"enemy",skill:strike}).ok,true,
      "after buff launch action must be available for a normal attack");
    clock+=600;pending();
    assert.equal(runtime.hasActiveAction,false);
  } finally {runtime.dispose();presenter.dispose();}
});
