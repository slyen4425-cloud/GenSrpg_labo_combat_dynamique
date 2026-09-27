import {
  mountCaptureEditorHumanV2
} from "../../src/ui/capture-editor-human-v2.js";
import {
  loadCombatSkillLibraryV1
} from "../../src/adapters/input/combat-skill-library-v1.js";

const opponentCreatureDraft = {
  schema: "capture-creature-editor-draft-v2",
  id: "crea-enemy",
  displayName: "Adversaire",
  description: "Créature adverse de prévisualisation.",
  level: 1,
  sourceStats: {
    force: 10,
    agility: 10,
    intelligence: 10,
    spirit: 10,
    endurance: 10,
    initiative: 10
  },
  elements: [],
  resistances: [],
  capture: {
    capturable: true,
    captureRate: 30,
    spawnChance: 10,
    spawnTags: [],
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
  skillIds: ["enemy-hit"],
  presentation: null
};

const opponentSkillDrafts = [
  {
    schema: "capture-skill-editor-draft-v1",
    id: "enemy-hit",
    description: "Attaque adverse simple.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id: "enemy-hit",
      name: "Attaque",
      category: "offensive",
      form: "contact",
      element: null,
      approachMode: "ground",
      energyCost: 1,
      preparationMs: 500,
      travelMs: 500,
      recoveryMs: 300,
      cooldownMs: 1000,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: {
        damage: 2
      }
    },
    presentation: null
  }
];

const opponentLoadout = {
  schema: "capture-active-skill-loadout-v1",
  creatureId: "crea-enemy",
  slots: [
    { id: "slot-1", skillId: "enemy-hit" },
    { id: "slot-2", skillId: null },
    { id: "slot-3", skillId: null },
    { id: "slot-4", skillId: null }
  ]
};

const root = document.querySelector(
  "[data-capture-editor-human]"
);

async function loadJson(url) {
  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      "Chargement impossible (" +
        response.status +
        ") : " +
        url
    );
  }

  return response.json();
}

async function startEditor() {
  const manifestUrl = new URL(
    "../../data/combat/skills/catalog.v1.json",
    import.meta.url
  );

  const manifest = await loadJson(
    manifestUrl
  );

  const skillLibrary =
    await loadCombatSkillLibraryV1({
      manifest,
      loadDefinition: (source) =>
        loadJson(
          new URL(
            "../../data/combat/skills/" +
              source,
            import.meta.url
          )
        )
    });

  const editor = mountCaptureEditorHumanV2({
    root,
    skillLibrary,
    opponentCreatureDraft,
    opponentSkillDrafts,
    opponentLoadout
  });

  window.addEventListener(
    "pagehide",
    () => editor.dispose(),
    { once: true }
  );
}

startEditor().catch((error) => {
  const status = root?.querySelector(
    "[data-editor-status]"
  );

  if (status) {
    status.textContent =
      "Bibliothèque de capacités indisponible : " +
      error.message;
    status.dataset.tone = "error";
  }
});
