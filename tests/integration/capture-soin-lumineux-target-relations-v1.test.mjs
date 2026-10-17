import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { humanSkillTargetRelationsFromTacticalEffectsV1 } from "../../src/ui/capture-editor-human-v2.js";
import { combatSkillTargetOptionsV1 } from "../../src/ui/combat-2v2-test-ui.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { normalizeBattleFormatDefinition } from "../../src/contracts/battle-format-definition.js";
import { isSkillTargetAllowed } from "../../src/core/combat/targeting.js";

const skillPath = "data/capture/showcase/cap_light_special_1.capture-skill-transfer-v1.json";
const loadSkill = async () => importCaptureTransferJsonV1(await readFile(new URL("../../"+skillPath,import.meta.url),"utf8")).value.draft;
const format = normalizeBattleFormatDefinition({
  id:"soin-lumineux-2v2",localActorId:"player",
  teams:{heroes:["player","ally"],foes:["enemy","enemy-2"]},
  actors:[
    {actorId:"player",teamId:"heroes",creatureId:"crea-player",displayName:"Player",fighterConfigId:"crea-player",controllerId:"human-local"},
    {actorId:"ally",teamId:"heroes",creatureId:"crea-ally",displayName:"Ally",fighterConfigId:"crea-ally",controllerId:"ai-ally"},
    {actorId:"enemy",teamId:"foes",creatureId:"crea-enemy",displayName:"Enemy",fighterConfigId:"crea-enemy",controllerId:"ai-enemy"},
    {actorId:"enemy-2",teamId:"foes",creatureId:"crea-enemy-2",displayName:"Enemy 2",fighterConfigId:"crea-enemy-2",controllerId:"ai-enemy"}
  ]
});
const fighter = id => ({id,maxHp:100,initialHp:40,maxEnergy:25,initialEnergy:25,
  energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const session = () => createCombatSession({distance:"medium",
  fighters:["player","ally","enemy","enemy-2"].map(fighter),battleFormat:format});

test("RED: Soin lumineux author skill keeps its effects but cannot target enemies", async () => {
  const draft=await loadSkill(), skill=draft.definition;
  assert.deepEqual(skill.targetRelations,["ally","self"]);
  assert.deepEqual(skill.targetLocations,["active","reserve"]);
  assert.equal(skill.category,"heal");
  assert.deepEqual(skill.effects.map(effect=>effect.kind),["heal","consume_marker"]);
  assert.equal(skill.effects[0].amount,35);
  assert.deepEqual([skill.energyCost,skill.preparationMs,skill.cooldownMs],[5,500,30000]);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(path=>path===skillPath).length,1);
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft,draft);
});

test("RED: editor derives ally and self for healing + marker cleansing, without reopening enemy",async () => {
  const draft=await loadSkill();
  assert.deepEqual(humanSkillTargetRelationsFromTacticalEffectsV1(
    draft.definition.effects,{form:draft.definition.form}
  ),["ally","self"]);
  assert.deepEqual(humanSkillTargetRelationsFromTacticalEffectsV1(
    [{kind:"consume_marker",targetScope:"target",markerId:"venin-static",count:"all",minimum:1,effects:[]}],
    {form:"projectile"}
  ),["enemy"],"marker-only offensive skill retains historical enemy default");
});

test("RED: actual Combat Rules and 2v2 targeting refuse enemies, still permit ally and self",async()=>{
  const {definition:skill}=await loadSkill();
  const s=session();
  for(const targetId of ["enemy","enemy-2"]) {
    assert.equal(isSkillTargetAllowed({format,actorId:"player",targetId,skill}).ok,false);
    assert.equal(s.previewSkill({actorId:"player",targetId,skill}).ok,false);
  }
  for(const targetId of ["player","ally"]) {
    assert.equal(isSkillTargetAllowed({format,actorId:"player",targetId,skill}).ok,true);
    assert.equal(s.previewSkill({actorId:"player",targetId,skill}).ok,true);
  }
  const targets=combatSkillTargetOptionsV1({
    format,actorId:"player",skill,state:s.snapshot(),
    previewSkill: options=>s.previewSkill(options)
  });
  assert.deepEqual(targets.allowedIds,["player","ally"]);
  assert.deepEqual(targets.availableIds,["player","ally"]);
  const healed=s.useSkill({actorId:"player",targetId:"ally",skill});
  assert.equal(healed.ok,true);
  assert.equal(s.snapshot().fighters.ally.hp,75);
  assert.equal(s.snapshot().fighters.enemy.hp,40);
  assert.equal(s.snapshot().fighters.player.energy,20);
});


test("Soin lumineux reserve target: own and ally bench succeed, opponent bench rejected before energy cost",async()=>{
  const {definition:skill}=await loadSkill();
  const {createRosterSession}=await import("../../src/core/combat/roster-session.js");
  const member=(id)=>({id,creatureId:id,displayName:id,fighterConfigId:id});
  const pairs=[["player","p0","p1"],["ally","a0","a1"],["enemy","e0","e1"],["enemy-2","e20","e21"]];
  const conf=Object.fromEntries(pairs.flatMap(([,a,b])=>[a,b]).map(id=>[id,fighter(id)]));
  const makeHarness=()=>{
    const combat=createCombatSession({distance:"medium",battleFormat:format,
      fighters:pairs.map(([slot,a])=>({...conf[a],id:slot}))});
    const rosters=Object.fromEntries(pairs.map(([slot,a,b])=>[slot,{
      slotId:slot,activeMemberId:a,members:[member(a),member(b)]
    }]));
    const roster=createRosterSession({combatSession:combat,fighterConfigs:conf,
      battleFormat:format,roster:{teams:rosters}});
    return {combat,roster};
  };
  for(const [teamId,memberId] of [["enemy","e1"],["enemy-2","e21"]]){
    const {combat,roster}=makeHarness();
    const result=roster.useSkillOnTarget({actorId:"player",
      targetRef:{scope:"reserve",teamId,memberId},skill});
    assert.equal(result.ok,false,teamId+" reserve cannot receive healing");
    assert.equal(combat.snapshot().fighters.player.energy,25);
    assert.equal(roster.reserveMemberSnapshot(teamId,memberId).hp,40);
  }
  for(const [teamId,memberId] of [["player","p1"],["ally","a1"]]){
    const {combat,roster}=makeHarness();
    const result=roster.useSkillOnTarget({actorId:"player",
      targetRef:{scope:"reserve",teamId,memberId},skill});
    assert.equal(result.ok,true,teamId+" allied reserve should be healable: "+result.outcome);
    assert.equal(roster.reserveMemberSnapshot(teamId,memberId).hp,75);
    assert.equal(roster.reserveMemberSnapshot("enemy","e1").hp,40);
    assert.equal(combat.snapshot().fighters.player.energy,20);
  }
});
