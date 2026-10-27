import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function cssBlock(source, selector) {
  const start = source.indexOf(selector);
  assert.notEqual(start, -1, "missing CSS selector " + selector);
  const open = source.indexOf("{", start);
  const close = source.indexOf("}", open);
  return source.slice(open + 1, close);
}

test("combat dodge uses the free arena gap instead of shrinking the skill grid", async () => {
  const html = await readFile(
    "examples/dom-demo/capture-editor-v2.html",
    "utf8"
  );
  const css = await readFile(
    "examples/dom-demo/capture-editor-v2.css",
    "utf8"
  );

  assert.equal(
    html.includes(
      'class="combat-dodge-action combat-dodge-action--arena"'
    ),
    true,
    "dodge must have its own arena HUD slot"
  );

  const primary = cssBlock(
    css,
    ".combat-primary-actions"
  );

  assert.equal(
    primary.includes("display: block"),
    true,
    "skill wrapper must use the full controls width"
  );
  assert.equal(
    primary.includes("grid-template-columns"),
    false,
    "dodge must not reserve a second column inside the skill block"
  );

  const arenaDodge = cssBlock(
    css,
    ".combat-dodge-action--arena"
  );
  assert.equal(
    arenaDodge.includes("position: absolute"),
    true,
    "dodge must remain an arena-level HUD control"
  );
});

test("landscape dodge is about forty percent smaller without shrinking skill icons", async () => {
  const css = await readFile(
    "examples/dom-demo/capture-editor-v2.css",
    "utf8"
  );

  assert.equal(
    css.includes(
      "class=\"combat-dodge-action combat-dodge-action--arena\""
    ),
    false,
    "CSS must not own or duplicate dodge markup"
  );

  assert.equal(
    css.includes(
      "width: clamp(1.45rem, 5.5dvh, 2rem);"
    ),
    true,
    "authored skill icon size rule must remain unchanged"
  );
  assert.equal(
    css.includes(
      "height: clamp(1.45rem, 5.5dvh, 2rem);"
    ),
    true,
    "authored skill icon size rule must remain unchanged"
  );
});
