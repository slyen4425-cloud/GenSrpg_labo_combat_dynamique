import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("creature CRUD save mode exists and protects create/update identities", async () => {
  const {
    resolveCaptureCreatureSaveModeV1,
    nextCaptureCreatureDraftIdV1
  } = await import(
    "../../src/ui/capture-editor-creature-save-mode-v1.js"
  );

  assert.equal(
    nextCaptureCreatureDraftIdV1({
      configuredCreatureIds: [
        "nouvelle-creature",
        "nouvelle-creature-2"
      ]
    }),
    "nouvelle-creature-3"
  );

  assert.throws(
    () =>
      resolveCaptureCreatureSaveModeV1({
        intent: "create",
        draftId: "wolf",
        configuredCreatureIds: ["wolf"]
      }),
    /existe déjà/i
  );

  assert.throws(
    () =>
      resolveCaptureCreatureSaveModeV1({
        intent: "update",
        draftId: "wolf",
        selectedCreatureId: "fox",
        configuredCreatureIds: ["wolf", "fox"]
      }),
    /identité|sélection/i
  );

  assert.throws(
    () =>
      resolveCaptureCreatureSaveModeV1({
        intent: "update",
        draftId: "dragon",
        selectedCreatureId: "dragon",
        configuredCreatureIds: ["wolf"]
      }),
    /n.existe pas encore|créer/i
  );
});

test("Capture editor exposes explicit creature choose/new/create/update actions", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-creature-library-select",
    "data-creature-new",
    "data-creature-create",
    "data-creature-update"
  ]) {
    assert.match(html, new RegExp(marker));
  }

  assert.match(html, /Nouvelle créature/);
  assert.match(html, /Enregistrer comme nouvelle/);
  assert.match(html, /Mettre à jour la créature existante/);
});

test("Human Editor owns one creature record library with draft plus loadout", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(source, /configuredCreatures\s*=\s*new Map/);
  assert.match(source, /persistCurrentCreature/);
  assert.match(source, /writeCreatureRecordFields/);
  assert.match(source, /record\.draft/);
  assert.match(source, /record\.loadout/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
});
