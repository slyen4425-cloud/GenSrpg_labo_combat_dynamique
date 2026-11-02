import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1}
 from "../../src/ui/capture-editor-human-v2.js";
const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const template=()=>read("data/capture/showcase/poing_givrant.capture-skill-transfer-v1.json").draft;
test("RED: channeling is editable and survives canonical author import-export without duplicate instant effects",()=>{
 const initial=humanSkillEditorFieldsFromDraftV1(template());
 const fields={...initial,form:"beam",effects:[],chargedAttack:null,chargedEffects:null,
  contactHold:null,channeling:{tickIntervalMs:750,maxDurationMs:4200,maxTicks:5,
  energyCostPerTick:2,stopOnDamage:false,stopOnStun:true,stopOnSilence:true,
  effects:[{kind:"damage",targetScope:"target",amount:12,channel:"ice"}]}};
 const saved=buildHumanSkillDraftV1(fields);
 assert.equal(saved.definition.channeling.tickIntervalMs,750);
 assert.equal(saved.definition.effects.length,0);
 const reloaded=humanSkillEditorFieldsFromDraftV1(saved);
 assert.deepEqual(reloaded.channeling,saved.definition.channeling);
 assert.equal(reloaded.channeling.effects[0].amount,12);
});
test("RED: author UI contains a discoverable channel section and nested effects",()=>{
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 for(const key of ["data-skill-channeling-enabled","data-skill-channeling-interval",
  "data-skill-channeling-duration","data-skill-channeling-max-ticks",
  "data-skill-channeling-energy","data-skill-channeling-effects-host",
  "data-skill-channeling-stop-damage","data-skill-channeling-stop-stun",
  "data-skill-channeling-stop-silence"]) assert.ok(html.includes(key),key);
});
test("RED: every ability selector is filterable by element without losing its selection",()=>{
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 assert.ok(html.includes("data-skill-element-filter"));
 const ui=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 assert.match(ui,/function refreshHumanSkillElementFiltersV1/);
});
