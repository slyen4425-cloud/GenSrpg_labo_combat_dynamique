import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function text(path) {
  return readFile(
    new URL("../../" + path, import.meta.url),
    "utf8"
  );
}

test("Human Editor exposes one reusable disclosure owner for existing cards without mutating child hidden state", async () => {
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    source,
    /mountEditorCardDisclosuresV1/
  );
  assert.match(
    source,
    /data-editor-card-toggle/
  );
  assert.match(
    source,
    /dataset\.collapsed/
  );
  assert.doesNotMatch(
    source,
    /child\.hidden\s*=|content\.hidden\s*=/
  );
});

test("editor CSS collapses card contents structurally and makes sprite customization hard to miss", async () => {
  const css = await text(
    "examples/dom-demo/capture-editor-v2.css"
  );

  assert.match(
    css,
    /data-collapsed="true"/
  );
  assert.match(
    css,
    /data-skill-fx-advanced/
  );
  assert.match(
    css,
    /summary/
  );
  assert.match(
    css,
    /min-height:\s*(?:4[4-9]|[5-9][0-9])px/
  );
});

test("combat preview exposes a configurable fullscreen landscape trial and portrait rotation gate", async () => {
  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );

  assert.match(
    html,
    /data-preview-landscape-mode/
  );
  assert.match(
    html,
    /Combat plein écran paysage/
  );
  assert.match(
    html,
    /data-preview-rotate-gate/
  );
  assert.match(
    html,
    /Tourne ton téléphone/
  );
});

test("preview display mode has one UI owner with fullscreen request, landscape lock and clean release", async () => {
  const source = await text(
    "src/ui/capture-preview-display-mode-v1.js"
  );

  assert.match(source, /requestFullscreen/);
  assert.match(source, /orientation\?\.lock|orientation\.lock/);
  assert.match(source, /"landscape"/);
  assert.match(source, /exitFullscreen/);
  assert.match(source, /orientation\?\.unlock|orientation\.unlock/);
  assert.match(source, /data-landscape-required|landscapeRequired/);
});

test("fullscreen request stays on the Tester en combat user gesture path before async preview launch", async () => {
  const source = await text(
    "examples/dom-demo/capture-editor-v2.js"
  );

  assert.match(
    source,
    /createCapturePreviewDisplayModeV1/
  );

  const click = source.indexOf(
    'testButton.addEventListener("click"'
  );
  const enter = source.indexOf(
    "previewDisplayMode.enter",
    click
  );
  const launch = source.indexOf(
    "await session.launch()",
    click
  );

  assert.ok(click >= 0);
  assert.ok(enter > click);
  assert.ok(launch > enter);
  assert.match(
    source,
    /previewDisplayMode\.leave/
  );
});
