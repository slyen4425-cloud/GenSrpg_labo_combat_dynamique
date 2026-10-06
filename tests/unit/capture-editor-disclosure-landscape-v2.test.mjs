import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function text(path) {
  return readFile(
    new URL("../../" + path, import.meta.url),
    "utf8"
  );
}

test("editor disclosure V2 makes the whole card title the visible keyboard-accessible control", async () => {
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    source,
    /title\.dataset\.editorCardToggle/
  );
  assert.match(
    source,
    /title\.setAttribute\(\s*["']role["']\s*,\s*["']button["']/
  );
  assert.match(
    source,
    /title\.tabIndex\s*=\s*0/
  );
  assert.match(
    source,
    /keydown/
  );
  assert.match(
    source,
    /event\.key\s*===\s*["']Enter["']/
  );
  assert.match(
    source,
    /event\.key\s*===\s*["'] ["']/
  );
  assert.doesNotMatch(
    source,
    /root\.ownerDocument\.createElement\(\s*["']button["']\s*\)/
  );
});

test("editor disclosure V2 reserves a visible trailing disclosure label on narrow screens", async () => {
  const css = await text(
    "examples/dom-demo/capture-editor-v2.css"
  );

  assert.match(
    css,
    /\.card-title\s*\{[^}]*grid-template-columns/s
  );
  assert.match(
    css,
    /\.card-title::after/
  );
  assert.match(
    css,
    /data-collapsed="true"[^}]*\.card-title::after|data-collapsed="true"[^\n]*>\s*\.card-title::after/s
  );
  assert.match(
    css,
    /min-width:\s*0/
  );
});

test("landscape preview V2 owns one centered 16 by 9 arena instead of stretching the arena to the viewport", async () => {
  const css = await text(
    "examples/dom-demo/capture-editor-v2.css"
  );

  assert.match(
    css,
    /data-landscape-required="true"[\s\S]*?\.arena[^}]*aspect-ratio:\s*16\s*\/\s*9/
  );
  assert.match(
    css,
    /data-landscape-required="true"[\s\S]*?\.capture-preview-host[^}]*place-items:\s*center/
  );
  assert.match(
    css,
    /data-landscape-required="true"[\s\S]*?\.capture-preview-host\s*>\s*\.game[^}]*padding:\s*0/
  );
});

test("landscape preview V2 uses dedicated compact HUD and height-driven fighter sizing", async () => {
  const css = await text(
    "examples/dom-demo/capture-editor-v2.css"
  );

  assert.match(
    css,
    /data-landscape-required="true"[\s\S]*?\.arena--coop-2v2\s+\.fighter--player[^}]*dvh/
  );
  assert.match(
    css,
    /data-landscape-required="true"[\s\S]*?\.coop-command-stack[^}]*width/
  );
  assert.match(
    css,
    /data-landscape-required="true"[\s\S]*?\.squad-card--local-full[^}]*width/
  );
});

test("landscape V2 preserves the known-working fullscreen request owner", async () => {
  const source = await text(
    "examples/dom-demo/capture-editor-v2.js"
  );

  assert.match(
    source,
    /fullscreenHost:\s*document\.documentElement/
  );
});
