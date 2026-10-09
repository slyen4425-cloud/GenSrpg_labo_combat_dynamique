import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  exportCaptureCreatureTransferJsonV1,
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

const SKILL_PRESET =
  "data/capture/showcase/cap_water_atk_2.capture-skill-transfer-v1.json";
const CREATURE_PRESET =
  "data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json";

async function text(relative) {
  return readFile(
    new URL("../../" + relative, import.meta.url),
    "utf8"
  );
}

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

test("Morsure de maree author export is preserved exactly through Capture Transfer", async () => {
  const raw = await text(SKILL_PRESET);
  const transfer = importCaptureTransferJsonV1(raw);

  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;

  assert.equal(draft.id, "cap_water_atk_2");
  assert.equal(draft.definition.name, "Morsure de marée");
  assert.equal(draft.requiredLevel, 5);
  assert.equal(draft.definition.form, "contact");
  assert.equal(draft.definition.approachMode, "burrow");
  assert.equal(draft.definition.energyCost, 5);
  assert.equal(draft.definition.preparationMs, 2000);
  assert.equal(draft.definition.travelMs, 650);
  assert.equal(draft.definition.recoveryMs, 300);
  assert.equal(draft.definition.cooldownMs, 20000);
  assert.deepEqual(
    draft.definition.hitPresenceStates,
    ["surface", "underground"]
  );
  assert.equal(draft.definition.dodgeable, true);
  assert.deepEqual(
    draft.definition.effects,
    [
      {
        kind: "damage",
        targetScope: "target",
        amount: 20,
        channel: "water"
      },
      {
        kind: "energy_drain",
        targetScope: "target",
        amount: 3
      }
    ]
  );
  assert.equal(draft.presentation.version, 9);
  assert.equal(
    draft.presentation.visual.icon.assetId,
    "pack:capture:icon-skill-marine-bite-01"
  );
  assert.equal(
    draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-impact-physical-01"
  );
  assert.equal(
    draft.presentation.visual.impact.displayScale,
    2
  );

  const roundTrip = importCaptureTransferJsonV1(
    exportCaptureSkillTransferJsonV1(draft)
  );
  assert.deepEqual(roundTrip.value, transfer.value);
});

test("Maraileron author export preserves authored creature stats presentation sockets and loadout", async () => {
  const raw = await text(CREATURE_PRESET);
  const transfer = importCaptureTransferJsonV1(
    raw,
    { statRegistry: registry }
  );

  assert.equal(transfer.kind, "creature");
  const record = transfer.value;

  assert.equal(record.draft.id, "crea_maraileron");
  assert.equal(record.draft.displayName, "Maraileron");
  assert.equal(record.draft.level, 1);
  assert.deepEqual(record.draft.elements, ["water"]);
  assert.equal(record.draft.combat.maxHp, 140);
  assert.equal(
    record.draft.combat.approachTimeModifierPct,
    -20
  );
  assert.equal(record.draft.presentation.profileId, "serpentine");
  assert.equal(record.draft.presentation.displayScale, 1.18);
  assert.equal(
    record.draft.presentation.viewOverrides.player.displayScale,
    1.5
  );
  assert.equal(
    record.draft.presentation.viewOverrides.opponent.displayScale,
    0.92
  );
  assert.deepEqual(
    record.draft.presentation.sockets.find(
      (socket) => socket.id === "mouth"
    ),
    {
      id: "mouth",
      label: "Bouche",
      front: { x: 0.22, y: 0.47 },
      back: { x: 0.76, y: 0.39 }
    }
  );
  assert.equal(
    record.draft.resistances.find(
      (entry) => entry.kind === "element:electric"
    )?.value,
    -50
  );
  assert.equal(record.statValues.values.health, 140);
  assert.equal(record.statValues.values.speed, 15);
  assert.equal(record.statValues.values.defense, 5);
  assert.equal(record.statValues.values.water, 15);
  assert.deepEqual(
    record.loadout.slots.map((slot) => slot.skillId),
    [
      "cap_water_atk_1",
      "cap_water_atk_2",
      "cap_water_atk_3",
      "cap_water_atk_4",
      null
    ]
  );

  const roundTrip = importCaptureTransferJsonV1(
    exportCaptureCreatureTransferJsonV1(
      record,
      { statRegistry: registry }
    ),
    { statRegistry: registry }
  );
  assert.deepEqual(roundTrip.value, transfer.value);
});

