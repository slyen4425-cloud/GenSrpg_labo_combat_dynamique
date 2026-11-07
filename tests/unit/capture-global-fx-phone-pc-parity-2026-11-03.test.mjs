import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const css=readFileSync(new URL("../../examples/dom-demo/demo.css",import.meta.url),"utf8");
const fx=readFileSync(new URL("../../src/adapters/renderer/dom-skill-fx.js",import.meta.url),"utf8");
const load=id=>JSON.parse(readFileSync(new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
const snow=load("boule_neige"),ice=load("pique_glace"),fire=load("cap_fire_atk_6");

test("RED: keep original author offsets and scales for real Gorice/Firestorm assets",()=>{
 const cast=snow.presentation.visual.cast;
 assert.equal(cast.offsetX,85);assert.equal(cast.offsetY,15);
 assert.equal(cast.opponentOffsetX,-70);assert.equal(cast.opponentOffsetY,15);
 assert.equal(snow.presentation.visual.travel.displayScale,1.5);
 const spike=ice.presentation.visual.travel;
 assert.equal(spike.displayScale,3);assert.equal(spike.groundOffsetYPx,15);
 assert.equal(spike.groundRisePx,80);
 const zone=fire.presentation.visual.aura;
 assert.equal(zone.displayScale,1.2);assert.equal(zone.displayScaleX,1.6);
 assert.equal(zone.displayScaleY,0.8);assert.equal(zone.offsetY,0);
});

test("RED: all gameplay-bearing FX shells use the same 400px arena-height reference, regardless of PC width",()=>{
 const rules={
  ".skill-fx--projectile:not(.skill-fx--sprite-shell)":44.793,
  ".skill-fx--channel-pulse":44.793,
  ".skill-fx--sprite-shell":68.967,
  ".skill-fx--cast":100.962,
  ".skill-fx--impact":100.962,
  ".skill-fx--clash-impact":137.934,
  ".skill-fx--phase":110.205
 };
 const scope=css.slice(css.indexOf("/* All Capture visual settings use the SAME 400px arena-height unit"));
 assert.ok(scope.length>300,"unified author CSS FX geometry owner missing");
 for(const [selector,width] of Object.entries(rules)){
   const escaped=selector.replace(/\W/g,"\\$&");
   const rx=new RegExp(escaped+"\\s*\\{[^}]*\\bwidth:\\s*calc\\("+width+"px \\* var\\(--combat-arena-author-offset-scale, 1\\)\\);");
   assert.match(scope,rx,"missing height-projected native FX width "+selector);
 }
 assert.match(scope,/\.skill-fx--persistent-zone,\s*\n?.*\.skill-fx--tactical-zone\s*\{[^}]*width:\s*calc\(183\.438px \* var\(--combat-arena-author-offset-scale, 1\)\);/s,
 "the persistent sprite and its tactical ellipse must share one projected visual size");
});

test("RED: FX artist offsets and special beam dimensions consume the existing arena scale, movement trajectories never do",()=>{
 assert.match(fx,/function fxAuthorPixelsV1\s*\(/);
 assert.match(fx,/fxAuthorPixelsV1\(arena,\s*visual\.offsetX\)/);
 assert.match(fx,/fxAuthorPixelsV1\(arena,\s*visual\.offsetY\)/);
 assert.match(fx,/fxAuthorPixelsV1\(arena,\s*travelVisual\.groundOffsetYPx\)/);
 assert.match(fx,/fxAuthorPixelsV1\(arena,\s*travelVisual\.groundRisePx\)/);
 assert.match(fx,/BEAM_CAP_BASE_SIZE_PX\s*\*\s*displayScale\s*\*\s*displayScaleY\s*\*\s*fxArenaScaleV1\(arena\)/);
});
