import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  exportCaptureEditorDraftsToCombatExportV2
} from "../../src/adapters/input/capture/capture-editor-exporter-v2.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";

function presentation(creatureId, suffix) {
  return {
    id: `creature:${suffix}`,
    version: 1,
    subjectType: "creature",
    subjectId: creatureId,
    profileId: "biped",
    visual: {
      front: {
        assetId: `capture:${suffix}-front`
      },
      back: {
        assetId: `capture:${suffix}-back`
      },
      icon: {
        assetId: `capture:${suffix}-icon`
      }
    },
    sockets: [
      {
        id: "mouth",
        label: "Bouche",
        front: { x: 0.5, y: 0.2 },
        back: { x: 0.5, y: 0.2 }
      }
    ],
    audio: {
      hit: {
        assetId: "core:audio-creature-hit-01"
      }
    }
  };
}

function creatureDraft(id, name, skillIds, withPresentation = false) {
  return {
    schema: "capture-creature-editor-draft-v2",
    id,
    displayName: name,
    description: name,
    level: 10,
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
      captureRate: 40,
      spawnChance: 20,
      spawnTags: [],
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
    skillIds,
    presentation: withPresentation
      ? presentation(id, id.replace("crea-", ""))
      : null
  };
}

function skillDraft(id, {
  name = id,
  form = "contact",
  element = null,
  damage = 2,
  withPresentation = false
} = {}) {
  return {
    schema: "capture-skill-editor-draft-v1",
    id,
    description: name,
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id,
      name,
      category: "offensive",
      form,
      element,
      approachMode: form === "contact" ? "ground" : "none",
      energyCost: 2,
      preparationMs: 500,
      travelMs: 500,
      recoveryMs: 300,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: {
        damage,
        tags: element ? [element] : []
      }
    },
    presentation: withPresentation
      ? {
          id: `skill:${id}`,
          version: 1,
          subjectType: "skill",
          subjectId: id,
          visual: {
            icon: {
              assetId: `capture:icon-${id}`
            }
          }
        }
      : null
  };
}

function loadout(creatureId, ids = []) {
  return {
    schema: "capture-active-skill-loadout-v1",
    creatureId,
    slots: [0, 1, 2, 3].map((index) => ({
      id: `slot-${index + 1}`,
      skillId: ids[index] ?? null
    }))
  };
}

function battleSetup1v1() {
  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "capture-editor-v2-duel",
    localActorId: "player",
    teams: [
      {
        id: "players",
        slots: [
          {
            actorId: "player",
            creatureId: "crea-braiseau",
            displayName: "Braiseau",
            controllerId: "human-local",
            roster: {
              activeMemberId: "player-braiseau",
              members: [
                {
                  id: "player-braiseau",
                  creatureId: "crea-braiseau",
                  displayName: "Braiseau"
                },
                {
                  id: "player-golem",
                  creatureId: "crea-golem",
                  displayName: "Golem"
                }
              ]
            }
          }
        ]
      },
      {
        id: "enemies",
        slots: [
          {
            actorId: "opponent",
            creatureId: "crea-maraileron",
            displayName: "Maraileron",
            controllerId: "ai-enemy",
            roster: null
          }
        ]
      }
    ]
  };
}

function validInput() {
  return {
    battleSetup: battleSetup1v1(),
    creatureDrafts: [
      creatureDraft(
        "crea-braiseau",
        "Braiseau",
        ["fireball", "claw", "unused-skill"],
        true
      ),
      creatureDraft("crea-golem", "Golem", []),
      creatureDraft(
        "crea-maraileron",
        "Maraileron",
        ["water-wave"]
      )
    ],
    skillDrafts: [
      skillDraft("fireball", {
        name: "Boule de feu",
        form: "projectile",
        element: "fire",
        damage: 4,
        withPresentation: true
      }),
      skillDraft("claw", {
        name: "Griffe",
        form: "contact",
        damage: 3
      }),
      skillDraft("unused-skill", {
        name: "Réserve",
        form: "contact",
        damage: 1
      }),
      skillDraft("water-wave", {
        name: "Vague",
        form: "projectile",
        element: "water",
        damage: 3
      })
    ],
    loadouts: [
      loadout("crea-braiseau", ["fireball", "claw"]),
      loadout("crea-golem"),
      loadout("crea-maraileron", ["water-wave"])
    ],
    metadata: {
      producer: "capture-editor-v2-test"
    }
  };
}

test("Capture Editor Exporter V2 composes battle setup, V2 creatures, skills and loadouts", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV2(validInput());

  assert.equal(exported.schema, "capture-combat-export-v1");
  assert.equal(exported.battle.id, "capture-editor-v2-duel");
  assert.deepEqual(exported.teams, {
    players: ["player"],
    enemies: ["opponent"]
  });
  assert.deepEqual(
    exported.actors.map((actor) => actor.actorId),
    ["player", "opponent"]
  );
  assert.equal(exported.rosters.length, 1);
  assert.equal(exported.rosters[0].slotId, "player");
});

