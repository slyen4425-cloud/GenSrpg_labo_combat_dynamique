import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_TEST_CREATURE_OPTIONS_V1
} from "../../src/catalogs/capture-test-creature-options-v1.js";
import {
  captureSelectedSocketPointV1
} from "../../src/ui/capture-editor-human-v2.js";

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

test("Moussados mouth socket preserves the original exported front/back coordinates", async () => {
  const preset = await json(
    "data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json"
  );
  const mouth = preset.draft.presentation.sockets.find(
    (entry) => entry.id === "mouth"
  );

  assert.deepEqual(
    mouth?.front,
    {
      x: 0.10053788768847613,
      y: 0.6934029261271158
    }
  );
  assert.deepEqual(
    mouth?.back,
    {
      x: 0.9318691325306842,
      y: 0.5627603530883789
    }
  );
});

test("selected socket marker resolves the requested socket instead of the last socket in the record", () => {
  const sockets = new Map([
    [
      "mouth",
      {
        id: "mouth",
        front: { x: 0.1, y: 0.2 },
        back: { x: 0.8, y: 0.3 }
      }
    ],
    [
      "tail",
      {
        id: "tail",
        front: { x: 0.7, y: 0.6 },
        back: { x: 0.2, y: 0.6 }
      }
    ]
  ]);

  assert.deepEqual(
    captureSelectedSocketPointV1({
      sockets,
      socketId: "mouth",
      view: "front"
    }),
    { x: 0.1, y: 0.2 }
  );
  assert.deepEqual(
    captureSelectedSocketPointV1({
      sockets,
      socketId: "mouth",
      view: "back"
    }),
    { x: 0.8, y: 0.3 }
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

  assert.match(source, /buildCaptureEditorCombatTestV1/);
  const composition = await readFile(new URL("../../src/ui/capture-editor-combat-test-v1.js", import.meta.url), "utf8");
  assert.match(composition, /configuredCreatures\.get/);
  assert.match(composition, /records\.map\(r => r\.statValues\)/);
  assert.doesNotMatch(composition, /CAPTURE_TEST_CREATURE_OPTIONS_V1/);
});

test("DOM demo delegates all test-team choices to the Human Editor active owners", async () => {
  const source = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(source, /mountCaptureEditorHumanV2\(\{ root \}\)/);
  assert.doesNotMatch(source, /getOpponentCreatureId|opponentLoadout|enemy-hit/);
});


test("showcase hydration reloads the selected creature record after replacing the static startup draft", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  const showcaseStart = source.indexOf(
    "const showcaseResult ="
  );
  assert.notEqual(showcaseStart, -1);

  const showcaseTail = source.slice(
    showcaseStart,
    showcaseStart + 5000
  );

  assert.match(
    showcaseTail,
    /loadCreatureRecord\(\s*selectedRecord\.draft\.id\s*\)/
  );
});

test("Loup showcase preset keeps one mouth socket and the requested five-slot loadout", async () => {
  const preset = await json(
    "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json"
  );

  assert.equal(
    preset.draft.presentation.sockets.some(
      (entry) => entry.id === "mouth"
    ),
    true
  );
  assert.deepEqual(
    preset.loadout.slots.map((slot) => slot.skillId),
    [
      "claw",
      "fireball",
      "cap_fire_special_1",
      "lib_flame_bite",
      "cap_fire_atk_6"
    ]
  );
});
