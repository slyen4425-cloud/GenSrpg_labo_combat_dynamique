import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeBattleFormatDefinition } from "../../src/contracts/battle-format-definition.js";
import {
  combatSkillTargetOptionsV1,
  resolveCombatSkillClickTargetV1
} from "../../src/ui/combat-2v2-test-ui.js";

function format(perTeam) {
  const allies = Array.from({length:perTeam},(_,i) => "hero-" + (i+1));
  const enemies = Array.from({length:perTeam},(_,i) => "foe-" + (i+1));
  const actors = [...allies.map((actorId,i)=>({
    actorId, teamId:"friendly", creatureId:"c-"+actorId,
    displayName:actorId,fighterConfigId:"c-"+actorId,
    controllerId:i===0?"human-local":"ai-ally"
  })),...enemies.map(actorId=>({
    actorId, teamId:"hostile", creatureId:"c-"+actorId,
    displayName:actorId,fighterConfigId:"c-"+actorId,
    controllerId:"ai-enemy"
  }))];
  return normalizeBattleFormatDefinition({
    id:"implicit-target-"+perTeam,localActorId:"hero-1",
    teams:{friendly:allies,hostile:enemies},actors
  });
}

const skill = (...relations) => ({targetRelations:relations});

function target(format, definition, selectedTargetId, {
  deadIds = [], unavailableIds = [], absentIds = []
} = {}) {
  const state = {fighters:Object.fromEntries(format.actors.map(
    actor => [actor.actorId,{hp:deadIds.includes(actor.actorId)?0:100}]
  ))};
  const options = combatSkillTargetOptionsV1({
    format,actorId:format.localActorId,skill:definition,state,
    isPresent:actorId=>!absentIds.includes(actorId),
    previewSkill:({targetId})=>({ok:!unavailableIds.includes(targetId)})
  });
  return {options,targetId:resolveCombatSkillClickTargetV1({
    actorId:format.localActorId,skill:definition,selectedTargetId,
    availableIds:options.availableIds
  })};
}

test("1v1 self-only ability immediately targets the caster although opponent is selected", () => {
  const result=target(format(1),skill("self"),"foe-1");
  assert.deepEqual(result.options.availableIds,["hero-1"]);
  assert.equal(result.targetId,"hero-1");
});

test("1v1 enemy-only ability immediately targets opponent after casting on self", () => {
  const result=target(format(1),skill("enemy"),"hero-1");
  assert.deepEqual(result.options.availableIds,["foe-1"]);
  assert.equal(result.targetId,"foe-1");
});

test("2v2 self-only ability ignores previously selected enemy or ally", () => {
  for(const selectedTargetId of ["foe-1","hero-2"]) {
    assert.equal(target(format(2),skill("self"),selectedTargetId).targetId,"hero-1");
  }
});

test("2v2 enemy targeting honors a deliberate enemy selection and requires choice after selecting an ally", () => {
  const battle=format(2);
  assert.equal(target(battle,skill("enemy"),"foe-2").targetId,"foe-2");
  assert.equal(target(battle,skill("enemy"),"hero-1").targetId,null);
  assert.equal(target(battle,skill("enemy"),"hero-2").targetId,null);
});

test("2v2 auto-picks only remaining available enemy, but never picks a KO/absent/unavailable actor", () => {
  const battle=format(2),attack=skill("enemy");
  assert.equal(target(battle,attack,"hero-1",{deadIds:["foe-2"]}).targetId,"foe-1");
  assert.equal(target(battle,attack,"hero-1",{absentIds:["foe-1"]}).targetId,"foe-2");
  assert.equal(target(battle,attack,"hero-1",{unavailableIds:["foe-2"]}).targetId,"foe-1");
  assert.equal(target(battle,attack,"hero-1",{unavailableIds:["foe-1","foe-2"]}).targetId,null);
});

test("ally-targeted support and mixed self/ally preserve explicit choice rather than forced self", () => {
  const battle=format(2);
  assert.equal(target(battle,skill("ally"),"foe-1").targetId,null);
  assert.equal(target(battle,skill("ally"),"hero-2").targetId,"hero-2");
  assert.equal(target(battle,skill("self","ally"),"foe-1").targetId,null);
  assert.equal(target(battle,skill("self","ally"),"hero-1").targetId,"hero-1");
  assert.equal(target(battle,skill("self","ally"),"hero-2").targetId,"hero-2");
});

test("only actually available actors can ever be auto-activated", () => {
  const battle=format(1);
  assert.equal(target(battle,skill("self"),"foe-1",{unavailableIds:["hero-1"]}).targetId,null);
  assert.equal(target(battle,skill("self"),"foe-1",{deadIds:["hero-1"]}).targetId,null);
  assert.equal(target(battle,skill("enemy"),"hero-1",{deadIds:["foe-1"]}).targetId,null);
  assert.equal(target(battle,skill("enemy"),"hero-1",{unavailableIds:["foe-1"]}).targetId,null);
});

test("combat skill button and target-required indicator use the same resolver, without rewriting rules", async () => {
  const source=await readFile(new URL("../../src/ui/combat-2v2-test-ui.js",import.meta.url),"utf8");
  assert.match(source,/function renderAvailability\(\)[\s\S]*resolveCombatSkillClickTargetV1/);
  assert.match(source,/const onClick = \(\) => \{[\s\S]*resolveCombatSkillClickTargetV1/);
  assert.match(source,/activateLocalSkill\(skill, resolvedTargetId\)/);
  assert.match(source,/runtime\.startSkill\(/);
});


test("1v1 positive ability allowing self OR ally launches immediately when only caster is available", () => {
  const result=target(format(1),skill("self","ally"),"foe-1");
  assert.deepEqual(result.options.availableIds,["hero-1"]);
  assert.equal(result.targetId,"hero-1");
});

test("2v2 supportive ability auto-selects only eligible ally without bypassing preview/KO", () => {
  const battle=format(2),support=skill("self","ally");
  assert.equal(target(battle,support,"foe-1",{deadIds:["hero-2"]}).targetId,"hero-1");
  assert.equal(target(battle,support,"foe-1",{unavailableIds:["hero-1"]}).targetId,"hero-2");
  assert.equal(target(battle,support,"foe-1",{unavailableIds:["hero-1","hero-2"]}).targetId,null);
  assert.equal(target(battle,support,"foe-1").targetId,null,"two valid support targets still require choice");
});

test("authored Charge tellurique keeps its self-only target and can cast from an enemy selection", async () => {
  const json=JSON.parse(await readFile(new URL("../../data/capture/showcase/cap_earth_atk_3.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
  const { adaptCaptureSkillToSkillDefinition }=await import("../../src/adapters/input/capture/capture-skill-to-skill-definition.js");
  const definition=adaptCaptureSkillToSkillDefinition({id:json.draft.id,definition:json.draft.definition});
  assert.equal(definition.name,"Charge tellurique");
  assert.deepEqual(definition.targetRelations,["self"]);
  assert.equal(target(format(1),definition,"foe-1").targetId,"hero-1");
});
