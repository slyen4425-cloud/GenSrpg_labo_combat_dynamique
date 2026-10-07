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

test("Capture landscape layout moves both opponent slots slightly higher and right without scale overrides", () => {
  assert.match(
    css,
    /\.capture-preview-shell\[data-landscape-required="true"\][\s\S]*\.arena--coop-2v2[\s\S]*--arena-coop-far-primary-y:\s*33%;[\s\S]*--arena-coop-far-secondary-y:\s*34%;/
  );

  assert.match(
    css,
    /\.capture-preview-shell\[data-landscape-required="true"\][\s\S]*\.arena--coop-2v2 \.fighter--opponent\s*\{[\s\S]*left:\s*77%;[\s\S]*\}/
  );

  assert.match(
    css,
    /\.capture-preview-shell\[data-landscape-required="true"\][\s\S]*\.arena--coop-2v2 \.fighter--opponent-b\s*\{[\s\S]*left:\s*34%;[\s\S]*\}/
  );

  const marker =
    "Capture landscape opponent slot placement V1";
  const start = css.indexOf(marker);
  assert.ok(start >= 0);
  const block = css.slice(start, start + 1200);

  assert.equal(
    /width\s*:|transform\s*:[^;]*scale\s*\(|--creature-display-scale\s*:/.test(block),
    false,
    "landscape slot shift must not modify author scale/width"
  );
});
