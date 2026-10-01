import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_TEST_CREATURE_OPTIONS_V1
} from "../../src/catalogs/capture-test-creature-options-v1.js";

async function json(path) {
  return JSON.parse(
    await readFile(
      new URL("../../" + path, import.meta.url),
      "utf8"
    )
  );
}

test("showcase test options bind to configured creature ids instead of generic opponent authority", () => {
  const wolf = CAPTURE_TEST_CREATURE_OPTIONS_V1.find(
    (entry) => entry.id === "loup-volcanique"
  );
  const moss = CAPTURE_TEST_CREATURE_OPTIONS_V1.find(
    (entry) => entry.id === "golem-moussu"
  );

  assert.equal(wolf?.configuredCreatureId, "crea-loup");
  assert.equal(moss?.configuredCreatureId, "crea_mossback");
});

test("Moussados mouth socket persists the corrected front/back coordinates", async () => {
  const preset = await json(
    "data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json"
  );
  const mouth = preset.draft.presentation.sockets.find(
    (entry) => entry.id === "mouth"
  );

  assert.deepEqual(
    mouth?.front,
    {
      x: 0.9318691325306842,
      y: 0.5627603530883789
    }
  );
  assert.deepEqual(
    mouth?.back,
    {
      x: 0.10053788768847613,
      y: 0.6934029261271158
    }
  );
});

test("Human Editor supports configured opponent authority for showcase combat tests", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(source, /getOpponentCreatureId/);
  assert.match(
    source,
    /configuredCreatures\.get\(\s*configuredOpponentCreatureId/
  );
  assert.match(
    source,
    /resolvedOpponentStatValues/
  );
});

test("DOM demo passes configured opponent ids from the test catalog into the Human Editor", async () => {
  const source = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(source, /configuredCreatureId/);
  assert.match(source, /getOpponentCreatureId/);
});
