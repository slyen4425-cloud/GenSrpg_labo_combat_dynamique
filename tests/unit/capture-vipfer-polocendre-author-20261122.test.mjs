import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureCreatureTransferV1} from "../../src/contracts/capture-creature-transfer-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const registry=read("data/capture/monster-capture-stat-registry.v1.json");
const specs=[["Vipfer","steel","serpentine","dodge",20,"pack:capture:creature-vipfer-icon-01"],
 ["polocendre","fire","quadruped","defense",10,"pack:capture:creature-cheval-de-feu-icon-v1"]];
test("both author exports are published exactly once, with unchanged native loadouts",()=>{
 for(const [id,element,profile,reaction,speed,icon] of specs){
  const p="data/capture/showcase/"+id+".capture-creature-transfer-v1.json";
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===p).length,1,id);
  const record=normalizeCaptureCreatureTransferV1(read(p),registry);
  assert.equal(record.draft.id,id);assert.equal(record.draft.displayName,id==="Vipfer"?"Vipfer":"Polocendre");
  assert.deepEqual(record.draft.elements,[element]);assert.equal(record.draft.capture.rarity,"mythic");
  assert.equal(record.draft.combat.maxHp,170);assert.equal(record.draft.combat.reaction.type,reaction);
  assert.equal(record.statValues.creatureId,id);assert.equal(record.statValues.values.health,170);
  assert.equal(record.statValues.values.speed,speed);
  assert.equal(record.loadout.creatureId,id);assert.equal(record.loadout.slots.length,5);
  assert.equal(new Set(record.loadout.slots.map(x=>x.skillId)).size,5);
  assert.equal(record.draft.presentation.subjectId,id);assert.equal(record.draft.presentation.profileId,profile);
  assert.equal(record.draft.presentation.visual.icon.assetId,icon);
  assert.ok(record.draft.presentation.visual.front.assetId);
  assert.ok(record.draft.presentation.visual.back.assetId);
  const ids=id==="Vipfer" ? ["claw","fireball","cap_fire_special_1","lib_flame_bite","cap_fire_atk_6"] : ["polocendre-charge","polocendre-trainee-feu","polocendre-coup-sabot","cap_fire_atk_5","polocendre-ruee-explosive"];
  assert.deepEqual(record.draft.skillIds,ids);assert.deepEqual(record.loadout.slots.map(x=>x.skillId),ids);
 }
});
test("Polocendre's four animation frame counts match canonical atlas identities",()=>{
 const v=read("data/capture/showcase/polocendre.capture-creature-transfer-v1.json").draft.presentation.visual;
 for(const [field,n] of [["movement",6],["movementBack",7],["rangedAttack",5],["rangedAttackBack",5]]){
  assert.equal(v[field].mode,"sprite");assert.equal(v[field].frameCount,n);
  assert.ok(v[field].assetId.endsWith("-"+n+"-v1"));
 }
});
