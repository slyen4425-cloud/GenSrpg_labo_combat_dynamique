import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalogUrl = new URL(
  "../../data/capture/monster-capture-legacy-creatures.v1.json",
  import.meta.url
);

test("exported Monster Capture legacy catalog contains the exact 110 seeded creature ids", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );

  assert.equal(
    catalog.schema,
    "monster-capture-legacy-creature-catalog-v1"
  );
  assert.equal(catalog.entries.length, 110);
  assert.equal(
    new Set(catalog.entries.map((entry) => entry.id)).size,
    110
  );

  for (const id of [
    "crea_aquafin",
    "crea_maraileron",
    "crea_braiseau",
    "crea_pyrolynx",
    "crea_voltik",
    "crea_ailevent"
  ]) {
    assert.ok(
      catalog.entries.some((entry) => entry.id === id),
      id + " missing"
    );
  }

  assert.equal(
    catalog.provenance.sourceSymbol,
    "MC162_ENTITIES"
  );
  assert.equal(
    catalog.provenance.sourceBlobSha,
    "6c95e3f6ca4bf8e34003776e7e43e44192aafb16"
  );
});

test("legacy creature importer produces V3 drafts without fabricating presentation assets", async () => {
  const {
    importLegacyMonsterCaptureCreatureV1
  } = await import(
    "../../src/adapters/input/capture/legacy-monster-capture-creature-import-v1.js"
  );

  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );
  const aquafin = catalog.entries.find(
    (entry) => entry.id === "crea_aquafin"
  );
  const pyrolynx = catalog.entries.find(
    (entry) => entry.id === "crea_pyrolynx"
  );

  const aquaRecord =
    importLegacyMonsterCaptureCreatureV1(aquafin);
  assert.equal(
    aquaRecord.draft.schema,
    "capture-creature-editor-draft-v3"
  );
  assert.equal(aquaRecord.draft.id, "crea_aquafin");
  assert.equal(aquaRecord.draft.displayName, "Aquafin");
  assert.equal(aquaRecord.draft.combat.maxHp, 20);
  assert.equal(aquaRecord.draft.combat.maxEnergy, 0);
  assert.equal(aquaRecord.draft.presentation, null);
  assert.ok(
    aquaRecord.draft.skillIds.includes(
      "cap_water_atk_1"
    )
  );

  const pyroRecord =
    importLegacyMonsterCaptureCreatureV1(pyrolynx);
  assert.equal(pyroRecord.draft.sourceStats.force, 25);
  assert.equal(pyroRecord.draft.sourceStats.agility, 22);
  assert.equal(pyroRecord.draft.sourceStats.endurance, 17);
  assert.equal(pyroRecord.draft.sourceStats.initiative, 24);
  assert.equal(pyroRecord.draft.sourceStats.intelligence, 0);
});

test("Human Editor hydrates the exported Monster Capture catalog into its single creature library owner", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /monster-capture-legacy-creatures\.v1\.json/
  );
  assert.match(
    source,
    /hydrateLegacyMonsterCaptureCreatureCatalogV1/
  );
  assert.match(
    source,
    /configuredCreatures\.set/
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|raw\.githubusercontent\.com\/slyen4425-cloud\/Zombicide-40k/
  );
});
