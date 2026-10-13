import test from "node:test";
import assert from "node:assert/strict";
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
