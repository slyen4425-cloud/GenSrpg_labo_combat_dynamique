import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("presentation scale controls do not invent a 4x maximum", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
    "utf8"
  );

  for (const marker of [
    "data-creature-display-scale",
    "data-skill-cast-scale",
    "data-skill-travel-scale",
    "data-skill-impact-scale"
  ]) {
    const index = html.indexOf(marker);
    assert.notEqual(index, -1, marker + " missing");
    const snippet = html.slice(Math.max(0, index - 180), index + 260);
    assert.doesNotMatch(
      snippet,
      /max="4"/,
      marker + " must not be capped at 4x"
    );
  }
});

test("creature scale uses an unrestricted positive numeric control", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
    "utf8"
  );

  const index = html.indexOf("data-creature-display-scale");
  const snippet = html.slice(Math.max(0, index - 120), index + 260);

  assert.match(snippet, /type="number"/);
  assert.match(snippet, /min="0\.25"/);
  assert.doesNotMatch(snippet, /max=/);
});
