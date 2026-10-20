import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  normalizeArenaShadowLightV1,
  projectArenaShadowLightV1,
  shadowSilhouetteUrlFromOpaqueMaskV1
} from "../../src/adapters/renderer/dom-shadow-light-v1.js";

const source = path => readFile(new URL("../../" + path, import.meta.url), "utf8");
const mask = (width = 16, height = 16) => {
  const opaque = new Uint8Array(width * height);
  for (let y = 4; y < 13; y++) {
    for (let x = 3; x < 11; x++) opaque[y * width + x] = 1;
  }
  return { width, height, opaque };
};

test("one arena light accepts tactile French controls and validates authored numeric boundaries", () => {
  const defaults = normalizeArenaShadowLightV1();
  assert.equal(defaults.mode, "silhouette");
  assert.equal(defaults.azimuthDeg, 50);
  assert.equal(defaults.elevationDeg, 48);
  assert.equal(Object.isFrozen(defaults), true);
  assert.equal(normalizeArenaShadowLightV1({ mode: "contact" }).mode, "contact");
  assert.equal(normalizeArenaShadowLightV1({ mode: "soft" }).mode, "soft");
  assert.throws(() => normalizeArenaShadowLightV1({ mode: "second-engine" }), RangeError);
  assert.throws(() => normalizeArenaShadowLightV1({ elevationDeg: 0 }), RangeError);
  assert.throws(() => normalizeArenaShadowLightV1({ intensity: NaN }), RangeError);
});

test("one light projects consistently for grounded, mirrored and flying creatures", () => {
  const light = normalizeArenaShadowLightV1({ azimuthDeg: 90, flightHeightPx: 80 });
  const ground = projectArenaShadowLightV1(light);
  const flying = projectArenaShadowLightV1(light, { flying: true });
  assert.ok(ground.castXPct > 0);
  assert.ok(Math.abs(flying.castXPct) > Math.abs(ground.castXPct));
  assert.ok(flying.blurPx > ground.blurPx);
  assert.ok(flying.opacity < ground.opacity);
  assert.ok(flying.flatten > ground.flatten);
  const opposite = projectArenaShadowLightV1({ azimuthDeg: 270 });
  assert.ok(opposite.castXPct < 0);
  const overhead = projectArenaShadowLightV1({ elevationDeg: 85 });
  assert.ok(Math.abs(overhead.castXPct) < Math.abs(ground.castXPct));
  assert.deepEqual(projectArenaShadowLightV1(light), ground, "no uncontrolled animation state");
});

test("silhouette comes from accepted collision alpha, not a second image fetch", () => {
  const url = shadowSilhouetteUrlFromOpaqueMaskV1(mask());
  assert.ok(url.startsWith('url("data:image/svg+xml,'));
  const encodedSvg = url.slice('url("data:image/svg+xml,'.length, -2);
  const svg = decodeURIComponent(encodedSvg);
  assert.match(svg, /viewBox="0 0 16 16"/);
  assert.match(svg, /<path fill="white" d="M/);
  assert.doesNotMatch(svg, /<image|https?:|script/);
  const empty = { width: 4, height: 4, opaque: new Uint8Array(16) };
  assert.equal(shadowSilhouetteUrlFromOpaqueMaskV1(empty), null);
  assert.throws(() => shadowSilhouetteUrlFromOpaqueMaskV1({width:4,height:4,opaque:[]}), TypeError);
  assert.throws(() => shadowSilhouetteUrlFromOpaqueMaskV1(mask(),{resolution:128}), RangeError);
});

test("single renderer shadow owner persists; UI only controls one shared light and projected shape", async () => {
  const [app, css, html, keyframes] = await Promise.all([
    source("src/ui/demo-app.js"),
    source("examples/dom-demo/demo.css"),
    source("examples/dom-demo/capture-editor-v2.html"),
    source("src/adapters/renderer/dom-keyframes.js")
  ]);
  const slotStart = app.indexOf("function createSlot(");
  const mount = app.slice(app.indexOf("export async function mountCombatDemo("), slotStart);
  const slot = app.slice(slotStart);
  assert.match(mount, /let arenaLight = readLightControls\(\)/);
  assert.match(mount, /getArenaLight: \(\) => arenaLight/);
  assert.match(mount, /Object.values\(slots\)\) slot.applyShadowLight\(arenaLight\)/);
  assert.match(mount, /lightControls\?\.removeEventListener/);
  assert.match(slot, /const opaqueMask = collisionModel\.opaqueMask/);
  assert.match(slot, /silhouetteMaskUrl = shadowSilhouetteUrlFromOpaqueMaskV1\(opaqueMask\)/);
  assert.match(slot, /lastShadowLayout = layout;\s*silhouetteMaskUrl/);
  assert.match(slot, /applyShadowLight\(\);/);
  assert.match(slot, /shadowElement\.dataset\.shadowMode = resolvedMode/);
  assert.match(slot, /getArenaLight = \(\) => normalizeArenaShadowLightV1/);
  assert.doesNotMatch(slot, /new Image\(|requestAnimationFrame\(/);
  assert.match(css, /mask-image: var\(--shadow-light-mask, none\)/);
  assert.match(css, /scaleY\(var\(--shadow-light-flatten, 0\.2\)\)/);
  assert.match(html, /data-shadow-light-controls/);
  for (const field of ["mode","azimuth","elevation","softness","intensity","flight-height"]) {
    assert.match(html, new RegExp("data-shadow-light-" + field + '(?:=|[ >])'));
  }
  const previewTemplate = html.slice(html.indexOf("data-capture-preview-template"));
  assert.equal((previewTemplate.match(/data-demo-shadow aria-hidden="true"/g) || []).length, 4,
    "one canonical shadow node per 1v1/2v2 fighter, never a separate light sprite");
  assert.match(keyframes, /segment\.ground/);
  assert.match(keyframes, /composeDomShadowTransform\(actor, segment\.ground\)/);
});

test("existing hidden-arena shadow regression is still protected", async () => {
  const app = await source("src/ui/demo-app.js");
  const loaded = app.slice(app.indexOf("  function loadRuntimeAsset("), app.indexOf("  function setCreature(nextMeta"));
  assert.doesNotMatch(loaded, /collisionModel\.snapshot\(\)/);
  assert.match(loaded, /shadowElement\.style\.visibility = "visible"/);
  assert.match(loaded, /token !== imageLoadToken \|\| settled/);
});
