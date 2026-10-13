import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { mountCaptureEditorCombatTeamControlsV1 } from "../../src/ui/capture-editor-combat-test-v1.js";
import { normalizeBattleFormatDefinition } from "../../src/contracts/battle-format-definition.js";
import { createLocalControlSelectionV1, buildCoop2v2AiControllerSpecs } from "../../src/ui/combat-2v2-test-ui.js";

function battle(allyController) {
  return normalizeBattleFormatDefinition({
    id:"test-dual-human",localActorId:"local-1",
    teams:{"players":["local-1","local-2"],"enemies":["opponent-1","opponent-2"]},
    actors:[
      {actorId:"local-1",teamId:"players",creatureId:"wolf",displayName:"Wolf",fighterConfigId:"fighter-wolf",controllerId:"human-local"},
      {actorId:"local-2",teamId:"players",creatureId:"golem",displayName:"Golem",fighterConfigId:"fighter-golem",controllerId:allyController},
      {actorId:"opponent-1",teamId:"enemies",creatureId:"bird",displayName:"Bird",fighterConfigId:"fighter-bird",controllerId:"ai-enemy"},
      {actorId:"opponent-2",teamId:"enemies",creatureId:"fish",displayName:"Fish",fighterConfigId:"fighter-fish",controllerId:"ai-enemy"}
    ]
  });
}
const ids={"local-1":["claw"],"local-2":["stone"],"opponent-1":["wind"],"opponent-2":["water"]};

test("legacy human + IA ally remains the default control mode, target actor does not change it",()=>{
  const format=battle("ai-ally"),changes=[], selection=createLocalControlSelectionV1({format,onChange:(...a)=>changes.push(a)});
  assert.equal(selection.mode,"human-ai");
  assert.equal(selection.actorId,"local-1");
  assert.equal(selection.select("local-2").ok,false);
  assert.equal(selection.select("opponent-1").ok,false);
  assert.equal(selection.actorId,"local-1");
  assert.deepEqual(changes,[]);
  assert.deepEqual(buildCoop2v2AiControllerSpecs({format,skillIdsByActor:ids}).map(x=>x.actorId),["local-2","opponent-1","opponent-2"]);
});
test("solo local dual human mode can switch A->B->A without editing BattleFormat",()=>{
  const format=battle("human-local"), calls=[];
  const selection=createLocalControlSelectionV1({format,onChange:(next,prev)=>calls.push([next,prev])});
  assert.equal(selection.mode,"solo-dual");
  assert.equal(selection.actorId,"local-1");
  assert.equal(selection.select("local-2").ok,true);
  assert.equal(selection.actorId,"local-2");
  assert.equal(selection.select("local-2").changed,false);
  assert.equal(selection.select("local-1").ok,true);
  assert.equal(selection.actorId,"local-1");
  assert.deepEqual(calls,[["local-2","local-1"],["local-1","local-2"]]);
  assert.equal(format.localActorId,"local-1");
  assert.deepEqual(buildCoop2v2AiControllerSpecs({format,skillIdsByActor:ids}).map(x=>x.actorId),["opponent-1","opponent-2"]);
});
test("future remote human controller is not impersonated by local player or AI",()=>{
  const format=battle("human-remote");
  const selection=createLocalControlSelectionV1({format});
  assert.equal(selection.mode,"human-ai");
  assert.equal(selection.select("local-2").ok,false);
  assert.deepEqual(buildCoop2v2AiControllerSpecs({format,skillIdsByActor:ids}).map(x=>x.actorId),["opponent-1","opponent-2"]);
});


test("two real native actions survive local HUD switching and keep actor-specific energy",()=>{
  const format=battle("human-local");
  const fighter={maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,
    energyChargeAmount:1,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0};
  const session=createCombatSession({battleFormat:format,fighters:
    format.actors.map(actor=>({...fighter,id:actor.actorId}))});
  const runtime=createCombatRuntime({session,now:()=>0,setTimer:()=>1,clearTimer:()=>{}});
  try {
    const skill=normalizeSkillDefinition({id:"test-dual-hit",name:"Hit",category:"offensive",form:"projectile",
      allowedDistances:["short","medium","long"],energyCost:2,preparationMs:1000,travelMs:1000,
      recoveryMs:0,effect:{damage:5}});
    const control=createLocalControlSelectionV1({format});
    assert.equal(runtime.startSkill({actorId:control.actorId,targetId:"opponent-1",skill}).ok,true);
    const firstAction=runtime.activeActionFor("local-1");
    const firstEnergy=session.snapshot().fighters["local-1"].energy;
    assert.ok(firstAction);
    control.select("local-2");
    assert.equal(runtime.activeActionFor("local-1"),firstAction,"switch must not cancel active cast");
    assert.equal(runtime.startSkill({actorId:control.actorId,targetId:"opponent-2",skill}).ok,true);
    assert.ok(runtime.activeActionFor("local-2"));
    assert.equal(runtime.activeActionFor("local-1"),firstAction);
    assert.equal(session.snapshot().fighters["local-1"].energy,firstEnergy,"switch cannot reset energy");
    assert.equal(session.snapshot().fighters["local-2"].energy,8,"second actor pays its own skill cost");
    control.select("local-1");
    assert.equal(runtime.activeActionFor("local-2")?.actorId,"local-2");
  } finally {runtime.dispose();}
});

test("editor test scenario retains default AI and only exposes solo for 2v2",()=>{
  const changeHandlers=new Map();
  function select(value) {
    return {value,options:[],hidden:false,disabled:false,textContent:"",
      addEventListener(type,fn){changeHandlers.set(this,fn);},
      removeEventListener(){},append(option){this.options.push(option);}};
  }
  const localCount=select("2"),opponentCount=select("2");
  const active=select("2");
  active.options=[{value:"1",disabled:false},{value:"2",disabled:false}];
  const ally=select("solo");
  const locals=Array.from({length:5},()=>select("wolf"));
  const opponents=Array.from({length:6},()=>select("wolf"));
  const root={
    querySelector(q) {
      if(q==="[data-test-local-team-size]")return localCount;
      if(q==="[data-test-opponent-team-size]")return opponentCount;
      if(q==="[data-active-per-team]")return active;
      if(q==="[data-test-ally-control-mode]")return ally;
      if(q==="[data-test-current-creature]")return {textContent:""};
      return null;
    },
    querySelectorAll(q) {
      if(q==="[data-test-local-creature]")return locals;
      if(q==="[data-test-opponent-creature]")return opponents;
      return [];
    },
    ownerDocument:{createElement(tag){return {tagName:tag.toUpperCase(),value:"",textContent:""};}}
  };
  const records=new Map([["wolf",{draft:{id:"wolf",displayName:"Wolf"}}]]);
  const controls=mountCaptureEditorCombatTeamControlsV1({root,configuredCreatures:records,getSelectedCreatureId:()=>"wolf"});
  try {
    assert.equal(ally.disabled,false);
    assert.equal(controls.read().allyControlMode,"solo");
    ally.value="ai";
    assert.equal(Object.hasOwn(controls.read(),"allyControlMode"),false,"old AI export stays unchanged");
    ally.value="solo";active.value="1";
    changeHandlers.get(active)();
    assert.equal(ally.disabled,true);
    assert.equal(Object.hasOwn(controls.read(),"allyControlMode"),false);
  } finally {controls.dispose();}
});
