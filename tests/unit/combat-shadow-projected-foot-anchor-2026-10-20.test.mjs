import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groundShadowLayoutFromOpaqueMaskV2 } from "../../src/adapters/renderer/dom-ground-shadow-v2.js";

const source = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const mask = (width, height, regions) => {
  const opaque = new Uint8Array(width * height);
  for (const [x0, y0, x1, y1] of regions) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      opaque[y * width + x] = 1;
    }
  }
  return { width, height, opaque };
};

test("projected shadow retains the actual foot contact (incl. off-centre posture)", () => {
  const centered = groundShadowLayoutFromOpaqueMaskV2(mask(24, 24, [
    [7, 3, 16, 13], [9, 14, 10, 20], [13, 14, 14, 20]
  ]));
  const leaning = groundShadowLayoutFromOpaqueMaskV2(mask(24, 24, [
    [2, 3, 11, 13], [13, 14, 15, 20], [17, 14, 19, 20]
  ]));
  assert.ok(centered.contactYPct > 80 && centered.contactYPct < 95);
  assert.ok(leaning.contactYPct > 80 && leaning.contactYPct < 95);
  assert.ok(leaning.contactXPct > centered.contactXPct,
    "projected foot pivot must follow the contact pixels instead of torso");
  assert.ok(Number.isFinite(leaning.centerXPct),
    "legacy ellipse centre must remain independently available");
  assert.ok(centered.bottomPct >= 0 && leaning.bottomPct >= 0,
    "old small-ellipse positioning still exists");
});

test("same shadow node switches foot pivot only in projected mode", () => {
  const app = source("src/ui/demo-app.js");
  const css = source("examples/dom-demo/demo.css");
  const pure = source("src/adapters/renderer/dom-shadow-light-v1.js");
  const slot = app.slice(app.indexOf("function createSlot("));
  assert.match(slot, /projected \? 0 : lastShadowLayout\.bottomPct/);
  assert.match(slot, /"--shadow-light-foot-x", lastShadowLayout\.contactXPct/);
  assert.match(slot, /"--shadow-light-foot-y", \(lastShadowLayout\.contactYPct/);
  assert.match(css, /transform-origin: var\(--shadow-light-foot-x, 50%\) var\(--shadow-light-foot-y, 88%\)/);
  assert.match(css, /\[data-shadow-mode="silhouette"\]::before/);
  assert.match(slot, /const opaqueMask = collisionModel\.opaqueMask/);
  assert.match(slot, /shadowSilhouetteUrlFromOpaqueMaskV1\(opaqueMask\)/);
  assert.doesNotMatch(slot, /new Image\(|requestAnimationFrame\(/);
  assert.match(pure, /flying \? settings\.flightHeightPx : 0/);
  assert.equal((source("examples/dom-demo/capture-editor-v2.html")
    .match(/data-demo-shadow aria-hidden="true"/g) || []).length, 4);
});

test("empty alpha mask exposes no invented foot contact", () => {
  const layout = groundShadowLayoutFromOpaqueMaskV2(mask(16,16,[]), { bottomPct: 9 });
  assert.equal(layout.contactYPct, null);
  assert.equal(layout.centerXPct, 50);
  assert.equal(layout.contactXPct, 50);
  assert.equal(layout.bottomPct, 9);
});
