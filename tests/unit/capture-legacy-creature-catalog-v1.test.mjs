import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Monster Capture legacy importer exposes the full 110-creature MC162 seed", async () => {
  const catalog = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-creature-seed.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const {
    importCaptureLegacyCreatureCatalogV1
  } = await import(
    "../../src/catalogs/capture-legacy-creature-catalog-v1.js"
  );

  const records =
    importCaptureLegacyCreatureCatalogV1(catalog);

  assert.equal(catalog.entries.length, 110);
  assert.equal(records.length, 110);
  assert.equal(
    new Set(records.map((record) => record.draft.id)).size,
    110
  );

  const aquafin = records.find(
    (record) => record.draft.id === "crea_aquafin"
  );
  assert.ok(aquafin);
  assert.equal(aquafin.draft.displayName, "Aquafin");
  assert.equal(aquafin.draft.level, 5);
  assert.deepEqual(aquafin.draft.elements, ["water"]);
  assert.equal(
    aquafin.draft.capture.evolution.targetId,
    "crea_maraileron"
  );
  assert.ok(
    aquafin.draft.skillIds.includes("lib_water_bolt")
  );
  assert.equal(
    aquafin.source.stats.agilite,
    12
  );

  const maraileron = records.find(
    (record) =>
      record.draft.id === "crea_maraileron"
  );
  assert.ok(maraileron);
  assert.equal(maraileron.draft.level, 16);
  assert.equal(
    maraileron.source.stats.defense,
    22
  );
  assert.equal(
    maraileron.source.stats.speed,
    20
  );
});

test("legacy projection preserves source-only stats instead of inventing mappings", async () => {
  const catalog = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-creature-seed.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const {
    importCaptureLegacyCreatureCatalogV1
  } = await import(
    "../../src/catalogs/capture-legacy-creature-catalog-v1.js"
  );

  const maraileron =
    importCaptureLegacyCreatureCatalogV1(catalog)
      .find(
        (record) =>
          record.draft.id === "crea_maraileron"
      );

  assert.equal(
    maraileron.draft.sourceStats.force,
    21
  );
  assert.equal(
    maraileron.draft.sourceStats.agility,
    20
  );
  assert.equal(
    maraileron.draft.sourceStats.spirit,
    25
  );

  assert.equal(
    maraileron.draft.sourceStats.intelligence,
    0
  );
  assert.equal(
    maraileron.draft.sourceStats.endurance,
    0
  );
  assert.equal(
    maraileron.draft.sourceStats.initiative,
    0
  );

  assert.equal(
    maraileron.source.stats.defense,
    22
  );
  assert.equal(
    maraileron.source.stats.speed,
    20
  );
});

test("Human Editor imports legacy creature records without overwriting session-owned creatures", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );
  const page = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /importCreatureRecords/
  );
  assert.match(
    source,
    /configuredCreatures\.has\(record\.draft\.id\)/
  );
  assert.match(
    page,
    /monster-capture-creature-seed\.v1\.json/
  );
  assert.match(
    page,
    /importCaptureLegacyCreatureCatalogV1/
  );
});
