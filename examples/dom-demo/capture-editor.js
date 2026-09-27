import {
  mountCaptureEditorTestUi
} from "../../src/ui/capture-editor-test-ui.js";

const root = document.querySelector("[data-capture-editor]");

const opponentCreatureDraft = {
  schema: "capture-creature-editor-draft-v1",
  id: "crea-maraileron",
  displayName: "Maraileron",
  description: "Fixture adverse du laboratoire.",
  level: 10,
  sourceStats: {
    force: 10,
    agility: 12,
    intelligence: 8,
    spirit: 9,
    endurance: 11,
    initiative: 12
  },
  elements: ["water"],
  resistances: [],
  capture: {
    capturable: true,
    captureRate: 35,
    spawnChance: 20,
    spawnTags: ["water"],
    evolution: null
  },
  combat: {
    maxHp: 40,
    initialHp: 40,
    maxEnergy: 10,
    initialEnergy: 0,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 2,
    chargeTimeModifierPct: 0
  },
  skillIds: ["water-wave"],
  presentationId: "creature:maraileron"
};

const opponentSkillDraft = {
  schema: "capture-skill-editor-draft-v1",
  id: "water-wave",
  description: "Fixture adverse du laboratoire.",
  requiredLevel: 1,
  usageScopes: ["capture", "combat"],
  definition: {
    id: "water-wave",
    name: "Vague",
    category: "offensive",
    form: "projectile",
    element: "water",
    approachMode: "none",
    energyCost: 2,
    preparationMs: 700,
    travelMs: 500,
    recoveryMs: 400,
    allowedDistances: ["medium", "long"],
    targetRelations: ["enemy"],
    effect: {
      damage: 3,
      tags: ["water"]
    }
  },
  presentation: null
};

const editor = mountCaptureEditorTestUi({
  root,
  context: {
    battle: {
      id: "capture-editor-preview",
      localActorId: "player"
    },
    teams: {
      players: ["player"],
      enemies: ["opponent"]
    },
    actors: [
      {
        actorId: "player",
        teamId: "players",
        creatureId: "crea-braiseau",
        displayName: "Braiseau",
        controllerId: "human-local"
      },
      {
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "crea-maraileron",
        displayName: "Maraileron",
        controllerId: "ai-enemy"
      }
    ],
    rosters: [],
    additionalCreatureDrafts: [opponentCreatureDraft],
    additionalSkillDrafts: [opponentSkillDraft],
    metadata: {
      producer: "capture-editor-ui-v1"
    }
  }
});

window.addEventListener(
  "pagehide",
  () => editor.dispose(),
  { once: true }
);
