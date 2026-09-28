import test from "node:test";
import assert from "node:assert/strict";

import {
  adaptCaptureExportToNativeVisualSourceV1
} from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";

function baseExport() {
  return {
    schema: "capture-combat-export-v1",
    battle: {
      id: "preview",
      localActorId: "local-1"
    },
    teams: {
      "local-team": ["local-1"],
      "enemy-team": ["enemy-1"]
    },
    actors: [
      {
        actorId: "local-1",
        teamId: "local-team",
        creatureId: "crea-local",
        displayName: "Locale",
        controllerId: "human-local"
      },
      {
        actorId: "enemy-1",
        teamId: "enemy-team",
        creatureId: "crea-enemy",
        displayName: "Ennemie",
        controllerId: "ai-enemy"
      }
    ],
    creatures: [
      {
        id: "crea-local",
        displayName: "Locale",
        combat: {
          maxHp: 10,
          initialHp: 10,
          maxEnergy: 5,
          initialEnergy: 5,
          energyChargeAmount: 0,
          energyChargeIntervalMs: 1000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        skillIds: [],
        presentationId: "creature:crea-local",
        metadata: {}
      },
      {
        id: "crea-enemy",
        displayName: "Ennemie",
        combat: {
          maxHp: 10,
          initialHp: 10,
          maxEnergy: 5,
          initialEnergy: 5,
          energyChargeAmount: 0,
          energyChargeIntervalMs: 1000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        skillIds: [],
        presentationId: "creature:crea-enemy",
        metadata: {}
      }
    ],
    skills: [],
    rosters: [],
    presentation: {
      creatures: {
        "creature:crea-local": {
          id: "creature:crea-local",
          version: 2,
          subjectType: "creature",
          subjectId: "crea-local",
          profileId: "quadruped",
          displayScale: 1.4,
          visual: {
            front: { assetId: "pack:local-front" },
            back: { assetId: "pack:local-back" },
            icon: { assetId: "pack:local-icon" }
          },
          sockets: [
            {
              id: "projectile",
              label: "Projectile",
              front: { x: 0.7, y: 0.2 },
              back: { x: 0.3, y: 0.25 }
            }
          ],
          audio: {}
        },
        "creature:crea-enemy": {
          id: "creature:crea-enemy",
          version: 1,
          subjectType: "creature",
          subjectId: "crea-enemy",
          profileId: "biped",
          visual: {
            front: { assetId: "pack:enemy-front" },
            back: null,
            icon: null
          },
          sockets: [],
          audio: {}
        }
      }
    },
    metadata: {}
  };
}

function assetCatalog() {
  return {
    version: 1,
    assets: [
      ["pack:local-front", "capture/local-front.png"],
      ["pack:local-back", "capture/local-back.png"],
      ["pack:local-icon", "capture/local-icon.png"],
      ["pack:enemy-front", "capture/enemy-front.png"]
    ].map(([id, file]) => ({
      id,
      resource: { file }
    }))
  };
}

function profiles() {
  return [
    { id: "quadruped", idle: {}, attack: {}, hit: {}, ko: {} },
    { id: "biped", idle: {}, attack: {}, hit: {}, ko: {} }
  ];
}

test("Capture visual adapter resolves actor creature presentations without changing asset ids", () => {
  const source = adaptCaptureExportToNativeVisualSourceV1({
    exported: baseExport(),
    assetCatalog: assetCatalog(),
    profiles: profiles(),
    assetUrlForFile(file) {
      return "https://assets.example/" + file;
    }
  });

  assert.equal(source.profiles.length, 2);
  assert.equal(source.creatureMetas.length, 2);

  const local = source.creatureMetas.find(
    (item) => item.id === "crea-local"
  );
  assert.equal(local.profile, "quadruped");
  assert.equal(local.displayScale.player, 1.4);
  assert.equal(local.displayScale.opponent, 1.4);
  assert.equal(
    local.runtimePreview.player,
    "https://assets.example/capture/local-back.png"
  );
  assert.equal(
    local.runtimePreview.opponent,
    "https://assets.example/capture/local-front.png"
  );
  assert.equal(
    local.runtimePreview.icon,
    "https://assets.example/capture/local-icon.png"
  );
  assert.deepEqual(
    local.fxAnchors.player.projectile,
    { x: 0.3, y: 0.25 }
  );
  assert.deepEqual(
    local.fxAnchors.opponent.projectile,
    { x: 0.7, y: 0.2 }
  );

  const enemy = source.creatureMetas.find(
    (item) => item.id === "crea-enemy"
  );
  assert.equal(enemy.profile, "biped");
  assert.equal(enemy.displayScale.player, 1);
  assert.equal(
    enemy.runtimePreview.player,
    "https://assets.example/capture/enemy-front.png"
  );
  assert.equal(
    enemy.runtimePreview.icon,
    "https://assets.example/capture/enemy-front.png"
  );
});

test("Capture visual adapter rejects missing presentation, asset or profile explicitly", () => {
  const missingPresentation = baseExport();
  delete missingPresentation.presentation.creatures[
    "creature:crea-enemy"
  ];

  assert.throws(
    () =>
      adaptCaptureExportToNativeVisualSourceV1({
        exported: missingPresentation,
        assetCatalog: assetCatalog(),
        profiles,
        assetUrlForFile: (file) => file
      }),
    /presentation.*crea-enemy|crea-enemy.*presentation/i
  );

  const missingAsset = assetCatalog();
  missingAsset.assets = missingAsset.assets.filter(
    (asset) => asset.id !== "pack:local-front"
  );

  assert.throws(
    () =>
      adaptCaptureExportToNativeVisualSourceV1({
        exported: baseExport(),
        assetCatalog: missingAsset,
        profiles,
        assetUrlForFile: (file) => file
      }),
    /unknown asset.*pack:local-front|pack:local-front.*unknown/i
  );

  assert.throws(
    () =>
      adaptCaptureExportToNativeVisualSourceV1({
        exported: baseExport(),
        assetCatalog: assetCatalog(),
        profiles: [profiles()[0]],
        assetUrlForFile: (file) => file
      }),
    /unknown profile.*biped|biped.*unknown/i
  );
});