test("author transfers replace stable ids through the canonical planner without changing collection sizes", async () => {
  const configuredSkills = configuredSkillMap();
  const configuredCreatures = new Map();

  const skillTransfer = importCaptureTransferJsonV1(
    await text(SKILL_PRESET)
  );
  const historicalSkill =
    configuredSkills.get("cap_water_atk_2");
  assert.ok(historicalSkill);
  assert.notEqual(
    historicalSkill.definition.energyCost,
    5
  );

  const beforeSkillCount = configuredSkills.size;
  let currentDatabase = buildCaptureEditorDatabaseV1({
    statRegistry: registry,
    progressionRules,
    configuredCreatures,
    configuredSkills,
    metadata: { producer: "maraileron-author-export-test" }
  });
  const skillPlan = planCaptureTransferImportV1({
    currentDatabase,
    transfer: skillTransfer,
    mode: "replace"
  });
  assert.equal(skillPlan.action, "replace-skill");

  applyCaptureTransferPlanToEditorStateV1({
    plan: skillPlan,
    configuredCreatures,
    configuredSkills,
    statRegistry: registry,
    progressionRules
  });
  assert.equal(configuredSkills.size, beforeSkillCount);
  assert.equal(
    configuredSkills.get("cap_water_atk_2").definition.approachMode,
    "burrow"
  );

  const creatureTransfer = importCaptureTransferJsonV1(
    await text(CREATURE_PRESET),
    { statRegistry: registry }
  );
  const incoming = creatureTransfer.value;
  configuredCreatures.set(
    "crea_maraileron",
    {
      draft: {
        ...incoming.draft,
        displayName: "Maraileron historique",
        level: 1
      },
      statValues: incoming.statValues,
      loadout: incoming.loadout
    }
  );

  const beforeCreatureCount = configuredCreatures.size;
  currentDatabase = buildCaptureEditorDatabaseV1({
    statRegistry: registry,
    progressionRules,
    configuredCreatures,
    configuredSkills,
    metadata: { producer: "maraileron-author-export-test" }
  });
  const creaturePlan = planCaptureTransferImportV1({
    currentDatabase,
    transfer: creatureTransfer,
    mode: "replace"
  });
  assert.equal(creaturePlan.action, "replace-creature");

  applyCaptureTransferPlanToEditorStateV1({
    plan: creaturePlan,
    configuredCreatures,
    configuredSkills,
    statRegistry: registry,
    progressionRules
  });

  assert.equal(configuredCreatures.size, beforeCreatureCount);
  assert.deepEqual(
    configuredCreatures.get("crea_maraileron"),
    {
      draft: incoming.draft,
      statValues: incoming.statValues,
      loadout: incoming.loadout
    }
  );
});

test("showcase catalogs declare Maraileron and Morsure de maree exactly once", async () => {
  const skillCatalog = await text(
    "src/catalogs/capture-showcase-skill-presets-v1.js"
  );
  const creatureCatalog = await text(
    "src/catalogs/capture-showcase-creature-presets-v1.js"
  );

  assert.equal(
    (
      skillCatalog.match(
        /cap_water_atk_2\.capture-skill-transfer-v1\.json/g
      ) ?? []
    ).length,
    1
  );
  assert.equal(
    (
      creatureCatalog.match(
        /crea_maraileron\.capture-creature-transfer-v1\.json/g
      ) ?? []
    ).length,
    1
  );
});
