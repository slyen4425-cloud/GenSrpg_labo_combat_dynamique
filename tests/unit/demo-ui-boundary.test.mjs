import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("demo delegates animation authority to Core and renderer", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /normalizeCombatVisualEvent/);
  assert.match(source, /planAnimation/);
  assert.match(source, /createDomActorRenderer/);
  assert.match(source, /createImageSourceManager/);

  assert.doesNotMatch(source, /\.animate\s*\(/);
  assert.doesNotMatch(source, /durationMs\s*:/);
  assert.doesNotMatch(source, /translateX\s*:/);
  assert.doesNotMatch(source, /rotateDeg\s*:/);
});

test("demo page is mobile-first and keeps JavaScript external", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");

  assert.match(html, /name="viewport"/);
  assert.match(html, /data-demo-file/g);
  assert.match(html, /data-demo-event="idle"/);
  assert.match(html, /data-demo-event="attack"/);
  assert.match(html, /data-demo-event="hit"/);
  assert.match(html, /data-demo-event="ko"/);
  assert.match(html, /src="\.\/demo\.js"/);
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/);
});

test("demo bootstrap disposes the mounted controller on pagehide", async () => {
  const source = await readFile("examples/dom-demo/demo.js", "utf8");

  assert.match(source, /mountCombatDemo/);
  assert.match(source, /pagehide/);
  assert.match(source, /demo\.dispose\(\)/);
});
