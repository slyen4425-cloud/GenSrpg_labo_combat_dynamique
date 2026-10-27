import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootUrl = new URL("../../", import.meta.url);

async function text(path) {
  return readFile(new URL(path, rootUrl), "utf8");
}

test("preview editor restores the dedicated private audio catalog", async () => {
  const raw = await text(
    "data/presentation/audio/private-audio-catalog.v1.json"
  );
  const catalog = JSON.parse(raw);
  assert.equal(catalog.entries.length, 203);

  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(html, /data-private-audio/);
  assert.match(source, /private-audio-catalog\.v1\.json/);
  assert.match(source, /hydratePrivateAudioCatalog/);
});

test("preview editor keeps 103 historical templates and restores native runnable skills", async () => {
  const legacyModule = await import(
    "../../src/ui/capture-editor-skill-catalog-v1.js"
  );
  assert.equal(
    legacyModule.captureLegacySkillLibraryEntriesV1().length,
    103
  );

  const nativeRaw = await text(
    "data/combat/skills/catalog.v1.json"
  );
  const nativeCatalog = JSON.parse(nativeRaw);
  assert.equal(nativeCatalog.entries.length, 9);

  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );
  assert.match(source, /data\/combat\/skills\/catalog\.v1\.json/);
  assert.match(source, /hydrateNativeSkillCatalog/);
});

test("preview editor restores the real creature scale path", async () => {
  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(html, /data-creature-display-scale/);
  assert.match(source, /capture-creature-editor-draft-v3\.js/);
  assert.match(source, /capture-editor-exporter-v3\.js/);
  assert.match(source, /displayScale/);
});

test("combat preview restores an explicit arena presentation binding", async () => {
  const source = await text(
    "examples/dom-demo/capture-editor-v2.js"
  );

  assert.match(source, /demoPresentationAssets/);
  assert.match(source, /presentationForArena/);
  assert.match(source, /--arena-background-image/);
});
