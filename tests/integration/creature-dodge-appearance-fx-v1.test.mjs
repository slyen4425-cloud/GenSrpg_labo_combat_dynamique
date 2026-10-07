import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHumanCreatureDraftV3,
  buildHumanLoadoutV1,
  buildHumanBattleSetupV1,
  buildHumanEditorExportV3
} from "../../src/ui/capture-editor-human-v2.js";
import {
  adaptCaptureExportToNativeVisualSourceV1
} from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";

function fields(
  id,
  {
    dodge = null
  } = {}
) {
  return {
    id,
    displayName: id,
    description: "Dodge appearance true path fixture",
    level: 5,
    sourceStats: {
      force: 1,
      agility: 1,
      intelligence: 1,
      spirit: 1,
      endurance: 1,
      initiative: 1
    },
    elements: [],
    resistances: {},
    capture: {
      capturable: true,
      captureRate: 30,
      spawnChance: 10,
      spawnTags: [],
      evolution: null
    },
    combat: {
      maxHp: 100,
      maxEnergy: 10,
      initialEnergy: 10,
      energyChargeAmount: 0,
      energyChargeIntervalMs: 1000,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: 0,
      approachTimeModifierPct: 0
    },
    linkedSkillIds: [],
    profileId: "biped",
    displayScale: 1,
    visual: {
      frontAssetId:
        "pack:test:" + id + ":front",
      backAssetId:
        "pack:test:" + id + ":back",
      iconAssetId:
        "pack:test:" + id + ":icon",
      ...(dodge === null
        ? {}
        : {
            dodgeAssetId:
              dodge.assetId,
            dodgeDisplayScale:
              dodge.displayScale,
            dodgeOffsetX:
              dodge.offsetX,
            dodgeOffsetY:
              dodge.offsetY
          })
    },
    sockets: [],
    audio: {}
  };
}

test("Editor creature Dodge appearance survives the true preview export and native visual adapter", () => {
  const local =
    buildHumanCreatureDraftV3(
      fields(
        "crea-local",
        {
          dodge: {
            assetId:
              "pack:test:dodge-lightning",
            displayScale: 1.35,
            offsetX: -4,
            offsetY: 7
          }
        }
      )
    );
  const enemy =
    buildHumanCreatureDraftV3(
      fields("crea-enemy")
    );

  const localLoadout =
    buildHumanLoadoutV1({
      creatureId: local.id,
      skillIds: []
    });
  const enemyLoadout =
    buildHumanLoadoutV1({
      creatureId: enemy.id,
      skillIds: []
    });
  const battleSetup =
    buildHumanBattleSetupV1({
      battleId: "dodge-fx-true-path",
      localCreatureId: local.id,
      localDisplayName:
        local.displayName,
      opponentCreatureId: enemy.id,
      opponentDisplayName:
        enemy.displayName,
      arenaId: "city",
      activePerTeam: 1
    });

  const exported =
    buildHumanEditorExportV3({
      creatureDraft: local,
      skillDrafts: [],
      loadout: localLoadout,
      battleSetup,
      opponentCreatureDraft: enemy,
      opponentSkillDrafts: [],
      opponentLoadout: enemyLoadout
    });

  assert.equal(
    exported.presentation.creatures[
      "creature:crea-local"
    ].version,
    3
  );
  assert.deepEqual(
    exported.presentation.creatures[
      "creature:crea-local"
    ].visual.dodge,
    {
      assetId:
        "pack:test:dodge-lightning",
      displayScale: 1.35,
      offsetX: -4,
      offsetY: 7
    }
  );
  assert.equal(
    exported.presentation.creatures[
      "creature:crea-enemy"
    ].version,
    2
  );

  const ids = [
    "pack:test:crea-local:front",
    "pack:test:crea-local:back",
    "pack:test:crea-local:icon",
    "pack:test:crea-enemy:front",
    "pack:test:crea-enemy:back",
    "pack:test:crea-enemy:icon",
    "pack:test:dodge-lightning"
  ];
  const assetCatalog = {
    version: 1,
    assets: ids.map((id) => ({
      id,
      assetType: "sprite",
      mediaType: "image",
      category:
        id.includes("dodge")
          ? "dodge"
          : "creature",
      compatibility: {
        uses: [
          "combat",
          "capture",
          "editor"
        ]
      },
      resource: {
        file:
          id.replaceAll(":", "_") +
          ".webp",
        ...(id.includes("dodge")
          ? {
              format: "sprite-strip",
              frameCount: 8,
              frameMs: 50
            }
          : {})
      }
    }))
  };

  const native =
    adaptCaptureExportToNativeVisualSourceV1({
      exported,
      assetCatalog,
      profiles: [
        {
          id: "biped",
          idle: {},
          attack: {},
          hit: {},
          ko: {}
        }
      ],
      assetUrlForFile(file) {
        return "https://assets.test/" + file;
      }
    });

  const localMeta =
    native.creatureMetas.find(
      (entry) =>
        entry.id === "crea-local"
    );
  const enemyMeta =
    native.creatureMetas.find(
      (entry) =>
        entry.id === "crea-enemy"
    );

  assert.deepEqual(
    localMeta.dodgeFx,
    {
      assetId:
        "pack:test:dodge-lightning",
      url:
        "https://assets.test/pack_test_dodge-lightning.webp",
      frameCount: 8,
      frameMs: 50,
      format: "sprite-strip",
      displayScale: 1.35,
      offsetX: -4,
      offsetY: 7
    }
  );
  assert.equal(
    enemyMeta.dodgeFx,
    null
  );
});
