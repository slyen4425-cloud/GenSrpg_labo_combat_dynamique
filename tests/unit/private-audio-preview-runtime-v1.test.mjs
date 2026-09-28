import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import {
  privateAudioPreviewAssetV1
} from "../../src/assets/private-audio-preview-assets-v1.js";

const EXPECTED = Object.freeze({
  "gensrpg:sound:effect-135ee2ed": "fire_cast.mp3",
  "gensrpg:sound:effect-df32b429": "melee_impact.mp3",
  "gensrpg:sound:effect-0221d6ed": "teleport.mp3"
});

test("private audio preview delivery exposes only the three authorized runtime test assets", () => {
  for (const [assetId, filename] of Object.entries(EXPECTED)) {
    const asset = privateAudioPreviewAssetV1(assetId);
    assert.equal(asset?.assetId, assetId);
    assert.match(asset?.url ?? "", new RegExp(filename.replace(".", "\\.")));
  }

  assert.equal(
    privateAudioPreviewAssetV1("gensrpg:sound:academie-01fc18a6"),
    null
  );
});

test("Capture editor preview resolves private audio delivery before demo fallback", async () => {
  const source = await fs.readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /privateAudioPreviewAssetV1/
  );
  assert.match(
    source,
    /privateAudioPreviewAssetV1\(assetId\)\s*\?\?\s*demoPresentationAssets\.audioAsset\(assetId\)/
  );
});
