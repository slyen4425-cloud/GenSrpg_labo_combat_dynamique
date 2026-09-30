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

test("all 33 complex abilities are runtime-ready once proven legacy semantics are owned", () => {
  const entries =
    captureComplexSkillMigrationEntriesV1();
  const ready = entries.filter(
    (entry) =>
      entry.migrationState === "runtime-ready"
  );

  assert.equal(ready.length, 33);
  for (const entry of ready) {
    assert.deepEqual(entry.blockers, []);
    assert.ok(
      Array.isArray(entry.tacticalEffects) &&
      entry.tacticalEffects.length > 0,
      entry.id
    );
  }
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

test("persistent legacy abilities preserve owner-action-end duration without inventing milliseconds", () => {
  const entries =
    captureComplexSkillMigrationEntriesV1();
  const persistent = entries.filter(
    (entry) =>
      entry.legacyEffects.some(
        (effect) =>
          ["buff", "debuff", "dot", "hot"].includes(
            effect.kind
          )
      )
  );

  assert.equal(persistent.length, 26);

  for (const entry of persistent) {
    assert.equal(
      entry.migrationState,
      "runtime-ready",
      entry.id
    );
    for (
      const effect of entry.tacticalEffects.filter(
        (candidate) =>
          candidate.kind === "apply_status"
      )
    ) {
      assert.equal(
        effect.status.durationModel,
        "owner_action_end",
        entry.id
      );
      assert.equal(
        "durationMs" in effect.status,
        false,
        entry.id
      );
    }
  }
});

test("DoT and HoT preserve fixed per-owner-action tick semantics", () => {
  const entries = byId(
    captureComplexSkillMigrationEntriesV1()
  );

  const regen =
    entries.get("lib_regen").tacticalEffects[0]
      .status;
  assert.equal(regen.kind, "heal_over_time");
  assert.equal(
    regen.durationModel,
    "owner_action_end"
  );
  assert.equal(regen.durationActions, 3);
  assert.equal("tickIntervalMs" in regen, false);

  const poison = entries.get(
    "cap_poison_special_1"
  ).tacticalEffects.find(
    (effect) =>
      effect.kind === "apply_status"
  ).status;
  assert.equal(
    poison.kind,
    "damage_over_time"
  );
  assert.equal(
    poison.durationModel,
    "owner_action_end"
  );
  assert.equal(poison.durationActions, 3);
  assert.equal(poison.damageMode, "fixed");
  assert.equal("tickIntervalMs" in poison, false);
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

test("buff and debuff migration keeps legacy percent semantics and explicit stat owners", () => {
  const entries = byId(
    captureComplexSkillMigrationEntriesV1()
  );

  const agility = entries.get(
    "cap_air_special_2"
  ).tacticalEffects[0].status;
  assert.equal(agility.statId, "speed");
  assert.equal(
    agility.modifierMode,
    "percent"
  );
  assert.equal(agility.percent, 40);
  assert.equal(
    "deltaPoints" in agility,
    false
  );

  const heat = entries.get(
    "lib_heat_wave"
  ).tacticalEffects[0].status;
  assert.equal(heat.statId, "defense");
  assert.equal(heat.percent, -30);

  const armor = entries.get(
    "lib_earth_guard"
  ).tacticalEffects[0].status;
  assert.equal(armor.statId, "defense");
  assert.equal(armor.percent, 30);
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
