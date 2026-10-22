import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  captureSkillDraftHasUnsavedChangesV1,
  humanSkillEditorFieldsFromDraftV1,
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";

const raw=JSON.parse(readFileSync(
  new URL("../../data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json",import.meta.url),"utf8"
)).draft;
const clone=x=>JSON.parse(JSON.stringify(x));
function legacy() {
  const skill=clone(raw);
  // Reproduce the historical author-facing scalar damage form that is auto
  // migrated to "effects" when its editor opens, without a user edit.
  skill.definition.effect.damage=3;
  skill.definition.effect.heal=0;
  skill.definition.effect.stunMs=0;
  skill.definition.effect.interruptsPreparation=false;
  skill.definition.effect.tags=[];
  skill.definition.effects=[];
  return skill;
}
function hydrated(skill) {
  return buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1(skill));
}
function dirty(current,saved) {
  return captureSkillDraftHasUnsavedChangesV1({
    currentDraft:current,configuredSkills:new Map([[saved.id,saved]])
  });
}
test("normal same saved/current draft is not dirty; missing skill remains dirty",()=>{
  const saved=clone(raw);
  assert.equal(dirty(saved,saved),false);
  assert.equal(captureSkillDraftHasUnsavedChangesV1({
    currentDraft:saved,configuredSkills:new Map()
  }),true);
});
test("forced-save export regression: legacy damage 3 becomes typed effect 3, without a real edit",()=>{
 const saved=legacy();
 const current=hydrated(saved);
 assert.equal(saved.definition.effect.damage,3);
 assert.deepEqual(saved.definition.effects,[]);
 assert.equal(current.definition.effect.damage,0);
 assert.equal(current.definition.effects.length,1);
 assert.equal(current.definition.effects[0].amount,3);
 const original=JSON.stringify(saved);
 assert.equal(dirty(current,saved),false,
   "purely automatic scalar to typed-effect conversion must not require Save before full DB export");
 assert.equal(JSON.stringify(saved),original,"dirty check must never mutate stored skill");
});
test("real edits (damage, target, name, tags, metadata) still block full database export",()=>{
 const saved=legacy(),base=hydrated(saved);
 const modified=(update)=>{
   const draft=clone(base);
   update(draft);
   assert.equal(dirty(draft,saved),true);
 };
 modified(x=>{x.definition.effects[0].amount=4});
 modified(x=>{x.definition.effects[0].channel="water"});
 modified(x=>{x.definition.effects[0].targetScope="self"});
 modified(x=>{x.definition.name=x.definition.name+" changé"});
 modified(x=>{x.description=x.description+" modifiée"});
 modified(x=>{x.definition.effect.tags=["poison"]});
});
test("mixed legacy damage/heal or statuses cannot be silently treated as clean",()=>{
 const saved=legacy();saved.definition.effect.heal=2;
 const current=hydrated(saved);
 assert.equal(dirty(current,saved),true,"a legacy heal must not be dismissed by a damage-only comparison");
 const stunned=legacy();stunned.definition.effect.stunMs=200;
 assert.equal(dirty(hydrated(stunned),stunned),true);
});
test("unchanged modern tactical effects are compared normally",()=>{
 const saved=hydrated(legacy());
 assert.equal(dirty(clone(saved),saved),false);
 const edited=clone(saved);edited.definition.effects[0].amount=5;
 assert.equal(dirty(edited,saved),true);
});
