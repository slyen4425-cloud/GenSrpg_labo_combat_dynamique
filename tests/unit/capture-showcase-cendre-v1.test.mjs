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
  importCaptureTransferJsonV1,
  planCaptureTransferImportV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  buildCaptureEditorDatabaseV1,
  applyCaptureTransferPlanToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {
  normalizeCaptureStatRegistryV1
} from "../../src/contracts/capture-stat-registry-v1.js";
import {
  normalizeCaptureProgressionRulesV1
} from "../../src/contracts/capture-progression-rules-v1.js";
import {
  capturePortableNativeSkillDraftsV1
} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  captureComplexNativeSkillDraftsV1
} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
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

test("Cendre aveuglante showcase preset preserves the latest authored V3 export", async () => {
  const transfer =
    importCaptureTransferJsonV1(
      await text(CENDRE_FILE)
    );
  const draft = transfer.value.draft;
  const [speedDebuff, physicalDebuff] =
    draft.definition.effects;

  assert.equal(
    draft.id,
    "cap_fire_special_1"
  );
  assert.equal(
    draft.definition.name,
    "Cendre aveuglante"
  );
  assert.equal(draft.requiredLevel, 10);
  assert.equal(
    draft.definition.travelMs,
    800
  );
  assert.equal(
    draft.definition.cooldownMs,
    60000
  );

  assert.deepEqual(
    draft.definition.effects.map(
      (effect) => effect.status.statId
    ),
    ["speed", "physical"]
  );
  assert.equal(
    speedDebuff.status.durationMs,
    20000
  );
  assert.equal(
    physicalDebuff.status.durationMs,
    20000
  );
  assert.equal(
    speedDebuff.status.deltaPoints,
    -50
  );
  assert.equal(
    physicalDebuff.status.deltaPoints,
    -50
  );

  assert.equal(
    draft.presentation.version,
    9
  );
  assert.equal(
    draft.presentation.visual.icon.assetId,
    "core:icon-skill-poison-cloud-01"
  );
  assert.equal(
    draft.presentation.visual.cast.assetId,
    "pack:capture:sprite-ash-smoke-cast-01"
  );
  assert.equal(
    draft.presentation.visual.cast.anchor,
    "mouth"
  );
  assert.equal(
    draft.presentation.visual.cast.offsetX,
    30
  );
  assert.equal(
    draft.presentation.visual.cast.offsetY,
    0
  );
  assert.equal(
    draft.presentation.visual.cast.offsetMode,
    "mirror_x"
  );
  assert.equal(
    draft.presentation.visual.travel.assetId,
    "pack:capture:sprite-ash-smoke-projectile-01"
  );
  assert.equal(
    draft.presentation.visual.travel.displayScale,
    1.45
  );
  assert.equal(
    draft.presentation.visual.travel.anchor,
    "mouth"
  );
  assert.equal(
    draft.presentation.visual.travel.playbackMode,
    "loop"
  );
  assert.equal(
    draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-ash-smoke-impact-01"
  );
  assert.equal(
    draft.presentation.visual.impact.displayScale,
    1.45
  );
  assert.equal(
    draft.presentation.visual.impact.durationMs,
    500
  );

  assert.equal(
    draft.presentation.audio.cast.assetId,
    "gensrpg:sound:tower-ccc16d37"
  );
  assert.equal(
    draft.presentation.audio.travel.assetId,
    "gensrpg:sound:genrpg-pack2-3e95d6c6"
  );
  assert.equal(
    draft.presentation.audio.impact.assetId,
    "gensrpg:sound:genrpg-pack2-a3d02c0f"
  );

  assert.deepEqual(
    draft.presentation.statusVisuals[
      "cap_fire_special_1:1"
    ],
    {
      mode: "sprite",
      tintColor: "#5b2067",
      tintOpacity: 0.35,
      sprite: {
        offsetY: -15,
        assetId: "pack:capture:sprite-ash-smoke-status-aura-01",
        displayScale: 1.5,
        opacity: 0.65,
        offsetMode: "same"
      }
    }
  );

  assert.deepEqual(
    draft.presentation.feedback.glow,
    {
      color: "#d4dde4",
      strength: 0.65,
      radiusPx: 22
    }
  );
  assert.equal(
    draft.presentation.feedback.projectileTrail.count,
    7
  );
  assert.equal(
    draft.presentation.feedback.aftermathSmoke.count,
    6
  );
  assert.equal(
    draft.presentation.feedback.castBurst.count,
    12
  );
});

test("latest Cendre transfer replaces the historical skill through the canonical configuredSkills owner", async () => {
  const registry =
    normalizeCaptureStatRegistryV1(
      await json(
        "data/capture/monster-capture-stat-registry.v1.json"
      )
    );
  const progressionRules =
    normalizeCaptureProgressionRulesV1(
      await json(
        "data/capture/monster-capture-progression-rules.v1.json"
      )
    );

  const configuredSkills = new Map();
  for (
    const draft of
      capturePortableNativeSkillDraftsV1()
  ) {
    configuredSkills.set(draft.id, draft);
  }
  for (
    const draft of
      captureComplexNativeSkillDraftsV1()
  ) {
    if (!configuredSkills.has(draft.id)) {
      configuredSkills.set(draft.id, draft);
    }
  }

  const historical =
    configuredSkills.get(
      "cap_fire_special_1"
    );
  assert.ok(
    historical,
    "historical Cendre must exist before showcase replacement"
  );

  const configuredCreatures = new Map();
  const transfer =
    importCaptureTransferJsonV1(
      await text(CENDRE_FILE)
    );
  const beforeSize = configuredSkills.size;
  const currentDatabase =
    buildCaptureEditorDatabaseV1({
      statRegistry: registry,
      progressionRules,
      configuredCreatures,
      configuredSkills,
      metadata: {
        producer:
          "capture-showcase-cendre-author-v2-test"
      }
    });
  const plan =
    planCaptureTransferImportV1({
      currentDatabase,
      transfer,
      mode: "replace"
    });

  assert.equal(
    plan.action,
    "replace-skill"
  );
  assert.equal(
    plan.id,
    "cap_fire_special_1"
  );

  applyCaptureTransferPlanToEditorStateV1({
    plan,
    configuredCreatures,
    configuredSkills,
    statRegistry: registry,
    progressionRules
  });

  assert.equal(
    configuredSkills.size,
    beforeSize,
    "replacement must not duplicate Cendre"
  );

  const active =
    configuredSkills.get(
      "cap_fire_special_1"
    );
  assert.equal(
    active.definition.travelMs,
    800
  );
  assert.equal(
    active.definition.cooldownMs,
    60000
  );
  assert.equal(
    active.presentation.visual.travel.assetId,
    "pack:capture:sprite-ash-smoke-projectile-01"
  );
  assert.equal(
    active.presentation.visual.impact.assetId,
    "pack:capture:sprite-ash-smoke-impact-01"
  );
  assert.equal(
    active.presentation.audio.cast.assetId,
    "gensrpg:sound:academie-01fc18a6"
  );
  assert.equal(
    active.presentation.audio.impact.assetId,
    "gensrpg:sound:genrpg-pack2-a3d02c0f"
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
