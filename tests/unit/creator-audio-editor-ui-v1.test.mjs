import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Capture editor exposes creator audio import for creature and skill audio", async () => {
  const html = await readFile(
    "examples/dom-demo/capture-editor-v2.html",
    "utf8"
  );

  assert.equal(
    (html.match(/data-creator-audio-importer/g) ?? []).length >= 2,
    true,
    "creator audio importer must exist for creature and skill sections"
  );

  for (const marker of [
    "data-creator-audio-role",
    "data-creator-audio-label",
    "data-creator-audio-file",
    "data-creator-audio-import",
    "data-creator-audio-state",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      "missing " + marker
    );
  }
});

test("Human Editor adds creator audio to the existing private-audio selectors instead of owning playback", async () => {
  const source = await readFile(
    "src/ui/capture-editor-human-v2.js",
    "utf8"
  );

  for (const marker of [
    "creatorAudioAssets",
    "data-creator-audio-importer",
    "data-creator-audio-import",
    "importAudio",
    "populatePrivateAudioSelect"
  ]) {
    assert.equal(
      source.includes(marker),
      true,
      "missing creator audio editor bridge " + marker
    );
  }

  for (const forbidden of [
    "new Audio(",
    "setInterval(",
    "FileReader("
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      "Human Editor must not become audio playback/storage owner: " + forbidden
    );
  }
});

test("editor entry uses one combined audio resolver for listening and combat preview and disposes creator session", async () => {
  const source = await readFile(
    "examples/dom-demo/capture-editor-v2.js",
    "utf8"
  );

  for (const marker of [
    "createCreatorAudioAssetSessionV1",
    "creatorAudioAssets",
    "resolveEditorAudioAsset",
    "creatorAudioAssets.runtimeAsset",
    "privateAudioRuntimeAssetV1",
    "creatorAudioAssets.dispose"
  ]) {
    assert.equal(
      source.includes(marker),
      true,
      "missing creator audio runtime bridge " + marker
    );
  }
});
