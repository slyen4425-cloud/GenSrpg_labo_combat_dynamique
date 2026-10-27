import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  exportCaptureSkillTransferJsonV1,
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

const PRESET =
  "data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

const registry = normalizeCaptureStatRegistryV1(
  JSON.parse(
    await text("data/capture/monster-capture-stat-registry.v1.json")
  )
);
const progressionRules =
  normalizeCaptureProgressionRulesV1(
    JSON.parse(
      await text("data/capture/monster-capture-progression-rules.v1.json")
    )
  );

function configuredSkillMap() {
  const map = new Map();
  for (const draft of capturePortableNativeSkillDraftsV1()) {
    map.set(draft.id, draft);
  }
  for (const draft of captureComplexNativeSkillDraftsV1()) {
    if (!map.has(draft.id)) {
      map.set(draft.id, draft);
    }
  }
  return map;
}

test("Goutte vive author export is preserved exactly through Capture Transfer", async () => {
  const transfer =
    importCaptureTransferJsonV1(await text(PRESET));

  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;

  assert.equal(draft.id, "cap_water_atk_1");
  assert.equal(draft.definition.name, "Goutte vive");
  assert.equal(draft.requiredLevel, 1);
  assert.equal(draft.definition.form, "projectile");
  assert.equal(draft.definition.element, "water");
  assert.equal(draft.definition.energyCost, 3);
  assert.equal(draft.definition.preparationMs, 800);
  assert.equal(draft.definition.travelMs, 800);
  assert.equal(draft.definition.recoveryMs, 200);
  assert.equal(draft.definition.cooldownMs, 15000);
  assert.equal(draft.definition.dodgeable, true);
  assert.deepEqual(draft.definition.effects, [
    {
      kind: "damage",
      targetScope: "target",
      amount: 10,
      channel: "water"
    }
  ]);

  assert.equal(
    draft.presentation.visual.cast.assetId,
    "pack:capture:sprite-cast-water-01"
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
    draft.presentation.visual.travel.assetId,
    "pack:capture:sprite-projectile-water-01"
  );
  assert.equal(
    draft.presentation.visual.travel.displayScale,
    1.7
  );
  assert.equal(
    draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-impact-water-01"
  );
  assert.equal(
    draft.presentation.visual.impact.durationMs,
    650
  );
  assert.deepEqual(
    draft.presentation.audio.cast,
    {
      assetId: "gensrpg:sound:xel-cbc6cf88",
      volume: 1,
      loop: false
    }
  );
  assert.deepEqual(
    draft.presentation.audio.travel,
    {
      assetId: "gensrpg:sound:xel-48520d94",
      volume: 1,
      loop: true
    }
  );

  const roundTrip =
    importCaptureTransferJsonV1(
      exportCaptureSkillTransferJsonV1(draft)
    );
  assert.deepEqual(roundTrip.value, transfer.value);
});

test("Goutte vive replaces its stable skill id through the canonical planner", async () => {
  const configuredSkills =
    configuredSkillMap();
  const configuredCreatures = new Map();

  const beforeCount = configuredSkills.size;
  const historical =
    configuredSkills.get("cap_water_atk_1");
  assert.ok(historical);

  const transfer =
    importCaptureTransferJsonV1(await text(PRESET));

  const currentDatabase =
    buildCaptureEditorDatabaseV1({
      statRegistry: registry,
      progressionRules,
      configuredCreatures,
      configuredSkills,
      metadata: {
        producer: "water-atk1-author-export-test"
      }
    });

  const plan =
    planCaptureTransferImportV1({
      currentDatabase,
      transfer,
      mode: "replace"
    });

  assert.equal(plan.action, "replace-skill");

  applyCaptureTransferPlanToEditorStateV1({
    plan,
    configuredCreatures,
    configuredSkills,
    statRegistry: registry,
    progressionRules
  });

  assert.equal(configuredSkills.size, beforeCount);
  assert.equal(
    configuredSkills.get("cap_water_atk_1").definition.name,
    "Goutte vive"
  );
  assert.equal(
    configuredSkills.get("cap_water_atk_1").definition.cooldownMs,
    15000
  );
});

test("showcase skill catalog declares Goutte vive exactly once", async () => {
  const catalog =
    await text(
      "src/catalogs/capture-showcase-skill-presets-v1.js"
    );

  assert.equal(
    (
      catalog.match(
        /cap_water_atk_1\.capture-skill-transfer-v1\.json/g
      ) ?? []
    ).length,
    1
  );
});
