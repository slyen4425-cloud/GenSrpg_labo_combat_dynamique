import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const read = async (path) =>
  readFile(new URL("../../" + path, import.meta.url), "utf8");
const publishedPath = "data/capture/showcase/coupe_feuille.capture-skill-transfer-v1.json";
const archivePath = "data/capture/source-exports/gensrpg-capture-skill-coupe_feuille-2026-10-28.json";
const historicalPath = "data/capture/source-exports/gensrpg-capture-skill-coupe_feuille-2026-10-27.json";

test("public editor reloads the actual Capture skill manifest and global assets through one revisioned chain", async () => {
  const html = await read("examples/dom-demo/capture-editor-v2.html");
  const entry = await read("examples/dom-demo/capture-editor-v2.js");
  const editor = await read("src/ui/capture-editor-human-v2.js");
  const media = await read("src/assets/global-visual-library.js");
  const scriptMatch = html.match(/src="\.\/capture-editor-v2\.js\?v=([^"]+)"/);
  assert.ok(scriptMatch, "HTML must expose one versioned editor entry");
  const release = scriptMatch[1];
  assert.notEqual(release, "sleep-conditions-20261028", "new editor must not use the old cached entry");
  for (const imported of [
    "../../src/ui/capture-editor-human-v2.js",
    "../../src/assets/global-visual-library.js"
  ]) assert.ok(entry.includes('from "' + imported + '?v=' + release + '"'), "entry must use current revision for " + imported);
  for (const imported of [
    "../catalogs/capture-showcase-skill-presets-v1.js",
    "../assets/global-visual-library.js"
  ]) assert.ok(editor.includes('from "' + imported + '?v=' + release + '"'), "UI owner must use current revision for " + imported);
  assert.ok(media.includes('/${BRANCH}/data/assets/catalog/global-visual-assets.v1.json?v=${REVISION}'), "one canonical global-assets catalog");
  assert.match(media,/const BRANCH = "global-assets"/);
  const revision = media.match(/const REVISION = "([^"]+)"/)?.[1];
  assert.ok(revision && revision !== "2026-10-28-v44-projectile-native-bidirectional", "media cache must advance with published catalog");
  const version = revision.match(/^2026-\d\d-\d\d-v(\d+)-[a-z0-9-]+$/);
  assert.ok(version && Number(version[1]) >= 45, "Liane media requires catalog revision v45 or newer");
});

test("every active Capture Showcase skill path and author id is unique", async () => {
  const paths = CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1;
  assert.equal(paths.length, new Set(paths).size, "duplicate manifest path");
  const ids = [];
  for (const path of paths) {
    const transfer = JSON.parse(await read(path));
    assert.equal(transfer.schema, "capture-skill-transfer-v1");
    assert.equal(transfer.draft.id, transfer.draft.definition.id);
    ids.push(transfer.draft.id);
  }
  assert.equal(ids.length, new Set(ids).size, "duplicate skill id");
  assert.equal(ids.filter((id) => id === "coupe_feuille").length, 1);
});

test("Coupe feuille v11 keeps its new signed source without overwriting the historical v9", async () => {
  const raw = await read(archivePath);
  const live = JSON.parse(await read(publishedPath));
  const original = JSON.parse(raw);
  const old = JSON.parse(await read(historicalPath));
  assert.equal(Buffer.byteLength(raw), 4176);
  assert.equal(createHash("sha256").update(raw).digest("hex"), "572e78fa2b2c1da0142be3ec48fa89b4e569331df32fa35a0360c76f3b6d5b6c");
  assert.deepEqual(live, original, "published user config differs from signed source");
  assert.equal(live.draft.presentation.version, 11);
  assert.equal(old.draft.presentation.version, 9);
});
