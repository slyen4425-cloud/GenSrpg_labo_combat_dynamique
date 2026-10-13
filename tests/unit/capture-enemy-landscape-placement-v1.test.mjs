import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(
  "examples/dom-demo/capture-editor-v2.html",
  "utf8"
);
const css = await readFile(
  "examples/dom-demo/capture-editor-v2.css",
  "utf8"
);
const js = await readFile(
  "examples/dom-demo/capture-editor-v2.js",
  "utf8"
);

test("Capture smartphone landscape is the definitive automatic gameplay mode", () => {
  assert.doesNotMatch(
    html,
    /data-preview-landscape-mode/
  );
  assert.doesNotMatch(
    html,
    /Combat plein écran paysage/
  );
  assert.equal(
    html.includes("Test provisoire"),
    false
  );
  assert.match(
    js,
    /previewDisplayMode\.enter\(\{\s*enabled:\s*true\s*\}\)/
  );
});

test("Capture landscape 2v2 keeps two distant enemy slots with real geometry and unchanged 1v1 scales", async () => {
  const marker = "Capture landscape 2v2 depth V2";
  const start = css.indexOf(marker);
  assert.ok(start >= 0, "single owned landscape section must exist");
  const block = css.slice(start, css.indexOf("/* Rayon :", start));
  assert.match(block, /--arena-coop-far-primary-y:\s*26%;/);
  assert.match(block, /--arena-coop-far-secondary-y:\s*28%;/);
  assert.match(block, /\.arena--coop-2v2 \.fighter--opponent\s*\{\s*left:\s*58%;\s*width:\s*min\(24dvh,\s*13rem\);/);
  assert.match(block, /\.arena--coop-2v2 \.fighter--opponent-b\s*\{\s*left:\s*36%;\s*width:\s*min\(23dvh,\s*12\.5rem\);/);
  assert.doesNotMatch(block, /transform\s*:|--creature-display-scale\s*:|--distance-scale\s*:/,
    "landscape depth must move/size the actual DOM slot and must never override author scale");

  const original = await readFile("examples/dom-demo/demo.css","utf8");
  assert.match(original, /--arena-far-y:\s*38%;/,
    "1v1 depth must remain unchanged");
  assert.match(original, /\.fighter--opponent\s*\{\s*z-index:\s*3;\s*top:\s*var\(--arena-far-y\)/,
    "the 1v1 positional owner must remain unchanged");
});
