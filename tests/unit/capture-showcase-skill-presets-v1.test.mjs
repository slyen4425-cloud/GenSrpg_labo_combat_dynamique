import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
  createCombatSession
} from "../../src/core/combat/combat-session.js";

const PRESET_FILE =
  "data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json";
const CATALOG_FILE =
  "src/catalogs/capture-showcase-skill-presets-v1.js";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

test("Tempete de flammes showcase transfer preserves the editor export with one combat use", async () => {
  const transfer = importCaptureTransferJsonV1(
    await text(PRESET_FILE)
  );

  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;

  assert.equal(draft.id, "cap_fire_atk_6");
  assert.equal(draft.requiredLevel, 20);
  assert.equal(draft.definition.name, "Tempête de flammes");
  assert.equal(draft.definition.loadoutSlot, "ultimate");
  assert.equal(draft.definition.element, "fire");
  assert.equal(draft.definition.energyCost, 5);
  assert.equal(draft.definition.preparationMs, 2000);
  assert.equal(draft.definition.cooldownMs, 3500);
  assert.equal(draft.definition.maxUsesPerCombat, 1);

  const zone = draft.definition.effects[0];
  assert.equal(zone.kind, "persistent_zone");
  assert.equal(zone.radius, "short");
  assert.equal(zone.durationMs, 7000);
  assert.equal(zone.tickIntervalMs, 1000);
  assert.equal(zone.reactivation, "reinforce");
  assert.equal(zone.maxActivations, 3);
  assert.equal(zone.radiusGrowthSteps, 1);
  assert.equal(zone.tickEffect.amount, 5);

  assert.equal(
    draft.presentation.visual.icon.assetId,
    "core:icon-skill-fire-breath-01"
  );
  assert.equal(
    draft.presentation.visual.aura.assetId,
    "pack:capture:sprite-fire-zone-loop-01"
  );
  assert.equal(draft.presentation.visual.aura.displayScale, 3.5);
  assert.equal(draft.presentation.visual.aura.displayScaleX, 2.3);
  assert.equal(draft.presentation.visual.aura.displayScaleY, 1);
  assert.equal(draft.presentation.visual.aura.offsetX, 0);
  assert.equal(draft.presentation.visual.aura.offsetY, -50);
  assert.equal(
    draft.presentation.audio.cast.assetId,
    "gensrpg:sound:effect-135ee2ed"
  );
});

test("showcase skill catalog declares the Tempete de flammes transfer once", async () => {
  const source = await text(CATALOG_FILE);

  assert.match(
    source,
    /CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1/
  );
  assert.equal(
    (
      source.match(
        /cap_fire_atk_6\.capture-skill-transfer-v1\.json/g
      ) ?? []
    ).length,
    1
  );
});

test("showcase transfer replaces historical cap_fire_atk_6 through the canonical Transfer owner", async () => {
  const registry = normalizeCaptureStatRegistryV1(
    JSON.parse(
      await text(
        "data/capture/monster-capture-stat-registry.v1.json"
      )
    )
  );
  const progressionRules =
    normalizeCaptureProgressionRulesV1(
      JSON.parse(
        await text(
          "data/capture/monster-capture-progression-rules.v1.json"
        )
      )
    );

  const configuredSkills = new Map();

  for (const draft of capturePortableNativeSkillDraftsV1()) {
    configuredSkills.set(draft.id, draft);
  }
  for (const draft of captureComplexNativeSkillDraftsV1()) {
    if (!configuredSkills.has(draft.id)) {
      configuredSkills.set(draft.id, draft);
    }
  }

  const historical = configuredSkills.get("cap_fire_atk_6");
  assert.ok(historical, "historical skill must exist before replacement");
  assert.notEqual(historical.requiredLevel, 20);

  const configuredCreatures = new Map();
  const transfer = importCaptureTransferJsonV1(
    await text(PRESET_FILE)
  );
  const beforeSize = configuredSkills.size;
  const currentDatabase = buildCaptureEditorDatabaseV1({
    statRegistry: registry,
    progressionRules,
    configuredCreatures,
    configuredSkills,
    metadata: { producer: "showcase-skill-test" }
  });
  const plan = planCaptureTransferImportV1({
    currentDatabase,
    transfer,
    mode: "replace"
  });

  assert.equal(plan.action, "replace-skill");
  assert.equal(plan.id, "cap_fire_atk_6");

  applyCaptureTransferPlanToEditorStateV1({
    plan,
    configuredCreatures,
    configuredSkills,
    statRegistry: registry,
    progressionRules
  });

  assert.equal(configuredSkills.size, beforeSize);
  assert.equal(
    configuredSkills.get("cap_fire_atk_6").requiredLevel,
    20
  );
  assert.equal(
    configuredSkills
      .get("cap_fire_atk_6")
      .definition.maxUsesPerCombat,
    1
  );
});

test("Human Editor hydrates showcase skill transfers before showcase creature transfers", async () => {
  const source = await text(
    "src/ui/capture-editor-human-v2.js"
  );

  assert.match(
    source,
    /CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1/
  );
  assert.match(
    source,
    /hydrateCaptureShowcaseSkillPresetsV1/
  );

  const skillAwait = source.indexOf(
    "await hydrateCaptureShowcaseSkillPresetsV1"
  );
  const creatureAwait = source.indexOf(
    "await hydrateCaptureShowcaseCreaturePresetsV1"
  );

  assert.ok(skillAwait >= 0);
  assert.ok(creatureAwait > skillAwait);
  assert.match(
    source,
    /applyCaptureTransferBatchToEditorStateV1/
  );
});


test("Tempete de flammes real Combat path enforces one use for the imported definition", async () => {
  const transfer = importCaptureTransferJsonV1(
    await text(PRESET_FILE)
  );
  const skill = transfer.value.draft.definition;

  const fighter = (id) => ({
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: 20,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1,
    chargeTimeModifierPct: 0
  });

  const session = createCombatSession({
    distance: "short",
    fighters: [
      fighter("player"),
      fighter("opponent")
    ]
  });

  session.advanceMs(25000);

  const first = session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });

  assert.equal(first.ok, true);
  assert.equal(
    session.snapshot().fighters.player.skillUseCounts[
      "cap_fire_atk_6"
    ],
    1
  );

  session.advanceMs(3500);

  const second = session.startSkill({
    actorId: "player",
    targetId: "opponent",
    skill
  });

  assert.equal(second.ok, false);
  assert.equal(second.outcome, "usage_limit");
  assert.equal(second.maxUsesPerCombat, 1);
});
