import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalogUrl = new URL(
  "../../data/capture/monster-capture-creatures.v1.json",
  import.meta.url
);

test("Monster Capture builtin catalog exports the 100 canonical starter creatures", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );

  assert.equal(catalog.version, 1);
  assert.equal(
    catalog.provenance?.sourceFunction,
    "gensStarterCreatures"
  );
  assert.equal(catalog.entries.length, 100);

  const ids = catalog.entries.map((entry) => entry.id);
  const names = catalog.entries.map((entry) => entry.name);

  assert.equal(new Set(ids).size, 100);
  assert.equal(new Set(names).size, 100);

  assert.ok(ids.includes("crea_aquafin"));
  assert.ok(ids.includes("crea_voltik"));
  assert.ok(names.includes("Aquafin"));
  assert.ok(names.includes("Voltige"));

  assert.ok(!ids.includes("crea_embercub"));
  assert.ok(!ids.includes("crea_galewing"));
  assert.ok(!ids.includes("crea_lumipup"));
});

test("Monster Capture source entry imports deterministically to CaptureCreatureEditorDraftV3", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );
  const {
    importMonsterCaptureCreatureRecordV1
  } = await import(
    "../../src/adapters/input/capture/monster-capture-creature-import-v1.js"
  );

  const source = catalog.entries.find(
    (entry) => entry.id === "crea_aquafin"
  );
  const record =
    importMonsterCaptureCreatureRecordV1(source);

  assert.equal(
    record.draft.schema,
    "capture-creature-editor-draft-v3"
  );
  assert.equal(record.draft.id, "crea_aquafin");
  assert.equal(record.draft.displayName, "Aquafin");
  assert.equal(record.draft.level, 5);
  assert.equal(record.draft.combat.maxHp, 20);
  assert.equal(record.draft.sourceStats.force, 10);
  assert.equal(record.draft.sourceStats.agility, 12);
  assert.equal(record.draft.sourceStats.endurance, 10);
  assert.equal(record.draft.sourceStats.initiative, 11);
  assert.equal(record.draft.sourceStats.spirit, 13);
  assert.equal(record.draft.sourceStats.intelligence, 0);
  assert.equal(record.draft.capture.captureRate, 65);
  assert.equal(
    record.draft.capture.evolution?.targetId,
    "crea_maraileron"
  );
  assert.ok(
    record.draft.skillIds.includes("cap_water_atk_1")
  );
  assert.equal(record.draft.presentation, null);

  assert.equal(record.loadout.creatureId, "crea_aquafin");
  assert.deepEqual(
    record.loadout.slots.map((slot) => slot.skillId),
    [null, null, null, null]
  );
});

test("Human Editor hydrates the Monster Capture catalog into its single creature library", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /monster-capture-creatures\.v1\.json/
  );
  assert.match(
    source,
    /importMonsterCaptureCreatureRecordV1/
  );
  assert.match(
    source,
    /configuredCreatures\.set/
  );
  assert.doesNotMatch(
    source,
    /localStorage|sessionStorage/
  );
});
