import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {createCombatResolutionPresenter} from "../../src/adapters/renderer/combat-resolution-presenter.js";

const sourcePath="data/capture/source-exports/gensrpg-capture-skill-liane_venimeuse-2026-10-29.json";
const activePath="data/capture/showcase/liane_venimeuse.capture-skill-transfer-v1.json";
const read=p=>readFile(new URL("../../"+p,import.meta.url),"utf8");

test("RED: faithful original export, single beam-authoring preset and actual asset binding", async()=>{
  const sourceText=await read(sourcePath);
  assert.equal(Buffer.byteLength(sourceText),2937);
  assert.equal(createHash("sha256").update(sourceText).digest("hex"),"15c7e1ad305b3ede49698e835675d1b95fdb68ac267cf8778435ded388264a7d");
  const original=importCaptureTransferJsonV1(sourceText).value.draft;
  assert.equal(original.presentation,null);
  assert.equal(original.definition.form,"contact");
  const active=importCaptureTransferJsonV1(await read(activePath)).value.draft;
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===activePath).length,1);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
  assert.equal(active.definition.id,"liane_venimeuse");
  assert.equal(active.definition.form,"beam");
  assert.equal(active.definition.loadoutSlot,"ultimate");
  assert.equal(active.definition.maxUsesPerCombat,1);
  assert.equal(active.definition.preparationMs,2200);
  assert.equal(active.definition.travelMs,800);
  assert.deepEqual(active.definition.targetLocations,["reserve"]);
  assert.deepEqual(active.definition.effects.map(e=>e.kind),["force_reserve_switch","apply_marker","apply_marker"]);
  assert.deepEqual(active.definition.effects.slice(1).map(e=>[e.marker.id,e.charges]),[["graine-sansue",2],["poison",2]]);
  assert.deepEqual(active.definition,{...original.definition,form:"beam"},"only original form contact → beam may change in gameplay");
  assert.equal(active.presentation.subjectId,active.definition.id);
  assert.equal(active.presentation.visual.travel.assetId,"pack:capture:sprite-liane-epineuse-rayon-01");
  assert.equal(active.presentation.visual.travel.attachment,"trajectory");
  assert.equal(active.presentation.visual.travel.trigger,"travel-start");
});

test("RED: reserve result uses the existing presenter beam renderer once, never on failure",()=>{
  const played=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{playEventFor:()=>Promise.resolve({status:"finished"}),cancelFor:()=>{}},
    fx:{play:args=>{played.push(args);return {status:"running",finished:Promise.resolve({status:"finished"})};}}
  });
  const skill={id:"liane_venimeuse",form:"beam",element:"nature",travelMs:800};
  assert.equal(presenter.presentReserveSkill({result:{ok:false},skill,actorSlot:"player",targetSlot:"opponent"}).status,"rejected");
  assert.equal(played.length,0);
  assert.equal(presenter.presentReserveSkill({result:{ok:true,outcome:"forced_switched"},skill,actorSlot:"player",targetSlot:"opponent"}).status,"running");
  assert.equal(played.length,1);
  assert.deepEqual(played[0],{type:"beam",skillId:"liane_venimeuse",element:"nature",actorSlot:"player",fromSlot:"player",targetSlot:"opponent",durationMs:800});
  presenter.dispose();
});

test("RED: author editor cache loads new Liane preset and latest canonical global-assets", async()=>{
  const {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl}=await import("../../src/assets/global-visual-library.js");
  assert.match(GLOBAL_VISUAL_LIBRARY.revision,/2026-10-29.*liane/);
  assert.match(GLOBAL_VISUAL_LIBRARY.catalogUrl,/global-assets\\/data\\/assets\\/catalog\\/global-visual-assets/);
  assert.match(globalVisualAssetUrl("capture/sprites/skills/liane_epineuse_rayon/liane_epineuse_rayon_atlas_12f.webp"),/liane_epineuse_rayon_atlas_12f.webp\\?v=/);
  const expected="liane-venimeuse-20261029";
  for (const file of [
    "examples/dom-demo/capture-editor-v2.html",
    "examples/dom-demo/capture-editor-v2.js",
    "src/ui/capture-editor-human-v2.js",
    "src/ui/capture-editor-preview-runtime-loader-v1.js",
    "src/ui/capture-combat-preview-v1.js",
    "src/ui/combat-2v2-test-ui.js"
  ]) {
    const text=await read(file);
    assert.ok(text.includes(expected),"stale module version in "+file);
  }
});
