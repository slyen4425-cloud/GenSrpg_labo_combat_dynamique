import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("showcase creature visual mappings match the user-validated creature/style pairs", async () => {
  const {
    captureCreatureVisualBindingForIdV1
  } = await import(
    "../../src/catalogs/capture-creature-visual-bindings-v1.js"
  );

  const expected = new Map([
    ["crea_voltik", ["voltige", "biped"]],
    ["crea_galewing", ["ailevent", "biped"]],
    ["crea_ailevent", ["ailevent", "biped"]],
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
      creatureId + " must have an explicit visual binding"
    );
    assert.equal(binding.metaId, metaId);
    assert.equal(binding.profileId, profileId);
  }
});

test("visual binding profile is owned by the explicit creature mapping, not by the shared asset metadata", async () => {
  const {
    applyCaptureCreatureVisualBindingV1
  } = await import(
    "../../src/adapters/input/capture/capture-creature-visual-binding-v1.js"
  );

  const record = {
    draft: {
      schema: "capture-creature-editor-draft-v3",
      id: "crea_mossback",
      displayName: "Moussados",
      description: "Créature terre historique.",
      level: 5,
      sourceStats: {
        force: 10,
        agility: 10,
        intelligence: 0,
        spirit: 10,
        endurance: 10,
        initiative: 10
      },
      elements: ["earth"],
      resistances: [],
      capture: {
        capturable: true,
        captureRate: 30,
        spawnChance: 10,
        spawnTags: ["earth"],
        evolution: null
      },
      combat: {
        maxHp: 50,
        initialHp: 50,
        maxEnergy: 10,
        initialEnergy: 0,
        energyChargeAmount: 1,
        energyChargeIntervalMs: 2000,
        movementEnergyPerStep: 2,
        chargeTimeModifierPct: 0
      },
      skillIds: [],
      presentation: null
    },
    loadout: {
      schema: "capture-active-skill-loadout-v1",
      creatureId: "crea_mossback",
      slots: [
        { id: "slot-1", skillId: null },
        { id: "slot-2", skillId: null },
        { id: "slot-3", skillId: null },
        { id: "slot-4", skillId: null }
      ]
    }
  };

  const binding = {
    creatureId: "crea_mossback",
    metaId: "golem_moussu",
    metaFile:
      "capture/creatures/golem_moussu/golem_moussu.meta.json",
    profileId: "massive"
  };

  const meta = {
    id: "golem_moussu",
    profile: "drake",
    assetIds: {
      player:
        "pack:capture:creature-golem-moussu-player-01",
      opponent:
        "pack:capture:creature-golem-moussu-opponent-01",
      icon:
        "pack:capture:creature-golem-moussu-icon-01"
    },
    displayScale: {
      player: 1.15,
      opponent: 0.9
    },
    offset: { x: 0, y: 0 },
    transformOrigin: {
      x: "50%",
      y: "88%"
    },
    fxAnchors: {
      player: {
        head: { x: 0.86, y: 0.48 }
      },
      opponent: {
        head: { x: 0.18, y: 0.5 }
      }
    }
  };

  const availableAssetIds =
    Object.values(meta.assetIds);

  const result =
    applyCaptureCreatureVisualBindingV1({
      record,
      binding,
      creatureMeta: meta,
      availableAssetIds
    });

  assert.equal(
    result.draft.presentation.profileId,
    "massive"
  );
  assert.equal(
    result.draft.presentation.displayScale,
    1.15
  );
});

test("massive profile exists and is accepted by the creature profile registry", async () => {
  const {
    validateCreatureProfile
  } = await import(
    "../../src/core/profiles/profile-registry.js"
  );

  const profile = JSON.parse(
    await readFile(
      new URL(
        "../../data/profiles/massive.profile.json",
        import.meta.url
      ),
      "utf8"
    )
  );

  assert.equal(profile.id, "massive");
  assert.equal(profile.label, "Massif / golem");
  assert.equal(
    validateCreatureProfile(profile).id,
    "massive"
  );
});

test("Capture editor preview loads the massive profile alongside existing canonical profiles", async () => {
  const source = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /data\/profiles\/massive\.profile\.json/
  );
});
