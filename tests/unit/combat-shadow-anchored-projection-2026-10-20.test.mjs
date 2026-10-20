import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectArenaShadowLightV1 } from "../../src/adapters/renderer/dom-shadow-light-v1.js";
import { groundShadowLayoutFromOpaqueMaskV2 } from "../../src/adapters/renderer/dom-ground-shadow-v2.js";

const source = path => readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const mask = () => {
  const width=128,height=128,opaque=new Uint8Array(width*height);
  const fill=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)
    for(let x=x0;x<=x1;x++)opaque[y*width+x]=1;};
  fill(12,22,75,79);fill(40,75,48,115);fill(69,75,77,115);
  return {width,height,opaque};
};

test("real contact pivot remains the accepted collision alpha contact",()=>{
  const layout=groundShadowLayoutFromOpaqueMaskV2(mask());
  assert.ok(layout.contactYPct>85 && layout.contactYPct<95);
  assert.ok(layout.contactXPct>35&&layout.contactXPct<70);
});
test("projected cast deforms silhouette around contact rather than translating the feet",()=>{
  const css=source("examples/dom-demo/demo.css");
  const projected=css.slice(css.indexOf('.fighter__shadow[data-shadow-mode="silhouette"]::before'),
    css.indexOf('.fighter__shadow[data-shadow-mode="soft"]'));
  assert.match(projected,/transform-origin: var\(--shadow-light-foot-x, 50%\) var\(--shadow-light-foot-y, 88%\)/);
  assert.doesNotMatch(projected,/translate\(/,
    "global projection translation physically lifts the support off the paws");
  assert.match(projected,/skewX\(var\(--shadow-light-skew,/);
  assert.match(projected,/scaleY\(var\(--shadow-light-flatten,/);
  assert.equal((source("examples/dom-demo/capture-editor-v2.html").match(/data-demo-shadow aria-hidden="true"/g)||[]).length,4);
});
test("directional shear respects light azimuth, altitude and perspective, without a species ID",()=>{
  const east=projectArenaShadowLightV1({azimuthDeg:90});
  const west=projectArenaShadowLightV1({azimuthDeg:270});
  const overhead=projectArenaShadowLightV1({azimuthDeg:90,elevationDeg:85});
  const flying=projectArenaShadowLightV1({azimuthDeg:90,flightHeightPx:100},{flying:true});
  assert.ok(east.skewDeg<0,"rightward cast from upper body requires negative shear on upward pixels");
  assert.ok(west.skewDeg>0);
  assert.ok(Math.abs(overhead.skewDeg)<Math.abs(east.skewDeg));
  assert.ok(Math.abs(flying.skewDeg)>Math.abs(east.skewDeg));
  assert.ok(Number.isFinite(flying.skewDeg));
});
test("the same one shadow renderer keeps motion; no hidden image, second timer or duplicate owner",()=>{
 const app=source("src/ui/demo-app.js");
 const slot=app.slice(app.indexOf("function createSlot("));
 const css=source("examples/dom-demo/demo.css");
 assert.match(slot,/const opaqueMask = collisionModel\.opaqueMask/);
 assert.match(slot,/shadowSilhouetteUrlFromOpaqueMaskV1\(opaqueMask\)/);
 assert.match(slot,/lastShadowLayout\.contactXPct/);
 assert.match(slot,/lastShadowLayout\.contactYPct/);
 assert.match(css,/\.fighter__shadow\\s*\\{/);
 assert.doesNotMatch(slot,/requestAnimationFrame\(|new Image\(/);
 assert.match(source("src/adapters/renderer/dom-keyframes.js"),/composeDomShadowTransform\(actor, segment\.ground\)/);
});
