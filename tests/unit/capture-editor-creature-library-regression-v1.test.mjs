import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../../src/contracts/capture-skill-editor-draft-v1.js";
import {
  normalizeCaptureStatRegistryV1
} from "../../src/contracts/capture-stat-registry-v1.js";
import {
  normalizeCaptureProgressionRulesV1
} from "../../src/contracts/capture-progression-rules-v1.js";
import {
  canonicalCaptureCreatureRecordsV1
} from "../../src/catalogs/capture-canonical-creature-catalog-v1.js";
import {
  importMonsterCaptureCreatureRecordV1
} from "../../src/adapters/input/capture/monster-capture-creature-import-v1.js";
import {
  importMonsterCaptureStatValuesV1
} from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";
import {
  buildCaptureCreatureHistoricalLoadoutV1
} from "../../src/catalogs/capture-creature-historical-loadout-v1.js";
import {
  capturePortableNativeSkillDraftsV1
} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  captureComplexNativeSkillDraftsV1
} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import {
  CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {
  CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  applyCaptureTransferBatchToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";

const rootUrl = new URL("../../", import.meta.url);

async function json(path) {
  return JSON.parse(
    await readFile(new URL(path, rootUrl), "utf8")
  );
}

async function text(path) {
  return readFile(new URL(path, rootUrl), "utf8");
}

test("real Human Editor startup data keeps historical creature library when authored showcase presets are applied", async () => {
  const statRegistry =
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
  const nativeCatalog =
    await json("data/combat/skills/catalog.v1.json");

  for (const entry of nativeCatalog.entries ?? []) {
    const definition =
      normalizeSkillDefinition(entry.definition);
    const draft =
      normalizeCaptureSkillEditorDraftV1({
        schema: "capture-skill-editor-draft-v1",
        id: definition.id,
        description:
          "Capacité native du laboratoire.",
        requiredLevel: 1,
        usageScopes: ["capture", "combat"],
        definition,
        presentation: null
      });
    configuredSkills.set(draft.id, draft);
  }

  for (const draft of capturePortableNativeSkillDraftsV1()) {
    if (!configuredSkills.has(draft.id)) {
      configuredSkills.set(draft.id, draft);
    }
  }
  for (const draft of captureComplexNativeSkillDraftsV1()) {
    if (!configuredSkills.has(draft.id)) {
      configuredSkills.set(draft.id, draft);
    }
  }

  const historical =
    await json(
      "data/capture/monster-capture-creatures.v1.json"
    );

  assert.equal(historical.entries.length, 110);
  assert.equal(historical.provenance.sourceCount, 110);

  const configuredCreatures = new Map();
  const runtimeSkillIds = new Set(configuredSkills.keys());

  for (
    const entry of
    canonicalCaptureCreatureRecordsV1(
      historical.entries
    )
  ) {
    const imported =
      importMonsterCaptureCreatureRecordV1(entry);
    const statValues =
      importMonsterCaptureStatValuesV1(
        entry,
        statRegistry
      );
    const loadout =
      buildCaptureCreatureHistoricalLoadoutV1({
        creatureId: imported.draft.id,
        level: imported.draft.level,
        abilityIds: imported.draft.skillIds,
        runtimeSkillIds
      }).loadout;

    configuredCreatures.set(
      imported.draft.id,
      Object.freeze({
        draft: imported.draft,
        loadout,
        statValues
      })
    );
  }

  assert.equal(configuredCreatures.size, 110);
  assert.equal(configuredCreatures.has("crea_maraileron"), true);
  assert.equal(configuredCreatures.has("crea_mossback"), true);
  assert.equal(configuredCreatures.has("crea-loup"), false);

  const transfers = [];
  for (const path of CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1) {
    transfers.push(
      importCaptureTransferJsonV1(await text(path))
    );
  }
  for (const path of CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1) {
    transfers.push(
      importCaptureTransferJsonV1(
        await text(path),
        { statRegistry }
      )
    );
  }

  applyCaptureTransferBatchToEditorStateV1({
    transfers,
    configuredCreatures,
    configuredSkills,
    statRegistry,
    progressionRules,
    mode: "replace",
    metadata: {
      producer:
        "capture-human-editor-v2-showcase-startup-regression"
    }
  });

  assert.equal(
    configuredCreatures.size,
    111,
    "Showcase replacement must preserve 110 historical creatures and add only the non-historical Loup"
  );
  assert.equal(
    configuredCreatures.get("crea_maraileron")?.draft?.displayName,
    "Maraileron"
  );
  assert.equal(
    configuredCreatures.get("crea_maraileron")?.draft?.combat?.maxHp,
    140
  );
  assert.equal(
    configuredCreatures.get("crea_mossback")?.draft?.displayName,
    "Moussados"
  );
  assert.equal(
    configuredCreatures.get("crea-loup")?.draft?.displayName,
    "Loup volcanique"
  );

  const historicalIds =
    new Set(historical.entries.map((entry) => entry.id));
  for (const id of historicalIds) {
    assert.equal(
      configuredCreatures.has(id),
      true,
      "historical creature must remain in active library: " + id
    );
  }
});
