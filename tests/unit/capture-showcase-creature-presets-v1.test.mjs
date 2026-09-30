import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  normalizeCaptureStatRegistryV1
} from "../../src/contracts/capture-stat-registry-v1.js";

const registry = normalizeCaptureStatRegistryV1(
  JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-stat-registry.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  )
);

async function importedPreset(file) {
  const jsonText = await readFile(
    new URL("../../" + file, import.meta.url),
    "utf8"
  );
  return importCaptureTransferJsonV1(
    jsonText,
    { statRegistry: registry }
  );
}

test("showcase preset catalog discovers exactly two transfer files without duplicating creature ids", () => {
  assert.deepEqual(
    CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1,
    [
      "data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json",
      "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json"
    ]
  );
});

test("Moussados showcase preset preserves the editor-authored model", async () => {
  const imported = await importedPreset(
    CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1[0]
  );
  const record = imported.value;

  assert.equal(imported.kind, "creature");
  assert.equal(record.draft.id, "crea_mossback");
  assert.equal(record.draft.level, 1);
  assert.equal(record.statValues.values.health, 200);
  assert.equal(record.draft.presentation.profileId, "massive");
  assert.equal(record.draft.presentation.displayScale, 1.7);
  assert.equal(
    record.draft.resistances.find(
      (item) => item.kind === "element:fire"
    )?.value,
    50
  );
  assert.equal(
    record.draft.resistances.find(
      (item) => item.kind === "element:air"
    )?.value,
    -50
  );
  assert.deepEqual(
    record.loadout.slots.map((slot) => slot.skillId),
    [
      "lib_earth_guard",
      "claw",
      "lib_quake",
      "lib_rock_slam"
    ]
  );
});

test("Loup volcanique showcase preset preserves health natural matchup visuals and planned loadout", async () => {
  const imported = await importedPreset(
    CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1[1]
  );
  const record = imported.value;

  assert.equal(imported.kind, "creature");
  assert.equal(record.draft.id, "crea-loup");
  assert.equal(record.draft.level, 10);
  assert.equal(record.statValues.values.health, 150);
  assert.equal(record.draft.presentation.profileId, "quadruped");
  assert.equal(record.draft.presentation.displayScale, 1.2);
  assert.equal(
    record.draft.resistances.find(
      (item) => item.kind === "element:fire"
    )?.value,
    35
  );
  assert.equal(
    record.draft.resistances.find(
      (item) => item.kind === "element:water"
    )?.value,
    -50
  );
  assert.deepEqual(
    record.loadout.slots.map((slot) => slot.skillId),
    [
      "fireball",
      "claw",
      "lib_flame_bite",
      "lib_fireball"
    ]
  );
});

test("Human Editor hydrates showcase presets through the existing Transfer planner and state owner", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1/
  );
  assert.match(
    source,
    /hydrateCaptureShowcaseCreaturePresetsV1/
  );
  assert.match(
    source,
    /importCaptureTransferJsonV1/
  );
  assert.match(
    source,
    /planCaptureTransferImportV1/
  );
  assert.match(
    source,
    /applyCaptureTransferPlanToEditorStateV1/
  );
});