test("Capture Editor Exporter V2 exports only equipped skills while preserving linked skills as editor metadata", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV2(validInput());
  const braiseau = exported.creatures.find(
    (creature) => creature.id === "crea-braiseau"
  );

  assert.deepEqual(
    braiseau.skillIds,
    ["fireball", "claw"]
  );
  assert.deepEqual(
    braiseau.metadata.editor.linkedSkillIds,
    ["fireball", "claw", "unused-skill"]
  );
});

test("Capture Editor Exporter V2 transports creature presentation separately from gameplay", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV2(validInput());

  assert.equal(
    exported.presentation.creatures["creature:braiseau"].subjectId,
    "crea-braiseau"
  );
  assert.equal(
    exported.presentation.creatures["creature:braiseau"].visual.front.assetId,
    "capture:braiseau-front"
  );

  const braiseau = exported.creatures.find(
    (creature) => creature.id === "crea-braiseau"
  );

  assert.equal(braiseau.presentationId, "creature:braiseau");
  assert.equal("visual" in braiseau.combat, false);
  assert.equal("audio" in braiseau.combat, false);
});

test("Capture Editor Exporter V2 output is consumed by the authoritative Capture adapter stack", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV2(validInput());
  const adapted = adaptCaptureCombatExportStackV1(exported);

  assert.deepEqual(
    adapted.skillIdsByActor.player,
    ["fireball", "claw"]
  );
  assert.deepEqual(
    adapted.skillIdsByActor.opponent,
    ["water-wave"]
  );
  assert.equal(adapted.fighters.length, 2);
  assert.equal(
    adapted.skillPresentations.fireball.visual.icon.assetId,
    "capture:icon-fireball"
  );
});

test("Capture Editor Exporter V2 requires exactly one loadout for every creature draft", () => {
  const missing = validInput();
  missing.loadouts.pop();

  assert.throws(
    () => exportCaptureEditorDraftsToCombatExportV2(missing),
    /missing loadout.*crea-maraileron/i
  );

  const duplicate = validInput();
  duplicate.loadouts.push(
    loadout("crea-braiseau", ["fireball"])
  );

  assert.throws(
    () => exportCaptureEditorDraftsToCombatExportV2(duplicate),
    /duplicate loadout.*crea-braiseau/i
  );
});

test("Capture Editor Exporter V2 refuses equipped skills not linked to the creature", () => {
  const input = validInput();
  input.loadouts[0] =
    loadout("crea-braiseau", ["water-wave"]);

  assert.throws(
    () => exportCaptureEditorDraftsToCombatExportV2(input),
    /equipped skill.*water-wave.*not linked.*crea-braiseau/i
  );
});

test("Capture Editor Exporter V2 refuses equipped skills absent from skill drafts", () => {
  const input = validInput();
  input.creatureDrafts[0].skillIds.push("ghost-skill");
  input.loadouts[0] =
    loadout("crea-braiseau", ["ghost-skill"]);

  assert.throws(
    () => exportCaptureEditorDraftsToCombatExportV2(input),
    /equipped skill.*ghost-skill.*unknown/i
  );
});

test("Capture Editor Exporter V2 uses the same path for 2v2", () => {
  const input = validInput();

  input.battleSetup.teams[0].slots.push({
    actorId: "ally",
    creatureId: "crea-golem",
    displayName: "Golem",
    controllerId: "ai-ally",
    roster: null
  });

  input.battleSetup.teams[1].slots.push({
    actorId: "opponent-b",
    creatureId: "crea-braiseau",
    displayName: "Braiseau B",
    controllerId: "ai-enemy-b",
    roster: null
  });

  const exported =
    exportCaptureEditorDraftsToCombatExportV2(input);
  const adapted = adaptCaptureCombatExportStackV1(exported);

  assert.equal(exported.actors.length, 4);
  assert.equal(adapted.battleFormat.actors.length, 4);
  assert.deepEqual(
    adapted.skillIdsByActor["opponent-b"],
    ["fireball", "claw"]
  );
});

test("Capture Editor Exporter V2 stays independent from UI, runtime, renderer, storage and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/adapters/input/capture/capture-editor-exporter-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "is2v2",
    "document.",
    "window.",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "fetch(",
    "XMLHttpRequest",
    "Zombicide-40k",
    "captureFix",
    "combat-runtime",
    "renderer/"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `exporter source must not contain ${forbidden}`
    );
  }

  assert.equal(
    source.includes("exportCaptureEditorDraftsToCombatExportV1"),
    true,
    "V2 must delegate to the GREEN V1 exporter"
  );
});
