import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDomVisibleModelCollisionModel } from "../../src/adapters/renderer/dom-visible-model-contact.js";
import { groundShadowLayoutFromOpaqueMaskV2 } from "../../src/adapters/renderer/dom-ground-shadow-v2.js";

function hiddenArenaFixture() {
  const pixels = new Uint8ClampedArray(16 * 4);
  for (const [x,y] of [[1,1],[2,1],[1,2],[2,2]]) {
    pixels[(y*4+x)*4+3] = 255;
  }
  let maskReads = 0;
  const document = {
    createElement(tag) {
      if (tag === "canvas") {
        return {
          width:0,height:0,
          getContext() {
            return {
              drawImage() {},
              getImageData() { maskReads++; return {data:pixels}; }
            };
          }
        };
      }
      return {
        style:{},
        dataset:{},
        setAttribute() {},
        getBoundingClientRect() { return {left:0,top:0,width:0,height:0}; },
        remove() {}
      };
    }
  };
  const motion = {
    clientWidth:0,offsetWidth:0,clientHeight:0,offsetHeight:0,
    append() {},
    getBoundingClientRect() {return {left:0,top:0,width:0,height:0};}
  };
  const image = {ownerDocument:document,naturalWidth:4,naturalHeight:4,src:"/hidden-arena-creature.webp"};
  return {motion,image,get maskReads(){return maskReads;}};
}

test("real collision owner exposes accepted opaque mask while hidden arena cannot produce screen snapshot", () => {
  const fixture = hiddenArenaFixture();
  const collision = createDomVisibleModelCollisionModel(fixture);
  assert.equal(collision.opaqueMask, null);
  assert.equal(collision.refreshFromImage(), true);
  assert.equal(fixture.maskReads, 1);
  assert.equal(collision.ready, true);
  assert.equal(collision.snapshot(), null, "hidden arena has no measurable screen markers");
  assert.equal(collision.opaqueMask?.width, 4);
  assert.equal(collision.opaqueMask?.height, 4);
  assert.equal(collision.opaqueMask?.opaque.reduce((x,v)=>x+v,0), 4);
  const shadow = groundShadowLayoutFromOpaqueMaskV2(collision.opaqueMask,{opacity:0.42,bottomPct:8});
  assert.ok(shadow.widthPct > 0 && shadow.heightPct > 0);
  assert.ok(shadow.bottomPct >= 0);
  assert.equal(shadow.opacity, 0.42);
  collision.clear();
  assert.equal(collision.opaqueMask, null, "no stale mask survives the next creature");
  collision.dispose();
});

test("shadow is revealed by collision alpha readiness, never by geometry-only snapshot", async () => {
  const source = await readFile(new URL("../../src/ui/demo-app.js",import.meta.url),"utf8");
  const load = source.slice(source.indexOf("  function loadRuntimeAsset("),source.indexOf("  function setCreature(nextMeta"));
  assert.match(load,/const opaqueMask = collisionModel\.opaqueMask/);
  assert.match(load,/groundShadowLayoutFromOpaqueMaskV2\(\s*opaqueMask,\s*profileShadow/);
  assert.doesNotMatch(load,/collisionModel\.snapshot\(\)/);
  assert.match(load,/shadowElement\.style\.visibility = "hidden"/);
  assert.match(load,/settled = true;\s*shadowElement\.style\.visibility = "visible"/);
  assert.match(load,/if \(token !== imageLoadToken \|\| settled\)/);
  const setCreature = source.slice(source.indexOf("  function setCreature(nextMeta"),source.indexOf("  function setVisible("));
  assert.ok(setCreature.indexOf("rebuildActor(runtimeUrl)") < setCreature.indexOf("loadRuntimeAsset(runtimeUrl)"));
  const rebuild = source.slice(source.indexOf("  function rebuildActor("),source.indexOf("  function loadRuntimeAsset("));
  assert.doesNotMatch(rebuild,/--creature-shadow-bottom|--creature-shadow-opacity/);
});
