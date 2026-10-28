import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const read = async (path) =>
  readFile(new URL("../../" + path, import.meta.url), "utf8");
const release = "projectile-heading-catalog-20261028";
const publishedPath = "data/capture/showcase/coupe_feuille.capture-skill-transfer-v1.json";
const archivePath = "data/capture/source-exports/gensrpg-capture-skill-coupe_feuille-2026-10-28.json";
const historicalPath = "data/capture/source-exports/gensrpg-capture-skill-coupe_feuille-2026-10-27.json";

test("public editor reloads the exact Capture skill manifest module through a revisioned import chain", async () => {
  const html = await read("examples/dom-demo/capture-editor-v2.html");
  const entry = await read("examples/dom-demo/capture-editor-v2.js");
  const editor = await read("src/ui/capture-editor-human-v2.js");
  assert.ok(html.includes(`src="./capture-editor-v2.js?v=${release}"`), "HTML must request the revised entry module");
  assert.ok(entry.includes(`from "../../src/ui/capture-editor-human-v2.js?v=${release}"`), "entry must request the revised UI owner");
  assert.ok(editor.includes(`from "../catalogs/capture-showcase-skill-presets-v1.js?v=${release}"`), "UI owner must request the same versioned canonical skill manifest");
  assert.ok(editor.includes(`from "../assets/global-visual-library.js?v=${release}"`), "UI owner must not import stale media metadata");
  assert.ok(entry.includes(`from "../../src/assets/global-visual-library.js?v=${release}"`), "entry and UI owner must use same media URL");
  const media = await read("src/assets/global-visual-library.js");
  assert.ok(media.includes('a30333bb6da73c3c452506ad7997c5642536fa38'),"global media release must be pinned to a proven immutable commit");
  assert.ok(media.includes('/${CATALOG_REF}/data/assets/catalog/global-visual-assets.v1.json'),"live editor must load the media metadata from that exact catalog commit, not the mutable branch cache");
  assert.match(media,/const REVISION = "2026-10-28-v43-projectile-native-facing"/,
    "stable dated cache revision must remain compatible with all existing media URL users");
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
