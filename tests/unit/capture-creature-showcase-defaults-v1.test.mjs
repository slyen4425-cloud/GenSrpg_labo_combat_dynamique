import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse(
  await readFile(
    new URL(
      "../../data/capture/monster-capture-creatures.v1.json",
      import.meta.url
    ),
    "utf8"
  )
);

test("historical showcase loadout follows GenSrpG level order and max 4 rule", async () => {
  const {
    buildCaptureCreatureHistoricalLoadoutV1
  } = await import(
    "../../src/catalogs/capture-creature-historical-loadout-v1.js"
  );

  const maraileron = catalog.entries.find(
    (entry) => entry.id === "crea_maraileron"
  );

  const result =
    buildCaptureCreatureHistoricalLoadoutV1({
      creatureId: maraileron.id,
      level: maraileron.level,
      abilityIds: maraileron.abilityIds,
      runtimeSkillIds: new Set([
        "cap_water_atk_1",
        "cap_water_atk_2",
        "cap_water_atk_3",
        "cap_water_atk_4"
      ])
    });

  assert.deepEqual(
    result.historicalActiveIds,
    [
      "cap_water_atk_1",
      "cap_water_atk_2",
      "cap_water_atk_3",
      "cap_water_atk_4"
    ]
  );
  assert.deepEqual(
    result.loadout.slots.map(
      (slot) => slot.skillId
    ),
    [
      "cap_water_atk_1",
      "cap_water_atk_2",
      "cap_water_atk_3",
      "cap_water_atk_4"
    ]
  );
});

test("historical showcase loadout preserves an unavailable legacy active slot instead of replacing it by a later move", async () => {
  const {
    buildCaptureCreatureHistoricalLoadoutV1
  } = await import(
    "../../src/catalogs/capture-creature-historical-loadout-v1.js"
  );

  const voltige = catalog.entries.find(
    (entry) => entry.id === "crea_voltik"
  );

  const result =
    buildCaptureCreatureHistoricalLoadoutV1({
      creatureId: voltige.id,
      level: voltige.level,
      abilityIds: voltige.abilityIds,
      runtimeSkillIds: new Set([
        "lib_chain_lightning",
        "lib_static_bite",
        "lib_thunder_dash",
        "cap_electric_atk_1",
        "cap_electric_atk_2"
      ])
    });

  assert.deepEqual(
    result.historicalActiveIds,
    [
      "lib_chain_lightning",
      "lib_static_bite",
      "lib_thunder_dash",
      "lib_paralyze"
    ]
  );
  assert.deepEqual(
    result.loadout.slots.map(
      (slot) => slot.skillId
    ),
    [
      "lib_chain_lightning",
      "lib_static_bite",
      "lib_thunder_dash",
      null
    ]
  );
  assert.deepEqual(
    result.unavailableActiveIds,
    ["lib_paralyze"]
  );
});

test("historical showcase loadout never invents an ability outside the creature abilityIds", async () => {
  const {
    buildCaptureCreatureHistoricalLoadoutV1
  } = await import(
    "../../src/catalogs/capture-creature-historical-loadout-v1.js"
  );

  const ailevent = catalog.entries.find(
    (entry) => entry.id === "crea_ailevent"
  );

  const result =
    buildCaptureCreatureHistoricalLoadoutV1({
      creatureId: ailevent.id,
      level: ailevent.level,
      abilityIds: ailevent.abilityIds,
      runtimeSkillIds: new Set([
        "cap_air_atk_1",
        "cap_air_atk_2",
        "lib_gust"
      ])
    });

  assert.deepEqual(
    result.historicalActiveIds,
    ["cap_air_atk_1", "cap_air_atk_2"]
  );
  assert.ok(
    !result.historicalActiveIds.includes(
      "lib_gust"
    )
  );
});

