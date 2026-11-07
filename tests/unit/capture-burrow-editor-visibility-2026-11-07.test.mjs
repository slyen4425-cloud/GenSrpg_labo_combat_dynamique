import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

test("RED: the author approach must be assigned before burrow fieldset visibility is hydrated",()=>{
 const src=read("src/ui/capture-editor-human-v2.js");
 const writer=src.slice(src.indexOf("function writeSkillDraftFields("),src.indexOf("function prepareNewSkillDraftFields("));
 const fieldLoop=writer.indexOf("for (const [selector, value] of values)");
 const burrowWriter=writer.indexOf("writeBurrowStageFieldsV1(root, fields.presentation)");
 assert.ok(fieldLoop>=0&&burrowWriter>fieldLoop,"stage visibility must read the newly selected approachMode, not the previous skill's");
 assert.match(writer,/fields\.approachMode === "burrow"[\s\S]*?data-editor-card-toggle/);
 const fresh=src.slice(src.indexOf("function prepareNewSkillDraftFields("),src.indexOf("function creatureAudioAssetId("));
 assert.match(fresh,/writeBurrowStageFieldsV1\(root\)/,"a new skill must reset the old burrow controls");
});

test("RED: the UI still has all three editable terrain animations and their saved values",()=>{
 const html=read("examples/dom-demo/capture-editor-v2.html");
 for(const stage of ["start","travel","impact"]){
  for(const field of ["asset","scale","x","y","frame-ms"])
   assert.match(html,new RegExp("data-burrow-"+stage+"-"+field+"\\b"),"missing "+stage+" "+field);
 }
 assert.match(html,/data-burrow-stage-fields hidden/);
 const skill=read("data/capture/showcase/attaque-sous-terraine.capture-skill-transfer-v1.json");
 const draft=JSON.parse(skill).draft;
 assert.equal(draft.definition.approachMode,"burrow");
 assert.deepEqual(["start","travel","impact"].map(x=>draft.presentation.visual.burrowTerrain[x].scale),[1.5,1.5,1]);
 assert.deepEqual(["start","travel","impact"].map(x=>draft.presentation.visual.burrowTerrain[x].offsetY),[-25,-50,0]);
 assert.equal(draft.requiredLevel,10);
});
