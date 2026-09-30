import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  adaptCaptureCreatureToFighterConfig
} from "../../src/adapters/input/capture/capture-creature-to-fighter-config.js";
import {
  exportCaptureEditorDraftsToCombatExportV1
} from "../../src/adapters/input/capture/capture-editor-exporter-v1.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import {
  createCombatState
} from "../../src/core/combat/combat-state.js";
import {
  computeCombatDamageV1
} from "../../src/core/combat/combat-damage-v1.js";

const ELEMENTS = Object.freeze([
  "fire",
  "water",
  "earth",
  "air",
  "electric",
  "light",
  "shadow",
  "nature",
  "ice",
  "poison",
  "steel",
  "psy",
  "spirit"
]);

function combat() {
  return {
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 10,
    initialEnergy: 10,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  };
}

function editorCreature(id, elements, resistances) {
  return {
    schema: "capture-creature-editor-draft-v1",
    id,
    displayName: id,
    description: id + " test",
    level: 5,
    sourceStats: {
      force: 10,
      agility: 10,
      intelligence: 10,
      spirit: 10,
      endurance: 10,
      initiative: 10
    },
    elements,
    resistances,
    capture: {
      capturable: true,
      captureRate: 50,
      spawnChance: 25,
      spawnTags: [...elements],
      evolution: null
    },
    combat: combat(),
    skillIds: [],
    presentationId: "creature:" + id
  };
}

function exportInput() {
  return {
    battle: {
      id: "natural-elements-test",
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
        creatureId: "fire-creature",
        displayName: "Fire",
        controllerId: "human-local"
      },
      {
        actorId: "opponent",
        teamId: "enemies",
        creatureId: "neutral-creature",
        displayName: "Neutral",
        controllerId: "ai-enemy"
      }
    ],
    rosters: [
      {
        slotId: "player",
        activeMemberId: "player-member",
        members: [
          {
            id: "player-member",
            creatureId: "fire-creature",
            displayName: "Fire"
          }
        ]
      },
      {
        slotId: "opponent",
        activeMemberId: "opponent-member",
        members: [
          {
            id: "opponent-member",
            creatureId: "neutral-creature",
            displayName: "Neutral"
          }
        ]
      }
    ],
    creatureDrafts: [
      editorCreature(
        "fire-creature",
        ["fire"],
        [
          { kind: "element:fire", value: 35 },
          { kind: "element:water", value: -50 }
        ]
      ),
      editorCreature(
        "neutral-creature",
        [],
        []
      )
    ],
    skillDrafts: [],
    metadata: {
      producer: "natural-elements-test"
    }
  };
}

test("Capture editor exposes every historical element and natural resistance channel", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  const skillSelect = html.match(
    /<select data-skill-element>[\s\S]*?<\/select>/
  )?.[0] ?? "";

  for (const elementId of ELEMENTS) {
    assert.match(
      html,
      new RegExp('data-element value="' + elementId + '"')
    );
    assert.match(
      html,
      new RegExp('data-resistance="' + elementId + '"')
    );
    assert.match(
      skillSelect,
      new RegExp('value="' + elementId + '"')
    );
  }
});

test("natural resistance and stat resistance merge once in FighterConfig", () => {
  const fighter = adaptCaptureCreatureToFighterConfig({
    id: "target",
    elements: ["fire"],
    resistances: [
      { kind: "element:fire", value: 35 },
      { kind: "element:water", value: -50 }
    ],
    combat: {
      ...combat(),
      statEffects: {
        damagePctByChannel: {},
        resistancePctByChannel: {
          fire: 10,
          earth: 20
        },
        chargeTimeReductionPct: 0,
        damageReductionPct: 0
      }
    }
  });

  assert.deepEqual(
    fighter.resistancePctByChannel,
    {
      fire: 45,
      water: -50,
      earth: 20
    }
  );
});

test("signed resistance is accepted while damage bonuses stay non-negative", () => {
  const state = createCombatState({
    fighters: [
      {
        id: "attacker",
        maxHp: 100,
        maxEnergy: 10
      },
      {
        id: "target",
        maxHp: 100,
        maxEnergy: 10,
        resistancePctByChannel: {
          fire: 35,
          water: -50
        }
      }
    ]
  });

  assert.equal(
    computeCombatDamageV1({
      state,
      attackerId: "attacker",
      targetId: "target",
      baseDamage: 100,
      channel: "fire"
    }).damage,
    65
  );

  assert.equal(
    computeCombatDamageV1({
      state,
      attackerId: "attacker",
      targetId: "target",
      baseDamage: 100,
      channel: "water"
    }).damage,
    150
  );

  assert.throws(
    () => createCombatState({
      fighters: [
        {
          id: "bad",
          maxHp: 100,
          maxEnergy: 10,
          damagePctByChannel: {
            fire: -10
          }
        },
        {
          id: "other",
          maxHp: 100,
          maxEnergy: 10
        }
      ]
    }),
    /damagePctByChannel|non-negative/i
  );
});

test("editor export preserves natural elements through native combat", () => {
  const exported =
    exportCaptureEditorDraftsToCombatExportV1(
      exportInput()
    );

  const portable = exported.creatures.find(
    (creature) =>
      creature.id === "fire-creature"
  );

  assert.deepEqual(portable.elements, ["fire"]);
  assert.deepEqual(
    portable.resistances,
    [
      { kind: "element:fire", value: 35 },
      { kind: "element:water", value: -50 }
    ]
  );

  const native =
    adaptCaptureCombatExportStackV1(exported);
  const fighter = native.fighters.find(
    (entry) => entry.id === "player"
  );

  assert.deepEqual(
    fighter.resistancePctByChannel,
    {
      fire: 35,
      water: -50
    }
  );

  const state = createCombatState({
    fighters: native.fighters
  });

  assert.equal(
    computeCombatDamageV1({
      state,
      attackerId: "opponent",
      targetId: "player",
      baseDamage: 100,
      channel: "water"
    }).damage,
    150
  );
});
