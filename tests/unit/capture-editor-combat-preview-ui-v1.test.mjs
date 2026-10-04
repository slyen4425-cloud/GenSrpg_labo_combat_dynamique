import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { createCaptureEditorPreviewSessionV2 } from "../../src/ui/capture-editor-preview-session-v2.js";

const htmlUrl = new URL(
  "../../examples/dom-demo/capture-editor-v2.html",
  import.meta.url
);
const jsUrl = new URL(
  "../../examples/dom-demo/capture-editor-v2.js",
  import.meta.url
);
const testCreatureCatalogUrl = new URL(
  "../../src/catalogs/capture-test-creature-options-v1.js",
  import.meta.url
);

test("Capture editor exposes real combat preview controls and reusable preview DOM template", async () => {
  const html = await readFile(htmlUrl, "utf8");

  assert.match(html, /data-editor-test-combat/);
  assert.match(html, /data-preview-back-editor/);
  assert.match(html, /data-capture-preview-shell/);
  assert.match(html, /data-capture-preview-host/);
  assert.match(html, /data-capture-preview-template/);

  for (const actorId of [
    "local-1",
    "local-2",
    "opponent-1",
    "opponent-2"
  ]) {
    assert.match(
      html,
      new RegExp(`data-demo-slot=["']${actorId}["']`)
    );
    assert.match(
      html,
      new RegExp(`data-combat-hp=["']${actorId}["']`)
    );
  }

  assert.match(
    html,
    /data-combat-energy=["']local-1["']/
  );
  assert.match(html, /data-combat-skills/);
});

test("Capture editor page composes Session V2 with native combat and visual owners", async () => {
  const [source, testCreatureCatalog] = await Promise.all([
    readFile(jsUrl, "utf8"),
    readFile(testCreatureCatalogUrl, "utf8")
  ]);

  for (const required of [
    "createCaptureEditorPreviewSessionV2",
    "adaptCaptureExportToNativeVisualSourceV1",
    "mountCaptureCombatPreviewV1",
    "GLOBAL_VISUAL_LIBRARY",
    "globalVisualAssetUrl",
    "mountCaptureEditorHumanV2"
  ]) {
    assert.match(source, new RegExp(required));
  }

  assert.match(
    testCreatureCatalog,
    /pack:capture:creature-braisombre-opponent-01/
  );
  assert.match(
    testCreatureCatalog,
    /pack:capture:creature-braisombre-player-01/
  );
  assert.match(
    testCreatureCatalog,
    /pack:capture:creature-braisombre-icon-01/
  );
  assert.match(
    testCreatureCatalog,
    /profileId:\s*["']flying["']/
  );
  assert.match(
    source,
    /data\/profiles\/flying\.profile\.json/
  );
  assert.doesNotMatch(
    source,
    /data\/profiles\/drake\.profile\.json/
  );
  assert.doesNotMatch(
    source,
    /const opponentCreatureDraft\s*=\s*\{/
  );
  assert.match(source, /session\.launch\(\)/);
  assert.match(source, /session\.returnToEditor\(\)/);
});

test("Capture editor combat preview page keeps storage and business globals out", async () => {
  const source = await readFile(jsUrl, "utf8");

  for (const forbidden of [
    "localStorage",
    "sessionStorage",
    "window.currentCaptureExport",
    "window.currentCombat",
    "Zombicide-40k",
    "captureFix"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `preview page must not contain ${forbidden}`
    );
  }
});

test("native test button allows a retry after invalid fields and a failed preview", async () => {
  const source = await readFile(jsUrl, "utf8");
  const start = source.indexOf('testButton.addEventListener("click"');
  const end = source.indexOf("window.addEventListener(", start);
  assert.ok(start >= 0 && end > start);
  const listeners = {};
  const testButton = {
    disabled: false,
    addEventListener(type, listener) { listeners.test = listener; }
  };
  const backButton = {
    addEventListener(type, listener) { listeners.back = listener; }
  };
  let valid = false;
  let adapterFails = false;
  let mode = "editor";
  let mounts = 0;
  const editorStatus = { textContent: "Configuration invalide", dataset: {} };
  const session = createCaptureEditorPreviewSessionV2({
    editor: { validate: () => valid ? { marker: "valid" } : null, dispose() {} },
    adaptCombatExport(exported) {
      if (adapterFails) throw new Error("missing preview asset");
      return exported;
    },
    adaptVisualExport: exported => exported,
    mountPreview: () => { mounts += 1; return { dispose() {} }; },
    onModeChange: next => { mode = next; }
  });
  // Execute the page's own handlers against the real Preview Session.
  runInNewContext(source.slice(start, end), {
    testButton, backButton, session, editorStatus,
    visualContext: {}, visualContextPromise: Promise.resolve({}),
    setMode: next => { mode = next; }
  });
  const refused = listeners.test();
  assert.equal(testButton.disabled, true, "in-flight launch is gated");
  await refused;
  assert.equal(testButton.disabled, false, "invalid fields must not lock the test button");
  assert.equal(mode, "editor");
  assert.equal(mounts, 0);
  assert.equal(editorStatus.textContent, "Configuration invalide");

  valid = true;
  await listeners.test();
  assert.equal(mode, "preview");
  assert.equal(mounts, 1);
  assert.equal(testButton.disabled, true);
  listeners.back();
  assert.equal(mode, "editor");
  assert.equal(testButton.disabled, false);
  adapterFails = true;
  await listeners.test();
  assert.equal(testButton.disabled, false);
  assert.equal(mode, "editor");
  assert.match(editorStatus.textContent, /missing preview asset/);
  session.dispose();
});
