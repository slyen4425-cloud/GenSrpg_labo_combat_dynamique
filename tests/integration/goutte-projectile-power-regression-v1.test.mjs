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
  capturePortableNativeSkillDraftsV1
} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  captureComplexNativeSkillDraftsV1
} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import {
  normalizeCaptureStatRegistryV1
} from "../../src/contracts/capture-stat-registry-v1.js";
import {
  normalizeCaptureProgressionRulesV1
} from "../../src/contracts/capture-progression-rules-v1.js";
import {
  buildCaptureEditorCombatTestV1
} from "../../src/ui/capture-editor-combat-test-v1.js";
import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";

const rootUrl = new URL("../../", import.meta.url);

async function text(path) {
  return readFile(new URL(path, rootUrl), "utf8");
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

test("Goutte vive keeps authored projectile power 1 through active owner export native adapter and Runtime clash", async () => {
  const configuredSkills =
    configuredSkillMap();

  const historical =
    configuredSkills.get("cap_water_atk_1");

  assert.ok(historical);
  assert.equal(
    historical.definition.projectileClash.power,
    0,
    "historical native entry reproduces the stale power observed by the user"
  );

  const skillTransfer =
    importCaptureTransferJsonV1(
      await text(
        "data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json"
      )
    );

  assert.equal(
    skillTransfer.value.draft.definition.projectileClash.power,
    1,
    "author transfer is the source of truth"
  );

  const creatureTransfer =
    importCaptureTransferJsonV1(
      await text(
        "data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json"
      ),
      { statRegistry: registry }
    );

  const configuredCreatures =
    new Map([
      [
        creatureTransfer.value.draft.id,
        creatureTransfer.value
      ]
    ]);

  const database =
    buildCaptureEditorDatabaseV1({
      statRegistry: registry,
      progressionRules,
      configuredCreatures,
      configuredSkills,
      metadata: {
        producer:
          "goutte-projectile-power-regression-v1"
      }
    });

  const plan =
    planCaptureTransferImportV1({
      currentDatabase: database,
      transfer: skillTransfer,
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

  assert.equal(
    configuredSkills.get(
      "cap_water_atk_1"
    ).definition.projectileClash.power,
    1,
    "configuredSkills must own the author value after replacement"
  );

  const exported =
    buildCaptureEditorCombatTestV1({
      configuredCreatures,
      configuredSkills,
      localCreatureIds: ["crea_maraileron"],
      opponentCreatureIds: [
        "crea_maraileron"
      ],
      activePerTeam: 1,
      arenaId: "city",
      combatRules: {
        schema:
          "capture-combat-rules-editor-draft-v1",
        maxEnergy: 20,
        initialEnergy: 20,
        energyChargeAmount: 0,
        energyChargeIntervalMs: 2000,
        movementEnergyPerStep: 1,
        chargeTimeModifierPct: 0
      }
    });

  const exportedGoutte =
    exported.skills.find(
      (skill) =>
        skill.id === "cap_water_atk_1"
    );

  assert.equal(
    exportedGoutte.definition
      .projectileClash.power,
    1,
    "combat export must not fall back to historical power 0"
  );

  const native =
    adaptCaptureCombatExportStackV1(
      exported
    );

  const goutte =
    native.skills.cap_water_atk_1;

  assert.equal(
    goutte.projectileClash.power,
    1,
    "native combat skill must retain author power"
  );

  const session =
    createCombatSession({
      distance: "medium",
      battleFormat:
        native.battleFormat,
      fighters: native.fighters
    });

  let clock = 0;
  let scheduled = null;
  const resolutions = [];

  const runtime =
    createCombatRuntime({
      session,
      tickMs: 10,
      now: () => clock,
      setTimer(callback) {
        scheduled = callback;
        return 1;
      },
      clearTimer() {},
      onResolved(resolution) {
        resolutions.push(resolution);
      }
    });

  runtime.start();

  assert.equal(
    runtime.startSkill({
      actorId: "local-1",
      targetId: "opponent-1",
      skill: goutte
    }).ok,
    true
  );
  assert.equal(
    runtime.startSkill({
      actorId: "opponent-1",
      targetId: "local-1",
      skill: goutte
    }).ok,
    true
  );

  clock = 1200;
  assert.equal(
    typeof scheduled,
    "function"
  );
  scheduled();

  assert.deepEqual(
    resolutions
      .map((resolution) => resolution.outcome)
      .sort(),
    ["clashed", "clashed"],
    "power 1 versus power 1 must mutually cancel instead of crossing"
  );

  runtime.dispose();
});
