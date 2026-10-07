import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("landscape dodge is taller and slightly higher without changing skill icons", async () => {
  const css = await readFile("examples/dom-demo/capture-editor-v2.css", "utf8");

  assert.equal(
    css.includes("min-height: clamp(2.6rem, 8.5dvh, 3.4rem);"),
    true,
    "landscape dodge needs a larger vertical touch target"
  );
  assert.equal(
    css.includes("bottom: 0.8rem;"),
    true,
    "landscape dodge should sit slightly higher than V2"
  );
  assert.equal(
    css.includes("width: clamp(1.45rem, 5.5dvh, 2rem);"),
    true
  );
  assert.equal(
    css.includes("height: clamp(1.45rem, 5.5dvh, 2rem);"),
    true
  );
});
