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

test("RED: all gameplay-bearing FX shells are sized against the real 16:9 arena, not capped viewport px",()=>{
 const rules={
  ".skill-fx--projectile:not(.skill-fx--sprite-shell)":6.3,
  ".skill-fx--sprite-shell":9.7,
  ".skill-fx--cast":14.2,
  ".skill-fx--impact":14.2,
  ".skill-fx--clash-impact":19.4,
  ".skill-fx--phase":15.5
 };
 const scope=css.slice(css.indexOf("/* Capture phone-reference FX geometry"));
 assert.ok(scope.length>300,"native Capture-only CSS FX geometry owner missing");
 for(const [selector,width] of Object.entries(rules)){
   const escaped=selector.replace(/\W/g,"\\$&");
   const rx=new RegExp(escaped+"\\s*\\{[^}]*\\bwidth:\\s*"+width+"%;");
   assert.match(scope,rx,"missing arena-relative native FX width "+selector);
 }
 assert.match(scope,/\.skill-fx--persistent-zone,\s*\n?.*\.skill-fx--tactical-zone\s*\{[^}]*width:\s*25\.8%;/s,"one CSS rule must own the persistent sprite and its tactical ellipse");
});

test("RED: FX artist offsets and special beam dimensions consume the existing arena scale, movement trajectories never do",()=>{
 assert.match(fx,/function fxAuthorPixelsV1\s*\(/);
 assert.match(fx,/fxAuthorPixelsV1\(arena,\s*visual\.offsetX\)/);
 assert.match(fx,/fxAuthorPixelsV1\(arena,\s*visual\.offsetY\)/);
 assert.match(fx,/fxAuthorPixelsV1\(arena,\s*travelVisual\.groundOffsetYPx\)/);
 assert.match(fx,/fxAuthorPixelsV1\(arena,\s*travelVisual\.groundRisePx\)/);
 assert.match(fx,/BEAM_CAP_BASE_SIZE_PX\s*\*\s*displayScale\s*\*\s*displayScaleY\s*\*\s*fxArenaScaleV1\(arena\)/);
});
