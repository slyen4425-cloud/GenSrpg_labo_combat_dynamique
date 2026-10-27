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

const FILE =
  "../../data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json";

async function transfer() {
  return importCaptureTransferJsonV1(
    await readFile(new URL(FILE, import.meta.url), "utf8")
  );
}

test("Cendre V3 showcase preserves the complete latest author presentation", async () => {
  const draft = (await transfer()).value.draft;

  assert.equal(draft.id, "cap_fire_special_1");
  assert.equal(draft.presentation.version, 9);
  assert.deepEqual(draft.definition.targetLocations, ["active"]);
  assert.equal(draft.definition.hitPresenceStates, null);
  assert.equal(draft.definition.dodgeable, true);

  assert.deepEqual(
    {
      assetId: draft.presentation.visual.cast.assetId,
      anchor: draft.presentation.visual.cast.anchor,
      offsetX: draft.presentation.visual.cast.offsetX,
      offsetY: draft.presentation.visual.cast.offsetY,
      offsetMode: draft.presentation.visual.cast.offsetMode,
      scale: draft.presentation.visual.cast.displayScale
    },
    {
      assetId: "pack:capture:sprite-ash-smoke-cast-01",
      anchor: "mouth",
      offsetX: 30,
      offsetY: 0,
      offsetMode: "mirror_x",
      scale: 0.7
    }
  );

  assert.equal(
    draft.presentation.visual.travel.assetId,
    "pack:capture:sprite-ash-smoke-projectile-01"
  );
  assert.equal(
    draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-ash-smoke-impact-01"
  );
  assert.equal(
    draft.presentation.visual.impact.durationMs,
    500
  );
  assert.equal(
    draft.presentation.statusVisuals["cap_fire_special_1:1"].mode,
    "sprite"
  );
  assert.deepEqual(
    draft.presentation.statusVisuals["cap_fire_special_1:1"].sprite,
    {
      offsetY: -15,
      assetId: "pack:capture:sprite-ash-smoke-status-aura-01",
      displayScale: 1.5,
      opacity: 0.65,
      offsetMode: "same"
    }
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
  assert.equal(draft.presentation.feedback.glow.color, "#d4dde4");
  assert.equal(draft.presentation.feedback.castBurst.color, "#d4dde4");
});

test("Cendre V3 replaces the historical skill atomically through configuredSkills", async () => {
  const registry = normalizeCaptureStatRegistryV1(
    JSON.parse(await readFile(
      new URL("../../data/capture/monster-capture-stat-registry.v1.json", import.meta.url),
      "utf8"
    ))
  );
  const progressionRules = normalizeCaptureProgressionRulesV1(
    JSON.parse(await readFile(
      new URL("../../data/capture/monster-capture-progression-rules.v1.json", import.meta.url),
      "utf8"
    ))
  );

  const configuredSkills = new Map();
  for (const draft of capturePortableNativeSkillDraftsV1()) {
    configuredSkills.set(draft.id, draft);
  }
  for (const draft of captureComplexNativeSkillDraftsV1()) {
    if (!configuredSkills.has(draft.id)) configuredSkills.set(draft.id, draft);
  }

  const configuredCreatures = new Map();
  const beforeSize = configuredSkills.size;
  const currentDatabase = buildCaptureEditorDatabaseV1({
    statRegistry: registry,
    progressionRules,
    configuredCreatures,
    configuredSkills,
    metadata: { producer: "cendre-author-v3-test" }
  });
  const imported = await transfer();
  const plan = planCaptureTransferImportV1({
    currentDatabase,
    transfer: imported,
    mode: "replace"
  });

  assert.equal(plan.action, "replace-skill");
  assert.equal(plan.id, "cap_fire_special_1");

  applyCaptureTransferPlanToEditorStateV1({
    plan,
    configuredCreatures,
    configuredSkills,
    statRegistry: registry,
    progressionRules
  });

  assert.equal(configuredSkills.size, beforeSize);
  const active = configuredSkills.get("cap_fire_special_1");
  assert.equal(active.presentation.version, 9);
  assert.equal(active.presentation.visual.cast.anchor, "mouth");
  assert.equal(active.presentation.visual.cast.offsetX, 30);
  assert.equal(
    active.presentation.visual.travel.assetId,
    "pack:capture:sprite-ash-smoke-projectile-01"
  );
});
