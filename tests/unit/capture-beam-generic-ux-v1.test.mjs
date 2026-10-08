import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyCaptureBeamVisualPackV1,
  captureBeamVisualPackV1,
  snapshotCaptureBeamPresetControlsV1,
  restoreCaptureBeamPresetControlsV1
} from "../../src/ui/capture-editor-beam-visual-pack-v1.js";

test("generic water-beam sample reuses mouth start during preparation instead of an extra charge atlas", () => {
  const pack = captureBeamVisualPackV1("pressurized-jet");
  assert.equal(pack.label, "Rayon d’eau");
  const previous = Object.freeze({
    castAssetId: "pack:capture:cast-custom",
    beamStartAssetId: "pack:capture:start-custom",
    travelAssetId: "pack:capture:travel-custom",
    impactAssetId: "pack:capture:impact-custom",
    castAudioAssetId: "gensrpg:sound:custom",
    travelAudioAssetId: "gensrpg:sound:custom-travel"
  });
  const applied = applyCaptureBeamVisualPackV1({packId: pack.id, presentation: previous});
  assert.equal(applied.castAssetId, pack.beamStart, "preparation should display the same mouth-connected visual as beam start");
  assert.equal(applied.beamStartAssetId, pack.beamStart);
  assert.equal(applied.travelAssetId, pack.travel);
  assert.equal(applied.impactAssetId, pack.impact);
  assert.equal(applied.castAudioAssetId, previous.castAudioAssetId);
  assert.equal(applied.travelAudioAssetId, previous.travelAudioAssetId);
  assert.equal(previous.castAssetId, "pack:capture:cast-custom", "pack must not mutate original");
});

test("reversing the beam model restores form, custom sprite controls, cast offsets and unrelated fields", () => {
  const inputs = new Map(Object.entries({
    "[data-skill-form]": "projectile",
    "[data-skill-cast-fx]": "custom:cast",
    "[data-skill-cast-scale]": "1.25",
    "[data-skill-cast-playback]": "stretch",
    "[data-skill-cast-offset-x]": "-30",
    "[data-skill-cast-offset-y]": "5",
    "[data-skill-cast-offset-mode]": "custom",
    "[data-skill-cast-opponent-offset-x]": "30",
    "[data-skill-cast-opponent-offset-y]": "-5",
    "[data-skill-beam-start-fx]": "",
    "[data-skill-beam-start-scale]": "1",
    "[data-skill-travel-fx]": "custom:travel",
    "[data-skill-travel-scale]": "2.5",
    "[data-skill-travel-playback]": "stretch",
    "[data-skill-impact-fx]": "custom:impact",
    "[data-skill-impact-scale]": "1.2",
    "[data-skill-impact-duration]": "500",
    "[data-skill-impact-offset-x]": "12",
    "[data-skill-impact-offset-y]": "-3",
    "[data-skill-energy-cost]": "6"
  }).map(([key,value])=>[key,{value}]));
  const root={querySelector(selector){return inputs.get(selector)??null;}};
  const original = Object.fromEntries([...inputs].map(([key,element])=>[key,element.value]));
  const snapshot = snapshotCaptureBeamPresetControlsV1(root);
  for(const [key,element] of inputs){
    if(key!=="[data-skill-energy-cost]") element.value = "changed";
  }
  restoreCaptureBeamPresetControlsV1(root,snapshot);
  for(const [key,old] of Object.entries(original)){
    assert.equal(inputs.get(key).value,old,key);
  }
});

test("beam UI is a generic, reversible, adjacent-to-zone three-phase editor with no new gameplay authority", async () => {
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),"utf8");
  const marker=html.indexOf('data-skill-beam-stage-editor');
  const zone=html.indexOf('data-skill-effects-host');
  const movement=html.indexOf('<h2>Mouvement</h2>');
  assert.ok(zone<marker && marker<movement);
  assert.match(html,/data-skill-beam-pack-undo/);
  assert.match(html,/Appliquer le modèle de rayon d’eau/);
  assert.doesNotMatch(html,/Utiliser les 4 sprites « Jet pressurisé »/);
  assert.match(html,/Rayon continu — 3 phases/);
  for(const phase of ["start","body","impact"]){
    assert.equal(html.split('data-beam-stage-fields="'+phase+'"').length-1,1);
  }
  assert.equal(html.split('data-beam-stage-fields="cast"').length-1,0);
});
