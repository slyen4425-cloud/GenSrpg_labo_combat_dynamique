import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function text(path) {
  return readFile(
    new URL("../../" + path, import.meta.url),
    "utf8"
  );
}

test("Capture skill FX UI explains starter packs instead of presenting them as raw sprites", async () => {
  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );

  assert.match(
    html,
    /Pack FX de départ/
  );
  assert.match(
    html,
    /Cast \+ Projectile \+ Impact/
  );
  assert.match(
    html,
    /Appliquer ce pack/
  );
});

test("creator visual import is directly available from the Skills FX panel and reuses the same importer owner", async () => {
  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    html,
    /data-skill-visual-importer/
  );
  assert.match(
    html,
    /Mes sprites \/ Importer/
  );

  const importerCount =
    (
      html.match(
        /data-creator-visual-importer/g
      ) ?? []
    ).length;
  assert.equal(
    importerCount >= 2,
    true,
    "creature and skill panels must expose the shared importer"
  );

  assert.match(
    source,
    /querySelectorAll\(\s*"\[data-creator-visual-importer\]"/
  );
  assert.match(
    source,
    /importer\.querySelector/
  );
  assert.equal(
    (
      source.match(
        /const asset =\s*creatorVisualAssets\.importImage/g
      ) ?? []
    ).length,
    1,
    "all importer widgets must reuse one import invocation path"
  );
});

test("skill importer exposes only presentation roles and imported assets still target canonical asset-role selects", async () => {
  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  const start =
    html.indexOf(
      "data-skill-visual-importer"
    );
  assert.ok(start >= 0);
  const block =
    html.slice(start, start + 5000);

  for (const role of [
    "icon",
    "cast",
    "travel",
    "impact",
    "zone",
    "status"
  ]) {
    assert.match(
      block,
      new RegExp(
        'option value="' + role + '"'
      )
    );
  }

  assert.doesNotMatch(
    block,
    /option value="creature"/
  );
  assert.match(
    source,
    /\[data-asset-role="' \+\s*role \+\s*'"\]/
  );
});
