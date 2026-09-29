import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalogUrl = new URL(
  "../../data/capture/legacy-monster-capture-creatures.v1.json",
  import.meta.url
);

test("legacy Monster Capture catalog exports the 110 authoritative MC162 creatures", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );

  assert.equal(
    catalog.schema,
    "capture-legacy-creature-catalog-v1"
  );
  assert.equal(
    catalog.source.commit,
    "49289784ee92a47fd51089815ca25954cdba4493"
  );
  assert.equal(
    catalog.source.indexBlob,
    "74e223b2c9877e6a88b6ad6726290d230f1f616e"
  );
  assert.equal(
    catalog.source.entityTable,
    "MC162_ENTITIES"
  );
  assert.equal(catalog.creatures.length, 110);
  assert.equal(
    new Set(
      catalog.creatures.map((entry) => entry.id)
    ).size,
    110
  );

  const abilityIds = new Set(
    catalog.creatures.flatMap(
      (entry) => entry.abilityIds ?? []
    )
  );
  assert.equal(abilityIds.size, 103);

  for (const id of [
    "crea_aquafin",
    "crea_maraileron",
    "crea_ailevent",
    "crea_voltik"
  ]) {
    assert.ok(
      catalog.creatures.some(
        (entry) => entry.id === id
      ),
      id
    );
  }
});

test("legacy creature adapter preserves raw identity and uses documented historical editor fallbacks", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );
  const {
    adaptLegacyCaptureCreatureToEditorRecordV1
  } = await import(
    "../../src/catalogs/capture-legacy-creature-catalog-v1.js"
  );

  const raw = catalog.creatures.find(
    (entry) => entry.id === "crea_braiseau"
  );

  const record =
    adaptLegacyCaptureCreatureToEditorRecordV1(
      raw,
      {
        enabledSkillIds: new Set(
          raw.abilityIds
        )
      }
    );

  assert.equal(
    record.draft.id,
    "crea_braiseau"
  );
  assert.equal(
    record.draft.displayName,
    "Braiseau"
  );
  assert.deepEqual(
    record.draft.sourceStats,
    {
      force: 13,
      agility: 11,
      intelligence: 10,
      spirit: 7,
      endurance: 10,
      initiative: 0
    }
  );
  assert.equal(
    record.draft.combat.maxHp,
    18
  );
  assert.equal(
    record.draft.combat.initialHp,
    18
  );
  assert.equal(
    record.draft.combat.maxEnergy,
    10
  );
  assert.equal(
    record.draft.presentation,
    null
  );
  assert.deepEqual(
    record.draft.skillIds,
    raw.abilityIds
  );
  assert.deepEqual(
    record.loadout.slots
      .map((slot) => slot.skillId)
      .filter(Boolean),
    raw.abilityIds.slice(0, 4)
  );
});

test("legacy creature adapter preserves all historical skill links while filtering only the active runtime loadout", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );
  const {
    adaptLegacyCaptureCreatureToEditorRecordV1
  } = await import(
    "../../src/catalogs/capture-legacy-creature-catalog-v1.js"
  );

  const raw = catalog.creatures.find(
    (entry) => entry.id === "crea_aquafin"
  );
  const original = JSON.stringify(raw);
  const enabled = new Set(
    raw.abilityIds.slice(0, 2)
  );

  const record =
    adaptLegacyCaptureCreatureToEditorRecordV1(
      raw,
      { enabledSkillIds: enabled }
    );

  assert.deepEqual(
    record.draft.skillIds,
    raw.abilityIds
  );
  assert.deepEqual(
    record.loadout.slots
      .map((slot) => slot.skillId)
      .filter(Boolean),
    raw.abilityIds.slice(0, 2)
  );
  assert.equal(
    JSON.stringify(raw),
    original
  );
});

test("Capture creature editor exposes every legacy Monster Capture element", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const element of [
    "air",
    "earth",
    "electric",
    "fire",
    "ice",
    "light",
    "nature",
    "poison",
    "psy",
    "shadow",
    "spirit",
    "steel",
    "water"
  ]) {
    assert.match(
      html,
      new RegExp(
        'data-element value="' + element + '"'
      ),
      element
    );
    assert.match(
      html,
      new RegExp(
        'data-resistance="' + element + '"'
      ),
      element
    );
  }
});

test("Human Editor hydrates the static legacy creature catalog into configuredCreatures", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /CAPTURE_LEGACY_CREATURE_CATALOG_URL/
  );
  assert.match(
    source,
    /adaptLegacyCaptureCreatureToEditorRecordV1/
  );
  assert.match(
    source,
    /hydrateLegacyCreatureCatalog/
  );
  assert.match(
    source,
    /configuredCreatures\.set/
  );
  assert.doesNotMatch(
    source,
    /Zombicide-40k/
  );
});

test("Human creature V3 builder accepts an imported creature without invented presentation", async () => {
  const {
    buildHumanCreatureDraftV3
  } = await import(
    "../../src/ui/capture-editor-human-v2.js"
  );

  const draft = buildHumanCreatureDraftV3({
    id: "legacy-no-art",
    displayName: "Legacy sans art",
    description: "",
    level: 1,
    sourceStats: {
      force: 10,
      agility: 10,
      intelligence: 10,
      spirit: 10,
      endurance: 10,
      initiative: 0
    },
    elements: ["poison"],
    resistances: {
      poison: 35
    },
    capture: {
      capturable: true,
      captureRate: 50,
      spawnChance: 25,
      spawnTags: ["poison"],
      evolution: null
    },
    combat: {
      maxHp: 10,
      initialHp: 10,
      maxEnergy: 10,
      initialEnergy: 0,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: 0
    },
    linkedSkillIds: [],
    profileId: "biped",
    displayScale: 1,
    visual: {
      frontAssetId: "",
      backAssetId: "",
      iconAssetId: ""
    },
    sockets: [],
    audio: {}
  });

  assert.equal(
    draft.presentation,
    null
  );
});


test("legacy creature adapter adapts all 110 records without losing identity, evolution or historical ability links", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );
  const {
    adaptLegacyCaptureCreatureToEditorRecordV1
  } = await import(
    "../../src/catalogs/capture-legacy-creature-catalog-v1.js"
  );

  const allAbilityIds = new Set(
    catalog.creatures.flatMap(
      (entry) => entry.abilityIds ?? []
    )
  );

  const records = catalog.creatures.map(
    (raw) =>
      adaptLegacyCaptureCreatureToEditorRecordV1(
        raw,
        { enabledSkillIds: allAbilityIds }
      )
  );

  assert.equal(records.length, 110);
  assert.equal(
    new Set(
      records.map((record) => record.draft.id)
    ).size,
    110
  );

  for (let index = 0; index < records.length; index += 1) {
    const raw = catalog.creatures[index];
    const record = records[index];

    assert.equal(record.draft.id, raw.id);
    assert.deepEqual(
      record.draft.skillIds,
      raw.abilityIds ?? []
    );

    const expectedEvolution =
      raw.evolution?.targetId ??
      raw.evolutionTo ??
      null;
    assert.equal(
      record.draft.capture.evolution?.targetId ?? null,
      expectedEvolution || null
    );
  }
});
