import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";

const fixture=JSON.parse(readFileSync(new URL("../../data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
const expected={
  tickIntervalMs:750,maxDurationMs:3500,maxTicks:4,energyCostPerTick:3,
  stopOnDamage:false,stopOnStun:true,stopOnSilence:false,
  effects:[{kind:"heal",targetScope:"self",amount:12}]
};
const fields=()=>({
  ...humanSkillEditorFieldsFromDraftV1(fixture),
  category:"heal",form:"beam",approachMode:"none",
  contactHold:null,chargedAttack:null,chargedEffects:null,
  effects:[],channeling:expected,
  preparationMs:0,travelMs:0
});

test("channeling authoring draft preserves all typed controls through save, reload and export",()=>{
  const drafted=buildHumanSkillDraftV1(fields());
  assert.deepEqual(drafted.definition.channeling,expected);
  const restored=humanSkillEditorFieldsFromDraftV1(drafted);
  assert.deepEqual(restored.channeling,expected);
  assert.deepEqual(buildHumanSkillDraftV1(restored).definition.channeling,expected);
});

test("channeling explanation displays frequency, energy, count, interruption and native pulses",()=>{
  const drafted=buildHumanSkillDraftV1(fields());
  const description=describeCaptureSkillV1(drafted.definition).sentences.join(" ");
  assert.match(description,/canalis/i);
  assert.match(description,/750/);
  assert.match(description,/3 énergie|3 points d'énergie/i);
  assert.match(description,/4/);
  assert.match(description,/soin|PV|rend/i);
});

test("channeling is rejected if paired with old attack charge, contact hold or instant effects",()=>{
  assert.throws(()=>buildHumanSkillDraftV1({...fields(),
    chargedEffects:{maxCharges:2,reactivationWindowMs:450,potencyIncreasePct:10,sizeIncreasePct:0}}),/channel|canalis/i);
  assert.throws(()=>buildHumanSkillDraftV1({...fields(),
    effects:[{kind:"damage",targetScope:"target",amount:5}]}),/channel|canalis/i);
  assert.throws(()=>buildHumanSkillDraftV1({...fields(),
    channeling:{...expected,effects:[{kind:"restore_energy",targetScope:"self",amount:4}]}}),/channel|canalis|unsupported/i);
});

test("real editor markup and handlers expose a distinct channeling authoring area",()=>{
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const script=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  for(const selector of [
    "data-skill-channeling-enabled","data-skill-channeling-interval",
    "data-skill-channeling-duration","data-skill-channeling-max-ticks",
    "data-skill-channeling-energy","data-skill-channeling-stop-damage",
    "data-skill-channeling-stop-stun","data-skill-channeling-stop-silence",
    "data-skill-channeling-effects-host","data-skill-channeling-effect-add"
  ]){
    assert.ok(html.includes(selector),"missing native authoring control: "+selector);
    assert.ok(script.includes(selector),"missing authoring read/write: "+selector);
  }
});
