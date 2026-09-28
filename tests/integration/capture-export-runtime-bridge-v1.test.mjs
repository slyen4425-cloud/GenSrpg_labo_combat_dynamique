import test from "node:test";
import assert from "node:assert/strict";

import {
  exportCaptureEditorDraftsToCombatExportV2
} from "../../src/adapters/input/capture/capture-editor-exporter-v2.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import {
  loadCoop2v2CombatSource
} from "../../src/ui/combat-2v2-test-ui.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";

function creature(id, name, skillIds) {
  return {
    schema: "capture-creature-editor-draft-v2",
    id,
    displayName: name,
    description: name,
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
      maxHp: 40,
      initialHp: 40,
      maxEnergy: 10,
      initialEnergy: 10,
      energyChargeAmount: 0,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: 0
    },
    skillIds,
    presentation: null
  };
}

function skill(id, damage) {
  return {
    schema: "capture-skill-editor-draft-v1",
    id,
    description: id,
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id,
      name: id,
      category: "offensive",
      form: "contact",
      element: null,
      approachMode: "ground",
      energyCost: 1,
      preparationMs: 100,
      travelMs: 100,
      recoveryMs: 0,
      cooldownMs: 0,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: {
        damage
      }
    },
    presentation: null
  };
}

function loadout(creatureId, skillId) {
  return {
    schema: "capture-active-skill-loadout-v1",
    creatureId,
    slots: [
      { id: "slot-1", skillId },
      { id: "slot-2", skillId: null },
      { id: "slot-3", skillId: null },
      { id: "slot-4", skillId: null }
    ]
  };
}

function battleSetup(activePerTeam) {
  const localSlots = [];
  const enemySlots = [];

  for (let index = 0; index < activePerTeam; index += 1) {
    const number = index + 1;
    localSlots.push({
      actorId: "local-" + number,
      creatureId: "crea-local",
      displayName: "Locale " + number,
      controllerId:
        index === 0
          ? "human-local"
          : "ai-ally",
      roster: null
    });
    enemySlots.push({
      actorId: "enemy-" + number,
      creatureId: "crea-enemy",
      displayName: "Ennemie " + number,
      controllerId: "ai-enemy",
      roster: null
    });
  }

  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "editor-preview-" + activePerTeam,
    localActorId: "local-1",
    teams: [
      {
        id: "local-team",
        slots: localSlots
      },
      {
        id: "enemy-team",
        slots: enemySlots
      }
    ]
  };
}

function editorExport(activePerTeam = 1) {
  return exportCaptureEditorDraftsToCombatExportV2({
    battleSetup: battleSetup(activePerTeam),
    creatureDrafts: [
      creature(
        "crea-local",
        "Créature locale",
        ["local-strike"]
      ),
      creature(
        "crea-enemy",
        "Créature ennemie",
        ["enemy-strike"]
      )
    ],
    skillDrafts: [
      skill("local-strike", 7),
      skill("enemy-strike", 3)
    ],
    loadouts: [
      loadout("crea-local", "local-strike"),
      loadout("crea-enemy", "enemy-strike")
    ],
    metadata: {
      producer: "capture-export-runtime-bridge-v1-test"
    }
  });
}

async function nativeSourceFromExport(exported) {
  const adapted =
    adaptCaptureCombatExportStackV1(
      exported
    );

  let fetchCalls = 0;
  const loaded =
    await loadCoop2v2CombatSource({
      nativeCombatSource: adapted,
      fetchImpl: async () => {
        fetchCalls += 1;
        throw new Error(
          "native bridge must not fetch demo fixtures"
        );
      }
    });

  assert.equal(fetchCalls, 0);
  return { adapted, loaded };
}

test("Capture editor export reaches real CombatRuntime and resolves exported damage", async () => {
  const exported = editorExport(1);
  const { adapted, loaded } =
    await nativeSourceFromExport(exported);

  assert.equal(
    loaded.format.id,
    adapted.battleFormat.id
  );
  assert.equal(
    loaded.format.localActorId,
    adapted.battleFormat.localActorId
  );
  assert.deepEqual(
    loaded.format.teams,
    adapted.battleFormat.teams
  );
  assert.deepEqual(
    loaded.format.actors.map((actor) => ({
      actorId: actor.actorId,
      teamId: actor.teamId,
      creatureId: actor.creatureId,
      controllerId: actor.controllerId
    })),
    adapted.battleFormat.actors.map((actor) => ({
      actorId: actor.actorId,
      teamId: actor.teamId,
      creatureId: actor.creatureId,
      controllerId: actor.controllerId
    }))
  );
  assert.deepEqual(
    loaded.skillIdsByActor["local-1"],
    ["local-strike"]
  );

  const session = createCombatSession({
    distance: "medium",
    fighters: loaded.fighters
  });

  let nowMs = 0;
  let scheduled = null;
  const resolved = [];

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now: () => nowMs,
    setTimer(callback) {
      scheduled = callback;
      return 1;
    },
    clearTimer() {},
    onResolved(result) {
      resolved.push(result);
    }
  });

  runtime.start();

  const started = runtime.startSkill({
    actorId: "local-1",
    targetId: "enemy-1",
    skill: loaded.skillsById["local-strike"]
  });

  assert.equal(started.ok, true);
  assert.equal(started.outcome, "started");
  assert.equal(
    runtime.hasActiveActionFor("local-1"),
    true
  );

  nowMs = 250;
  assert.equal(
    typeof scheduled,
    "function"
  );
  scheduled();

  assert.equal(resolved.length, 1);
  assert.equal(
    resolved[0].outcome,
    "hit"
  );
  assert.equal(
    session.snapshot().fighters["enemy-1"].hp,
    33
  );
  assert.equal(
    runtime.hasActiveActionFor("local-1"),
    false
  );

  runtime.dispose();
});

test("the same Capture export and adapter chain supports both allowed active formats", async () => {
  for (const activePerTeam of [1, 2]) {
    const exported =
      editorExport(activePerTeam);
    const { loaded } =
      await nativeSourceFromExport(
        exported
      );

    assert.equal(
      loaded.format.actors.length,
      activePerTeam * 2
    );
    assert.equal(
      loaded.fighters.length,
      activePerTeam * 2
    );
    assert.equal(
      loaded.format.localActorId,
      "local-1"
    );
    assert.deepEqual(
      loaded.skillIdsByActor["local-1"],
      ["local-strike"]
    );
  }
});
