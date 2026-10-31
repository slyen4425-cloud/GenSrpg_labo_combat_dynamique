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
  assert.equal(active.presentation.visual.icon.assetId,"pack:capture:icon-skill-ronce-01");
  assert.equal(active.presentation.visual.travel.playbackMode,"once");
  assert.equal(active.presentation.version,2);
});

test("native beam is planned at release, not projected after an already completed swap",async()=>{
  const {planSkillReleaseFx}=await import("../../src/core/fx/skill-fx-plan.js");
  const released=planSkillReleaseFx({action:{
    skill:{id:"liane_venimeuse",form:"beam",element:"nature",projectileClash:{power:0}},
    travelMs:800
  },actorSlot:"player",targetSlot:"opponent"});
  assert.equal(released.length,1);
  assert.equal(released[0].type,"beam");
  assert.equal(released[0].durationMs,800);
  const presenter=createCombatResolutionPresenter({
    visuals:{playEventFor:()=>Promise.resolve({status:"finished"}),cancelFor:()=>{}}
  });
  assert.equal("presentReserveSkill" in presenter,false,"no post-swap cosmetic double authority");
  presenter.dispose();
});

test("RED: author editor cache loads new Liane preset and latest canonical global-assets", async()=>{
  const {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl}=await import("../../src/assets/global-visual-library.js");
  const revision = GLOBAL_VISUAL_LIBRARY.revision.match(/^2026-\d\d-\d\d-v(\d+)-[a-z0-9-]+$/);
  assert.ok(revision && Number(revision[1]) >= 45, "Liane must not regress to a pre-v45 media catalog");
  assert.ok(GLOBAL_VISUAL_LIBRARY.catalogUrl.includes("global-assets/data/assets/catalog/global-visual-assets"));
  assert.ok(globalVisualAssetUrl("capture/sprites/skills/liane_epineuse_rayon/liane_epineuse_rayon_atlas_12f.webp").includes("liane_epineuse_rayon_atlas_12f.webp?v="));
  const expected="liane-audio-r2-20261030";
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

test("author r2 export is archived byte-exact and active as sole Liane skill without altering mechanics", async()=>{
  const archiveText=await read("data/capture/source-exports/gensrpg-capture-skill-liane_venimeuse-r2-2026-10-30.json");
  assert.equal(Buffer.byteLength(archiveText),3722);
  assert.equal(createHash("sha256").update(archiveText).digest("hex"),"fca80f26c714fe7d0f8418b9c077154c32e9c731affd562f4bc83b273a350ab0");
  const activeText=await read(activePath);
  const expected=JSON.parse(archiveText);
  expected.draft.presentation.audio={
    travel:{assetId:"gensrpg:sound:genrpg-pack2-879fc11a",volume:1,loop:true}
  };
  assert.deepEqual(JSON.parse(activeText),expected,
    "the archived r2 stays immutable; Oct 30 author adds only travel audio");
  const draft=importCaptureTransferJsonV1(activeText).value.draft;
  assert.equal(draft.presentation.version,2);
  assert.equal(draft.definition.form,"beam");
  assert.equal(draft.presentation.visual.icon.assetId,"pack:capture:icon-skill-ronce-01");
  assert.equal(draft.presentation.visual.travel.playbackMode,"once");
  assert.deepEqual(draft.presentation.audio,
    {travel:{assetId:"gensrpg:sound:genrpg-pack2-879fc11a",volume:1,loop:true}});
});
