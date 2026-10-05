import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const runtimeManifestUrl = new URL(
  "../../data/presentation/audio/private-audio-runtime.v1.json",
  import.meta.url
);
const editorHtmlUrl = new URL(
  "../../examples/dom-demo/capture-editor-v2.html",
  import.meta.url
);

test("private runtime audio manifest exposes all 173 opaque delivered assets", async () => {
  const raw = await readFile(runtimeManifestUrl, "utf8");
  const manifest = JSON.parse(raw);

  assert.equal(manifest.count, 173);
  assert.equal(manifest.entries.length, 173);
  assert.equal(
    new Set(manifest.entries.map((entry) => entry.assetId)).size,
    173
  );
  assert.equal(
    new Set(manifest.entries.map((entry) => entry.runtimeFile)).size,
    173
  );

  const serialized = JSON.stringify(manifest);
  assert.equal(serialized.includes("sourcePath"), false);
  assert.equal(serialized.includes("GenSrpG_audio_prive"), false);
  assert.equal(serialized.includes("github.com"), false);

  for (const entry of manifest.entries) {
    assert.match(entry.assetId, /^gensrpg:sound:/);
    assert.match(
      entry.runtimeFile,
      /^private-v1\/[a-z0-9_-]+\.mp3$/
    );
  }
});

test("full private audio resolver serves delivered ids and rejects unknown ids", async () => {
  const {
    PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1,
    privateAudioRuntimeAssetV1
  } = await import(
    "../../src/assets/private-audio-runtime-library-v1.js"
  );

  assert.equal(PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1.length, 173);

  for (const assetId of PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1) {
    const asset = privateAudioRuntimeAssetV1(assetId);
    assert.equal(asset?.assetId, assetId);
    assert.match(asset?.url ?? "", /assets\/runtime\/audio\/private-v1\/.+\.mp3/);
  }

  assert.equal(
    privateAudioRuntimeAssetV1("gensrpg:sound:unknown"),
    null
  );
});

test("every private audio selector has a prelisten action and dedicated controller", async () => {
  const html = await readFile(editorHtmlUrl, "utf8");
  const selectorCount =
    (html.match(/<select[^>]*data-private-audio[^>]*>/g) ?? []).length;
  const previewCount =
    (html.match(/data-private-audio-preview/g) ?? []).length;

  assert.equal(
    selectorCount,
    7,
    "cast, projectile travel, impact, persistent-zone and creature audio selectors must all expose preview"
  );
  assert.equal(previewCount, selectorCount);

  const module = await import(
    "../../src/ui/private-audio-preview-controller-v1.js"
  );
  assert.equal(
    typeof module.createPrivateAudioPreviewControllerV1,
    "function"
  );
});
