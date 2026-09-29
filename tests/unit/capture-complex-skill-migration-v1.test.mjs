import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_COMPLEX_SKILL_MIGRATION_V1,
  captureComplexSkillMigrationEntriesV1
} from "../../src/adapters/input/capture/capture-complex-skill-migration-v1.js";
import {
  CAPTURE_USED_ABILITY_CATALOG_V2
} from "../../src/catalogs/capture-used-ability-catalog-v2.js";
import {
  CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1
} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  resolveMonsterCaptureLegacyStatIdV1
} from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";

function byId(entries) {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

test("complex migration is exactly the 33 used abilities outside the 70 portable catalog", () => {
  const entries =
    captureComplexSkillMigrationEntriesV1();

  assert.equal(entries.length, 33);
  assert.equal(
    new Set(entries.map((entry) => entry.id)).size,
    33
  );

  const usedIds = new Set(
    CAPTURE_USED_ABILITY_CATALOG_V2.abilities.map(
      (ability) => ability.id
    )
  );
  const portableIds = new Set(
    CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1.entries.map(
      (entry) => entry.id
    )
  );

  for (const entry of entries) {
    assert.equal(usedIds.has(entry.id), true, entry.id);
    assert.equal(
      portableIds.has(entry.id),
      false,
      entry.id + " must not duplicate the 70 portable skills"
    );
  }
});

test("complex migration preserves every historical effect in original order", () => {
  const entries =
    captureComplexSkillMigrationEntriesV1();
  const sourceById = byId(
    CAPTURE_USED_ABILITY_CATALOG_V2.abilities
  );

  for (const entry of entries) {
    assert.deepEqual(
      entry.legacyEffects,
      sourceById.get(entry.id).effects,
      entry.id
    );
  }
});

test("seven deterministic heal area and self-heal abilities are runtime-ready", () => {
  const entries =
    captureComplexSkillMigrationEntriesV1();
  const ready = entries
    .filter(
      (entry) =>
        entry.migrationState === "runtime-ready"
    )
    .map((entry) => entry.id)
    .sort();

  assert.deepEqual(
    ready,
    [
      "cap_light_special_1",
      "cap_shadow_special_1",
      "cap_water_special_1",
      "lib_aqua_heal",
      "lib_heal_5",
      "lib_lifesteal_strike",
      "lib_quake"
    ].sort()
  );
});

test("deterministic tactical effects keep explicit target semantics and effect order", () => {
  const entries = byId(
    captureComplexSkillMigrationEntriesV1()
  );

  assert.deepEqual(
    entries.get("lib_aqua_heal").tacticalEffects,
    [
      {
        kind: "heal",
        targetScope: "self",
        amount: 4
      }
    ]
  );

  assert.deepEqual(
    entries.get("lib_quake").tacticalEffects,
    [
      {
        kind: "damage",
        targetScope: "all_enemies",
        amount: 4,
        channel: "earth"
      }
    ]
  );

  assert.deepEqual(
    entries.get("lib_lifesteal_strike")
      .tacticalEffects,
    [
      {
        kind: "damage",
        targetScope: "target",
        amount: 4,
        channel: "shadow"
      },
      {
        kind: "heal",
        targetScope: "self",
        amount: 2
      }
    ]
  );

  assert.deepEqual(
    entries.get("cap_shadow_special_1")
      .tacticalEffects,
    [
      {
        kind: "damage",
        targetScope: "target",
        amount: 3,
        channel: "shadow"
      },
      {
        kind: "heal",
        targetScope: "self",
        amount: 2
      }
    ]
  );
});

test("all 26 persistent legacy abilities remain explicit instead of inventing milliseconds", () => {
  const entries =
    captureComplexSkillMigrationEntriesV1();
  const blocked = entries.filter(
    (entry) =>
      entry.blockers.some(
        (blocker) =>
          blocker.kind ===
          "requires-duration-policy"
      )
  );

  assert.equal(blocked.length, 26);

  for (const entry of blocked) {
    assert.notEqual(
      entry.migrationState,
      "runtime-ready",
      entry.id
    );
    assert.equal(
      entry.tacticalEffects,
      null,
      entry.id +
        " must not publish partially migrated tactical effects"
    );
  }
});

test("DoT and HoT explicitly require turn-to-runtime duration and tick policy", () => {
  const entries = byId(
    captureComplexSkillMigrationEntriesV1()
  );

  for (const id of [
    "lib_regen",
    "cap_poison_special_1"
  ]) {
    const entry = entries.get(id);
    const blocker = entry.blockers.find(
      (item) =>
        item.kind ===
        "requires-duration-policy"
    );

    assert.ok(blocker, id);
    assert.equal(
      blocker.legacyUnit,
      "turn_end_turns"
    );
    assert.equal(
      blocker.requiresTickIntervalMs,
      true
    );
    assert.equal(entry.tacticalEffects, null);
  }
});

test("legacy stat identifiers resolve only through the existing explicit Monster Capture aliases", () => {
  for (const [legacy, modern] of [
    ["speed", "speed"],
    ["initiative", "speed"],
    ["agility", "speed"],
    ["agilite", "speed"],
    ["force", "physical"],
    ["power", "physical"]
  ]) {
    assert.equal(
      resolveMonsterCaptureLegacyStatIdV1(
        legacy,
        {
          schema: "capture-stat-registry-v1",
          stats: [
            {
              id: "speed",
              label: "Vitesse",
              damageChannel: null,
              resistanceChannel: null,
              damagePctPerPoint: 0,
              resistancePctPerPoint: 0,
              chargeTimeReductionPctPerPoint: 1
            },
            {
              id: "physical",
              label: "Physique",
              damageChannel: "physical",
              resistanceChannel: "physical",
              damagePctPerPoint: 1,
              resistancePctPerPoint: 1,
              chargeTimeReductionPctPerPoint: 0
            }
          ]
        }
      ),
      modern,
      legacy
    );
  }

  for (const legacy of ["defense", "armor"]) {
    assert.equal(
      resolveMonsterCaptureLegacyStatIdV1(
        legacy,
        {
          schema: "capture-stat-registry-v1",
          stats: [
            {
              id: "speed",
              label: "Vitesse",
              damageChannel: null,
              resistanceChannel: null,
              damagePctPerPoint: 0,
              resistancePctPerPoint: 0,
              chargeTimeReductionPctPerPoint: 1
            },
            {
              id: "physical",
              label: "Physique",
              damageChannel: "physical",
              resistanceChannel: "physical",
              damagePctPerPoint: 1,
              resistancePctPerPoint: 1,
              chargeTimeReductionPctPerPoint: 0
            }
          ]
        }
      ),
      null,
      legacy
    );
  }
});

test("buff and debuff migration never copies legacy percent semantics into modern deltaPoints", () => {
  const entries = byId(
    captureComplexSkillMigrationEntriesV1()
  );

  const mappedStat = entries.get(
    "cap_air_special_2"
  );
  assert.equal(
    mappedStat.blockers.some(
      (blocker) =>
        blocker.kind ===
        "requires-stat-effect-policy" &&
        blocker.legacyStatId === "agility" &&
        blocker.modernStatId === "speed" &&
        blocker.legacyValue === 4 &&
        blocker.legacyValueUnit === "historical-percent-rule"
    ),
    true
  );
  assert.equal(mappedStat.tacticalEffects, null);

  for (const id of [
    "lib_heat_wave",
    "lib_earth_guard"
  ]) {
    const entry = entries.get(id);
    assert.equal(
      entry.blockers.some(
        (blocker) =>
          blocker.kind ===
          "requires-stat-mapping"
      ),
      true,
      id
    );
    assert.equal(entry.tacticalEffects, null);
  }
});

test("migration catalog exposes explicit source provenance and never changes Runtime or UI ownership", async () => {
  assert.equal(
    CAPTURE_COMPLEX_SKILL_MIGRATION_V1.source
      .catalogSchema,
    CAPTURE_USED_ABILITY_CATALOG_V2.schema
  );
  assert.equal(
    CAPTURE_COMPLEX_SKILL_MIGRATION_V1.source
      .commit,
    CAPTURE_USED_ABILITY_CATALOG_V2.source.commit
  );
  assert.equal(
    CAPTURE_COMPLEX_SKILL_MIGRATION_V1.source
      .indexBlob,
    CAPTURE_USED_ABILITY_CATALOG_V2.source.indexBlob
  );

  const source = await readFile(
    new URL(
      "../../src/adapters/input/capture/capture-complex-skill-migration-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "document.",
    "window.",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "fetch(",
    "XMLHttpRequest",
    "../ui/",
    "status-effect-runtime-v1",
    "combat-session",
    "action-resolver"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      forbidden
    );
  }
});
