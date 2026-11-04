import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureAuthorSlugV1} from "../../src/ui/capture-author-id-v1.js";
import {captureMarkerAuthorSlugV1} from "../../src/ui/capture-marker-library-v1.js";
import {suggestCaptureSkillDraftIdFromNameV1,resolveCaptureSkillSaveModeV1} from "../../src/ui/capture-editor-skill-save-mode-v1.js";

test("same immutable author ID owner serves markers and new skills",()=>{
  for(const [name,expected] of [
    ["Armure de pointes","armure-de-pointes"],
    ["Épine d'Acier !","epine-d-acier"],
    [" Rayon  Électrique ","rayon-electrique"],
    ["  ", ""],
    ["Lumière / Ombre","lumiere-ombre"]
  ]) {
    assert.equal(captureAuthorSlugV1(name),expected);
    assert.equal(captureMarkerAuthorSlugV1(name),expected);
  }
});

test("new skill IDs derive from authored names and never overwrite registered names",()=>{
  const ids=["armure-de-pointes","armure-de-pointes-2","rayon-electrique"];
  assert.equal(suggestCaptureSkillDraftIdFromNameV1({name:"Armure de pointes",configuredSkillIds:ids}),"armure-de-pointes-3");
  assert.equal(suggestCaptureSkillDraftIdFromNameV1({name:"Rayon électrique",configuredSkillIds:ids}),"rayon-electrique-2");
  assert.equal(suggestCaptureSkillDraftIdFromNameV1({name:"Épine d'acier",configuredSkillIds:ids}),"epine-d-acier");
  assert.equal(suggestCaptureSkillDraftIdFromNameV1({name:"  ",configuredSkillIds:[]}),"nouvelle-capacite");
  assert.throws(()=>resolveCaptureSkillSaveModeV1({intent:"create",draftId:"armure-de-pointes",configuredSkillIds:ids}),/existe déjà/);
  assert.equal(resolveCaptureSkillSaveModeV1({intent:"update",draftId:"armure-de-pointes",configuredSkillIds:ids}).id,"armure-de-pointes");
});

test("canonical editor only edits user-supplied IDs during new-skill authoring",()=>{
  const js=readFileSync("src/ui/capture-editor-human-v2.js","utf8");
  const html=readFileSync("examples/dom-demo/capture-editor-v2.html","utf8");
  assert.match(js,/const referenceElementFilters=createCaptureReferenceElementFiltersV1/);
  assert.match(js,/if \(!newSkillDraftMode \|\| librarySelect.value!==""\) return;/);
  assert.match(js,/newSkillDraftMode=false;/);
  assert.match(html,/data-skill-id[^>]*readonly/);
  assert.match(html,/data-skill-element-filter/);
});
