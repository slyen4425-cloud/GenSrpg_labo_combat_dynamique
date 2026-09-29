import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalogUrl = new URL(
  "../../data/capture/monster-capture-legacy-creatures.v1.json",
  import.meta.url
);

test("historical Monster Capture export keeps the exact 110 seeded entities", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );

  assert.equal(catalog.catalogId, "monster-capture-legacy-creatures-v1");
  assert.equal(catalog.counts.total, 110);
  assert.equal(catalog.counts.starterCapture, 98);
  assert.equal(catalog.counts.legacyDemo, 12);
  assert.equal(catalog.entries.length, 110);
  assert.equal(
    new Set(catalog.entries.map((entry) => entry.id)).size,
    110
  );

  const byId = new Map(
    catalog.entries.map((entry) => [entry.id, entry])
  );

  assert.equal(byId.get("crea_aquafin")?.name, "Aquafin");
  assert.equal(byId.get("crea_maraileron")?.name, "Maraileron");
  assert.equal(byId.get("crea_braiseau")?.name, "Braiseau");
  assert.equal(byId.get("crea_raijag")?.name, "Raijag");
  assert.equal(byId.get("crea_taup_2")?.name, "Blindotaupe");
});

test("legacy creature adapter projects historical entities without rewriting their identity", async () => {
  const {
    adaptMonsterCaptureLegacyCreatureV1
  } = await import(
    "../../src/adapters/input/capture/monster-capture-legacy-creature-adapter-v1.js"
  );
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );

  const aquafin = catalog.entries.find(
    (entry) => entry.id === "crea_aquafin"
  );
  const draft = adaptMonsterCaptureLegacyCreatureV1(
    aquafin
  );

  assert.equal(draft.schema, "capture-creature-editor-draft-v3");
  assert.equal(draft.id, "crea_aquafin");
  assert.equal(draft.displayName, "Aquafin");
  assert.equal(draft.level, 5);
  assert.equal(draft.combat.maxHp, 20);
  assert.deepEqual(draft.elements, ["water"]);
  assert.equal(draft.capture.captureRate, 60);
  assert.equal(draft.capture.evolution?.targetId, "crea_maraileron");
  assert.deepEqual(
    draft.skillIds,
    aquafin.abilityIds
  );
});

test("legacy creature session record activates only runtime-ready skills and never more than four", async () => {
  const {
    buildMonsterCaptureLegacyCreatureRecordV1
  } = await import(
    "../../src/adapters/input/capture/monster-capture-legacy-creature-adapter-v1.js"
  );
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );

  const aquafin = catalog.entries.find(
    (entry) => entry.id === "crea_aquafin"
  );
  const record =
    buildMonsterCaptureLegacyCreatureRecordV1({
      entity: aquafin,
      runtimeReadySkillIds: [
        "lib_water_bolt",
        "lib_tidal_bite",
        "cap_water_atk_1"
      ]
    });

  assert.equal(record.draft.id, "crea_aquafin");
  assert.equal(record.loadout.creatureId, "crea_aquafin");
  assert.deepEqual(
    record.loadout.slots.map((slot) => slot.skillId),
    [
      "lib_water_bolt",
      "lib_tidal_bite",
      "cap_water_atk_1",
      null
    ]
  );
});

test("Human Editor hydrates the historical Monster Capture catalog into configuredCreatures", async () => {
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
    /hydrateMonsterCaptureLegacyCreatureCatalog/
  );
  assert.match(
    source,
    /buildMonsterCaptureLegacyCreatureRecordV1/
  );
  assert.match(
    source,
    /configuredCreatures\.set/
  );
});
