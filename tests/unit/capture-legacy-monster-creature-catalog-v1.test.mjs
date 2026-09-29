import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  adaptLegacyMonsterCreatureCatalogV1
} from "../../src/catalogs/capture-legacy-monster-creature-catalog-v1.js";

async function sourceCatalog() {
  const raw = await readFile(
    new URL(
      "../../data/capture/legacy-monster-capture-creatures.v1.json",
      import.meta.url
    ),
    "utf8"
  );
  return JSON.parse(raw);
}

test("historical Monster Capture catalog preserves the 110 unique seeded creatures", async () => {
  const catalog = await sourceCatalog();

  assert.equal(
    catalog.schema,
    "capture-legacy-monster-creature-catalog-v1"
  );
  assert.equal(
    catalog.source.commitSha,
    "e8fd85ab68df818a138ed7949c411005ad622457"
  );
  assert.equal(
    catalog.source.indexBlobSha,
    "6c95e3f6ca4bf8e34003776e7e43e44192aafb16"
  );

  assert.equal(catalog.entries.length, 110);
  assert.equal(
    new Set(
      catalog.entries.map((entry) => entry.id)
    ).size,
    110
  );

  assert.equal(
    catalog.entries.filter(
      (entry) =>
        entry.universeId === "starter_capture"
    ).length,
    98
  );
  assert.equal(
    catalog.entries.filter(
      (entry) =>
        entry.universeId ===
        "game_profile_dungeon_demo"
    ).length,
    12
  );

  for (const id of [
    "crea_aquafin",
    "crea_maraileron",
    "crea_braiseau",
    "crea_ailevent",
    "crea_lucieclair",
    "crea_dracendre"
  ]) {
    assert.ok(
      catalog.entries.some(
        (entry) => entry.id === id
      ),
      id + " must remain in the historical catalog"
    );
  }
});

test("legacy adapter reuses historical shared-entity stat compatibility defaults", async () => {
  const catalog = await sourceCatalog();
  const records =
    adaptLegacyMonsterCreatureCatalogV1(
      catalog
    );

  assert.equal(records.length, 110);

  const maraileron = records.find(
    (record) =>
      record.draft.id === "crea_maraileron"
  );

  assert.ok(maraileron);
  assert.deepEqual(
    maraileron.draft.sourceStats,
    {
      force: 21,
      agility: 20,
      intelligence: 10,
      spirit: 25,
      endurance: 10,
      initiative: 0
    }
  );
  assert.equal(
    maraileron.draft.combat.maxHp,
    38
  );
  assert.equal(
    maraileron.draft.combat.maxEnergy,
    0
  );
  assert.deepEqual(
    maraileron.draft.skillIds.slice(0, 4),
    [
      "cap_water_atk_1",
      "cap_water_atk_2",
      "cap_water_atk_3",
      "cap_water_atk_4"
    ]
  );
  assert.deepEqual(
    maraileron.loadout.slots.map(
      (slot) => slot.skillId
    ),
    [
      "cap_water_atk_1",
      "cap_water_atk_2",
      "cap_water_atk_3",
      "cap_water_atk_4"
    ]
  );
  assert.deepEqual(
    maraileron.draft.capture.evolution,
    {
      condition: "level",
      level: 36,
      targetId: "crea_leviambre"
    }
  );

  const aquafin = records.find(
    (record) =>
      record.draft.id === "crea_aquafin"
  );
  assert.ok(aquafin);
  assert.deepEqual(
    aquafin.draft.sourceStats,
    {
      force: 10,
      agility: 12,
      intelligence: 10,
      spirit: 12,
      endurance: 12,
      initiative: 11
    }
  );
});

test("historical catalog remains raw provenance while lab draft stores only supported fields", async () => {
  const catalog = await sourceCatalog();

  const sourceMaraileron =
    catalog.entries.find(
      (entry) =>
        entry.id === "crea_maraileron"
    );
  assert.equal(
    sourceMaraileron.stats.defense,
    22
  );
  assert.equal(
    sourceMaraileron.stats.speed,
    20
  );

  const maraileron =
    adaptLegacyMonsterCreatureCatalogV1(
      catalog
    ).find(
      (record) =>
        record.draft.id === "crea_maraileron"
    );

  assert.equal(
    maraileron.source.legacyDefense,
    22
  );
  assert.equal(
    maraileron.source.legacySpeed,
    20
  );
  assert.equal(
    Object.hasOwn(
      maraileron.draft.sourceStats,
      "defense"
    ),
    false
  );
  assert.equal(
    Object.hasOwn(
      maraileron.draft.sourceStats,
      "speed"
    ),
    false
  );
});
