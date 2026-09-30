import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
    "CAPTURE_TEST_CREATURE_OPTIONS_V1",
    "buildCaptureTestOpponentDraftV1"
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


test("combat preview exposes authoritative cooldown feedback", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/combat-2v2-test-ui.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(source, /preview\.outcome\s*===\s*["']cooldown["']/);
  assert.match(source, /preview\.remainingCooldownMs/);
  assert.match(source, /action-option__cooldown/);
  assert.doesNotMatch(source, /setInterval\s*\(/);
  assert.doesNotMatch(source, /Date\.now\s*\(/);
});
