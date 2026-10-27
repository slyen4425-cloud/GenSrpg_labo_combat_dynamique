import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.css", import.meta.url), "utf8");
const begin = css.indexOf("/* Capture landscape opponent slot placement V1");
const split = css.indexOf("/* Capture landscape 2v2 depth V2", begin);
const end = css.indexOf("/* Rayon :", split);
const legacy = css.slice(begin, split);
const twoActive = css.slice(split, end);

test("1v1 historical placements stay unchanged while 2v2 shares only the real format guard", () => {
  assert.ok(begin >= 0 && split > begin && end > split);
  assert.match(legacy, /--arena-coop-far-primary-y:\s*33%;/);
  assert.match(legacy, /--arena-coop-far-secondary-y:\s*34%;/);
  assert.match(legacy, /\.arena--coop-2v2 \.fighter--opponent\s*\{\s*left:\s*77%;\s*\}/);
  assert.match(legacy, /\.arena--coop-2v2 \.fighter--opponent-b\s*\{\s*left:\s*34%;\s*\}/);
  assert.match(twoActive, /\.arena--coop-2v2\[data-combat-active-count="2"\]/);
  assert.doesNotMatch(twoActive, /\.arena--coop-2v2 \.fighter--opponent\s*\{/);
});

test("only 2v2 actors move slightly right, and far-right opponent lowers naturally", () => {
  assert.match(twoActive, /--arena-coop-far-primary-y:\s*30%;/);
  assert.match(twoActive, /--arena-coop-far-secondary-y:\s*28%;/);
  assert.match(twoActive, /\.arena--coop-2v2\[data-combat-active-count="2"\] \.fighter--opponent\s*\{\s*left:\s*68%;\s*width:\s*min\(24dvh,\s*13rem\);/);
  assert.match(twoActive, /\.arena--coop-2v2\[data-combat-active-count="2"\] \.fighter--opponent-b\s*\{\s*left:\s*46%;\s*width:\s*min\(23dvh,\s*12\.5rem\);/);
  assert.doesNotMatch(twoActive, /transform\s*:|--creature-display-scale\s*:|--distance-scale\s*:/);
});
