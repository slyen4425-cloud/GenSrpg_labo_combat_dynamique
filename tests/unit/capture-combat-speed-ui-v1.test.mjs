import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanBattleSetupV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  normalizeCaptureCombatExportV1
} from "../../src/contracts/capture-combat-export-v1.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import {
  loadCoop2v2CombatSource
} from "../../src/ui/combat-2v2-test-ui.js";

function skillDefinition() {
  return {
    id: "hit",
    name: "Hit",
    category: "offensive",
    form: "contact",
    element: null,
    approachMode: "ground",
    energyCost: 1,
    preparationMs: 600,
    travelMs: 400,
    recoveryMs: 300,
    cooldownMs: 1200,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: { damage: 2 }
  };
}

function creature(id) {
  return {
    id,
    displayName: id,
    combat: {
      maxHp: 50,
      initialHp: 50,
      maxEnergy: 10,
      initialEnergy: 5,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: 0
    },
    skillIds: ["hit"],
    presentationId: null,
    metadata: {}
  };
}

function exported(speed = 1.5) {
  return normalizeCaptureCombatExportV1({
    schema: "capture-combat-export-v1",
    battle: {
      id: "speed-preview",
      localActorId: "local-1",
      skillSpeedMultiplier: speed
    },
    teams: {
      "local-team": ["local-1"],
      "enemy-team": ["opponent-1"]
    },
    actors: [
      {
        actorId: "local-1",
        teamId: "local-team",
        creatureId: "local-creature",
        displayName: "Local",
        controllerId: "human-local"
      },
      {
        actorId: "opponent-1",
        teamId: "enemy-team",
        creatureId: "enemy-creature",
        displayName: "Enemy",
        controllerId: "ai-enemy"
      }
    ],
    creatures: [
      creature("local-creature"),
      creature("enemy-creature")
    ],
    skills: [
      {
        id: "hit",
        definition: skillDefinition(),
        presentationId: null,
        metadata: {}
      }
    ],
    rosters: [],
    presentation: {},
    metadata: {}
  });
}

test("human battle setup owns a global skill speed multiplier with default 1", () => {
  const configured = buildHumanBattleSetupV1({
    battleId: "speed-preview",
    localCreatureId: "local-creature",
    localDisplayName: "Local",
    opponentCreatureId: "enemy-creature",
    opponentDisplayName: "Enemy",
    activePerTeam: 1,
    skillSpeedMultiplier: 1.5
  });

  assert.equal(configured.skillSpeedMultiplier, 1.5);

  const defaulted = buildHumanBattleSetupV1({
    battleId: "speed-preview-default",
    localCreatureId: "local-creature",
    localDisplayName: "Local",
    opponentCreatureId: "enemy-creature",
    opponentDisplayName: "Enemy",
    activePerTeam: 1
  });

  assert.equal(defaulted.skillSpeedMultiplier, 1);
});

test("Capture export and Adapter Stack preserve battle skill speed", () => {
  const value = exported(1.5);

  assert.equal(value.battle.skillSpeedMultiplier, 1.5);

  const adapted = adaptCaptureCombatExportStackV1(value);
  assert.equal(adapted.skillSpeedMultiplier, 1.5);
});

test("native Combat Test source preserves skill speed and mount passes it to CombatSession", async () => {
  const adapted = adaptCaptureCombatExportStackV1(
    exported(1.75)
  );

  const loaded = await loadCoop2v2CombatSource({
    nativeCombatSource: adapted,
    fetchImpl: async () => {
      throw new Error("native source must not fetch fixtures");
    }
  });

  assert.equal(loaded.skillSpeedMultiplier, 1.75);

  const source = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );

  assert.match(
    source,
    /createCombatSession\(\{[\s\S]*skillSpeedMultiplier/
  );
});

test("Capture editor exposes and reads the global combat speed control", async () => {
  const [html, source] = await Promise.all([
    readFile(
      "examples/dom-demo/capture-editor-v2.html",
      "utf8"
    ),
    readFile(
      "src/ui/capture-editor-human-v2.js",
      "utf8"
    )
  ]);

  assert.equal(
    html.includes("data-combat-skill-speed"),
    true
  );
  assert.equal(
    source.includes("[data-combat-skill-speed]"),
    true
  );
  assert.match(
    source,
    /skillSpeedMultiplier\s*:\s*numericValue/
  );
});
