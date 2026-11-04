import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";
const raw=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const baseSkill=JSON.parse(raw("data/capture/showcase/pique_glace.capture-skill-transfer-v1.json")).draft;
test("RED: under-target FX uses validated V14 offsets independent of motion and native combat",()=>{
 const before=baseSkill.presentation;
 const result=normalizeSkillPresentationBinding({...before,version:14,sourceVersion:10,
  visual:{...before.visual,travel:{...before.visual.travel,groundMotion:"fixed",groundOffsetXPx:15,groundOffsetYPx:35,groundRisePx:90}}});
 assert.equal(result.visual.travel.groundMotion,"fixed");
 assert.equal(result.visual.travel.groundOffsetYPx,35);
 assert.equal(result.visual.travel.groundRisePx,90);
 assert.throws(()=>normalizeSkillPresentationBinding({...before,version:14,sourceVersion:10,
  visual:{...before.visual,travel:{...before.visual.travel,groundMotion:"teleport"}}}),/groundMotion/);
});
test("RED: old skills keep their original normalized travel and gameplay",()=>{
 const {sourceVersion:_source,...historical}=baseSkill.presentation;
 const {groundMotion:_m,groundOffsetXPx:_x,groundOffsetYPx:_y,groundRisePx:_rise,...oldTravel}=historical.visual.travel;
 const x=normalizeSkillPresentationBinding({...historical,version:10,
   visual:{...historical.visual,travel:oldTravel}});
 assert.equal(x.version,10);
 assert.equal(x.visual.travel.trajectoryMode,"under_target");
 assert.equal(x.visual.travel.groundMotion,undefined);
});
test("RED: creator settings persist separate feet position and movement parameters",()=>{
 const editor=raw("src/ui/capture-editor-human-v2.js");
 const html=raw("examples/dom-demo/capture-editor-v2.html");
 for(const v of ["data-skill-ground-offset-x","data-skill-ground-offset-y","data-skill-ground-motion","data-skill-ground-rise-px"]) {
  assert.ok(html.includes(v),v);
  assert.ok(editor.includes(v),v);
 }
 assert.match(editor,/groundMotion/);
 assert.match(editor,/sourceVersion/);
});
test("RED: target feet sprite can play fixed without native travel translation",()=>{
 const code=raw("src/adapters/renderer/dom-skill-fx.js");
 assert.match(code,/groundMotion/);
 assert.match(code,/groundOffsetYPx/);
 assert.match(code,/groundRisePx/);
});
test("RED: one shared registry-backed filter rebuilds native skill and creature menus for Android",()=>{
 const editor=raw("src/ui/capture-editor-human-v2.js");
 const owner=raw("src/ui/capture-reference-element-filter-v1.js");
 assert.match(editor,/createCaptureReferenceElementFiltersV1/);
 assert.match(editor,/referenceElementFilters\.refresh\(\)/);
 assert.match(owner,/original=now\.map\(node=>node\.cloneNode\(true\)\)/);
 assert.match(owner,/select\.replaceChildren\(\.\.\.visible\)/);
 assert.match(owner,/option\.value===selected/);
 assert.match(owner,/filter\.dataset\.skillElementFilter="true"/);
 assert.match(owner,/configuredCreatures\.get\(id\)/);
 assert.match(owner,/configuredSkills\.get\(id\)/);
});
