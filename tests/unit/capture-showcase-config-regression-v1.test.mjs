import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

test("Capture editor bootstrap must not expose a fake preconfigured Loup outside configuredCreatures", async () => {
  const html = await text(
    "examples/dom-demo/capture-editor-v2.html"
  );

  assert.doesNotMatch(
    html,
    /data-creature-name\s+value="Loup volcanique"/
  );
  assert.doesNotMatch(
    html,
    /data-creature-id\s+value="crea-loup"/
  );
  assert.doesNotMatch(
    html,
    /data-element\s+value="fire"\s+checked/
  );
  assert.doesNotMatch(
    html,
    /data-resistance="fire"\s+value="35"/
  );
  assert.doesNotMatch(
    html,
    /data-resistance="water"\s+value="-50"/
  );
});

test("Moussados mouth socket keeps the user-corrected face/back ownership", async () => {
  const preset = await json(
    "data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json"
  );
  const mouth = preset.draft.presentation.sockets.find(
    (socket) => socket.id === "mouth"
  );

  assert.ok(mouth);
  assert.deepEqual(
    mouth.front,
    {
      x: 0.9318691325306842,
      y: 0.5627603530883789
    }
  );
  assert.deepEqual(
    mouth.back,
    {
      x: 0.10053788768847613,
      y: 0.6934029261271158
    }
  );
});

test("Loup showcase preset remains the complete configured model", async () => {
  const preset = await json(
    "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json"
  );
  const resistance = Object.fromEntries(
    preset.draft.resistances.map(
      (entry) => [entry.kind, entry.value]
    )
  );

  assert.equal(preset.draft.id, "crea-loup");
  assert.equal(preset.draft.level, 10);
  assert.equal(preset.statValues.values.health, 150);
  assert.equal(preset.statValues.values.speed, 5);
  assert.equal(preset.statValues.values.fire, 10);
  assert.equal(resistance["element:fire"], 35);
  assert.equal(resistance["element:water"], -50);
  assert.equal(
    preset.draft.presentation.profileId,
    "quadruped"
  );
  assert.equal(
    preset.draft.presentation.displayScale,
    1.2
  );
  assert.deepEqual(
    preset.loadout.slots.map((slot) => slot.skillId),
    [
      "fireball",
      "claw",
      "lib_flame_bite",
      "lib_fireball"
    ]
  );
});

test("startup displays a real inserted showcase creature record instead of bootstrap form values", async () => {
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    source,
    /showcaseResult\.actions\.find\([\s\S]*?insert-creature/
  );
  assert.match(
    source,
    /loadCreatureRecord\([\s\S]*?insertedShowcase/
  );
});
