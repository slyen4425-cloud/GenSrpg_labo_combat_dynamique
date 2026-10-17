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
  assert.deepEqual([skill.energyCost,skill.preparationMs,skill.cooldownMs],[5,500,45000]);
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
