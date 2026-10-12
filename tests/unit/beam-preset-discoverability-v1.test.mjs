import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  captureBeamVisualPackV1,
  applyCaptureBeamVisualPackV1
} from "../../src/ui/capture-editor-beam-visual-pack-v1.js";

const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
const css=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
const layout=await readFile(new URL("../../src/ui/capture-editor-beam-stage-layout-v1.js",import.meta.url),"utf8");
const editor=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");

test("rayon three-phase preset is discoverable from Visuals even when another Style is selected",()=>{
  const visuals=html.indexOf("<h2>Effets visuels</h2>");
  const beam=html.indexOf('data-skill-beam-stage-editor');
  const audio=html.indexOf("<h2>Audio de la capacité</h2>");
  assert.ok(visuals>=0 && visuals<beam && beam<audio);
  const section=html.slice(html.lastIndexOf("<section",beam),html.indexOf("</section>",beam));
  assert.match(section,/data-beam-active="false"/);
  assert.match(section,/data-skill-beam-pack-apply/);
  assert.match(section,/Appliquer le modèle de rayon d’eau/);
  assert.match(section,/data-skill-beam-pack-undo/);
  assert.match(section,/data-skill-beam-pack-state/);
  assert.match(section,/data-beam-stage-fields="start"/);
  assert.match(section,/data-beam-stage-fields="body"/);
  assert.match(section,/data-beam-stage-fields="impact"/);
  assert.doesNotMatch(css,/\[data-skill-beam-stage-editor\]\[data-beam-active="false"\]\s*\{\s*display:\s*none\s*;/);
  assert.match(css,/\[data-skill-beam-stage-editor\]\s+\[data-beam-stage\]\[hidden\]\s*\{\s*display:\s*none/i);
});

test("choosing the complete model switches the existing skill form to Rayon and reveals three original stage controls",()=>{
  assert.match(editor,/one\(root, "\[data-skill-form\]"\)\.value = "beam";\s*beamStageLayout\.sync\(\);/);
  assert.match(layout,/const active = form\.value === "beam";/);
  assert.match(layout,/section\.hidden = !active/);
  assert.match(layout,/dest\.append\(label\)/);
  const ids=["data-skill-beam-start-fx","data-skill-travel-fx","data-skill-impact-fx","data-skill-socket"];
  for(const id of ids)assert.equal((html.match(new RegExp('\\b'+id+'\\b','g'))??[]).length,1,id+" has one canonical input");
});

test("existing reversible water-rayon preset is complete: mouth cast, beam body and impact without gameplay changes",()=>{
  const pack=captureBeamVisualPackV1("pressurized-jet");
  assert.ok(pack && pack.beamStart && pack.travel && pack.impact);
  const before={castAssetId:"user:custom-cast",beamStartAssetId:"user:start",travelAssetId:"user:travel",impactAssetId:"user:impact",castAudioAssetId:"user:audio",randomField:"keep"};
  const out=applyCaptureBeamVisualPackV1({packId:pack.id,presentation:before});
  assert.equal(out.castAssetId,pack.beamStart);
  assert.equal(out.beamStartAssetId,pack.beamStart);
  assert.equal(out.travelAssetId,pack.travel);
  assert.equal(out.impactAssetId,pack.impact);
  assert.equal(out.castPlaybackMode,"loop");
  assert.equal(out.travelPlaybackMode,"loop");
  assert.equal(out.castAudioAssetId,"user:audio");
  assert.equal(out.randomField,"keep");
  assert.equal(before.castAssetId,"user:custom-cast");
});
