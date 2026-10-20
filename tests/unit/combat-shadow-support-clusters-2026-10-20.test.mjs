import test from "node:test";
import assert from "node:assert/strict";
import { groundShadowLayoutFromOpaqueMaskV2 } from "../../src/adapters/renderer/dom-ground-shadow-v2.js";

const mask = (w, h, rects, pixels = []) => {
  const opaque = new Uint8Array(w * h);
  for (const [x0,y0,x1,y1] of rects) {
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) opaque[y*w+x]=1;
  }
  for(const [x,y] of pixels) opaque[y*w+x]=1;
  return { width:w,height:h,opaque };
};
const mirrored = (m) => {
  const opaque = new Uint8Array(m.opaque.length);
  for(let y=0;y<m.height;y++) for(let x=0;x<m.width;x++)
    opaque[y*m.width+(m.width-1-x)] = m.opaque[y*m.width+x];
  return {width:m.width,height:m.height,opaque};
};

// Scarabacier-like: massive left-leaning shell, two feet touching at the
// centre-right, and two raised pincers beyond the feet. These are
// presentation test silhouettes, not special-case species definitions.
const heavyArthropod = () => mask(120, 120, [
  [12,15,65,55], [21,53,68,78], // large leaning shell
  [84,50,101,93],              // forward pincer ends ABOVE the floor
  [2,60,13,92],                // rear pincer also raised
  [45,77,53,106],              // first load-bearing paw
  [63,77,72,106]               // second load-bearing paw
]);
const quadruped = () => mask(120, 120, [
  [20,25,87,62],
  [24,58,32,103], [42,58,49,103], [63,58,71,103], [82,58,89,103]
]);
test("massive leaning creature: foot clusters beat torso and hanging pincers",()=>{
 const g=groundShadowLayoutFromOpaqueMaskV2(heavyArthropod());
 assert.ok(g.contactXPct > 46 && g.contactXPct < 65,
   "true multiple ground contacts must beat massive leaning shell");
 assert.ok(g.contactYPct > 83 && g.contactYPct < 93,
   "foot-level contact stays near the paws, not the belly");
 assert.ok(g.centerXPct < g.contactXPct,
   "legacy ellipse mass centre remains independent and unchanged");
});
test("symmetric quadruped remains centred, without per-creature offset",()=>{
 const g=groundShadowLayoutFromOpaqueMaskV2(quadruped());
 assert.ok(Math.abs(g.contactXPct-50)<3);
 assert.ok(g.contactYPct>82 && g.contactYPct<89);
});
test("mirrors and asymmetric sprite views remain symmetrical",()=>{
 const a=groundShadowLayoutFromOpaqueMaskV2(heavyArthropod());
 const b=groundShadowLayoutFromOpaqueMaskV2(mirrored(heavyArthropod()));
 assert.ok(Math.abs(a.contactXPct+b.contactXPct-100)<0.5);
 assert.ok(Math.abs(a.contactYPct-b.contactYPct)<0.5);
});
test("isolated lowest pixels must not shift the projected contact",()=>{
 const clean=heavyArthropod();
 const noisy=heavyArthropod();
 noisy.opaque[119*120+118]=1;
 noisy.opaque[118*120+117]=1;
 noisy.opaque[0]=1;
 const a=groundShadowLayoutFromOpaqueMaskV2(clean);
 const b=groundShadowLayoutFromOpaqueMaskV2(noisy);
 assert.ok(Math.abs(a.contactXPct-b.contactXPct)<0.5);
 assert.ok(Math.abs(a.contactYPct-b.contactYPct)<0.5);
});
test("narrow real feet survive whole-mass 2% trimming",()=>{
 const g=groundShadowLayoutFromOpaqueMaskV2(mask(120,120,[
  [15,8,104,69],
  [35,67,40,105], [78,67,83,105]
 ]));
 assert.ok(g.contactYPct>85, "low thin contacts must not be trimmed as noise");
});
test("empty alpha and tiny sprite return safe finite fallback",()=>{
 const z=groundShadowLayoutFromOpaqueMaskV2(mask(16,16,[]),{bottomPct:11});
 assert.equal(z.contactXPct,50);
 assert.equal(z.contactYPct,null);
 assert.equal(z.bottomPct,11);
 const tiny=groundShadowLayoutFromOpaqueMaskV2(mask(1,1,[[0,0,0,0]]));
 assert.ok(Number.isFinite(tiny.contactXPct) && Number.isFinite(tiny.contactYPct));
});
