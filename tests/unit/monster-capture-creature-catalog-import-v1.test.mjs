import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalogUrl = new URL(
  "../../data/capture/monster-capture-creatures.v1.json",
  import.meta.url
);

test("Monster Capture runtime catalog exports the 110 historically seeded creatures", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );

  assert.equal(catalog.version, 1);
  assert.equal(
    catalog.provenance?.sourceOwner,
    "MC162_ENTITIES"
  );
  assert.equal(
    catalog.provenance?.starterSourceFunction,
    "gensStarterCreatures"
  );
  assert.equal(catalog.entries.length, 110);

  const ids = catalog.entries.map((entry) => entry.id);
  const names = catalog.entries.map((entry) => entry.name);

  assert.equal(new Set(ids).size, 110);
  assert.equal(new Set(names).size, 102);

  assert.ok(ids.includes("crea_aquafin"));
  assert.ok(ids.includes("crea_voltik"));
  assert.ok(names.includes("Aquafin"));
  assert.ok(names.includes("Voltige"));

  assert.ok(ids.includes("crea_embercub"));
  assert.ok(ids.includes("crea_galewing"));
  assert.ok(ids.includes("crea_lumipup"));
  assert.ok(ids.includes("crea_braiseau"));
  assert.ok(ids.includes("crea_ailevent"));
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
  assert.equal(record.draft.sourceStats.endurance, 12);
  assert.equal(record.draft.sourceStats.initiative, 11);
  assert.equal(record.draft.sourceStats.spirit, 12);
  assert.equal(record.draft.sourceStats.intelligence, 10);
  assert.equal(record.draft.capture.captureRate, 60);
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
    [null, null, null, null, null]
  );
});

test("Human Editor validates runtime catalog count from provenance instead of a stale literal", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /entries\.length\s*!==\s*100|exactement 100 créatures builtin/
  );
  assert.match(
    source,
    /catalog\.provenance\?\.sourceCount/
  );
  assert.match(
    source,
    /new Set\(\s*entries\.map\(\(entry\) => entry\.id\)\s*\)\.size/
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
    /monster-capture-creatures.v1.json/
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


test("historical creature without visual remains a valid CaptureCreatureEditorDraftV3", async () => {
  const {
    buildHumanCreatureDraftV3
  } = await import(
    "../../src/ui/capture-editor-human-v2.js"
  );

  const draft = buildHumanCreatureDraftV3({
    id: "crea-legacy-no-art",
    displayName: "Legacy sans art",
    description: "Créature historique sans visuel.",
    level: 1,
    sourceStats: {
      force: 1,
      agility: 1,
      intelligence: 0,
      spirit: 1,
      endurance: 1,
      initiative: 1
    },
    elements: ["steel"],
    resistances: [
      {
        kind: "element:steel",
        value: 35
      }
    ],
    capture: {
      capturable: true,
      captureRate: 50,
      spawnChance: 10,
      spawnTags: ["steel"],
      evolution: null
    },
    combat: {
      maxHp: 10,
      initialHp: 10,
      maxEnergy: 0,
      initialEnergy: 0,
      energyChargeAmount: 0,
      energyChargeIntervalMs: 0,
      movementEnergyPerStep: 0,
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

  assert.equal(draft.presentation, null);
  assert.deepEqual(draft.elements, ["steel"]);
});

test("updating a historical creature preserves fields not represented by the current UI", async () => {
  const {
    preserveUnrepresentedCreatureFieldsV1
  } = await import(
    "../../src/ui/capture-editor-human-v2.js"
  );

  const result =
    preserveUnrepresentedCreatureFieldsV1({
      fields: {
        elements: ["fire"],
        resistances: {
          fire: 10
        },
        capture: {
          capturable: true,
          captureRate: 55,
          spawnChance: 20,
          spawnTags: ["fire"],
          evolution: null
        }
      },
      previousDraft: {
        elements: ["fire", "steel"],
        resistances: [
          {
            kind: "element:fire",
            value: 35
          },
          {
            kind: "element:steel",
            value: 50
          }
        ],
        capture: {
          spawnTags: ["fire", "steel"],
          evolution: {
            condition: "level",
            level: 24,
            targetId: "crea-next"
          }
        },
        skillIds: [
          "cap_fire_atk_1",
          "legacy-steel-skill"
        ]
      },
      visibleElementIds: [
        "fire",
        "water",
        "earth",
        "air",
        "electric",
        "light",
        "shadow"
      ],
      visibleResistanceKinds: [
        "element:fire",
        "element:water",
        "element:earth",
        "element:air",
        "element:light",
        "element:shadow"
      ],
      activeSkillIds: ["cap_fire_atk_2"]
    });

  assert.deepEqual(
    result.elements,
    ["fire", "steel"]
  );
  assert.deepEqual(
    result.resistances,
    [
      {
        kind: "element:fire",
        value: 10
      },
      {
        kind: "element:steel",
        value: 50
      }
    ]
  );
  assert.deepEqual(
    result.capture.evolution,
    {
      condition: "level",
      level: 24,
      targetId: "crea-next"
    }
  );
  assert.deepEqual(
    result.linkedSkillIds,
    [
      "cap_fire_atk_1",
      "legacy-steel-skill",
      "cap_fire_atk_2"
    ]
  );
});
