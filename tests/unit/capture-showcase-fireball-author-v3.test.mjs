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

const FIREBALL_FILE =
  "data/capture/showcase/fireball.capture-skill-transfer-v1.json";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

async function json(relative) {
  return JSON.parse(await text(relative));
}

test("Fireball showcase preserves Sylvain author export V3 exactly on important authored values", async () => {
  const transfer = importCaptureTransferJsonV1(
    await text(FIREBALL_FILE)
  );
  const draft = transfer.value.draft;

  assert.equal(draft.id, "fireball");
  assert.equal(draft.requiredLevel, 5);
  assert.equal(draft.definition.energyCost, 6);
  assert.equal(draft.definition.preparationMs, 2500);
  assert.equal(draft.definition.travelMs, 1300);
  assert.equal(draft.definition.recoveryMs, 400);
  assert.equal(draft.definition.cooldownMs, 20000);
  assert.deepEqual(
    draft.definition.targetLocations,
    ["active"]
  );
  assert.equal(draft.definition.hitPresenceStates, null);
  assert.equal(draft.definition.dodgeable, true);
  assert.equal(draft.definition.effects[0].amount, 25);
  assert.equal(draft.definition.effects[0].channel, "fire");

  assert.equal(draft.presentation.version, 8);
  assert.equal(
    draft.presentation.visual.cast.assetId,
    "pack:capture:sprite-fireball-2-cast-01"
  );
  assert.equal(
    draft.presentation.visual.cast.displayScale,
    1.6
  );
  assert.equal(
    draft.presentation.visual.cast.offsetY,
    30
  );
  assert.equal(
    draft.presentation.visual.travel.assetId,
    "pack:capture:sprite-fireball-travel-01"
  );
  assert.equal(
    draft.presentation.visual.travel.displayScale,
    2.5
  );
  assert.equal(
    draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-fireball-2-impact-01"
  );
  assert.equal(
    draft.presentation.visual.impact.displayScale,
    1.7
  );

  assert.equal(
    draft.presentation.audio.cast.assetId,
    "gensrpg:sound:effect-135ee2ed"
  );
  assert.equal(
    draft.presentation.audio.travel.assetId,
    "gensrpg:sound:genrpg-pack2-a30f1071"
  );
  assert.equal(
    draft.presentation.audio.impact.assetId,
    "gensrpg:sound:genrpg-pack2-a3d02c0f"
  );
  assert.equal(draft.presentation.audio.travel.loop, true);

  assert.deepEqual(draft.presentation.feedback.glow, {
    color: "#ff6a1f",
    strength: 0.85,
    radiusPx: 32
  });
  assert.equal(
    draft.presentation.feedback.aftermathSmoke.count,
    6
  );
});

test("Fireball author export replaces the existing configured skill through the canonical import plan", async () => {
  const registry = normalizeCaptureStatRegistryV1(
    await json("data/capture/monster-capture-stat-registry.v1.json")
  );
  const progressionRules = normalizeCaptureProgressionRulesV1(
    await json("data/capture/monster-capture-progression-rules.v1.json")
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

  assert.ok(
    configuredSkills.has("fireball"),
    "historical/native Fireball must exist before replacement"
  );

  const configuredCreatures = new Map();
  const transfer = importCaptureTransferJsonV1(
    await text(FIREBALL_FILE)
  );
  const beforeSize = configuredSkills.size;

  const currentDatabase = buildCaptureEditorDatabaseV1({
    statRegistry: registry,
    progressionRules,
    configuredCreatures,
    configuredSkills,
    metadata: {
      producer: "capture-showcase-fireball-author-v3-test"
    }
  });

  const plan = planCaptureTransferImportV1({
    currentDatabase,
    transfer,
    mode: "replace"
  });

  assert.equal(plan.action, "replace-skill");
  assert.equal(plan.id, "fireball");

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
    "Fireball replacement must not create a duplicate"
  );

  const active = configuredSkills.get("fireball");
  assert.equal(
    active.presentation.visual.cast.assetId,
    "pack:capture:sprite-fireball-2-cast-01"
  );
  assert.equal(active.presentation.visual.cast.offsetY, 30);
  assert.equal(active.presentation.visual.travel.displayScale, 2.5);
  assert.equal(
    active.presentation.visual.impact.assetId,
    "pack:capture:sprite-fireball-2-impact-01"
  );
});
