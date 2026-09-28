import {
  normalizeCaptureCreatureEditorDraftV3
} from "../contracts/capture-creature-editor-draft-v3.js";

const ENEMY_SKILL_IDS = Object.freeze([
  "enemy-hit",
  "enemy-burst",
  "enemy-heavy-hit"
]);

export const CAPTURE_TEST_CREATURE_OPTIONS_V1 = Object.freeze([
  Object.freeze({
    id: "braisombre",
    label: "Braisombre",
    profileId: "drake",
    elements: Object.freeze(["fire"]),
    assets: Object.freeze({
      front: "pack:capture:creature-braisombre-opponent-01",
      back: "pack:capture:creature-braisombre-player-01",
      icon: "pack:capture:creature-braisombre-icon-01"
    })
  }),
  Object.freeze({
    id: "maraileron",
    label: "Maraileron",
    profileId: "serpentine",
    elements: Object.freeze(["water"]),
    assets: Object.freeze({
      front: "pack:capture:creature-maraileron-opponent-01",
      back: "pack:capture:creature-maraileron-player-01",
      icon: "pack:capture:creature-maraileron-icon-01"
    })
  }),
  Object.freeze({
    id: "loup-volcanique",
    label: "Loup volcanique",
    profileId: "quadruped",
    elements: Object.freeze(["fire"]),
    assets: Object.freeze({
      front: "pack:capture:creature-loup-volcanique-opponent-01",
      back: "pack:capture:creature-loup-volcanique-player-01",
      icon: "pack:capture:creature-loup-volcanique-icon-01"
    })
  }),
  Object.freeze({
    id: "golem-moussu",
    label: "Golem moussu",
    profileId: "biped",
    elements: Object.freeze(["earth"]),
    assets: Object.freeze({
      front: "pack:capture:creature-golem-moussu-opponent-01",
      back: "pack:capture:creature-golem-moussu-player-01",
      icon: "pack:capture:creature-golem-moussu-icon-01"
    })
  }),
  Object.freeze({
    id: "guepe-cybernetique",
    label: "Guêpe cybernétique",
    profileId: "drake",
    elements: Object.freeze(["electricity"]),
    assets: Object.freeze({
      front: "pack:capture:creature-guepe-cybernetique-opponent-01",
      back: "pack:capture:creature-guepe-cybernetique-player-01",
      icon: "pack:capture:creature-guepe-cybernetique-icon-01"
    })
  }),
  Object.freeze({
    id: "chat-mystique",
    label: "Chat mystique",
    profileId: "quadruped",
    elements: Object.freeze(["shadow"]),
    assets: Object.freeze({
      front: "pack:capture:creature-chat-mystique-opponent-01",
      back: "pack:capture:creature-chat-mystique-player-01",
      icon: "pack:capture:creature-chat-mystique-icon-01"
    })
  }),
  Object.freeze({
    id: "renard-magique-dore",
    label: "Renard magique doré",
    profileId: "quadruped",
    elements: Object.freeze(["light"]),
    assets: Object.freeze({
      front: "pack:capture:creature-renard-magique-dore-opponent-01",
      back: "pack:capture:creature-renard-magique-dore-player-01",
      icon: "pack:capture:creature-renard-magique-dore-icon-01"
    })
  }),
  Object.freeze({
    id: "ailevent",
    label: "Ailevent",
    profileId: "drake",
    elements: Object.freeze(["air"]),
    assets: Object.freeze({
      front: "pack:capture:creature-ailevent-opponent-01",
      back: "pack:capture:creature-ailevent-player-01",
      icon: "pack:capture:creature-ailevent-icon-01"
    })
  }),
  Object.freeze({
    id: "voltige",
    label: "Voltige",
    profileId: "quadruped",
    elements: Object.freeze(["electricity"]),
    assets: Object.freeze({
      front: "pack:capture:creature-voltige-opponent-01",
      back: "pack:capture:creature-voltige-player-01",
      icon: "pack:capture:creature-voltige-icon-01"
    })
  })
]);

function requireAssetIds(option, assetCatalog) {
  if (
    !assetCatalog ||
    typeof assetCatalog !== "object" ||
    !Array.isArray(assetCatalog.assets)
  ) {
    throw new TypeError("assetCatalog.assets must be an array");
  }

  const available = new Set(
    assetCatalog.assets
      .map((asset) => asset?.id)
      .filter((id) => typeof id === "string")
  );

  for (const assetId of Object.values(option.assets)) {
    if (!available.has(assetId)) {
      throw new RangeError(
        "Capture test creature references unknown asset: " + assetId
      );
    }
  }
}

export function buildCaptureTestOpponentDraftV1({
  optionId,
  assetCatalog
}) {
  const option = CAPTURE_TEST_CREATURE_OPTIONS_V1.find(
    (entry) => entry.id === optionId
  );

  if (!option) {
    throw new RangeError(
      "Unknown Capture test creature option: " + optionId
    );
  }

  requireAssetIds(option, assetCatalog);

  return normalizeCaptureCreatureEditorDraftV3({
    schema: "capture-creature-editor-draft-v3",
    id: "crea-enemy",
    displayName: option.label,
    description:
      "Créature adverse de prévisualisation : " +
      option.label +
      ".",
    level: 1,
    sourceStats: {
      force: 10,
      agility: 10,
      intelligence: 10,
      spirit: 10,
      endurance: 10,
      initiative: 10
    },
    elements: [...option.elements],
    resistances: [],
    capture: {
      capturable: true,
      captureRate: 30,
      spawnChance: 10,
      spawnTags: [...option.elements],
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
    skillIds: [...ENEMY_SKILL_IDS],
    presentation: {
      id: "creature:crea-enemy",
      version: 2,
      subjectType: "creature",
      subjectId: "crea-enemy",
      profileId: option.profileId,
      displayScale: 1,
      visual: {
        front: { assetId: option.assets.front },
        back: { assetId: option.assets.back },
        icon: { assetId: option.assets.icon }
      },
      sockets: [
        {
          id: "projectile",
          label: "Projectile",
          front: { x: 0.5, y: 0.45 },
          back: { x: 0.5, y: 0.45 }
        }
      ],
      audio: {}
    }
  });
}
