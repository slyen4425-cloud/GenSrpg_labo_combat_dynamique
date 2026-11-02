import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const raw = path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
test("Pique de glace author export is installed as canonical showcase preserving tick energy and damage",()=>{
 const manifest=raw("src/catalogs/capture-showcase-skill-presets-v1.js");
 assert.match(manifest,/data\/capture\/showcase\/pique_glace\.capture-skill-transfer-v1\.json/);
 const t=JSON.parse(raw("data/capture/showcase/pique_glace.capture-skill-transfer-v1.json"));
 assert.equal(t.draft.id,"pique_glace");
 assert.equal(t.draft.definition.form,"area");
 assert.equal(t.draft.definition.channeling.maxTicks,10);
 assert.equal(t.draft.definition.channeling.energyCostPerTick,3);
 assert.deepEqual(t.draft.definition.effects,[]);
 assert.equal(t.draft.definition.channeling.effects[0].amount,5);
 assert.equal(t.draft.presentation?.visual?.travel?.assetId,"pack:capture:sprite-pointe-glace-01");
 assert.equal(t.draft.presentation?.visual?.travel?.trajectoryMode,"under_target");
});
test("Unified effect selector owns mechanics visibility without displaying independent disclosure headers",()=>{
 const html=raw("examples/dom-demo/capture-editor-v2.html");
 const js=raw("src/ui/capture-editor-human-v2.js");
 assert.match(html,/data-skill-effect-add-kind/);
 for(const attr of ["data-skill-charged-panel","data-skill-charged-effects-panel","data-skill-channeling-section","data-skill-contact-hold"]){
   assert.match(html,new RegExp(attr+"[^>]* hidden"));
 }
 assert.match(js,/syncGuidedEffectPanelsV1/);
 assert.match(js,/\.hidden\s*=\s*selected\s*!==\s*key/);
 assert.match(js,/writeSkillDraftFields\([\s\S]*?syncHumanGuidedSkillEffectPanelsV1/);
});