test("CreaturePresentationBindingV2 carries position and transformOrigin to VisualActor", async () => {
  const {
    normalizeCreaturePresentationBindingV2
  } = await import(
    "../../src/contracts/creature-presentation-binding-v2.js"
  );
  const {
    adaptCreaturePresentationBindingV2ToVisualActor
  } = await import(
    "../../src/adapters/input/capture/creature-presentation-to-visual-actor-v2.js"
  );

  const binding =
    normalizeCreaturePresentationBindingV2({
      id: "creature:test",
      version: 2,
      subjectType: "creature",
      subjectId: "crea-test",
      profileId: "serpentine",
      displayScale: 1.2,
      position: {
        x: 12,
        y: -8
      },
      transformOrigin: {
        x: "50%",
        y: "78%"
      },
      visual: {
        front: {
          assetId: "pack:capture:test-front"
        },
        back: {
          assetId: "pack:capture:test-back"
        },
        icon: {
          assetId: "pack:capture:test-icon"
        }
      },
      sockets: [],
      audio: {}
    });

  const actor =
    adaptCreaturePresentationBindingV2ToVisualActor({
      binding,
      visualActor: {
        id: "actor-test",
        creatureId: "crea-test",
        profile: "biped",
        asset: "https://example.invalid/test.webp",
        view: "player"
      }
    });

  assert.deepEqual(actor.position, {
    x: 12,
    y: -8
  });
  assert.deepEqual(actor.transformOrigin, {
    x: "50%",
    y: "78%"
  });
});

test("capture native visual source retains presentation position and transform origin", async () => {
  const source = await readFile(
    new URL(
      "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /offset:\s*Object\.freeze/
  );
  assert.match(
    source,
    /transformOrigin:\s*Object\.freeze/
  );
});

test("visual autolink takes offset and transformOrigin from authoritative metadata", async () => {
  const source = await readFile(
    new URL(
      "../../src/adapters/input/capture/capture-creature-visual-binding-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(source, /meta\.offset/);
  assert.match(source, /meta\.transformOrigin/);
});

test("Human Editor preserves hidden creature position when a linked creature is saved", async () => {
  const {
    preserveUnrepresentedCreatureFieldsV1,
    buildHumanCreatureDraftV3
  } = await import(
    "../../src/ui/capture-editor-human-v2.js"
  );

  const fields =
    preserveUnrepresentedCreatureFieldsV1({
      fields: {
        id: "crea-marai",
        displayName: "Marai",
        description:
          "Fixture de créature liée avec position persistante.",
        level: 5,
        sourceStats: {
          force: 1,
          agility: 1,
          intelligence: 1,
          spirit: 1,
          endurance: 1,
          initiative: 1
        },
        elements: ["water"],
        resistances: [],
        capture: {
          capturable: true,
          captureRate: 50,
          spawnChance: 10,
          spawnTags: ["water"],
          evolution: null
        },
        combat: {
          maxHp: 20,
          initialHp: 20
        },
        linkedSkillIds: [],
        profileId: "serpentine",
        displayScale: 1.1,
        visual: {
          frontAssetId:
            "pack:capture:creature-maraileron-opponent-01",
          backAssetId:
            "pack:capture:creature-maraileron-player-01",
          iconAssetId:
            "pack:capture:creature-maraileron-icon-01"
        },
        sockets: [],
        audio: {}
      },
      previousDraft: {
        skillIds: [],
        elements: ["water"],
        resistances: [],
        capture: {
          spawnTags: ["water"],
          evolution: null
        },
        combat: {
          maxEnergy: 0,
          initialEnergy: 0,
          energyChargeAmount: 0,
          energyChargeIntervalMs: 0,
          movementEnergyPerStep: 0,
          chargeTimeModifierPct: 0
        },
        presentation: {
          position: {
            x: 7,
            y: -4
          },
          transformOrigin: {
            x: "50%",
            y: "78%"
          }
        }
      },
      visibleElementIds: ["water"],
      visibleResistanceKinds: [
        "element:water"
      ],
      activeSkillIds: []
    });

  const draft =
    buildHumanCreatureDraftV3(fields);

  assert.deepEqual(
    draft.presentation.position,
    { x: 7, y: -4 }
  );
  assert.deepEqual(
    draft.presentation.transformOrigin,
    {
      x: "50%",
      y: "78%"
    }
  );
});

test("Human Editor derives imported creature active loadouts after runtime skill catalogs are known", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /buildCaptureCreatureHistoricalLoadoutV1/
  );
  assert.match(
    source,
    /runtimeSkillIds/
  );
  assert.match(
    source,
    /historicalLoadout\.loadout/
  );
});
