import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { applyCaptureFxQuickProfileV1, captureFxQuickProfileIdForValuesV1 } from "../../src/ui/capture-fx-quick-mode-v1.js";

const source=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
const original=JSON.parse(await readFile(new URL("../../data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json",import.meta.url),"utf8"));

const originalFx=original.draft.presentation.feedback;
function currentFx(feedback){
 const glow=feedback.glow??{},shake=feedback.cameraShake??{},cast=feedback.castBurst??{},trail=feedback.projectileTrail??{},burst=feedback.impactBurst??{},smoke=feedback.aftermathSmoke??{};
 return {
  fxGlowStrength:glow.strength??0,fxGlowRadiusPx:glow.radiusPx??16,
  impactShakeAmplitudePx:shake.amplitudePx??0,
  castBurstCount:cast.count??0,castBurstSpreadPx:cast.spreadPx??0,castBurstSizePx:cast.sizePx??0,castBurstRisePx:cast.risePx??0,castBurstDurationMs:cast.durationMs??0,castBurstOpacity:cast.opacity??0,
  projectileTrailCount:trail.count??0,projectileTrailLengthPx:trail.lengthPx??0,projectileTrailSizePx:trail.sizePx??0,projectileTrailOpacity:trail.opacity??0,
  impactBurstCount:burst.count??0,impactBurstSpreadPx:burst.spreadPx??0,impactBurstSizePx:burst.sizePx??0,impactBurstDurationMs:burst.durationMs??0,impactBurstOpacity:burst.opacity??0,
  aftermathSmokeCount:smoke.count??0,aftermathSmokeSpreadPx:smoke.spreadPx??0,aftermathSmokeSizePx:smoke.sizePx??0,aftermathSmokeRisePx:smoke.risePx??0,aftermathSmokeDurationMs:smoke.durationMs??0,aftermathSmokeOpacity:smoke.opacity??0
 };
}

test("reloading real author Arc électrique should identify already-saved Spectaculaire instead of 'mes réglages'",()=>{
 const saved=currentFx(originalFx);
 assert.equal(captureFxQuickProfileIdForValuesV1(saved),"spectacular");
 assert.equal(saved.fxGlowStrength,0.85);
 assert.equal(saved.fxGlowRadiusPx,32);
 assert.equal(saved.impactShakeAmplitudePx,9);
});

test("all three preset signatures are restored from values without adding a parallel persistence field",()=>{
 for(const id of ["discreet","balanced","spectacular"]){
   const authored={fxGlowColor:"#aa2277",projectileTrailAnchorX:.22,travelAssetId:"author:effect"};
   const preset=applyCaptureFxQuickProfileV1({profileId:id,presentation:authored});
   assert.equal(captureFxQuickProfileIdForValuesV1(preset),id);
   assert.equal(preset.fxGlowColor,authored.fxGlowColor);
   assert.equal(preset.projectileTrailAnchorX,.22);
   assert.equal(preset.travelAssetId,"author:effect");
   assert.deepEqual(authored,{fxGlowColor:"#aa2277",projectileTrailAnchorX:.22,travelAssetId:"author:effect"});
   const changed={...preset,fxGlowRadiusPx:preset.fxGlowRadiusPx+1};
   assert.equal(captureFxQuickProfileIdForValuesV1(changed),"current",
     "an advanced custom edit must not claim to be the original preset");
 }
});

test("Human Editor recognizes saved settings ONLY on load; user selection remains preview until explicit Apply",()=>{
 assert.match(source,/refreshSkillFxQuickControlStateV1\(root,\s*\{restoreSaved:true\}\)/);
 assert.match(source,/captureFxQuickProfileIdForValuesV1/);
 assert.match(source,/fxQuickApply,\s*"click"/);
 assert.match(source,/applyCaptureFxQuickProfileV1/);
 assert.match(source,/resetSelection:true/);
});
