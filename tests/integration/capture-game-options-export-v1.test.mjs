import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCaptureEditorCombatTestV1
} from "../../src/ui/capture-editor-combat-test-v1.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";

function record(id) {
  return {
    draft: {
      schema: "capture-creature-editor-draft-v3",
      id,
      displayName: id,
      description: id,
      level: 1,
      sourceStats: {
        force: 1,
        agility: 1,
        intelligence: 1,
        spirit: 1,
        endurance: 1,
        initiative: 1
      },
      elements: [],
      resistances: [],
      capture: {
        capturable: true,
        captureRate: 50,
        spawnChance: 50,
        spawnTags: [],
        evolution: null
      },
      combat: {
        maxHp: 100,
        maxEnergy: 10
      },
      skillIds: [],
      presentation: null
    },
    loadout: {
      schema: "capture-active-skill-loadout-v1",
      creatureId: id,
      slots: [
        { id: "slot-1", skillId: null },
        { id: "slot-2", skillId: null },
        { id: "slot-3", skillId: null },
        { id: "slot-4", skillId: null },
        { id: "ultimate", skillId: null }
      ]
    },
    statValues: null
  };
}

test("Capture editor export carries Game Options dodge into native combat source", () => {
  const creatures = new Map([
    ["local", record("local")],
    ["enemy", record("enemy")]
  ]);

  const exported =
    buildCaptureEditorCombatTestV1({
      configuredCreatures: creatures,
      configuredSkills: new Map(),
      localCreatureIds: ["local"],
      opponentCreatureIds: ["enemy"],
      activePerTeam: 1,
      arenaId: null,
      combatRules: {
        schema: "capture-combat-rules-editor-draft-v1",
        maxEnergy: 10,
        initialEnergy: 0,
        energyChargeAmount: 1,
        energyChargeIntervalMs: 2000
      },
      skillSpeedMultiplier: 0.5,
      recallPreparationMs: 2000,
      gameOptions: {
        dodge: {
          enabled: true,
          maxCharges: 3,
          rechargeMs: 2500
        }
      }
    });

  assert.deepEqual(
    exported.battle.gameOptions,
    {
      dodge: {
        enabled: true,
        maxCharges: 3,
        rechargeMs: 2500
      }
    }
  );

  const native =
    adaptCaptureCombatExportStackV1(
      exported
    );

  assert.deepEqual(
    native.gameOptions,
    exported.battle.gameOptions
  );
});
