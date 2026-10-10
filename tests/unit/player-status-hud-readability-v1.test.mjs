import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const cssPath = new URL("../../examples/dom-demo/demo.css", import.meta.url);
const htmlPath = new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url);
const uiPath = new URL("../../src/ui/combat-2v2-test-ui.js", import.meta.url);

function block(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(escaped + "\\s*\\{([^}]+)\\}"));
  assert.ok(match, "CSS selector missing: " + selector);
  return match[1];
}

test("player status info opens ABOVE player card and inside the left arena edge", async () => {
  const css = await readFile(cssPath, "utf8");
  const rule = block(css, ".squad-card--player .status-icon__details");
  assert.match(rule, /top:\s*auto\s*;/);
  assert.match(rule, /bottom:\s*calc\(100%\s*\+\s*0\.42rem\)\s*;/);
  assert.match(rule, /left:\s*0\s*;/);
  assert.match(rule, /transform:\s*none\s*;/);
  assert.match(rule, /width:\s*min\(/);
});

test("ally status info opens UP and anchors right; enemy still opens down", async () => {
  const css = await readFile(cssPath, "utf8");
  const ally = block(css, ".squad-card--command-ally .status-icon__details");
  assert.match(ally, /top:\s*auto\s*;/);
  assert.match(ally, /bottom:\s*calc\(100%\s*\+\s*0\.42rem\)\s*;/);
  assert.match(ally, /right:\s*0\s*;/);
  assert.match(ally, /left:\s*auto\s*;/);
  const enemy = block(css, ".status-icon__details");
  assert.match(enemy, /top:\s*calc\(100%\s*\+\s*0\.42rem\)\s*;/);
});

test("real combat template and shared status renderer cover all 4 actors", async () => {
  const html = await readFile(htmlPath, "utf8");
  const ui = await readFile(uiPath, "utf8");
  for (const id of ["local-1", "local-2", "opponent-1", "opponent-2"]) {
    assert.match(html, new RegExp('data-combat-status-icons="' + id + '"'));
  }
  assert.match(ui, /\[data-combat-status-icons="\$\{actor\.actorId\}"\]/);
  assert.match(ui, /createDomStatusFxRenderer\(\{/);
  assert.match(ui, /statusFx\?\.sync\(state\)/);
});
