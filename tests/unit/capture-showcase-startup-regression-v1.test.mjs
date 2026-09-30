import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureStatRegistryV1
} from "../../src/contracts/capture-stat-registry-v1.js";
import {
  normalizeCaptureProgressionRulesV1
} from "../../src/contracts/capture-progression-rules-v1.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../../src/contracts/capture-skill-editor-draft-v1.js";
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
  CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {
  importCaptureTransferJsonV1,
  planCaptureTransferImportV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  buildCaptureEditorDatabaseV1,
  applyCaptureTransferPlanToEditorStateV1,
  applyCaptureTransferBatchToEditorStateV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";

async function json(relative) {
  return JSON.parse(
    await readFile(
      new URL("../../" + relative, import.meta.url),
      "utf8"
    )
  );
}

test("startup library remains complete while showcase presets are applied through the canonical Transfer pipeline", async () => {
  const registry = normalizeCaptureStatRegistryV1(
    await json("data/capture/monster-capture-stat-registry.v1.json")
  );
  const progressionRules = normalizeCaptureProgressionRulesV1(
    await json("data/capture/monster-capture-progression-rules.v1.json")
  );
  const monsterCatalog = await json(
    "data/capture/monster-capture-creatures.v1.json"
  );
  const nativeCatalog = await json(
    "data/combat/skills/catalog.v1.json"
  );

  const configuredSkills = new Map();

  for (const entry of nativeCatalog.entries) {
    const definition = normalizeSkillDefinition(
      entry.definition
    );
    const draft = normalizeCaptureSkillEditorDraftV1({
      schema: "capture-skill-editor-draft-v1",
      id: definition.id,
      description: "Capacité native du laboratoire.",
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

  const runtimeSkillIds = new Set(configuredSkills.keys());
  const configuredCreatures = new Map();

  for (
    const source of canonicalCaptureCreatureRecordsV1(
      monsterCatalog.entries
    )
  ) {
    const imported = importMonsterCaptureCreatureRecordV1(
      source
    );
    const historicalLoadout =
      buildCaptureCreatureHistoricalLoadoutV1({
        creatureId: imported.draft.id,
        level: imported.draft.level,
        abilityIds: imported.draft.skillIds,
        runtimeSkillIds
      });

    configuredCreatures.set(
      imported.draft.id,
      Object.freeze({
        draft: imported.draft,
        loadout: historicalLoadout.loadout,
        statValues: importMonsterCaptureStatValuesV1(
          source,
          registry
        )
      })
    );
  }

  assert.equal(
    configuredCreatures.size,
    102,
    "canonical startup roster must be available before presets"
  );

  for (const file of CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1) {
    const transfer = importCaptureTransferJsonV1(
      await readFile(
        new URL("../../" + file, import.meta.url),
        "utf8"
      ),
      { statRegistry: registry }
    );

    const currentDatabase = buildCaptureEditorDatabaseV1({
      statRegistry: registry,
      progressionRules,
      configuredCreatures,
      configuredSkills,
      metadata: { producer: "startup-regression-test" }
    });

    const plan = planCaptureTransferImportV1({
      currentDatabase,
      transfer,
      mode: "replace"
    });

    applyCaptureTransferPlanToEditorStateV1({
      plan,
      configuredCreatures,
      configuredSkills,
      statRegistry: registry,
      progressionRules
    });
  }

  assert.equal(
    configuredCreatures.size,
    103,
    "Moussados must replace its historical record and Loup must insert without deleting the roster"
  );
  assert.ok(configuredCreatures.has("crea_mossback"));
  assert.ok(configuredCreatures.has("crea-loup"));

  assert.equal(
    buildCaptureEditorDatabaseV1({
      statRegistry: registry,
      progressionRules,
      configuredCreatures,
      configuredSkills,
      metadata: { producer: "startup-regression-test" }
    }).creatures.length,
    103
  );
});


test("showcase preset batch is atomic and preserves the stable roster when one preset fails", async () => {
  const registry = normalizeCaptureStatRegistryV1(
    await json("data/capture/monster-capture-stat-registry.v1.json")
  );
  const progressionRules = normalizeCaptureProgressionRulesV1(
    await json("data/capture/monster-capture-progression-rules.v1.json")
  );
  const monsterCatalog = await json(
    "data/capture/monster-capture-creatures.v1.json"
  );
  const nativeCatalog = await json(
    "data/combat/skills/catalog.v1.json"
  );

  const configuredSkills = new Map();
  for (const entry of nativeCatalog.entries) {
    const definition = normalizeSkillDefinition(entry.definition);
    const draft = normalizeCaptureSkillEditorDraftV1({
      schema: "capture-skill-editor-draft-v1",
      id: definition.id,
      description: "Capacité native du laboratoire.",
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

  const runtimeSkillIds = new Set(configuredSkills.keys());
  const configuredCreatures = new Map();

  for (
    const source of canonicalCaptureCreatureRecordsV1(
      monsterCatalog.entries
    )
  ) {
    const imported = importMonsterCaptureCreatureRecordV1(source);
    const historicalLoadout =
      buildCaptureCreatureHistoricalLoadoutV1({
        creatureId: imported.draft.id,
        level: imported.draft.level,
        abilityIds: imported.draft.skillIds,
        runtimeSkillIds
      });

    configuredCreatures.set(
      imported.draft.id,
      Object.freeze({
        draft: imported.draft,
        loadout: historicalLoadout.loadout,
        statValues: importMonsterCaptureStatValuesV1(
          source,
          registry
        )
      })
    );
  }

  const baselineIds = [...configuredCreatures.keys()];
  const goodTransfer = importCaptureTransferJsonV1(
    await readFile(
      new URL(
        "../../" +
          CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1[0],
        import.meta.url
      ),
      "utf8"
    ),
    { statRegistry: registry }
  );

  const badTransfer = Object.freeze({
    kind: "creature",
    value: Object.freeze({
      ...goodTransfer.value,
      draft: Object.freeze({
        ...goodTransfer.value.draft,
        id: "crea-bad-showcase",
        skillIds: ["skill-does-not-exist"]
      }),
      statValues: Object.freeze({
        ...goodTransfer.value.statValues,
        creatureId: "crea-bad-showcase"
      }),
      loadout: Object.freeze({
        ...goodTransfer.value.loadout,
        creatureId: "crea-bad-showcase"
      })
    })
  });

  assert.throws(
    () =>
      applyCaptureTransferBatchToEditorStateV1({
        transfers: [goodTransfer, badTransfer],
        configuredCreatures,
        configuredSkills,
        statRegistry: registry,
        progressionRules,
        mode: "replace",
        metadata: {
          producer: "startup-regression-test"
        }
      }),
    /unknown skill|skill-does-not-exist/i
  );

  assert.deepEqual(
    [...configuredCreatures.keys()],
    baselineIds,
    "failed preset batch must not mutate the stable roster"
  );
  assert.equal(
    configuredCreatures.has("crea-bad-showcase"),
    false
  );
});
