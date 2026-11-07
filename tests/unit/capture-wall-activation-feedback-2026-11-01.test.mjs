import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {combat1v1SkillTargetIdV1} from "../../src/ui/combat-test-ui.js";
import {humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {exportCaptureSkillTransferJsonV1,importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const preset=JSON.parse(readFileSync(new URL(
  "../../data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json",import.meta.url
),"utf8")).draft.definition;
// Regression copy of the player export: contact form, self relation,
// 5 energy / 900ms cast and official glace -> barrier HP scaling.
const authored=normalizeSkillDefinition({...preset,form:"contact",energyCost:5,
 preparationMs:900,cooldownMs:45000,
 effects:[{kind:"summon_entity",targetScope:"self",entityKind:"barrier",
 statId:"glace",hpPerStatPoint:1,interceptKinds:["projectile","beam","contact"],
 spriteAssetId:"pack:capture:sprite-status-stone-shell-01",visualScale:1,
 offsetForwardPx:0,offsetUpPx:0}]});
const session=glace=>createCombatSession({fighters:[
 {id:"player",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace}},
 {id:"opponent",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
]});

test("player export: a wall with zero Glace is rejected before charging energy or cooldown",()=>{
 const battle=session(0),before=battle.snapshot();
 const preview=battle.previewSkill({actorId:"player",targetId:"player",skill:authored});
 assert.equal(preview.ok,false);
 assert.equal(preview.outcome,"no_stat_points");
 assert.equal(preview.statId,"glace");
 const attempt=battle.startSkill({actorId:"player",targetId:"player",skill:authored});
 assert.equal(attempt.ok,false);assert.equal(attempt.outcome,"no_stat_points");
 assert.equal(battle.snapshot().fighters.player.energy,before.fighters.player.energy);
 assert.deepEqual(battle.snapshot().fighters.player.skillCooldowns,before.fighters.player.skillCooldowns);
 assert.equal(battle.snapshot().combatEntities.length,0);
});

test("player export: nonzero Glace consumes 5 energy and creates exactly one visible-state barrier",()=>{
 const battle=session(7),started=battle.startSkill({actorId:"player",targetId:"player",skill:authored});
 assert.equal(started.ok,true);
 assert.equal(battle.snapshot().fighters.player.energy,5);
 const done=battle.completeSkill({action:started.action});
 assert.equal(done.ok,true);
 assert.equal(battle.snapshot().combatEntities.length,1);
 assert.equal(battle.snapshot().combatEntities[0].hp,7);
 assert.equal(battle.snapshot().combatEntities[0].spriteAssetId,
   "pack:capture:sprite-status-stone-shell-01");
});

test("1v1 button and preview select caster for self-only skills; enemy attacks retain opponent",()=>{
 assert.equal(combat1v1SkillTargetIdV1("player",authored),"player");
 assert.equal(combat1v1SkillTargetIdV1("player",
   {...authored,targetRelations:["enemy"]}),"opponent");
});

// The official preset now matches the user's approved level-10 export.
// Transfer and editor fields must preserve that level without a manual import.
test("the official player-authored level-10 wall round-trips transfer and editor",()=>{
 const old=JSON.parse(readFileSync(new URL(
   "../../data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json",import.meta.url
 ),"utf8")).draft;
 assert.equal(old.requiredLevel,10,"official player preset must be level 10");
 const edited={...old,requiredLevel:10,
   definition:{...old.definition,form:"self",energyCost:5,preparationMs:900,
     effects:[...authored.effects]}};
 const transfer=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(edited));
 assert.equal(transfer.kind,"skill");
 assert.equal(transfer.value.draft.id,old.id);
 assert.equal(transfer.value.draft.requiredLevel,10);
 const fields=humanSkillEditorFieldsFromDraftV1(transfer.value.draft);
 assert.equal(fields.requiredLevel,10);
 assert.equal(fields.form,"self");
 assert.equal(fields.effects[0].spriteAssetId,"pack:capture:sprite-status-stone-shell-01");
});
