import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CAPTURE_FX_QUICK_PROFILES_V1,
  captureFxQuickProfileByIdV1,
  applyCaptureFxQuickProfileV1,
  captureFxQuickWarningsV1,
  captureFxQuickTrajectoryHintV1
} from "../../src/ui/capture-fx-quick-mode-v1.js";

test("beginner FX offers three clearly labelled levels backed by existing preset owners", () => {
  assert.deepEqual(CAPTURE_FX_QUICK_PROFILES_V1.map(p => p.label),
    ["Discret","Équilibré","Spectaculaire"]);
  assert.deepEqual(CAPTURE_FX_QUICK_PROFILES_V1.map(p => p.shakeAmplitudePx),[2,5,9]);
  assert.equal(captureFxQuickProfileByIdV1("inexistant"),null);
});

test("beginner FX reuse of V1 glow and particle catalog alters visual feedback only", () => {
  const original = {
    fxGlowColor:"#aabbcc",fxGlowStrength:0.91,fxGlowRadiusPx:36,
    projectileTrailColor:"#aabbcc",projectileTrailCount:7,
    projectileTrailAnchorX:0.22,projectileTrailAnchorY:0.38,
    impactShakeAmplitudePx:600,impactShakeSequence:[{pauseMs:20,amplitudePx:8,durationMs:100}],
    travelTrajectoryMode:"skyfall",fallHeightPx:650,travelAssetId:"user:rock",
    impactAudioAssetId:"user:sound",damage:100,gameplay:{energy:5}
  };
  for(const name of ["discreet","balanced","spectacular"]){
    const result=applyCaptureFxQuickProfileV1({profileId:name,presentation:original});
    assert.equal(result.fxGlowColor,original.fxGlowColor);
    assert.equal(result.projectileTrailColor,original.projectileTrailColor);
    assert.equal(result.projectileTrailAnchorX,0.22);
    assert.equal(result.projectileTrailAnchorY,0.38);
    assert.deepEqual(result.impactShakeSequence,original.impactShakeSequence);
    assert.equal(result.impactAudioAssetId,original.impactAudioAssetId);
    assert.equal(result.travelAssetId,original.travelAssetId);
    assert.equal(result.fallHeightPx,650);
    assert.equal(result.damage,100);
    assert.deepEqual(result.gameplay,{energy:5});
    assert.ok(result.projectileTrailSizePx>0 && result.projectileTrailSizePx<=9);
    assert.ok(result.impactShakeAmplitudePx<=9);
  }
  assert.equal(original.impactShakeAmplitudePx,600,"author source stays untouched");
  assert.throws(()=>applyCaptureFxQuickProfileV1({profileId:"???",presentation:original}));
});

test("beginner safety advice identifies excessive inputs and keeps skyfall separate",()=>{
  const warnings=captureFxQuickWarningsV1({
    projectileTrailSizePx:120,projectileTrailLengthPx:120,
    impactShakeAmplitudePx:600,aftermathSmokeSizePx:120,
    impactShakeSequence:[{pauseMs:0,amplitudePx:8,durationMs:150}]
  });
  assert.ok(warnings.some(x=>/particules/i.test(x)));
  assert.ok(warnings.some(x=>/secousse/i.test(x)));
  assert.ok(warnings.some(x=>/fumée/i.test(x)));
  assert.equal(captureFxQuickWarningsV1({
    projectileTrailSizePx:8,projectileTrailLengthPx:50,
    impactShakeAmplitudePx:5,aftermathSmokeSizePx:35
  }).length,0);
  assert.match(captureFxQuickTrajectoryHintV1({form:"projectile",trajectoryMode:"skyfall"}),/ciel|tomb/i);
  assert.match(captureFxQuickTrajectoryHintV1({form:"beam",trajectoryMode:"linear"}),/rayon/i);
});

test("real editor has an explicit apply action and retains detailed FX controls / test combat",async()=>{
 const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const ui=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 for(const selector of ["data-skill-fx-quick-profile","data-skill-fx-quick-apply","data-skill-fx-quick-preview","data-skill-fx-quick-warning","data-skill-fx-advanced","data-skill-fx-glow-preset","data-skill-projectile-trail-size","data-skill-impact-shake-amplitude","data-skill-aftermath-smoke-size"]){
   assert.match(html,new RegExp(selector));
 }
 assert.match(html,/Aperçu indicatif/);
 assert.match(html,/Réglages avancés/);
 assert.match(ui,/applyCaptureFxQuickProfileV1/);
 assert.match(ui,/captureFxQuickWarningsV1/);
 assert.match(ui,/\[data-skill-fx-quick-apply\]/);
 assert.match(ui,/dispatchEvent/);
});
