import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const htmlUrl = new URL(
  "../../examples/dom-demo/capture-editor-v2.html",
  import.meta.url
);
const pageJsUrl = new URL(
  "../../examples/dom-demo/capture-editor-v2.js",
  import.meta.url
);
const humanEditorUrl = new URL(
  "../../src/ui/capture-editor-human-v2.js",
  import.meta.url
);

test("Capture test opponent catalog exposes exactly the nine delivered creature presentations", async () => {
  const {
    CAPTURE_TEST_CREATURE_OPTIONS_V1,
    buildCaptureTestOpponentDraftV1
  } = await import(
    "../../src/catalogs/capture-test-creature-options-v1.js"
  );

  assert.equal(CAPTURE_TEST_CREATURE_OPTIONS_V1.length, 9);
  assert.equal(
    new Set(CAPTURE_TEST_CREATURE_OPTIONS_V1.map((entry) => entry.id)).size,
    9
  );

  assert.deepEqual(
    CAPTURE_TEST_CREATURE_OPTIONS_V1.map((entry) => entry.label),
    [
      "Braisombre",
      "Maraileron",
      "Loup volcanique",
      "Golem moussu",
      "Guêpe cybernétique",
      "Chat mystique",
      "Renard magique doré",
      "Ailevent",
      "Voltige"
    ]
  );

  const option = CAPTURE_TEST_CREATURE_OPTIONS_V1.find(
    (entry) => entry.id === "golem-moussu"
  );
  const expectedAssets = [
    option.assets.front,
    option.assets.back,
    option.assets.icon
  ];
  const assetCatalog = {
    assets: expectedAssets.map((id) => ({ id }))
  };

  const draft = buildCaptureTestOpponentDraftV1({
    optionId: option.id,
    assetCatalog,
    creatureMeta: {
      id: "golem_moussu",
      displayScale: {
        player: 1.15,
        opponent: 0.9
      }
    }
  });

  assert.equal(draft.id, "crea-enemy");
  assert.equal(draft.displayName, "Golem moussu");
  assert.equal(draft.presentation.subjectId, "crea-enemy");
  assert.equal(draft.presentation.displayScale, 0.9);
  assert.equal(draft.presentation.visual.front.assetId, option.assets.front);
  assert.equal(draft.presentation.visual.back.assetId, option.assets.back);
  assert.equal(draft.presentation.visual.icon.assetId, option.assets.icon);
});

test("Capture editor exposes opponent selector and resolves it at validation time", async () => {
  const [html, pageJs, humanEditor] = await Promise.all([
    readFile(htmlUrl, "utf8"),
    readFile(pageJsUrl, "utf8"),
    readFile(humanEditorUrl, "utf8")
  ]);

  assert.match(html, /data-test-opponent-creature/);
  assert.match(pageJs, /CAPTURE_TEST_CREATURE_OPTIONS_V1/);
  assert.match(pageJs, /buildCaptureTestOpponentDraftV1/);
  assert.match(pageJs, /getOpponentCreatureDraft/);
  assert.match(humanEditor, /getOpponentCreatureDraft/);

  assert.doesNotMatch(
    pageJs,
    /const opponentCreatureDraft\s*=\s*\{/
  );
});

test("preview actor labels are derived from BattleFormat actors instead of a hardcoded Braisombre label", async () => {
  const [html, pageJs] = await Promise.all([
    readFile(htmlUrl, "utf8"),
    readFile(pageJsUrl, "utf8")
  ]);

  assert.doesNotMatch(
    html,
    /<strong>Braisombre<\/strong>/
  );
  assert.match(
    pageJs,
    /actor\.displayName/
  );
});
