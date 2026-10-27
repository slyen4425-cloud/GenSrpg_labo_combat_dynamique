import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function block(source, selector) {
  const start = source.indexOf(selector);
  assert.notEqual(start, -1, "missing " + selector);
  const open = source.indexOf("{", start);
  const close = source.indexOf("}", open);
  return source.slice(open + 1, close);
}

test("landscape dodge sits just left of the skill stack and is slightly larger than V1", async () => {
  const css = await readFile(
    "examples/dom-demo/capture-editor-v2.css",
    "utf8"
  );

  const arena = block(
    css,
    ".combat-dodge-action--arena"
  );
  assert.equal(
    arena.includes("left: 50%"),
    false,
    "dodge must no longer sit in the middle of the arena"
  );

  const landscapeAnchor = block(
    css,
    '.capture-preview-shell[data-landscape-required="true"]\n  .combat-dodge-action--arena'
  );
  assert.equal(
    landscapeAnchor.includes(
      "right: calc(min(15rem, 35%) + 0.65rem)"
    ),
    true,
    "dodge must hug the left edge of the landscape skill stack"
  );

  const landscapeButton = block(
    css,
    '.capture-preview-shell[data-landscape-required="true"]\n  .combat-dodge-action {'
  );
  assert.equal(
    landscapeButton.includes(
      "min-width: clamp(3.2rem, 7.8vw, 4.5rem);"
    ),
    true,
    "dodge should be slightly larger than V1"
  );

  const primary = block(css, ".combat-primary-actions");
  assert.equal(primary.includes("display: block"), true);
  assert.equal(primary.includes("grid-template-columns"), false);
});
