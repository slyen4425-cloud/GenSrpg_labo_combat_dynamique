import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("showcase creature bindings match the user-validated visual pack and position style", async () => {
  const {
    captureCreatureVisualBindingForIdV1
  } = await import(
    "../../src/catalogs/capture-creature-visual-bindings-v1.js"
  );

  const expected = new Map([
    ["crea_voltik", ["voltige", "biped"]],
    ["crea_ailevent", ["ailevent", "biped"]],
    ["crea_galewing", ["ailevent", "biped"]],
    ["crea_maraileron", ["maraileron", "serpentine"]],
    ["crea_mossback", ["golem_moussu", "massive"]],
    ["crea_lumipup", ["renard_magique_dore", "biped"]],
    ["crea_lumilo", ["renard_magique_dore", "biped"]],
    ["crea_sparkmoth", ["guepe_cybernetique", "serpentine"]],
    ["crea_lucieclair", ["guepe_cybernetique", "serpentine"]]
  ]);

  for (const [creatureId, [metaId, profileId]] of expected) {
    const binding =
      captureCreatureVisualBindingForIdV1(
        creatureId
      );

    assert.ok(
      binding,
      creatureId + " must have an explicit showcase binding"
    );
    assert.equal(
      binding.metaId,
      metaId,
      creatureId + " must use the validated visual pack"
    );
    assert.equal(
      binding.profileId,
      profileId,
      creatureId + " must use the validated position style"
    );
  }
});

test("visual binding applies explicit creature profile instead of the pack default profile", async () => {
  const {
    applyCaptureCreatureVisualBindingV1
  } = await import(
    "../../src/adapters/input/capture/capture-creature-visual-binding-v1.js"
  );

  const record = {
    draft: {
      schema: "capture-creature-editor-draft-v3",
      id: "crea-voltik",
      displayName: "Voltige",
      description: "Fixture Voltige.",
      level: 6,
      sourceStats: {
        force: 1,
        agility: 1,
        intelligence: 1,
        spirit: 1,
        endurance: 1,
        initiative: 1
      },
      elements: ["electric"],
      resistances: [],
      capture: {
        capturable: true,
        captureRate: 40,
        spawnChance: 10,
        spawnTags: ["electric"],
        evolution: null
      },
      combat: {
        maxHp: 20,
        initialHp: 20,
        maxEnergy: 0,
        initialEnergy: 0,
        energyChargeAmount: 0,
        energyChargeIntervalMs: 0,
        movementEnergyPerStep: 0,
        chargeTimeModifierPct: 0
      },
      skillIds: [],
      presentation: null
    },
    loadout: {
      schema: "capture-active-skill-loadout-v1",
      creatureId: "crea-voltik",
      slots: [
        { id: "slot-1", skillId: null },
        { id: "slot-2", skillId: null },
        { id: "slot-3", skillId: null },
        { id: "slot-4", skillId: null }
      ]
    }
  };

  const result =
    applyCaptureCreatureVisualBindingV1({
      record,
      binding: {
        creatureId: "crea-voltik",
        metaId: "voltige",
        metaFile:
          "capture/creatures/voltige/voltige.meta.json",
        profileId: "biped"
      },
      creatureMeta: {
        id: "voltige",
        profile: "drake",
        assetIds: {
          player:
            "pack:capture:creature-voltige-player-01",
          opponent:
            "pack:capture:creature-voltige-opponent-01",
          icon:
            "pack:capture:creature-voltige-icon-01"
        },
        displayScale: {
          player: 1.08,
          opponent: 1
        },
        offset: { x: 0, y: 0 },
        transformOrigin: {
          x: "50%",
          y: "82%"
        },
        fxAnchors: {
          player: {},
          opponent: {}
        }
      },
      availableAssetIds: [
        "pack:capture:creature-voltige-player-01",
        "pack:capture:creature-voltige-opponent-01",
        "pack:capture:creature-voltige-icon-01"
      ]
    });

  assert.equal(
    result.draft.presentation.profileId,
    "biped"
  );
  assert.notEqual(
    result.draft.presentation.profileId,
    "drake"
  );
});

test("massive profile exists as a valid runtime creature profile", async () => {
  const {
    validateCreatureProfile
  } = await import(
    "../../src/core/profiles/profile-registry.js"
  );

  const massive = JSON.parse(
    await readFile(
      new URL(
        "../../data/profiles/massive.profile.json",
        import.meta.url
      ),
      "utf8"
    )
  );

  assert.equal(massive.id, "massive");
  assert.match(massive.label, /Massif|golem/i);
  assert.equal(
    validateCreatureProfile(massive).id,
    "massive"
  );
});

test("Capture editor preview loads the massive runtime profile", async () => {
  const source = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /massive\.profile\.json/
  );
});
