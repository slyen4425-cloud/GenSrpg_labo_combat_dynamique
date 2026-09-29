import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  validateCreatureProfile
} from "../../src/core/profiles/profile-registry.js";

test("showcase creature links V2 use explicit historical IDs and user-approved posture profiles", async () => {
  const {
    captureCreatureVisualBindingForIdV1
  } = await import(
    "../../src/catalogs/capture-creature-visual-bindings-v1.js"
  );

  const expected = new Map([
    [
      "crea_voltik",
      { metaId: "voltige", profileId: "biped" }
    ],
    [
      "crea_galewing",
      { metaId: "ailevent", profileId: "biped" }
    ],
    [
      "crea_ailevent",
      { metaId: "ailevent", profileId: "biped" }
    ],
    [
      "crea_maraileron",
      { metaId: "maraileron", profileId: "serpentine" }
    ],
    [
      "crea_mossback",
      { metaId: "golem_moussu", profileId: "massive" }
    ],
    [
      "crea_lumipup",
      { metaId: "renard_magique_dore", profileId: "biped" }
    ],
    [
      "crea_lumilo",
      { metaId: "renard_magique_dore", profileId: "biped" }
    ],
    [
      "crea_sparkmoth",
      { metaId: "guepe_cybernetique", profileId: "serpentine" }
    ],
    [
      "crea_lucieclair",
      { metaId: "guepe_cybernetique", profileId: "serpentine" }
    ]
  ]);

  for (const [creatureId, wanted] of expected) {
    const binding =
      captureCreatureVisualBindingForIdV1(
        creatureId
      );

    assert.ok(binding, creatureId);
    assert.equal(
      binding.metaId,
      wanted.metaId,
      creatureId + " metaId"
    );
    assert.equal(
      binding.profileId,
      wanted.profileId,
      creatureId + " profileId"
    );
  }

  assert.equal(
    captureCreatureVisualBindingForIdV1(
      "Moussados"
    ),
    null,
    "display-name guessing must stay forbidden"
  );
});

test("visual binding prefers explicit historical posture profile over generic asset-pack profile", async () => {
  const catalog = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-creatures.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const {
    importMonsterCaptureCreatureRecordV1
  } = await import(
    "../../src/adapters/input/capture/monster-capture-creature-import-v1.js"
  );
  const {
    applyCaptureCreatureVisualBindingV1
  } = await import(
    "../../src/adapters/input/capture/capture-creature-visual-binding-v1.js"
  );

  const source = catalog.entries.find(
    (entry) => entry.id === "crea_mossback"
  );
  const record =
    importMonsterCaptureCreatureRecordV1(source);

  const enriched =
    applyCaptureCreatureVisualBindingV1({
      record,
      binding: {
        creatureId: "crea_mossback",
        metaId: "golem_moussu",
        profileId: "massive",
        metaFile:
          "capture/creatures/golem_moussu/golem_moussu.meta.json"
      },
      creatureMeta: {
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
          player: {},
          opponent: {}
        }
      },
      availableAssetIds: [
        "pack:capture:creature-golem-moussu-player-01",
        "pack:capture:creature-golem-moussu-opponent-01",
        "pack:capture:creature-golem-moussu-icon-01"
      ]
    });

  assert.equal(
    enriched.draft.presentation.profileId,
    "massive"
  );
  assert.equal(
    enriched.draft.presentation.displayScale,
    1.15
  );
  assert.equal(
    enriched.draft.presentation.visual.front.assetId,
    "pack:capture:creature-golem-moussu-opponent-01"
  );
});

test("massive profile exists as a canonical valid creature profile", async () => {
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
  assert.match(profile.label, /Massif|Golem/i);
  assert.equal(
    validateCreatureProfile(profile),
    profile
  );
});

test("Capture editor preview loads the canonical massive profile", async () => {
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
