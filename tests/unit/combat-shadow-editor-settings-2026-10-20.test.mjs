import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mountCaptureCombatPreviewV1 } from "../../src/ui/capture-combat-preview-v1.js";
import { normalizeArenaShadowLightV1 } from "../../src/adapters/renderer/dom-shadow-light-v1.js";

const source = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

test("Capture editor exposes one set of light settings in Combat, not over gameplay", () => {
  const html = source("examples/dom-demo/capture-editor-v2.html");
  const editorStart = html.indexOf('data-editor-panel="combat"');
  const editorEnd = html.indexOf('data-editor-panel="skills"', editorStart);
  const panel = html.slice(editorStart, editorEnd);
  const preview = html.slice(html.indexOf("data-capture-preview-template"));
  assert.ok(editorStart >= 0 && editorEnd > editorStart);
  assert.match(panel, /data-combat-light-settings/);
  assert.match(panel, /data-shadow-light-controls/);
  for (const name of ["mode", "azimuth", "elevation", "softness", "intensity", "flight-height"]) {
    assert.match(panel, new RegExp("data-shadow-light-" + name + "(?:[ >])"));
    assert.doesNotMatch(preview, new RegExp("data-shadow-light-" + name + "(?:[ >])"));
  }
  assert.equal((html.match(/data-shadow-light-controls/g) ?? []).length, 1);
  assert.doesNotMatch(preview, /shadow-light-console/);
  assert.match(panel, /Une seule lumière commune/);
});

test("Capture editor sends Combat lighting explicitly without author export changes", () => {
  const editor = source("examples/dom-demo/capture-editor-v2.js");
  const demo = source("src/ui/demo-app.js");
  assert.match(editor, /function readCombatLightEditor\(\)/);
  assert.match(editor, /arenaLight: readCombatLightEditor\(\)/);
  assert.match(editor, /mode: value\("mode"\)/);
  assert.match(editor, /flightHeightPx: value\("flight-height"\)/);
  assert.match(demo, /if \(!lightControls\) return normalizeArenaShadowLightV1\(initialArenaLight \?\? \{\}\)/);
  assert.match(demo, /let arenaLight = readLightControls\(\)/);
});

test("Capture visual owner receives optional Combat lighting only once", async () => {
  const light = Object.freeze({ mode: "silhouette", azimuthDeg: 295,
    elevationDeg: 60, softness: 0.3, intensity: 0.7, flightHeightPx: 75 });
  const calls = [];
  const disposed = [];
  for (const lighting of [light, null]) {
    const mounted = await mountCaptureCombatPreviewV1({
      root: { id: "root" },
      nativeCombatSource: { id: "combat" },
      nativeVisualSource: { id: "visual" },
      ...(lighting === null ? {} : { arenaLight: lighting }),
      mountVisuals: async params => {
        calls.push(params);
        return { dispose() { disposed.push("visual"); } };
      },
      mountCombat: async () => ({
        dispose() { disposed.push("combat"); }
      })
    });
    mounted.dispose();
    mounted.dispose();
  }
  assert.equal(calls.length, 2);
  assert.equal(calls[0].initialArenaLight, light);
  assert.equal(Object.hasOwn(calls[1], "initialArenaLight"), false);
  assert.deepEqual(disposed, ["combat", "visual", "combat", "visual"]);
});

test("existing light normalization accepts all six fields and rejects bad values", () => {
  const input = { mode: "soft", azimuthDeg: "315", elevationDeg: "60",
    softness: 0.4, intensity: 0.8, flightHeightPx: "85" };
  const normalized = normalizeArenaShadowLightV1(input);
  assert.equal(normalized.mode, "soft");
  assert.equal(normalized.azimuthDeg, 315);
  assert.equal(normalized.elevationDeg, 60);
  assert.equal(normalized.softness, 0.4);
  assert.equal(normalized.intensity, 0.8);
  assert.equal(normalized.flightHeightPx, 85);
  assert.equal(normalizeArenaShadowLightV1().mode, "silhouette");
  assert.throws(() => normalizeArenaShadowLightV1({ mode: "not-a-mode" }), RangeError);
  assert.throws(() => normalizeArenaShadowLightV1({ elevationDeg: 0 }), RangeError);
});
