import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(
    new URL("../../" + path, import.meta.url),
    "utf8"
  );
}

test("showcase batch reloads the full selected creature record instead of stats only", async () => {
  const human = await source(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    human,
    /showcaseResult[\s\S]*if \(\s*selectedRecord &&\s*creatureDirty === false\s*\) \{\s*loadCreatureRecord\(\s*selectedRecord\.draft\.id\s*\)/
  );
});

test("socket rendering is driven by the currently selected socket id", async () => {
  const human = await source(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    human,
    /renderSelectedCreatureSocketMarkersV1/
  );
  assert.match(
    human,
    /data-socket-kind[\s\S]*change[\s\S]*renderSelectedCreatureSocketMarkersV1/
  );
  const replaceStart = human.indexOf(
    "function replaceCreatureSockets("
  );
  const replaceEnd = human.indexOf(
    "function writeCreatureRecordFields(",
    replaceStart
  );
  const replaceSource = human.slice(
    replaceStart,
    replaceEnd
  );

  assert.ok(replaceStart >= 0);
  assert.ok(replaceEnd > replaceStart);
  assert.match(
    replaceSource,
    /renderSelectedCreatureSocketMarkersV1/
  );
  assert.doesNotMatch(
    replaceSource,
    /updateSocketMarker\(/
  );
});

test("socket surface hint is not selected by last-child marker styling", async () => {
  const [html, css] = await Promise.all([
    source("examples/dom-demo/capture-editor-v2.html"),
    source("examples/dom-demo/capture-editor-v2.css")
  ]);

  assert.match(
    html,
    /class="socket-surface__hint">Toucher pour placer · FACE/
  );
  assert.match(
    html,
    /class="socket-surface__hint">Toucher pour placer · DOS/
  );
  assert.match(
    css,
    /\.socket-surface__hint\s*\{/
  );
  assert.doesNotMatch(
    css,
    /\.socket-surface\s*>\s*span:last-child/
  );
});


test("Loup volcanique planned loadout skills all exist in the active skill catalogs", async () => {
  const native = JSON.parse(
    await source("data/combat/skills/catalog.v1.json")
  ).entries.map((entry) => entry.id);

  const portableModule = await import(
    "../../src/catalogs/capture-portable-native-skill-catalog-v1.js"
  );
  const complexModule = await import(
    "../../src/catalogs/capture-complex-native-skill-catalog-v1.js"
  );

  const activeIds = new Set([
    ...native,
    ...portableModule
      .capturePortableNativeSkillDraftsV1()
      .map((draft) => draft.id),
    ...complexModule
      .captureComplexNativeSkillDraftsV1()
      .map((draft) => draft.id)
  ]);

  for (const skillId of [
    "fireball",
    "claw",
    "lib_flame_bite",
    "lib_fireball"
  ]) {
    assert.equal(
      activeIds.has(skillId),
      true,
      skillId + " must be available to populate the showcase loadout"
    );
  }
});
