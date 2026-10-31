import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const root = new URL("../../", import.meta.url);
const file = async path => readFile(new URL(path,root));
const published = id => `data/capture/showcase/${id}.capture-skill-transfer-v1.json`;
const archives = new Map([
 ["poing_givrant",["data/capture/source-exports/gensrpg-capture-skill-poing_givrant-2026-10-31.json","385d69ec3a255cde737b78b22745510dcac1d215853ba3827730843af44b164a"]],
 ["boule_neige",["data/capture/source-exports/gensrpg-capture-skill-boule_neige-r2-2026-10-31.json","5c7434c2804d73173d62919aed7b3e4f00f9e651619475622390e7f0f24278b7"]]
]);
test("two ice author exports are preserved byte-for-byte, imported by the canonical owner",async()=>{
 const ids=[];
 for(const [id,[sourcePath,sha]] of archives){
  const original=await file(sourcePath), active=await file(published(id));
  assert.equal(createHash("sha256").update(original).digest("hex"),sha,id+" author SHA256");
  assert.deepEqual(active,original,id+" active payload differs from author export");
  const parsed=importCaptureTransferJsonV1(active.toString("utf8"));
  assert.equal(parsed.kind,"skill");
  assert.equal(parsed.value.draft.id,id);
  assert.equal(parsed.value.draft.definition.id,id);
  ids.push(parsed.value.draft.id);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===published(id)).length,1);
 }
 assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
 assert.equal(new Set(ids).size,2);
});
test("Poing givrant author status is a 20-second double-stack 50% incoming damage vulnerability",async()=>{
 const {value:{draft}}=importCaptureTransferJsonV1((await file(published("poing_givrant"))).toString("utf8"));
 assert.equal(draft.definition.form,"contact");
 assert.equal(draft.definition.element,"ice");
 assert.equal(draft.definition.energyCost,3);
 assert.equal(draft.definition.effects[0].kind,"damage");
 assert.equal(draft.definition.effects[0].amount,15);
 const effect=draft.definition.effects[1];
 assert.equal(effect.kind,"apply_status");
 assert.equal(effect.targetScope,"target");
 assert.equal(effect.status.kind,"incoming_effect_modifier");
 assert.equal(effect.status.polarity,"detrimental");
 assert.equal(effect.status.affectedPolarity,"detrimental");
 assert.equal(effect.status.modifierPct,50);
 assert.equal(effect.status.durationMs,20000);
 assert.equal(effect.status.stacking,"stack");
 assert.equal(effect.status.maxStacks,2);
 assert.equal(draft.presentation.visual.impact.assetId,"pack:capture:sprite-frost-bolt-impact-01");
});
test("Boule de neige r2 author updates visuals without changing native charge/energy semantics",async()=>{
 const {value:{draft}}=importCaptureTransferJsonV1((await file(published("boule_neige"))).toString("utf8"));
 assert.deepEqual(draft.definition.chargedAttack,{baseDamage:3,bonusDamagePerCharge:3,maxCharges:10,reactivationWindowMs:700,sizeIncreasePct:10});
 assert.equal(draft.definition.preparationMs,800);
 assert.equal(draft.definition.travelMs,1100);
 assert.equal(draft.definition.energyCost,1);
 assert.equal(draft.presentation.visual.cast.displayScale,0.8);
 assert.equal(draft.presentation.visual.cast.offsetX,85);
 assert.equal(draft.presentation.visual.cast.playbackMode,"loop");
 assert.equal(draft.presentation.visual.travel.displayScale,1.5);
 assert.equal(draft.presentation.visual.travel.playbackMode,"loop");
 assert.equal(draft.presentation.visual.impact.assetId,"pack:capture:sprite-boule-de-neige-impact-01");
 assert.equal(draft.presentation.visual.cast.assetId,"pack:capture:sprite-boule-de-neige-cast-01");
 assert.equal(draft.presentation.visual.travel.assetId,"pack:capture:sprite-boule-de-neige-projectile-01");
 assert.equal(draft.presentation.feedback.cameraShake.amplitudePx,9);
});

test("public editor import and preview modules use the new single module cache revision",async()=>{
 const paths=[
  "examples/dom-demo/capture-editor-v2.html",
  "examples/dom-demo/capture-editor-v2.js",
  "src/ui/capture-editor-human-v2.js",
  "src/ui/capture-editor-preview-runtime-loader-v1.js",
  "src/ui/capture-combat-preview-v1.js",
  "src/ui/combat-2v2-test-ui.js"
 ];
 for(const path of paths){
  const text=(await file(path)).toString("utf8");
  assert.ok(text.includes("?v=liane-audio-r2-20261030-snowball-v46-20261031-stage-energy-boule-20261031-ice-author-r2-20261031"),"stale public module path: "+path);
 }
 const catalog=(await file("src/catalogs/capture-showcase-skill-presets-v1.js")).toString("utf8");
 assert.ok(catalog.includes("data/capture/showcase/poing_givrant.capture-skill-transfer-v1.json"));
});
