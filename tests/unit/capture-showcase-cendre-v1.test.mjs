import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  exportCaptureEditorDraftsToCombatExportV3
} from "../../src/adapters/input/capture/capture-editor-exporter-v3.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const CENDRE_FILE =
  "data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json";
const FIREBALL_FILE =
  "data/capture/showcase/fireball.capture-skill-transfer-v1.json";
const LOUP_FILE =
  "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

function creature(id, skillIds = []) {
  return {
    schema: "capture-creature-editor-draft-v3",
    id,
    displayName: id,
    description: id,
    level: 20,
    sourceStats: {
      force: 0,
      agility: 0,
      intelligence: 0,
      spirit: 0,
      endurance: 0,
      initiative: 0
    },
    elements: ["fire"],
    resistances: [],
    capture: {
      capturable: true,
      captureRate: 30,
      spawnChance: 10,
      spawnTags: ["fire"],
      evolution: null
    },
    combat: {
      maxHp: 100,
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

function loadout(creatureId, skillId = null) {
  return {
    schema: "capture-active-skill-loadout-v1",
    creatureId,
    slots: [
      { id: "slot-1", skillId },
      { id: "slot-2", skillId: null },
      { id: "slot-3", skillId: null },
      { id: "slot-4", skillId: null },
      { id: "slot-ultimate", skillId: null }
    ]
  };
}

function battleSetup() {
  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "cendre-preview",
    localActorId: "local-1",
    teams: [
      {
        id: "local-team",
        slots: [
          {
            actorId: "local-1",
            creatureId: "source",
            displayName: "Source",
            controllerId: "human-local",
            roster: null
          }
        ]
      },
      {
        id: "enemy-team",
        slots: [
          {
            actorId: "enemy-1",
            creatureId: "target",
            displayName: "Target",
            controllerId: "ai-enemy",
            roster: null
          }
        ]
      }
    ]
  };
}

test("V3 export gives every exported creature registry rules and neutral stat values", async () => {
  const registry = await json(
    "data/capture/monster-capture-stat-registry.v1.json"
  );
  const cendreTransfer =
    importCaptureTransferJsonV1(
      await text(CENDRE_FILE)
    );

  const exported =
    exportCaptureEditorDraftsToCombatExportV3({
      battleSetup: battleSetup(),
      creatureDrafts: [
        creature("source", [
          "cap_fire_special_1"
        ]),
        creature("target")
      ],
      skillDrafts: [
        cendreTransfer.value.draft
      ],
      loadouts: [
        loadout(
          "source",
          "cap_fire_special_1"
        ),
        loadout("target")
      ],
      statRegistry: registry,
      statValues: [
        {
          schema:
            "capture-creature-stat-values-v1",
          creatureId: "source",
          values: {
            health: 100,
            speed: 5,
            physical: 5
          }
        }
      ],
      metadata: {
        producer:
          "capture-showcase-cendre-v1-test"
      }
    });

  const target =
    exported.creatures.find(
      (entry) => entry.id === "target"
    );

  assert.ok(target);
  assert.ok(
    target.combat.statEffectRulesById.speed
  );
  assert.ok(
    target.combat.statEffectRulesById.physical
  );
  assert.equal(
    target.combat.statValuesById.speed,
    0
  );
  assert.equal(
    target.combat.statValuesById.physical,
    0
  );

  const adapted =
    adaptCaptureCombatExportStackV1(
      exported
    );
  const session = createCombatSession({
    distance: "medium",
    fighters: adapted.fighters,
    battleFormat: adapted.battleFormat
  });

  const preview = session.previewSkill({
    actorId: "local-1",
    targetId: "enemy-1",
    skill:
      adapted.skills[
        "cap_fire_special_1"
      ]
  });

  assert.equal(
    preview.ok,
    true,
    "Cendre aveuglante must not be greyed because the target omitted custom statValues"
  );
});

test("Cendre aveuglante showcase preset preserves the user export", async () => {
  const transfer =
    importCaptureTransferJsonV1(
      await text(CENDRE_FILE)
    );
  const draft = transfer.value.draft;

  assert.equal(
    draft.id,
    "cap_fire_special_1"
  );
  assert.equal(
    draft.definition.name,
    "Cendre aveuglante"
  );
  assert.equal(draft.requiredLevel, 10);
  assert.deepEqual(
    draft.definition.effects.map(
      (effect) => effect.status.statId
    ),
    ["speed", "physical"]
  );
});

test("Loup showcase preset keeps the requested level and loadout", async () => {
  const transfer =
    importCaptureTransferJsonV1(
      await text(LOUP_FILE),
      {
        statRegistry:
          await json(
            "data/capture/monster-capture-stat-registry.v1.json"
          )
      }
    );

  assert.equal(
    transfer.value.draft.level,
    20
  );
  assert.deepEqual(
    transfer.value.loadout.slots.map(
      (slot) => slot.skillId
    ),
    [
      "claw",
      "fireball",
      "cap_fire_special_1",
      "lib_flame_bite",
      "cap_fire_atk_6"
    ]
  );
});

test("showcase skill presets declare Cendre and the edited Fireball exactly once", async () => {
  assert.equal(
    CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(
      (path) => path === CENDRE_FILE
    ).length,
    1
  );
  assert.equal(
    CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(
      (path) => path === FIREBALL_FILE
    ).length,
    1
  );

  const fireball =
    importCaptureTransferJsonV1(
      await text(FIREBALL_FILE)
    ).value.draft;

  assert.equal(fireball.id, "fireball");
  assert.equal(fireball.requiredLevel, 5);
  assert.equal(
    fireball.definition.energyCost,
    6
  );
  assert.equal(
    fireball.definition.effects[0].amount,
    25
  );
});
