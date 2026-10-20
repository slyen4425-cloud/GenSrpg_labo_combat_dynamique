import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  shadowGeometryFromOpaqueMaskV2,
  groundShadowLayoutFromOpaqueMaskV2
} from "../../src/adapters/renderer/dom-ground-shadow-v2.js";

function silhouette(draw, width = 100, height = 100) {
  const mask = {width, height, opaque:new Uint8Array(width * height)};
  const rect = (x0,y0,x1,y1) => {
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) mask.opaque[y*width+x]=1;
  };
  const pixel = (x,y) => { mask.opaque[y*width+x]=1; };
  draw({rect,pixel});
  return mask;
}
const symmetric = () => silhouette(({rect}) => rect(30,20,69,84));
const leaning = () => silhouette(({rect}) => {
  // Scarabacier-like squat posture: bulk on left, two leg clusters at
  // different depths and a right-forward appendage.
  rect(10,16,41,55);
  rect(20,48,37,80);
  rect(57,55,69,85);
});
function mirrored(input) {
  const {width,height,opaque} = input;
  const flipped = new Uint8Array(opaque.length);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++)
    flipped[y*width+(width-x-1)] = opaque[y*width+x];
  return {width,height,opaque:flipped};
}

test("symmetric standing creature preserves the original 50% horizontal shadow centre", () => {
  const g = shadowGeometryFromOpaqueMaskV2(symmetric());
  assert.ok(Math.abs(g.centerXRatio-0.5)<0.015);
  const layout = groundShadowLayoutFromOpaqueMaskV2(symmetric());
  assert.ok(Math.abs(layout.centerXPct-50)<1.5);
  assert.equal(layout.widthPct,g.widthPct);
  assert.equal(layout.heightPct,g.heightPct);
});

test("asymmetric leaning body grounds the ellipse under lower weighted support instead of image midpoint", () => {
  const a = groundShadowLayoutFromOpaqueMaskV2(leaning(), {bottomPct:31, opacity:0.55});
  assert.ok(a.centerXPct>34&&a.centerXPct<46,
    "mass and paws should bias the shadow left, not lock to 50% image centre");
  assert.ok(a.bottomPct>=0&&a.bottomPct<31,
    "vertical contact remains anchored by existing reliable silhouette rule");
  assert.equal(a.opacity,0.55);
  const b = groundShadowLayoutFromOpaqueMaskV2(mirrored(leaning()));
  assert.ok(Math.abs((a.centerXPct+b.centerXPct)-100)<1,
    "mirrored pose must mirror support without a creature-ID special case");
  assert.equal(a.bottomPct,b.bottomPct);
});

test("one stray edge pixel cannot pull the shadow centre off the foot support",()=>{
  const base=leaning(), noisy=leaning();
  noisy.opaque[99*noisy.width+99] = 1;
  noisy.opaque[0] = 1;
  const a=groundShadowLayoutFromOpaqueMaskV2(base);
  const b=groundShadowLayoutFromOpaqueMaskV2(noisy);
  assert.ok(Math.abs(a.centerXPct-b.centerXPct)<0.5);
  assert.ok(Math.abs(a.bottomPct-b.bottomPct)<0.5);
});

test("empty alpha retains neutral centre and profile-owned fallback vertical contact",()=>{
  const m={width:32,height:32,opaque:new Uint8Array(1024)};
  const g=shadowGeometryFromOpaqueMaskV2(m);
  const a=groundShadowLayoutFromOpaqueMaskV2(m,{bottomPct:17});
  assert.equal(g.centerXRatio,0.5);
  assert.equal(a.centerXPct,50);
  assert.equal(a.bottomPct,17);
});

test("shadow left coordinate is authored exactly once by accepted alpha mask; animation owner stays unchanged",async()=>{
  const [ui,css,renderer]=await Promise.all([
    readFile(new URL("../../src/ui/demo-app.js", import.meta.url),"utf8"),
    readFile(new URL("../../examples/dom-demo/demo.css",import.meta.url),"utf8"),
    readFile(new URL("../../src/adapters/renderer/dom-actor-renderer.js",import.meta.url),"utf8")
  ]);
  const rebuild=ui.slice(ui.indexOf("  function rebuildActor("),ui.indexOf("  function loadRuntimeAsset("));
  assert.doesNotMatch(rebuild,/--creature-shadow-bottom|--creature-shadow-left/);
  const load=ui.slice(ui.indexOf("  function loadRuntimeAsset("),ui.indexOf("  function setCreature(nextMeta"));
  assert.equal((load.match(/--creature-shadow-left/g)||[]).length,1);
  assert.match(load,/--creature-shadow-left", layout\.centerXPct\.toFixed\(2\)/);
  assert.match(load,/collisionModel\.opaqueMask/);
  assert.doesNotMatch(load,/collisionModel\.snapshot\(\)/,
    "hidden-arena bug PR37 must not return");
  assert.match(css,/\.fighter__shadow\s*\{[^}]*left:\s*var\(--creature-shadow-left, 50%\)/);
  assert.match(renderer,/shadowElement\.style\.transform\s*=/);
});
