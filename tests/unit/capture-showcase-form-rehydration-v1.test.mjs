import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(
    new URL("../../" + path, import.meta.url),
    "utf8"
  );
}

test("showcase batch reloads the full selected creature record instead of stats only", async () => {
  const human = await source(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    human,
    /showcaseResult[\s\S]*if \(\s*selectedRecord &&\s*creatureDirty === false\s*\) \{\s*loadCreatureRecord\(\s*selectedRecord\.draft\.id\s*\)/
  );
});

test("socket rendering is driven by the currently selected socket id", async () => {
  const human = await source(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    human,
    /renderSelectedCreatureSocketMarkersV1/
  );
  assert.match(
    human,
    /data-socket-kind[\s\S]*change[\s\S]*renderSelectedCreatureSocketMarkersV1/
  );
  assert.doesNotMatch(
    human,
    /for \(const socket of presentation\?\.sockets \?\? \[\]\)[\s\S]*updateSocketMarker\(surface, point\)/
  );
});

test("socket surface hint is not selected by last-child marker styling", async () => {
  const [html, css] = await Promise.all([
    source("examples/dom-demo/capture-editor-v2.html"),
    source("examples/dom-demo/capture-editor-v2.css")
  ]);

  assert.match(
    html,
    /class="socket-surface__hint">Toucher pour placer · FACE/
  );
  assert.match(
    html,
    /class="socket-surface__hint">Toucher pour placer · DOS/
  );
  assert.match(
    css,
    /\.socket-surface__hint\s*\{/
  );
  assert.doesNotMatch(
    css,
    /\.socket-surface\s*>\s*span:last-child/
  );
});
