import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalogUrl = new URL(
  "../../data/capture/monster-capture-creatures.v1.json",
  import.meta.url
);

test("Capture combat rules own shared energy settings independently from creature records", async () => {
  const {
    normalizeCaptureCombatRulesEditorDraftV1
  } = await import(
    "../../src/contracts/capture-combat-rules-editor-draft-v1.js"
  );

  const rules =
    normalizeCaptureCombatRulesEditorDraftV1({
      schema: "capture-combat-rules-editor-draft-v1",
      maxEnergy: 12,
      initialEnergy: 2,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 1800,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: 0
    });

  assert.equal(rules.maxEnergy, 12);
  assert.equal(rules.initialEnergy, 2);
  assert.throws(
    () =>
      normalizeCaptureCombatRulesEditorDraftV1({
        ...rules,
        initialEnergy: 13
      }),
    /initialEnergy/i
  );
});

test("combat rules overlay applies shared energy policy without changing creature HP or identity", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
  );
  const {
    importMonsterCaptureCreatureRecordV1
  } = await import(
    "../../src/adapters/input/capture/monster-capture-creature-import-v1.js"
  );
  const {
    applyCaptureCombatRulesToCreatureDraftV1
  } = await import(
    "../../src/adapters/input/capture/capture-combat-rules-overlay-v1.js"
  );

  const source = catalog.entries.find(
    (entry) => entry.id === "crea_maraileron"
  );
  const record =
    importMonsterCaptureCreatureRecordV1(source);

  const patched =
    applyCaptureCombatRulesToCreatureDraftV1({
      creatureDraft: record.draft,
      combatRules: {
        schema: "capture-combat-rules-editor-draft-v1",
        maxEnergy: 16,
        initialEnergy: 4,
        energyChargeAmount: 2,
        energyChargeIntervalMs: 1500,
        movementEnergyPerStep: 3,
        chargeTimeModifierPct: 10
      }
    });

  assert.equal(patched.id, record.draft.id);
  assert.equal(
    patched.combat.maxHp,
    record.draft.combat.maxHp
  );
  assert.equal(
    patched.combat.initialHp,
    record.draft.combat.initialHp
  );
  assert.deepEqual(
    {
      maxEnergy: patched.combat.maxEnergy,
      initialEnergy: patched.combat.initialEnergy,
      energyChargeAmount:
        patched.combat.energyChargeAmount,
      energyChargeIntervalMs:
        patched.combat.energyChargeIntervalMs,
      movementEnergyPerStep:
        patched.combat.movementEnergyPerStep,
      chargeTimeModifierPct:
        patched.combat.chargeTimeModifierPct
    },
    {
      maxEnergy: 16,
      initialEnergy: 4,
      energyChargeAmount: 2,
      energyChargeIntervalMs: 1500,
      movementEnergyPerStep: 3,
      chargeTimeModifierPct: 10
    }
  );
});

test("historical creature visual bindings are explicit by creature ID, never guessed by display name", async () => {
  const {
    captureCreatureVisualBindingForIdV1
  } = await import(
    "../../src/catalogs/capture-creature-visual-bindings-v1.js"
  );

  assert.equal(
    captureCreatureVisualBindingForIdV1(
      "crea_maraileron"
    )?.metaId,
    "maraileron"
  );
  assert.equal(
    captureCreatureVisualBindingForIdV1(
      "crea_voltik"
    )?.metaId,
    "voltige"
  );
  assert.equal(
    captureCreatureVisualBindingForIdV1(
      "crea_ailevent"
    )?.metaId,
    "ailevent"
  );
  assert.equal(
    captureCreatureVisualBindingForIdV1(
      "crea_galewing"
    )?.metaId,
    "ailevent"
  );
  assert.equal(
    captureCreatureVisualBindingForIdV1(
      "crea_aquafin"
    ),
    null
  );
});

