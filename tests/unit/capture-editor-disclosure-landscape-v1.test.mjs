import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createCapturePreviewDisplayModeV1
} from "../../src/ui/capture-preview-display-mode-v1.js";

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
    /data-editor-card-toggle|dataset\.editorCardToggle/
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

test("combat preview uses automatic landscape mode and keeps only the portrait rotation gate", async () => {
  const [html, source] = await Promise.all([
    text("examples/dom-demo/capture-editor-v2.html"),
    text("examples/dom-demo/capture-editor-v2.js")
  ]);

  assert.doesNotMatch(
    html,
    /data-preview-landscape-mode/
  );
  assert.doesNotMatch(
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
  assert.match(
    source,
    /previewDisplayMode\.enter\(\{\s*enabled:\s*true\s*\}\)/
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


test("preview display owner requests fullscreen and landscape then releases only what it owns", async () => {
  const body = { dataset: {} };
  const previewShell = { dataset: {} };
  const documentRef = {
    body,
    fullscreenElement: null,
    async exitFullscreen() {
      calls.push("exit");
      this.fullscreenElement = null;
    }
  };
  const fullscreenHost = {
    async requestFullscreen() {
      calls.push("fullscreen");
      documentRef.fullscreenElement =
        fullscreenHost;
    }
  };
  const orientation = {
    async lock(mode) {
      calls.push("lock:" + mode);
    },
    unlock() {
      calls.push("unlock");
    }
  };
  const calls = [];

  const owner =
    createCapturePreviewDisplayModeV1({
      documentRef,
      screenRef: { orientation },
      fullscreenHost,
      previewShell
    });

  const entered = await owner.enter({
    enabled: true
  });

  assert.equal(
    previewShell.dataset.landscapeRequired,
    "true"
  );
  assert.equal(
    body.dataset.previewLandscapeActive,
    "true"
  );
  assert.equal(entered.fullscreen, true);
  assert.equal(
    entered.orientationLocked,
    true
  );
  assert.deepEqual(
    calls,
    ["fullscreen", "lock:landscape"]
  );

  await owner.leave();

  assert.equal(
    previewShell.dataset.landscapeRequired,
    "false"
  );
  assert.equal(
    "previewLandscapeActive" in body.dataset,
    false
  );
  assert.deepEqual(
    calls,
    [
      "fullscreen",
      "lock:landscape",
      "unlock",
      "exit"
    ]
  );
});

test("preview display owner keeps the rotation gate when browser fullscreen or orientation lock is unavailable", async () => {
  const body = { dataset: {} };
  const previewShell = { dataset: {} };
  const documentRef = {
    body,
    fullscreenElement: null,
    async exitFullscreen() {}
  };
  const fullscreenHost = {
    async requestFullscreen() {
      throw new Error(
        "fullscreen unavailable"
      );
    }
  };
  const orientation = {
    async lock() {
      throw new Error(
        "orientation unavailable"
      );
    },
    unlock() {
      throw new Error(
        "must not unlock a lock it never owned"
      );
    }
  };

  const owner =
    createCapturePreviewDisplayModeV1({
      documentRef,
      screenRef: { orientation },
      fullscreenHost,
      previewShell
    });

  const entered = await owner.enter({
    enabled: true
  });

  assert.equal(
    entered.status,
    "rotation-gate"
  );
  assert.equal(entered.fullscreen, false);
  assert.equal(
    entered.orientationLocked,
    false
  );
  assert.equal(
    previewShell.dataset.landscapeRequired,
    "true"
  );

  await owner.leave();
  assert.equal(
    previewShell.dataset.landscapeRequired,
    "false"
  );
});
