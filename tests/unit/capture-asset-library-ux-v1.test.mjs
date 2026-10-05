import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  captureEditorAssetLibraryGroupV1
} from "../../src/ui/capture-editor-human-v2.js";

async function text(path) {
  return readFile(
    new URL("../../" + path, import.meta.url),
    "utf8"
  );
}

test("asset provenance maps system assets and creator imports to the two visible libraries", () => {
  assert.equal(
    captureEditorAssetLibraryGroupV1({
      source: { scope: "core" }
    }),
    "gensrpg"
  );
  assert.equal(
    captureEditorAssetLibraryGroupV1({
      source: { scope: "pack" }
    }),
    "gensrpg"
  );
  assert.equal(
    captureEditorAssetLibraryGroupV1({
      source: { scope: "user" }
    }),
    "user"
  );
});

test("visual selectors distinguish GenSrpG library from creator assets without a second importer", async () => {
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    source,
    /Bibliothèque GenSrpG/
  );
  assert.match(
    source,
    /Mes assets/
  );
  assert.match(
    source,
    /source\?\.scope\s*===\s*["']user["']|source\.scope\s*===\s*["']user["']/
  );

  assert.equal(
    (
      source.match(
        /const asset =\s*creatorVisualAssets\.importImage/g
      ) ?? []
    ).length,
    1,
    "the existing creator asset session must remain the only import invocation path"
  );
});

test("skill FX copy explains library, personal assets and importer as separate choices from Pack FX", async () => {
  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );

  assert.match(html, /Bibliothèque GenSrpG/);
  assert.match(html, /Mes assets/);
  assert.match(html, /Importer un sprite/);
  assert.match(html, /Pack FX GenSrpG/);
});

test("creator import owner still emits user assetIds for the canonical presentation pipeline", async () => {
  const owner = await text(
    "src/assets/creator-visual-asset-session-v1.js"
  );
  const preview = await text(
    "examples/dom-demo/capture-editor-v2.js"
  );

  assert.match(owner, /id = "user:"/);
  assert.match(owner, /scope: "user"/);
  assert.match(
    preview,
    /creatorVisualAssets\.list\(\)/
  );
  assert.match(
    preview,
    /createCaptureSkillPresentationAssetsV2/
  );
});

test("Loup volcanique showcase keeps its icon and aligns mouth socket with repaired visual metadata", async () => {
  const showcase = JSON.parse(
    await text(
      "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json"
    )
  );

  const presentation =
    showcase.draft.presentation;

  assert.equal(
    presentation.visual.icon.assetId,
    "pack:capture:creature-loup-volcanique-icon-01"
  );
  assert.equal(
    presentation.visual.front.assetId,
    "pack:capture:creature-loup-volcanique-opponent-01"
  );
  assert.equal(
    presentation.visual.back.assetId,
    "pack:capture:creature-loup-volcanique-player-01"
  );

  const mouth = presentation.sockets.find(
    (entry) => entry.id === "mouth"
  );
  assert.ok(mouth, "Loup mouth socket must exist");

  assert.deepEqual(
    mouth.front,
    { x: 0.15, y: 0.53 }
  );
  assert.deepEqual(
    mouth.back,
    { x: 0.82, y: 0.52 }
  );
});