test("visual metadata enriches an imported creature with face back icon scale profile and sockets", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
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
    (entry) => entry.id === "crea_maraileron"
  );
  const record =
    importMonsterCaptureCreatureRecordV1(source);

  const enriched =
    applyCaptureCreatureVisualBindingV1({
      record,
      binding: {
        creatureId: "crea_maraileron",
        metaId: "maraileron",
        metaFile:
          "capture/creatures/maraileron/maraileron.meta.json"
      },
      creatureMeta: {
        id: "maraileron",
        profile: "serpentine",
        assetIds: {
          player:
            "pack:capture:creature-maraileron-player-01",
          opponent:
            "pack:capture:creature-maraileron-opponent-01",
          icon:
            "pack:capture:creature-maraileron-icon-01"
        },
        displayScale: {
          player: 1.18,
          opponent: 0.92
        },
        fxAnchors: {
          player: {
            head: { x: 0.7, y: 0.35 },
            mouth: { x: 0.76, y: 0.39 },
            handLeft: { x: 0.61, y: 0.54 },
            handRight: { x: 0.74, y: 0.57 },
            tail: { x: 0.54, y: 0.82 }
          },
          opponent: {
            head: { x: 0.28, y: 0.42 },
            mouth: { x: 0.22, y: 0.47 },
            handLeft: { x: 0.4, y: 0.56 },
            handRight: { x: 0.32, y: 0.6 },
            tail: { x: 0.53, y: 0.8 }
          }
        }
      },
      availableAssetIds: [
        "pack:capture:creature-maraileron-player-01",
        "pack:capture:creature-maraileron-opponent-01",
        "pack:capture:creature-maraileron-icon-01"
      ]
    });

  assert.equal(
    enriched.draft.presentation.profileId,
    "serpentine"
  );
  assert.equal(
    enriched.draft.presentation.displayScale,
    1.18
  );
  assert.equal(
    enriched.draft.presentation.visual.front.assetId,
    "pack:capture:creature-maraileron-opponent-01"
  );
  assert.equal(
    enriched.draft.presentation.visual.back.assetId,
    "pack:capture:creature-maraileron-player-01"
  );
  assert.equal(
    enriched.draft.presentation.visual.icon.assetId,
    "pack:capture:creature-maraileron-icon-01"
  );

  const mouth =
    enriched.draft.presentation.sockets.find(
      (socket) => socket.id === "mouth"
    );
  assert.equal(enriched.draft.presentation.viewOverrides.opponent.displayScale, 0.92);
  assert.deepEqual(mouth.front, {
    x: 0.22,
    y: 0.47
  });
  assert.deepEqual(mouth.back, {
    x: 0.76,
    y: 0.39
  });
});


test("legacy drake visual metadata is normalized to canonical flying profile at the Capture input boundary", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
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
    (entry) => entry.id === "crea_maraileron"
  );
  const record =
    importMonsterCaptureCreatureRecordV1(source);

  const enriched =
    applyCaptureCreatureVisualBindingV1({
      record,
      binding: {
        creatureId: "crea_maraileron",
        metaId: "legacy-flyer",
        metaFile: "unused"
      },
      creatureMeta: {
        id: "legacy-flyer",
        profile: "drake",
        assetIds: {
          player: "pack:test:player",
          opponent: "pack:test:opponent",
          icon: "pack:test:icon"
        },
        displayScale: {
          player: 1,
          opponent: 1
        },
        fxAnchors: {}
      },
      availableAssetIds: [
        "pack:test:player",
        "pack:test:opponent",
        "pack:test:icon"
      ]
    });

  assert.equal(
    enriched.draft.presentation.profileId,
    "flying"
  );
});

test("visual binding refuses mismatched metadata instead of guessing", async () => {
  const catalog = JSON.parse(
    await readFile(catalogUrl, "utf8")
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
    (entry) => entry.id === "crea_maraileron"
  );
  const record =
    importMonsterCaptureCreatureRecordV1(source);

  assert.throws(
    () =>
      applyCaptureCreatureVisualBindingV1({
        record,
        binding: {
          creatureId: "crea_maraileron",
          metaId: "maraileron",
          metaFile: "unused"
        },
        creatureMeta: {
          id: "another-creature",
          profile: "serpentine",
          assetIds: {},
          displayScale: { player: 1 },
          fxAnchors: {}
        },
        availableAssetIds: []
      }),
    /metadata|meta/i
  );
});

test("Human Editor keeps shared combat rules outside creature save/load dirty ownership", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  const writeStart = source.indexOf(
    "function writeCreatureRecordFields"
  );
  const writeEnd = source.indexOf(
    "function prepareNewCreatureDraftFields",
    writeStart
  );
  const prepareEnd = source.indexOf(
    "function setStatus",
    writeEnd
  );
  const dirtyStart = source.indexOf(
    "const creatureOwnedSelectors"
  );
  const dirtyEnd = source.indexOf(
    "for (\n    const field of root.querySelectorAll(\n      '[data-editor-panel=\"skills\"]",
    dirtyStart
  );

  assert.ok(writeStart >= 0);
  assert.ok(writeEnd > writeStart);
  assert.ok(prepareEnd > writeEnd);
  assert.ok(dirtyStart >= 0);

  const writeSection =
    source.slice(writeStart, writeEnd);
  const prepareSection =
    source.slice(writeEnd, prepareEnd);
  const dirtySection =
    source.slice(
      dirtyStart,
      dirtyEnd > dirtyStart
        ? dirtyEnd
        : dirtyStart + 3000
    );

  for (const selector of [
    "data-max-energy",
    "data-initial-energy",
    "data-energy-charge-amount",
    "data-energy-charge-interval",
    "data-movement-energy",
    "data-charge-time-modifier"
  ]) {
    assert.doesNotMatch(
      writeSection,
      new RegExp(selector)
    );
    assert.doesNotMatch(
      prepareSection,
      new RegExp(selector)
    );
    assert.doesNotMatch(
      dirtySection,
      new RegExp(selector)
    );
  }

  assert.match(
    source,
    /applyCaptureCombatRulesToCreatureDraftV1/
  );
});

test("Capture editor labels energy as combat rules and exposes the canonical serpentine profile id", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(html, /Règles d'énergie du combat/);
  assert.doesNotMatch(
    html,
    /Ces valeurs appartiennent à la créature/
  );
  assert.match(
    html,
    /option value="serpentine"/
  );
});
