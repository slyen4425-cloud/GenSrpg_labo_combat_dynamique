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


test("rename creature ID rejects collisions and preserves a single active record", async () => {
  const { resolveCaptureCreatureSaveModeV1, renameCaptureCreatureInLibraryV1 } =
    await import("../../src/ui/capture-editor-creature-save-mode-v1.js");
  const first = {
    draft: {
      id: "nouvelle-creature",
      displayName: "Veuve jaune",
      capture: { evolution: { condition: "level", level: 10, targetId: "nouvelle-creature" } },
      presentation: { id: "creature:nouvelle-creature", subjectId: "nouvelle-creature", visual: { front: { assetId: "pack:face" } } }
    },
    statValues: { creatureId: "nouvelle-creature", values: { health: 110 } },
    loadout: { creatureId: "nouvelle-creature", slots: [{ id: "slot-1", skillId: "claw" }] }
  };
  const other = {
    draft: { id: "other", capture: { evolution: { condition: "level", level: 10, targetId: "nouvelle-creature" } } }
  };
  const lib = new Map([["nouvelle-creature", first], ["other", other]]);
  assert.equal(resolveCaptureCreatureSaveModeV1({
    intent: "rename", draftId: "veuve-jaune",
    selectedCreatureId: "nouvelle-creature",
    configuredCreatureIds: [...lib.keys()]
  }).mode, "rename");
  assert.throws(() => resolveCaptureCreatureSaveModeV1({
    intent: "rename", draftId: "other",
    selectedCreatureId: "nouvelle-creature",
    configuredCreatureIds: [...lib.keys()]
  }), /déjà utilisé/i);

  const renamed = renameCaptureCreatureInLibraryV1({
    configuredCreatures: lib,
    previousId: "nouvelle-creature",
    record: { ...first, draft: { ...first.draft, id: "veuve-jaune" } }
  });
  assert.equal(lib.size, 2);
  assert.equal(lib.has("nouvelle-creature"), false);
  assert.equal(lib.get("veuve-jaune"), renamed);
  assert.equal(renamed.draft.presentation.id, "creature:veuve-jaune");
  assert.equal(renamed.draft.presentation.subjectId, "veuve-jaune");
  assert.equal(renamed.draft.presentation.visual.front.assetId, "pack:face");
  assert.equal(renamed.statValues.creatureId, "veuve-jaune");
  assert.equal(renamed.loadout.creatureId, "veuve-jaune");
  assert.equal(renamed.draft.capture.evolution.targetId, "veuve-jaune");
  assert.equal(lib.get("other").draft.capture.evolution.targetId, "veuve-jaune");
});

test("creature identity edit action and existing record restoration are wired", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8"
  );
  const ui = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url), "utf8"
  );
  const team = await readFile(
    new URL("../../src/ui/capture-editor-combat-test-v1.js", import.meta.url), "utf8"
  );
  assert.match(html, /data-creature-edit-id/);
  assert.match(ui, /renameCaptureCreatureInLibraryV1/);
  assert.match(ui, /selectedCreatureId === null\s*\? null\s*:\s*configuredCreatures.get/);
  assert.match(team, /renameCreatureId\(oldId, newId\)/);
});
